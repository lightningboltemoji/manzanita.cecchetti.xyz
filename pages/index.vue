<script setup lang="ts">
import { getHiLoPredictions } from "@/service/noaa";
import { cacheV1 } from "@/service/storage";
import { useDateFormat, useNow } from "@vueuse/core";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { onBeforeMount } from "vue";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const now = useNow({ interval: 1000 });
const date = useDateFormat(now, "MMMM D, YYYY");
const time = useDateFormat(now, "h:mm");
const amPm = useDateFormat(now, "A");

import { computed } from "vue";

type Tide = {
  time: Dayjs;
  type: "H" | "L";
};

onBeforeMount(async () => {
  if (
    !cacheV1.value.predictions ||
    !cacheV1.value.created ||
    Date.now() > cacheV1.value.created + 60 * 60 * 1000
  ) {
    const now = dayjs();
    cacheV1.value = {
      created: Date.now(),
      predictions: await getHiLoPredictions(
        now.subtract(2, "days").format("YYYYMMDD"),
        now.add(30, "days").format("YYYYMMDD"),
      ),
    };
  }
});

const relevant: ComputedRef<{ prev?: Tide; next?: Tide }> = computed(() => {
  if (!cacheV1.value.predictions) {
    return {};
  }
  const p = cacheV1.value.predictions.predictions;
  for (const idx in p) {
    if (dayjs.utc(p[idx]["t"]) > dayjs()) {
      const prev = p[idx - 1];
      const next = p[idx];
      return {
        prev: { time: dayjs(prev["t"] + " UTC"), type: prev["type"] },
        next: { time: dayjs(next["t"] + " UTC"), type: next["type"] },
      };
    }
  }
  throw "Unable to determine what tides are nearest";
});

const whatsHappening = computed(() => {
  const { prev, next } = relevant.value;
  if (!prev || !next) {
    return "";
  }
  return next["type"] === "H" ? "coming in" : "going out";
});

const times = computed(() => {
  const { prev, next } = relevant.value;
  if (!prev || !next) {
    return {};
  }
  const now = dayjs();
  const between = next.time.diff(prev.time);
  const sincePrev = now.diff(prev.time);
  const percent =
    Math.round((sincePrev / between) * 10000.0 + Number.EPSILON) / 100;
  return {
    start: now.to(prev.time),
    end: now.to(next.time),
    percent,
    percentIn: prev["type"] === "L" ? percent : 100 - percent,
  };
});
</script>

<template>
  <div
    class="flex flex-col w-screen h-screen justify-center items-center"
    v-if="relevant && whatsHappening && times"
  >
    <h1 class="font-bold text-6xl">
      {{ time }} <span class="text-2xl">{{ amPm }}</span>
    </h1>
    <h2 class="text-lg mb-12">{{ date }}</h2>
    <h2 class="text-2xl">
      Tide is <span class="font-bold">{{ whatsHappening }}</span>
    </h2>
    <div class="flex flex-col w-80">
      <div class="w-80 bg-gray-300 h-2 my-2">
        <div class="bg-black h-2" :style="{ width: times.percent + '%' }" />
      </div>
      <div class="flex justify-between">
        <span class="text-sm">{{ times.start }}</span>
        <span class="text-sm">{{ times.end }}</span>
      </div>
    </div>
    <Wave :percent="times.percentIn" />
  </div>
</template>
