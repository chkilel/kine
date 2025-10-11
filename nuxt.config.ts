// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-10-10',
  devtools: { enabled: true },

  nitro: {
    preset: 'cloudflare_module',

    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },

    experimental: {
      database: true
    },

    database: {
      kineDB: {
        connector: 'cloudflare-d1',
        options: {
          bindingName: 'DB'
        }
      }
    }
  },

  modules: ['nitro-cloudflare-dev']
})
