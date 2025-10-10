// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  i18n: {
    locales: [
      { code: 'fr', name: 'Français' },
      { code: 'ar', name: 'العربية', dir: 'rtl' }
    ],
    defaultLocale: process.env.I18N_DEFAULT_LOCALE || 'fr',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts'
  },


  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
