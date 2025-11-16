<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'
  import { parseISO } from 'date-fns'
  import { LazyPatientEditSlideover } from '#components'

  // Const
  const tabs = [
    { label: "Vue d'Ensemble", slot: 'overview', value: 'overview' },
    { label: 'Plan de traitement', slot: 'plan', value: 'plan' },
    { label: 'Séances', slot: 'seances', value: 'seances' },
    { label: 'Documents', slot: 'documents', value: 'documents' },
    { label: 'Facturation', slot: 'facturation', value: 'facturation' }
  ]

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Patients', to: '/patients' },
    { label: patient.value ? formatFullName(patient.value) : 'Patient' }
  ])

  // -------------------------
  const route = useRoute()
  const overlay = useOverlay()
  const editSlideover = overlay.create(LazyPatientEditSlideover)
  const activeTab = ref('overview')

  const {
    data: patient,
    status,
    error
  } = await useFetch(`/api/patients/${route.params.id}`, {
    key: () => `user-${route.params.id}`,
    transform: (data) => {
      return {
        ...data,
        dateOfBirth: parseISO(data.dateOfBirth),
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt),
        deletedAt: data.deletedAt ? parseISO(data.deletedAt) : null
      }
    }
  })

  if (error.value) {
    throw createError({
      statusCode: error.value?.statusCode || 404,
      statusMessage: error.value?.statusMessage || 'Patient introuvable'
    })
  }

  function openEditSlideover() {
    if (!patient.value) return

    editSlideover.open({ patient: patient.value })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'warning'
      case 'discharged':
        return 'error'
      default:
        return 'neutral'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'inactive':
        return 'Inactif'
      case 'discharged':
        return 'Sorti'
      default:
        return status
    }
  }
</script>

<template>
  <UDashboardPanel id="patient-profil" class="bg-elevated">
    <template #header>
      <UDashboardNavbar :title="patient ? formatFullName(patient) : 'Profil du patient'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>notifications</template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div v-if="status === 'pending'" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
        </div>

        <div v-else-if="patient" class="space-y-6">
          <!-- Breadcrumb -->
          <UBreadcrumb :items="breadcrumbItems" />

          <!-- Patient Header -->
          <UCard variant="outline">
            <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div class="mx-auto shrink-0 sm:mx-0">
                <UAvatar :alt="formatFullName(patient)" class="size-24 rounded-xl text-4xl" />
              </div>
              <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
                <div class="flex flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-start">
                  <h1 class="text-2xl leading-tight font-bold md:text-3xl">
                    {{ formatFullName(patient) }}
                  </h1>
                  <UBadge :color="getStatusColor(patient.status)" variant="outline" class="self-center">
                    {{ getStatusLabel(patient.status) }}
                  </UBadge>
                </div>
                <div
                  class="text-muted flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm sm:justify-start"
                >
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-cake" class="text-base" />
                    <span v-if="patient.dateOfBirth">
                      Né le {{ formatDate(patient.dateOfBirth) }} ({{ getAge(patient.dateOfBirth) }} ans)
                    </span>
                  </div>
                  <div v-if="patient.phone" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-phone" class="text-base" />
                    <a class="hover:text-primary hover:underline" :href="`tel:${patient.phone}`">
                      {{ patient.phone }}
                    </a>
                  </div>
                  <div v-if="patient.email" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-mail" class="text-base" />
                    <a class="hover:text-primary truncate hover:underline" :href="`mailto:${patient.email}`">
                      {{ patient.email }}
                    </a>
                  </div>
                </div>
                <div
                  class="text-primary flex items-center justify-center gap-1.5 text-sm font-semibold sm:justify-start"
                >
                  <UIcon name="i-lucide-calendar-check" class="text-base" />
                  <span>Prochain RDV: 15 Oct. 2024 à 10:00 (Static)</span>
                </div>
              </div>
            </div>
            <div class="border-default mt-4 flex flex-wrap justify-center gap-2 border-t pt-4 sm:justify-end">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-edit"
                label="Modifier patient"
                @click="openEditSlideover"
              />
              <UButton color="primary" variant="soft" icon="i-lucide-plus" label="Ajouter une séance" />
              <UButton color="primary" icon="i-lucide-file-text" label="Créer un document" />
            </div>
          </UCard>

          <!-- Tabs -->
          <UTabs v-model="activeTab" variant="link" :items="tabs" default-value="overview" class="w-full">
            <!-- Vue d'Ensemble Tab -->
            <template #overview>
              <LazyPatientOverviewTab v-if="patient" :patient="patient" />
            </template>

            <!-- Séances Tab -->
            <template #seances>
              <PatientSessionsTab />
            </template>

            <!-- Plan de traitement Tab -->
            <template #plan>
              <LazyPatientTreatmentPlanTab v-if="patient" :patient="patient" />
            </template>

            <!-- Documents Tab -->
            <template #documents>
              <PatientDocumentsTab />
            </template>

            <!-- Facturation Tab -->
            <template #facturation>
              <PatientBillingTab />
            </template>
          </UTabs>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
