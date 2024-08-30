import { useStorage } from "@vueuse/core";
import type { GetHiLoPredictionsResponse } from "./noaa";

export type CacheV1 = {
  created?: number;
  predictions?: GetHiLoPredictionsResponse;
};

export const cacheV1: Ref<CacheV1> = useStorage("predictions-v1", {});
