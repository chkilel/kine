// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-10-10',
  devtools: { enabled: true },
  modules: ['@nuxthub/core'],
  hub: {
    database: true
    // kv: true
  }
})
