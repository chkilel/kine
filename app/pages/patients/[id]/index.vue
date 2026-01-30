<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'

  // Const
  const tabs = [
    { label: "Vue d'Ensemble", slot: 'overview', value: 'overview' },
    { label: 'Plan de traitement', slot: 'plan', value: 'plan' },
    { label: 'Séances', slot: 'seances', value: 'seances' },
    { label: 'Documents', slot: 'documents', value: 'documents' },
    { label: 'Facturation', slot: 'facturation', value: 'facturation' }
  ]

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: patient.value ? formatFullName(patient.value) : 'Patient' }
  ])

  const router = useRouter()
  const route = useRoute()

  const { data: patient, error, isPending } = usePatientById(() => route.params.id as string)

  const activeTab = computed({
    get() {
      const tabFromQuery = route.query.tab as string
      const validTabs = ['overview', 'plan', 'seances', 'documents', 'facturation']
      return validTabs.includes(tabFromQuery) ? tabFromQuery : 'overview'
    },
    set(tab) {
      router.push({
        path: route.path,
        query: { ...route.query, tab }
      })
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
  <AppDashboardPage
    id="patient-profil"
    :title="patient ? formatFullName(patient) : 'Profil du patient'"
    :breadcrumbs="breadcrumbItems"
  >
    <div v-if="isPending" class="flex justify-center py-8">
      <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
    </div>

    <div v-else-if="patient" class="space-y-6">
      <!-- Patient Header -->
      <PatientHeader v-if="patient" :patient="patient" />

      <!-- Tabs -->
      <UTabs
        v-model="activeTab"
        variant="link"
        :items="tabs"
        default-value="overview"
        :ui="{ content: 'pt-4' }"
        class="w-full"
      >
        <!-- Vue d'Ensemble Tab -->
        <template #overview>
          <LazyPatientOverviewTab v-if="patient" :patient="patient" />
        </template>

        <!-- Séances Tab -->
        <template #seances>
          <LazyPatientSessionsTab v-if="patient" :patient="patient" />
        </template>

        <!-- Plan de traitement Tab -->
        <template #plan>
          <LazyPatientTreatmentPlanTab v-if="patient" :patient="patient" />
        </template>

        <!-- Documents Tab -->
        <template #documents>
          <LazyPatientDocumentsTab />
        </template>

        <!-- Facturation Tab -->
        <template #facturation>
          <PatientBillingTab />
        </template>
      </UTabs>
    </div>
  </AppDashboardPage>
</template>
