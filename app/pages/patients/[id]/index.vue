<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'
  import type { BreadcrumbItem } from '@nuxt/ui'
  import { format, differenceInYears, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const route = useRoute()
  const toast = useToast()

  const { data: patient, status, error } = await useFetch<Patient>(`/api/patients/${route.params.id}`)
  const { data: documents, refresh: refreshDocuments } = await useFetch(`/api/patients/${route.params.id}/documents`)

  if (error.value) {
    throw createError({
      statusCode: error.value?.statusCode || 404,
      statusMessage: error.value?.statusMessage || 'Patient introuvable'
    })
  }

  const activeTab = ref('overview')

  const tabs = [
    { label: "Vue d'Ensemble", slot: 'overview', value: 'overview' },
    { label: 'Plan de traitement', slot: 'plan', value: 'plan' },
    { label: 'Séances', slot: 'seances', value: 'seances' },
    { label: 'Documents', slot: 'documents', value: 'documents' },
    { label: 'Facturation', slot: 'facturation', value: 'facturation' }
  ]

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    {
      label: 'Dashboard',
      to: '/'
    },
    {
      label: 'Patients',
      to: '/patients'
    },
    {
      label: patient.value ? formatFullName(patient.value) : 'Patient'
    }
  ])

  function formatDate(date?: Date | string) {
    if (!date) return '-'
    try {
      let dateObj: Date
      if (date instanceof Date) {
        dateObj = date
      } else if (typeof date === 'string') {
        dateObj = parseISO(date)
      } else {
        return '-'
      }
      return format(dateObj, 'dd/MM/yyyy', { locale: fr })
    } catch (error) {
      console.error('Error formatting date:', error, date)
      return '-'
    }
  }

  function formatFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`
  }

  function getAge(dateOfBirth?: Date | string) {
    if (!dateOfBirth) return ''
    try {
      let birth: Date
      if (dateOfBirth instanceof Date) {
        birth = dateOfBirth
      } else if (typeof dateOfBirth === 'string') {
        birth = parseISO(dateOfBirth)
      } else {
        return ''
      }
      const age = differenceInYears(new Date(), birth)
      return age.toString()
    } catch (error) {
      console.error('Error calculating age:', error, dateOfBirth)
      return ''
    }
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

  // Static data for demo purposes when API data is not available
  const staticPatientData = {
    phone: '06 12 34 56 78',
    email: 'jean.dupont@email.com',
    address: '123 Rue de la Santé',
    city: '75001 Paris, France',
    insurance: 'Harmonie Mutuelle',
    insuranceNumber: 'HM123456789',
    coverage: '100%',
    doctor: 'Dr. Leroy (Généraliste)',
    prescriptionDate: '12/08/2024',
    emergencyContact: 'Sophie Dupont (Épouse)',
    emergencyPhone: '06 87 65 43 21',
    nextAppointment: '15 Oct. 2024 à 10:00',
    pathology: 'Lombalgie chronique',
    treatmentGoal: 'Réduction douleur & mobilité',
    sessionsCompleted: 8,
    sessionsTotal: 15,
    painLevel: 6,
    allergies: 'Pénicilline, Pacemaker',
    medicalHistory: 'Hernie discale L4-L5 en 2018. Arthrose légère du genou droit.',
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
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-phone" class="text-base" />
                    <a class="hover:text-primary hover:underline" :href="`tel:${staticPatientData.phone}`">
                      {{ staticPatientData.phone }}
                    </a>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-mail" class="text-base" />
                    <a class="hover:text-primary truncate hover:underline" :href="`mailto:${staticPatientData.email}`">
                      {{ staticPatientData.email }}
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
              <PatientEditModal v-if="patient" :patient="patient" @updated="() => refreshNuxtData()">
                <UButton
                  color="neutral"
                  variant="outline"
                  class="flex h-9 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3"
                >
                  <UIcon name="i-lucide-edit" class="text-base" />
                  <span class="truncate">Modifier patient</span>
                </UButton>
              </PatientEditModal>
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
              <PatientTreatmentPlanTab />
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
