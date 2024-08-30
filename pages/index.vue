<script setup lang="ts">
import { cacheV1 } from "@/service/storage";
import { useIntervalFn } from "@vueuse/core";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { computed, onBeforeMount } from "vue";
import { getHiLoPredictions } from "~/service/noaa";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const now = ref(dayjs());
useIntervalFn(() => (now.value = dayjs()), 1000);
const date = computed(() => now.value.format("MMMM D, YYYY"));
const time = computed(() => now.value.format("h:mm"));
const amPm = computed(() => now.value.format("A"));

type Tide = {
  time: Dayjs;
  type: "H" | "L";
};

const fetchFailed = ref(false);
onBeforeMount(async () => {
  const now = dayjs();
  if (!cacheV1.value.predictions || !cacheV1.value.created || now.unix() > cacheV1.value.created + 60 * 60) {
    try {
      const predictions = await getHiLoPredictions(
        now.subtract(2, "days").format("YYYYMMDD"),
        now.add(30, "days").format("YYYYMMDD"),
      );
      cacheV1.value = { created: now.unix(), predictions };
    } catch (e: any) {
      console.error("Failed to load predictions from NOAA", e.stack);
      fetchFailed.value = true;
    }
  }
});

// onMounted(() => {
//   if (cacheV1.value.predictions) {
//     const p = cacheV1.value.predictions;
//     cacheV1.value.predictions = undefined;
//     setTimeout(() => {
//       fetchFailed.value = true;
//       setTimeout(() => (cacheV1.value.predictions = p), 2000);
//     }, 2000);
//   }
// });

const relevant: ComputedRef<{ prev?: Tide; next?: Tide }> = computed(() => {
  if (!cacheV1.value.predictions) {
    return {};
  }
  const p = cacheV1.value.predictions.predictions;
  for (const idx in p) {
    if (dayjs.utc(p[idx]["t"]) > now.value) {
      const prev = p[idx - 1];
      const next = p[idx];
      return {
        prev: { time: dayjs.utc(prev["t"]), type: prev["type"] },
        next: { time: dayjs.utc(next["t"]), type: next["type"] },
      };
    }
  }
  throw "Unable to determine what tides are nearest";
});

const whatsHappening = computed(() => {
  if (!relevant.value.next) {
    return "";
  }
  return relevant.value.next["type"] === "H" ? "coming in" : "going out";
});

const times = computed(() => {
  const { prev, next } = relevant.value;
  if (!prev || !next) {
    return {};
  }
  const between = next.time.diff(prev.time);
  const sincePrev = now.value.diff(prev.time);
  const percent = Math.round((sincePrev / between) * 10000.0 + Number.EPSILON) / 100;
  return {
    start: now.value.to(prev.time),
    end: now.value.to(next.time),
    percent,
    percentIn: prev["type"] === "L" ? percent : 100 - percent,
  };
});
</script>

<template>
  <Transition appear mode="out-in">
    <div class="flex flex-col w-screen h-dvh justify-center items-center" v-if="relevant && whatsHappening && times">
      <h1 class="font-bold text-6xl -mt-12 lg:-mt-24">
        {{ time }}<span class="text-2xl w-0 inline">{{ amPm }}</span>
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
      <Waves :percent="times.percentIn" />
    </div>
    <div class="flex flex-col w-screen h-dvh justify-center items-center" v-else>
      <div class="flex flex-col h-40 items-center">
        <h1 class="mb-10" :class="{ 'opacity-50': fetchFailed }">
          Loading data from <a class="font-bold underline" href="https://noaa.gov">https://noaa.gov</a> ...
        </h1>
        <h1 class="rounded-full bg-rose-100 border-2 border-black px-3 py-2" v-if="fetchFailed">It failed 😦</h1>
      </div>
    </div>
  </Transition>
</template>

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 1s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
