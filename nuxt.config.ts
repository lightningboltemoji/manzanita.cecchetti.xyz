// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devServer: { host: "0.0.0.0" },
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "nuxt-svgo"],
  ssr: false,
  svgo: {
    defaultImport: "component",
  },
  app: {
    head: {
      link: [
        {
          rel: "icon",
          href: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌊</text></svg>",
        },
      ],
    },
  },
});
