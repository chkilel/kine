<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'

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
    { id: 'suivi', label: 'Suivi & Bilan', icon: 'i-lucide-trending-up' },
    { id: 'rendezvous', label: 'Rendez-vous & Paiements', icon: 'i-lucide-calendar' },
    { id: 'informations', label: 'Informations & Documents', icon: 'i-lucide-file-text' }
  ]

  function formatDate(dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  function formatFullName(patient: Patient) {
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="patient ? formatFullName(patient) : 'Profil du patient'">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="$router.back()">Retour</UButton>
        </template>

        <template #right>
          <PatientEditModal v-if="patient" :patient="patient" @updated="() => refreshNuxtData()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>

      <div v-else-if="patient" class="space-y-6">
        <!-- Patient Header -->
        <div class="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <UAvatar
              :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(formatFullName(patient))}&background=random`"
              size="3xl"
              class="flex-shrink-0"
            />
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ formatFullName(patient) }}</h1>
                <UBadge :color="getStatusColor(patient.status)" variant="subtle" class="text-xs">
                  {{ getStatusLabel(patient.status) }}
                </UBadge>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span v-if="patient.dateOfBirth">Date de naissance: {{ formatDate(patient.dateOfBirth) }}</span>
                <span v-if="patient.dateOfBirth && patient.phone" class="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <span v-if="patient.phone">{{ patient.phone }}</span>
                <span v-if="patient.phone && patient.email" class="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <span v-if="patient.email">{{ patient.email }}</span>
              </p>
            </div>
          </div>
          <PatientEditModal v-if="patient" :patient="patient" @updated="() => refreshNuxtData()" />
        </div>

        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 dark:border-gray-800">
          <nav class="flex space-x-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200'
              ]"
            >
              <UIcon :name="tab.icon" class="mr-2 h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="mt-8">
          <!-- Suivi & Bilan Tab -->
          <div v-if="activeTab === 'suivi'" class="space-y-6">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Suivi du patient</h3>
              </template>
              <p class="text-gray-500 dark:text-gray-400">
                Cette section contiendra les informations de suivi et les bilans du patient.
              </p>
            </UCard>
          </div>

          <!-- Rendez-vous & Paiements Tab -->
          <div v-if="activeTab === 'rendezvous'" class="space-y-6">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Rendez-vous et paiements</h3>
              </template>
              <p class="text-gray-500 dark:text-gray-400">
                Cette section contiendra les rendez-vous et les informations de paiement du patient.
              </p>
            </UCard>
          </div>

          <!-- Informations & Documents Tab -->
          <div v-if="activeTab === 'informations'" class="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div class="space-y-6 xl:col-span-2">
              <!-- Basic Information Grid -->
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Basic Information -->
                <UCard>
                  <template #header>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Informations de base</h3>
                  </template>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date de naissance
                      </label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(patient.dateOfBirth) }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Sexe</label>
                      <p class="mt-1 text-gray-900 dark:text-white">
                        {{ patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '-' }}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.phone || '-' }}</p>
                    </div>
                  </div>
                </UCard>

                <!-- Emergency Contact -->
                <UCard>
                  <template #header>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Contact d'urgence</h3>
                  </template>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Nom du contact</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.emergencyContactName || '-' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Téléphone du contact
                      </label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.emergencyContactPhone || '-' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Relation</label>
                      <p class="mt-1 text-gray-900 dark:text-white">
                        {{ patient.emergencyContactRelationship || '-' }}
                      </p>
                    </div>
                  </div>
                </UCard>
              </div>

              <!-- Address -->
              <UCard>
                <template #header>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Adresse</h3>
                </template>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</label>
                    <p class="mt-1 text-gray-900 dark:text-white">{{ patient.address || '-' }}</p>
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Ville</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.city || '-' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Code postal</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.postalCode || '-' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Pays</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.country || '-' }}</p>
                    </div>
                  </div>
                </div>
              </UCard>

              <!-- Insurance and Referral -->
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <UCard>
                  <template #header>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Informations d'assurance</h3>
                  </template>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Assureur</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.insuranceProvider || '-' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Numéro d'assurance
                      </label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.insuranceNumber || '-' }}</p>
                    </div>
                  </div>
                </UCard>

                <UCard>
                  <template #header>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Referral Information</h3>
                  </template>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Referral Source</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ patient.referralSource || '-' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Referral Date</label>
                      <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(patient.referralDate) }}</p>
                    </div>
                  </div>
                </UCard>
              </div>

              <!-- Medical Information -->
              <UCard>
                <template #header>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Medical Information</h3>
                </template>
                <div class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Medical History</label>
                    <div class="mt-2 min-h-[6rem] rounded-md bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div v-if="patient.medicalHistory && patient.medicalHistory.length > 0" class="space-y-2">
                        <div v-for="(item, index) in patient.medicalHistory" :key="index">
                          <p class="font-medium">{{ item.condition }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-400">{{ item.diagnosisDate }}</p>
                          <p v-if="item.notes" class="text-sm">{{ item.notes }}</p>
                        </div>
                      </div>
                      <p v-else class="text-gray-900 dark:text-white">Aucun antécédent médical enregistré.</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Medications</label>
                      <div class="mt-2 min-h-[6rem] rounded-md bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div v-if="patient.medications && patient.medications.length > 0" class="space-y-2">
                          <div v-for="(med, index) in patient.medications" :key="index">
                            <p class="font-medium">{{ med.name }}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              {{ med.dosage }} - {{ med.frequency }}
                            </p>
                          </div>
                        </div>
                        <p v-else class="text-gray-900 dark:text-white">Aucun médicament enregistré.</p>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Allergies</label>
                      <div class="mt-2 min-h-[6rem] rounded-md bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div v-if="patient.allergies && patient.allergies.length > 0" class="space-y-2">
                          <div v-for="(allergy, index) in patient.allergies" :key="index">
                            <p class="font-medium">{{ allergy.allergen }}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">{{ allergy.reaction }}</p>
                          </div>
                        </div>
                        <p v-else class="text-gray-900 dark:text-white">Aucune allergie enregistrée.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

              <!-- Notes -->
              <UCard v-if="patient.notes">
                <template #header>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Notes</h3>
                </template>
                <div class="min-h-[8rem] rounded-md bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p class="whitespace-pre-wrap text-gray-900 dark:text-white">{{ patient.notes }}</p>
                </div>
              </UCard>
            </div>

            <!-- Documents Sidebar -->
            <div class="xl:col-span-1">
              <UCard>
                <template #header>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Documents</h3>
                </template>
                <div class="mt-4">
                  <div v-if="documents && documents.length > 0" class="space-y-3">
                    <div
                      v-for="doc in documents.slice(0, 5)"
                      :key="doc.id"
                      class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50"
                    >
                      <div class="flex items-center gap-3">
                        <UIcon name="i-lucide-file-text" class="text-gray-500 dark:text-gray-400" />
                        <div class="text-sm">
                          <p class="font-medium text-gray-900 dark:text-white">{{ doc.fileName }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(doc.uploadedAt) }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <UButton icon="i-lucide-eye" variant="ghost" size="xs" color="neutral" />
                        <UButton icon="i-lucide-download" variant="ghost" size="xs" color="neutral" />
                        <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" color="error" />
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-sm text-gray-500 dark:text-gray-400">Aucun document disponible.</p>
                </div>
                <UButton
                  block
                  color="primary"
                  class="mt-4"
                  @click="$router.push(`/patients/${route.params.id}/documents`)"
                >
                  <UIcon name="i-lucide-plus" class="mr-2" />
                  Gérer les documents
                </UButton>
              </UCard>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
