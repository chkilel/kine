// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['nitro-cloudflare-dev', '@nuxt/ui', '@vueuse/nuxt'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    betterAuthSecret: 'your-secret-key-for-better-auth',
    // R2 credentials
    r2Url: process.env.NUXT_R2_URL,
    r2BucketName: process.env.NUXT_R2_BUCKET_NAME,
    r2AccountId: process.env.NUXT_R2_ACCOUNT_ID,
    r2AccessKey: process.env.NUXT_R2_ACCESSKEY,
    r2SecretAccessKey: process.env.NUXT_R2_SECRETACCESSKEY,

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
