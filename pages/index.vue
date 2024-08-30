<script setup lang="ts">
import { useDateFormat, useNow } from "@vueuse/core";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const now = useNow({ interval: 1000 });
const time = useDateFormat(now, "h:mm:ss");
const amPm = useDateFormat(now, "A");

import predictions from "@/public/mock.json";
import { computed } from "vue";

type Tide = {
  time: Dayjs;
  type: "H" | "L";
};

const relevant: ComputedRef<{ prev: Tide; next: Tide }> = computed(() => {
  const p = predictions["predictions"];
  for (const idx in p) {
    if (Date.parse(p[idx]["t"] + " UTC") > now.value) {
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
  if (prev["type"] === "L" && next["type"] === "H") {
    return "coming in";
  } else if (prev["type"] === "H" && next["type"] === "L") {
    return "going out";
  }
});

const times = computed(() => {
  const { prev, next } = relevant.value;
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
  <div class="flex flex-col w-screen h-screen justify-center items-center">
    <h1 class="font-bold text-6xl mb-12">
      {{ time }} <span class="text-2xl">{{ amPm }}</span>
    </h1>
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
