# Internationalization Strategy

## Vue I18n Configuration

### 1. Nuxt I18n Setup
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', dir: 'ltr' },
      { code: 'ar', iso: 'ar-MA', file: 'ar.json', dir: 'rtl' }
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
});
```

### 2. RTL Layout Support
```vue
<!-- layouts/default.vue -->
<template>
  <div :dir="$i18n.localeProperties.dir" :class="rtlClasses">
    <NuxtPage />
  </div>
</template>

<script setup>
const { $i18n } = useNuxtApp();

const rtlClasses = computed(() => ({
  'rtl': $i18n.localeProperties.dir === 'rtl',
  'ltr': $i18n.localeProperties.dir === 'ltr'
}));
</script>

<style>
.rtl {
  direction: rtl;
  text-align: right;
}

.rtl .sidebar {
  right: 0;
  left: auto;
}
</style>
```

### 3. Translation Structure
```json
// locales/fr.json
{
  "navigation": {
    "dashboard": "Tableau de bord",
    "patients": "Patients",
    "appointments": "Rendez-vous",
    "billing": "Facturation"
  },
  "patients": {
    "create": "Créer un patient",
    "firstName": "Prénom",
    "lastName": "Nom de famille",
    "email": "Email",
    "phone": "Téléphone"
  }
}

// locales/ar.json
{
  "navigation": {
    "dashboard": "لوحة التحكم",
    "patients": "المرضى",
    "appointments": "المواعيد",
    "billing": "الفواتير"
  },
  "patients": {
    "create": "إنشاء مريض",
    "firstName": "الاسم الأول",
    "lastName": "اسم العائلة",
    "email": "البريد الإلكتروني",
    "phone": "الهاتف"
  }
}
```
