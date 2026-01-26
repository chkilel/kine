<script setup lang="ts">
  import type { ToasterProps } from '@nuxt/ui'
  import { fr } from '@nuxt/ui/locale'
  import { PiniaColadaDevtools } from '@pinia/colada-devtools'

  const toaster: ToasterProps = { expand: false, duration: 2000, position: 'top-center' }

  const colorMode = useColorMode()
  const color = computed(() => (colorMode.value === 'dark' ? '#1b1718' : 'white'))

  useHead({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { key: 'theme-color', name: 'theme-color', content: color }
    ],
    link: [{ rel: 'icon', href: '/favicon.ico' }],
    htmlAttrs: {
      lang: 'fr'
    }
  })

  const title = 'Kine - Plateforme de Kinésithérapie'
  const description =
    'Une plateforme complète de gestion pour kinésithérapeutes, permettant le suivi des patients, la planification des consultations et la gestion des documents de traitement.'

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: '/favicon.ico',
    twitterImage: '/favicon.ico',
    twitterCard: 'summary_large_image'
  })
</script>

<template>
  <UApp :locale="fr" :toaster>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
  <PiniaColadaDevtools />
</template>
