<script setup lang="ts">
  import type { BreadcrumbItem, TabsItem } from '@nuxt/ui'

  const route = useRoute()

  const { data: patient, error, isPending } = usePatientById(() => route.params.id as string)

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: patient.value ? formatFullName(patient.value) : 'Patient' }
  ])

  const items = computed(
    () =>
      [
        {
          label: "Vue d'Ensemble",
          icon: 'i-hugeicons-user',
          value: 'overview'
        },
        {
          label: 'Plan de traitement',
          icon: 'hugeicons-first-aid-kit',
          value: 'plan'
        },
        {
          label: 'Hors Plan',
          icon: 'hugeicons-folder-details',
          value: 'seances'
        },
        {
          label: 'Documents',
          icon: 'i-hugeicons-file-02',
          value: 'documents'
        },
        {
          label: 'Facturation',
          icon: 'i-hugeicons-wallet-01',
          value: 'facturation'
        }
      ] satisfies TabsItem[]
  )

  const activeTab = computed({
    get() {
      const path = route.path
      const basePath = `/patients/${route.params.id}`

      if (path === basePath) return 'overview'
      if (path === `${basePath}/plan`) return 'plan'
      if (path === `${basePath}/seances`) return 'seances'
      if (path === `${basePath}/documents`) return 'documents'
      if (path === `${basePath}/facturation`) return 'facturation'

      return 'overview'
    },
    set(tab: string) {
      const basePath = `/patients/${route.params.id}`
      let path = basePath

      if (tab === 'overview') path = basePath
      else if (tab === 'plan') path = `${basePath}/plan`
      else if (tab === 'seances') path = `${basePath}/seances`
      else if (tab === 'documents') path = `${basePath}/documents`
      else if (tab === 'facturation') path = `${basePath}/facturation`

      navigateTo(path)
    }
  })

  // Handle error after the query
  watchEffect(() => {
    if (error.value) {
      const err = error.value as any
      throw createError({
        statusCode: err.statusCode || err.status || 404,
        statusMessage: err.statusMessage || err.message || 'Patient introuvable'
      })
    }
  })
</script>

<template>
  <AppDashboardPage id="patient-profil" :breadcrumbs="breadcrumbItems">
    <div v-if="isPending" class="flex justify-center py-8">
      <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
    </div>
    <div v-else-if="patient" class="space-y-6">
      <UCard :ui="{ root: 'rounded-b', body: 'p-0 sm:p-0 rounded-b-none' }">
        <!-- Patient Header -->
        <PatientHeader :patient="patient" class="p-4 sm:p-6" />
        <USeparator />
        <!-- Tabs Navigation -->
        <UTabs
          v-model="activeTab"
          :content="false"
          :items="items"
          variant="link"
          size="lg"
          class="bg-muted mb-px w-full"
          :ui="{ indicator: 'h-[2px]' }"
        />
      </UCard>

      <!-- Tab Content -->
      <NuxtPage />
    </div>
  </AppDashboardPage>
</template>
