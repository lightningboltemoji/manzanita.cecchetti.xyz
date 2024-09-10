// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devServer: { host: "0.0.0.0" },
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss", "nuxt-svgo", "@nuxt/fonts"],
  ssr: false,
  svgo: {
    defaultImport: "component",
  },
  app: {
    head: {
      title: "Manzanita, OR - manzanita.cecchetti.xyz",
      viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
    },
  },
});