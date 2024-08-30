<script setup lang="ts">
import waves from "@/assets/waves.svg";
import { computed } from "vue";

const props = defineProps<{ percent: number }>();

const clampedPercent = computed(() => Math.round(props.percent * 90 + Number.EPSILON) / 100 + 10);
</script>

<template>
  <div class="w-screen h-dvh absolute top-0 left-0 flex flex-col -z-10">
    <div class="flex flex-col min-h-0" :style="{ flexBasis: clampedPercent + '%' }">
      <div class="basis-1/2 bg-[#b4e1fd]" />
      <waves class="flex-grow basis-0 bg-gradient-to-b from-[#b4e1fd] from-10% to-[#ece8da]" />
    </div>
    <div class="flex-grow basis-0 bg-[#ece8da]" />
  </div>
  <div class="fixed -bottom-[50vh] left-0 w-screen h-screen bg-[#ece8da] -z-20" />
</template>

<style>
body {
  background-color: #b4e1fd;
}
</style>
