<script setup lang="ts">
import waves from "@/assets/waves.svg";
import { computed } from "vue";
const props = defineProps<{ percent: number }>();
const clampedPercent = computed(() => props.percent * 0.9 + 10);
</script>

<template>
  <div class="w-screen h-dvh absolute top-0 left-0 flex flex-col -z-10">
    <div class="flex flex-col min-h-0" :style="{ flexBasis: clampedPercent + '%' }">
      <div class="basis-1/2 bg-[#8ed1fc]" />
      <waves class="basis-1/2 bg-amber-200" />
    </div>
    <div class="bg-amber-200" :style="{ flexBasis: 100 - clampedPercent + '%' }" />
  </div>
  <div class="fixed -bottom-[50vh] left-0 w-screen h-screen bg-amber-200 -z-20" />
</template>

<style>
body {
  background-color: #8ed1fc;
}
</style>
