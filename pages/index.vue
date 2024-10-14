<script setup lang="ts">
import { cacheV1 } from "@/service/storage";
import { useIntervalFn } from "@vueuse/core";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { computed, onBeforeMount } from "vue";
import { getHiLoPredictions, type HiLoPrediction } from "~/service/noaa";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

const now = ref(dayjs());
useIntervalFn(() => (now.value = dayjs().tz("America/Los_Angeles")), 1000);
const date = computed(() => now.value.format("MMMM D, YYYY"));
const time = computed(() => now.value.format("h:mm"));
const amPm = computed(() => now.value.format("a"));
const dayOfWeek = computed(() => now.value.format("d"));

type Tide = {
  time: Dayjs;
  value: number;
  type: "H" | "L";
};

function mapToTide(v: HiLoPrediction): Tide {
  return { time: dayjs.utc(v["t"]), type: v["type"], value: parseFloat(v["v"]) };
}

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

const relevant: ComputedRef<{ prev?: Tide; next?: Tide; nextFew?: Tide[] }> = computed(() => {
  if (!cacheV1.value.predictions) {
    return {};
  }
  const p = cacheV1.value.predictions.predictions;
  const cur = p.findIndex((p) => dayjs.utc(p["t"]) > now.value);
  if (cur < 0) {
    console.log("Unable to determine nearest tide; waiting for fetch");
    return {};
  }
  return {
    prev: mapToTide(p[cur - 1]),
    next: mapToTide(p[cur]),
    nextFew: [p[cur], p[cur + 1], p[cur + 2]].map(mapToTide),
  };
});

const currentCycle = computed(() => {
  const { prev, next } = relevant.value;
  if (!prev || !next) {
    return;
  }
  const between = next.time.diff(prev.time);
  const sincePrev = now.value.diff(prev.time);
  const percent = Math.round((sincePrev / between) * 10000.0) / 100;
  return {
    start: now.value.to(prev.time),
    end: now.value.to(next.time),
    percent,
    percentIn: prev["type"] === "L" ? percent : 100 - percent,
    description: next["type"] === "H" ? "coming in" : "going out",
  };
});
</script>

<template>
  <Transition appear mode="out-in">
    <div class="flex flex-col w-screen h-dvh justify-center items-center" v-if="relevant && currentCycle">
      <h1 class="font-bold text-6xl -mt-12 lg:-mt-24">
        {{ time }}<span class="text-2xl w-0 inline">{{ amPm }}</span>
      </h1>
      <h2 class="text-lg">{{ date }}</h2>
      <div class="text-sm flex mb-12">
        <div
          class="border-y border-black size-6 flex items-center justify-center [&:first-child]:w-8 [&:last-child]:w-8 [&:first-child]:border-l [&:last-child]:border-r [&:first-child]:rounded-l-full [&:last-child]:rounded-r-full"
          v-for="(d, idx) in ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa']"
          :class="{ 'font-bold': `${idx}` == dayOfWeek }"
        >
          {{ d }}
        </div>
      </div>
      <h2 class="text-2xl">
        Tide is <span class="font-bold">{{ currentCycle.description }}</span>
      </h2>
      <div class="flex flex-col w-80">
        <div class="w-80 bg-[#A8938A] border-black box-content border h-3 my-2 rounded-full overflow-hidden">
          <div class="bg-black h-3" :style="{ width: currentCycle.percent + '%' }" />
        </div>
        <div class="flex justify-between">
          <span class="text-sm">{{ currentCycle.start }}</span>
          <span class="text-sm">{{ currentCycle.end }}</span>
        </div>
        <div class="flex justify-between mt-12 [&>*:not(:first-child)]:pl-3">
          <div class="flex" v-for="t in relevant.nextFew">
            <div class="text-3xl">
              <span v-if="t.type === 'H'">↑</span>
              <span v-else>↓</span>
            </div>
            <div class="flex flex-col justify-center items-center text-sm">
              <span>{{ t.time.tz("America/Los_Angeles").format("h:mm a") }}</span>
              <span>{{ t.value.toFixed(2) + " ft" }}</span>
            </div>
          </div>
        </div>
      </div>
      <Waves :percent="currentCycle.percentIn" />
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
