<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'
  import type { BreadcrumbItem } from '@nuxt/ui'

  const route = useRoute()

  const {
    data: patient,
    status,
    error
  } = await useFetch(`/api/patients/${route.params.id}`, {
    transform: (data) => ({
      ...data,
      dateOfBirth: toDate(data.dateOfBirth),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      deletedAt: toDate(data.deletedAt)
    })
  })

  if (error.value) {
    throw createError({
      statusCode: error.value?.statusCode || 404,
      statusMessage: error.value?.statusMessage || 'Patient introuvable'
    })
  }

  const activeTab = ref('overview')
  const isEditModalOpen = ref(false)

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

  function formatFullName(patient: Pick<Patient, 'firstName' | 'lastName'>) {
    return `${patient.firstName} ${patient.lastName}`
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

  // Static data for fields not in database
  const staticPatientData = {
    coverage: '100%',
    doctor: 'Dr. Leroy (Généraliste)',
    nextAppointment: '15 Oct. 2024 à 10:00',
    pathology: 'Lombalgie chronique',
    treatmentGoal: 'Réduction douleur & mobilité',
    sessionsCompleted: 8,
    sessionsTotal: 15,
    painLevel: 6,
    currentTreatment: 'Anti-inflammatoires non stéroïdiens (si besoin).',
    notes:
      "Patient motivé. Bonne progression sur les exercices de renforcement du tronc. Penser à intégrer des exercices d'étirement la prochaine séance."
  }
</script>

<template>
  <UDashboardPanel class="bg-elevated">
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
                <UAvatar :alt="formatFullName(patient)" size="3xl" class="h-24 w-24 text-4xl" />
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
                  <span>Prochain RDV: {{ staticPatientData.nextAppointment }}</span>
                </div>
              </div>
            </div>
            <div class="border-default mt-4 flex flex-wrap justify-center gap-2 border-t pt-4 sm:justify-end">
              <UButton
                color="neutral"
                variant="outline"
                class="flex h-9 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3"
                @click="isEditModalOpen = true"
              >
                <UIcon name="i-lucide-edit" class="text-base" />
                <span class="truncate">Modifier patient</span>
              </UButton>
              <UButton
                color="primary"
                variant="soft"
                class="flex h-9 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3"
              >
                <UIcon name="i-lucide-plus" class="text-base" />
                <span class="truncate">Ajouter une séance</span>
              </UButton>
              <UButton
                color="primary"
                class="flex h-9 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3"
              >
                <UIcon name="i-lucide-file-text" class="text-base" />
                <span class="truncate">Créer un document</span>
              </UButton>
            </div>
          </UCard>

          <!-- Tabs -->
          <UTabs v-model="activeTab" variant="link" :items="tabs" default-value="overview" class="w-full">
            <!-- Vue d'Ensemble Tab -->
            <template #overview>
              <PatientOverviewTab v-if="patient" :patient="patient" />
            </template>

            <!-- Séances Tab -->
            <template #seances>
              <PatientSessionsTab />
            </template>

            <!-- Plan de traitement Tab -->
            <template #plan>
              <PatientTreatmentPlanTab v-if="patient" :patient="patient" />
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

  <!-- Edit Modal -->
  <PatientEditSlideover
    v-if="patient"
    :patient="patient"
    :open="isEditModalOpen"
    @update:open="isEditModalOpen = $event"
    @updated="() => refreshNuxtData()"
  />
</template>
