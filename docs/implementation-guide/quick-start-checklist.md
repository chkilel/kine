# Quick Start Checklist

## Immediate Next Steps (Week 1)

### 1. Environment Setup
```bash
# Install additional dependencies
pnpm add @better-auth/nuxt drizzle-orm postgres drizzle-kit @pinia/nuxt @nuxtjs/i18n redis pdf-lib nodemailer

# Install dev dependencies
pnpm add -D @types/pg @types/nodemailer
```

### 2. Environment Configuration
```bash
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/kine_app"
REDIS_URL="redis://localhost:6379"
BETTER_AUTH_SECRET="your-secret-key-here"
ENCRYPTION_KEY="your-32-character-encryption-key"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

### 3. Update Nuxt Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@better-auth/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],

  // Better Auth configuration
  auth: {
    baseURL: process.env.AUTH_ORIGIN,
    trustedOrigins: [process.env.AUTH_ORIGIN]
  },

  // Internationalization
  i18n: {
    locales: [
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', dir: 'ltr' },
      { code: 'ar', iso: 'ar-MA', file: 'ar.json', dir: 'rtl' }
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default'
  },

  // Runtime config
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    public: {
      authUrl: process.env.AUTH_ORIGIN
    }
  },

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-07-11'
});
```
