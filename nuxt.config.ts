// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['nitro-cloudflare-dev', '@nuxt/ui'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    betterAuthSecret: 'your-secret-key-for-better-auth',
    public: {
      betterAuthUrl: 'http://localhost:3000'
    }
  },
  nitro: {
    preset: 'cloudflare_module',
    experimental: {
      database: true
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },
    database: {
      default: {
        connector: 'cloudflare-d1',
        options: { bindingName: 'BD' }
      }
    }
  }
})
