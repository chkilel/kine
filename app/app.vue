<script lang="ts" setup>
  import { fr } from '@nuxt/ui/locale'
</script>
<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator />
  <UApp :locale="fr">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
