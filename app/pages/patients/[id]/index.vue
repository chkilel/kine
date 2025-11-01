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

  const activeTab = ref('informations')

  const tabs = [
    { label: 'Informations', slot: 'informations', value: 'informations' },
    { label: 'Séances', slot: 'seances', value: 'seances' },
    { label: 'Plan de traitement', slot: 'plan', value: 'plan' },
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
      <div v-if="status === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>

      <div v-else-if="patient" class="space-y-6">
        <!-- Breadcrumb -->
        <UBreadcrumb :items="breadcrumbItems" />

        <!-- Patient Header -->
        <header class="bg-default rounded-xl p-4 shadow-sm sm:p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div class="mx-auto shrink-0 sm:mx-0">
              <UAvatar :alt="formatFullName(patient)" size="3xl" class="h-24 w-24 text-4xl" />
            </div>
            <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
              <div class="flex flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-start">
                <h1 class="text-2xl leading-tight font-bold md:text-3xl">
                  {{ formatFullName(patient) }}
                </h1>
                <UBadge :color="getStatusColor(patient.status)" variant="subtle" class="self-center">
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
              <div class="text-primary flex items-center justify-center gap-1.5 text-sm font-semibold sm:justify-start">
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
        </header>

        <!-- Tabs -->
        <UTabs v-model="activeTab" variant="link" :items="tabs" default-value="informations" class="w-full">
          <!-- Informations Tab -->
          <template #informations>
            <div class="mt-6 space-y-6">
              <!-- Quick Summary -->
              <h2 class="text-default mb-3 text-lg font-bold">Résumé rapide</h2>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <UCard>
                  <p class="text-muted text-sm font-medium">Pathologie principale</p>
                  <p class="text-default mt-1 text-base font-bold">
                    {{ staticPatientData.pathology }}
                  </p>
                </UCard>
                <UCard>
                  <p class="text-muted text-sm font-medium">Objectif du traitement</p>
                  <p class="text-default mt-1 text-base font-bold">
                    {{ staticPatientData.treatmentGoal }}
                  </p>
                </UCard>
                <UCard>
                  <p class="text-muted text-sm font-medium">Séances</p>
                  <p class="text-default mt-1 text-base font-bold">
                    {{ staticPatientData.sessionsCompleted }} / {{ staticPatientData.sessionsTotal }} effectuées
                  </p>
                </UCard>
                <UCard>
                  <p class="text-muted mb-2 text-sm font-medium">Niveau de douleur actuel</p>
                  <div class="flex items-center gap-1.5">
                    <div class="bg-muted h-2.5 flex-1 rounded-full">
                      <div
                        class="bg-warning h-2.5 rounded-full"
                        :style="`width: ${staticPatientData.painLevel * 10}%`"
                      ></div>
                    </div>
                    <span class="text-warning font-bold">{{ staticPatientData.painLevel }}/10</span>
                  </div>
                </UCard>
              </div>

              <!-- Administrative Data -->
              <h2 class="text-default mt-8 mb-3 text-lg font-bold">Données administratives</h2>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                <UCard>
                  <h3 class="mb-2 text-base font-semibold">Adresse</h3>
                  <p class="text-toned text-sm">
                    {{ patient.address || '-' }}
                    <br v-if="patient.address && patient.city" />
                    {{ patient.city || '' }}{{ patient.postalCode ? ` ${patient.postalCode}` : ''
                    }}{{ patient.country ? `, ${patient.country}` : '' }}
                  </p>
                </UCard>
                <UCard>
                  <h3 class="mb-2 text-base font-semibold">Assurance / Mutuelle</h3>
                  <p class="text-toned text-sm">
                    {{ patient.insuranceProvider || '-' }}
                    <br v-if="patient.insuranceProvider" />
                    N°: {{ patient.insuranceNumber || '-' }}
                  </p>
                </UCard>
                <UCard>
                  <h3 class="mb-2 text-base font-semibold">Médecin prescripteur</h3>
                  <p class="text-toned text-sm">
                    {{ patient.referralSource || '-' }}
                    <br v-if="patient.referralSource && patient.referralDate" />
                    Prescription du: {{ patient.referralDate ? formatDate(patient.referralDate) : '-' }}
                  </p>
                </UCard>
                <UCard>
                  <h3 class="mb-2 text-base font-semibold">Contact d'urgence</h3>
                  <p class="text-toned text-sm">
                    <template v-if="patient.emergencyContacts && patient.emergencyContacts.length > 0">
                      {{ patient.emergencyContacts[0]?.name }}
                      ({{ patient.emergencyContacts[0]?.relationship }})
                      <br />
                      Tél: {{ patient.emergencyContacts[0]?.phone }}
                    </template>
                    <template v-else>Aucun contact d'urgence enregistré</template>
                  </p>
                </UCard>
              </div>

              <!-- Medical Data -->
              <h2 class="text-default mt-8 mb-3 text-lg font-bold">Données médicales</h2>
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div class="flex flex-col gap-6">
                  <UCard class="border-l-warning border-l-4">
                    <h3 class="text-warning mb-2 text-base font-semibold">Allergies & Contre-indications</h3>
                    <p class="text-toned text-sm">
                      <template v-if="patient.allergies && patient.allergies.length > 0">
                        {{ patient.allergies.join(', ') }}
                      </template>
                      <template v-else>Aucune allergie connue</template>
                    </p>
                  </UCard>
                  <UCard class="border-l-warning border-l-4">
                    <h3 class="text-warning mb-2 text-base font-semibold">Chirurgies</h3>
                    <p class="text-toned text-sm">
                      <template v-if="patient.surgeries && patient.surgeries.length > 0">
                        {{ patient.surgeries.join(', ') }}
                      </template>
                      <template v-else>Aucune allergie connue</template>
                    </p>
                  </UCard>

                  <UCard>
                    <h3 class="mb-2 text-base font-semibold">Antécédents médicaux</h3>
                    <p class="text-toned text-sm">
                      <template v-if="patient.medicalConditions && patient.medicalConditions.length > 0">
                        {{ patient.medicalConditions.join(', ') }}
                      </template>
                      <template v-else>Aucun antécédent médical enregistré</template>
                    </p>
                  </UCard>
                  <UCard>
                    <h3 class="mb-2 text-base font-semibold">Médicaments actuels</h3>
                    <p class="text-toned text-sm">
                      <template v-if="patient.medications && patient.medications.length > 0">
                        {{ patient.medications.join(', ') }}
                      </template>
                      <template v-else>Aucun médicament enregistré</template>
                    </p>
                  </UCard>
                </div>
                <!-- Notes -->
                <UCard>
                  <h2 class="text-default mb-3 text-lg font-bold">Notes du praticien</h2>
                  <UCard variant="subtle">
                    <textarea
                      v-model="patient.notes"
                      class="text-toned w-full resize-none border-0 bg-transparent p-0 text-sm focus:ring-0"
                      rows="4"
                      placeholder="Ajouter des notes sur le patient..."
                    ></textarea>
                  </UCard>
                </UCard>
              </div>
            </div>
          </template>

          <!-- Séances Tab -->
          <template #seances>
            <div class="mt-6">
              <UCard>
                <h3 class="text-default mb-4 text-lg font-semibold">Historique des séances</h3>
                <p class="text-muted">Cette section contiendra l'historique des séances du patient.</p>
              </UCard>
            </div>
          </template>

          <!-- Plan de traitement Tab -->
          <template #plan>
            <div class="mt-6">
              <UCard>
                <h3 class="text-default mb-4 text-lg font-semibold">Plan de traitement</h3>
                <p class="text-muted">Cette section contiendra le plan de traitement du patient.</p>
              </UCard>
            </div>
          </template>

          <!-- Documents Tab -->
          <template #documents>
            <div class="mt-6">
              <UCard>
                <h3 class="text-default mb-4 text-lg font-semibold">Documents</h3>
                <div v-if="documents && documents.length > 0" class="space-y-3">
                  <UCard
                    v-for="doc in documents"
                    :key="doc.id"
                    variant="subtle"
                    class="flex items-center justify-between p-3"
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-file-text" class="text-muted" />
                      <div class="text-sm">
                        <p class="text-default font-medium">{{ doc.fileName }}</p>
                        <p class="text-muted text-xs">{{ formatDate(doc.uploadedAt) }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <UButton icon="i-lucide-eye" variant="ghost" size="xs" color="neutral" />
                      <UButton icon="i-lucide-download" variant="ghost" size="xs" color="neutral" />
                      <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" color="error" />
                    </div>
                  </UCard>
                </div>
                <p v-else class="text-muted text-sm">Aucun document disponible.</p>
              </UCard>
            </div>
          </template>

          <!-- Facturation Tab -->
          <template #facturation>
            <div class="mt-6">
              <UCard>
                <h3 class="text-default mb-4 text-lg font-semibold">Facturation</h3>
                <p class="text-muted">Cette section contiendra les informations de facturation du patient.</p>
              </UCard>
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
