// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['nitro-cloudflare-dev', '@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt', '@pinia/colada-nuxt'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    betterAuthSecret: 'your-secret-key-for-better-auth',
    // R2 credentials
    r2Url: '',
    r2BucketName: '',
    r2AccountId: '',
    r2AccessKey: '',
    r2SecretAccessKey: '',

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
        options: { bindingName: 'DB' }
      }
    },
    // To exclude /_nuxt/** paths from being handled by the Cloudflare dev worker.
    routeRules: {
      '/_nuxt/**': {
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    }
  }
})
