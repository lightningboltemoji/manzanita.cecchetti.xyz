export type HiLoPrediction = {
  t: string;
  v: string;
  type: "H" | "L";
};

export type GetHiLoPredictionsResponse = {
  predictions: Array<HiLoPrediction>;
};

export async function getHiLoPredictions(begin_date: string, end_date: string) {
  const res = await fetch(
    "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?" +
      new URLSearchParams({
        begin_date,
        end_date,
        station: "9437908",
        product: "predictions",
        datum: "MLLW",
        time_zone: "gmt",
        interval: "hilo",
        units: "english",
        application: "manzanita.cecchetti.xyz",
        format: "json",
      }).toString(),
  );
  return (await res.json()) as GetHiLoPredictionsResponse;
}
