<script setup lang="ts">
  import { differenceInDays } from 'date-fns'
  import type { Patient } from '~~/shared/types/patient.types'

  const props = defineProps<{
    patient: Patient
  }>()

  // Use treatment plans composable
  const {
    getActiveTreatmentPlan,
    getTreatmentPlanHistory,
    formatTreatmentPlanStatus,
    formatDateRange,
    getTherapistName,
    loading: treatmentPlansLoading,
    error: treatmentPlansError
  } = usePatientTreatmentPlans(props.patient?.id)

  // Watch for patient changes
  watch(
    () => props.patient?.id,
    (newId) => {
      if (newId) {
        fetchTreatmentPlans(newId)
      }
    }
  )

  // Computed properties for database fields
  const fullAddress = computed(() => {
    const parts = []
    if (props.patient?.address) parts.push(props.patient.address)
    if (props.patient?.city) parts.push(props.patient.city)
    if (props.patient?.postalCode) parts.push(props.patient.postalCode)
    if (props.patient?.country) parts.push(props.patient.country)
    return parts.join(', ') || '-'
  })

  const insuranceDetails = computed(() => {
    if (props.patient?.insuranceProvider) {
      let details = props.patient.insuranceProvider
      if (props.patient?.insuranceNumber) {
        details += ` (${props.patient.insuranceNumber})`
      }
      return details
    }
    return '-'
  })

  const primaryEmergencyContact = computed(() => {
    if (props.patient?.emergencyContacts && props.patient.emergencyContacts.length > 0) {
      const contact = props.patient.emergencyContacts[0]
      return contact?.name || 'Sans nom'
    }
    return '-'
  })

  const primaryEmergencyPhone = computed(() => {
    if (props.patient?.emergencyContacts && props.patient.emergencyContacts.length > 0) {
      return props.patient.emergencyContacts[0]?.phone || '-'
    }
    return '-'
  })

  const allergiesList = computed(() => {
    if (props.patient?.allergies && props.patient.allergies.length > 0) {
      return props.patient.allergies
    }
    return []
  })

  const medicalHistoryList = computed(() => {
    if (props.patient?.medicalConditions && props.patient.medicalConditions.length > 0) {
      return props.patient.medicalConditions
    }
    return []
  })

  const currentTreatmentList = computed(() => {
    if (props.patient?.medications && props.patient.medications.length > 0) {
      return props.patient.medications
    }
    return []
  })

  const referralSource = computed(() => {
    return props.patient?.referralSource || '-'
  })

  const practitionerNotes = computed(() => {
    if (props.patient?.notes && props.patient.notes.length > 0) {
      return props.patient.notes.map((note) => ({
        text: note.content,
        author: note.author,
        date: formatDate(note.date)
      }))
    }
    return []
  })

  function formatDate(date: Date | string) {
    const noteDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInDays = differenceInDays(now, noteDate)

    if (diffInDays === 0) return "Aujourd'hui"
    if (diffInDays === 1) return 'Hier'
    if (diffInDays <= 7) return `il y a ${diffInDays} jours`
    if (diffInDays <= 30) return `il y a ${Math.floor(diffInDays / 7)} semaines`
    if (diffInDays <= 365) return `il y a ${Math.floor(diffInDays / 30)} mois`
    return `il y a ${Math.floor(diffInDays / 365)} ans`
  }

  // Static data for fields not yet connected to database
  const staticData = {
    upcomingSessions: [
      { date: '18', month: 'OCT', type: 'Renforcement', time: '11:00 - 30 min', status: 'upcoming' },
      { date: '15', month: 'OCT', type: 'Bilan initial', time: '10:00 - 45 min', status: 'completed' },
      { date: '12', month: 'OCT', type: 'Mobilisation', time: '09:00 - 30 min', status: 'missed' }
    ],
    recentDocuments: [
      { name: 'Radio_Epaule_Post-Chute.pdf', date: '02 Oct. 2024', type: 'radiology', icon: 'i-lucide-file-image' },
      { name: 'Rapport_Medecin_Traitant.docx', date: '01 Oct. 2024', type: 'document', icon: 'i-lucide-file-text' }
    ]
  }

  function getSessionBadgeColor(status: string) {
    switch (status) {
      case 'upcoming':
        return 'warning'
      case 'completed':
        return 'success'
      case 'missed':
        return 'error'
      default:
        return 'neutral'
    }
  }

  function getSessionBadgeLabel(status: string) {
    switch (status) {
      case 'upcoming':
        return 'À venir'
      case 'completed':
        return 'Terminée'
      case 'missed':
        return 'Manquée'
      default:
        return status
    }
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-3">
    <!-- Left Column -->
    <div class="flex flex-col gap-6 lg:col-span-1">
      <!-- Résumé rapide -->
      <UCard variant="outline">
        <template v-if="treatmentPlansLoading">
          <div class="flex items-center justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
          </div>
        </template>
        <template v-else-if="treatmentPlansError">
          <div class="py-8 text-center">
            <p class="text-muted">Erreur lors du chargement des données</p>
          </div>
        </template>
        <template v-else-if="getActiveTreatmentPlan">
          <h2 class="mb-5 text-lg font-bold">Résumé rapide</h2>
          <div class="space-y-4 text-sm">
            <div>
              <h3 class="text-muted font-semibold">Pathologie principale</h3>
              <p class="font-medium">{{ getActiveTreatmentPlan.diagnosis }}</p>
            </div>
            <div>
              <h3 class="text-muted font-semibold">Objectif du traitement</h3>
              <p class="font-medium">{{ getActiveTreatmentPlan.objective || 'Non spécifié' }}</p>
            </div>
            <div>
              <h3 class="text-muted mb-1 font-semibold">Niveau de douleur actuel</h3>
              <div class="flex items-center gap-3">
                <UProgress
                  :model-value="(getActiveTreatmentPlan.painLevel || 0) * 10"
                  :max="100"
                  color="primary"
                  size="md"
                  class="flex-1"
                />
                <span class="font-semibold">{{ getActiveTreatmentPlan.painLevel || 0 }}/10</span>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <h2 class="mb-5 text-lg font-bold">Résumé rapide</h2>
          <div class="space-y-4 text-sm">
            <div>
              <h3 class="text-muted font-semibold">Pathologie principale</h3>
              <p class="text-muted font-medium">Aucun plan de traitement actif</p>
            </div>
            <div>
              <h3 class="text-muted font-semibold">Objectif du traitement</h3>
              <p class="text-muted font-medium">Non spécifié</p>
            </div>
            <div>
              <h3 class="text-muted mb-1 font-semibold">Niveau de douleur actuel</h3>
              <div class="flex items-center gap-3">
                <UProgress :model-value="0" :max="100" color="primary" size="md" class="flex-1" />
                <span class="font-semibold">0/10</span>
              </div>
            </div>
          </div>
        </template>
      </UCard>

      <!-- Données administratives -->
      <UCard variant="outline">
        <h2 class="mb-5 text-lg font-bold">Données administratives</h2>
        <div class="space-y-3 text-sm">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-home" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Adresse</h3>
              <p class="font-medium">{{ fullAddress }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-heart" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Assurance/Mutuelle</h3>
              <p class="font-medium">{{ insuranceDetails }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-stethoscope" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Médecin prescripteur</h3>
              <p class="font-medium">{{ referralSource }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-phone-call" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Contact d'urgence</h3>
              <p class="font-medium">{{ primaryEmergencyContact }} - {{ primaryEmergencyPhone }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Données médicales -->
      <UCard variant="outline">
        <h2 class="mb-5 text-lg font-bold">Données médicales</h2>
        <div class="space-y-3 text-sm">
          <div>
            <h3 class="text-muted mb-2 font-semibold">Allergies / Contre-indications</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="allergy in allergiesList"
                :key="allergy"
                color="error"
                variant="subtle"
                size="md"
                class="rounded-full"
              >
                {{ allergy }}
              </UBadge>
              <span v-if="allergiesList.length === 0" class="text-muted">Aucune allergie connue</span>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Antécédents médicaux</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="condition in medicalHistoryList"
                :key="condition"
                color="warning"
                variant="subtle"
                size="md"
                class="text-error rounded-full"
              >
                {{ condition }}
              </UBadge>
              <span v-if="medicalHistoryList.length === 0" class="text-muted">Aucun antécédent médical connu</span>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Traitement actuel</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="medication in currentTreatmentList"
                :key="medication"
                color="primary"
                variant="subtle"
                size="md"
                class="rounded-full"
              >
                {{ medication }}
              </UBadge>
              <span v-if="currentTreatmentList.length === 0" class="text-muted">Aucun traitement en cours</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Notes du praticien -->
      <UCard variant="outline">
        <template #header>
          <h2 class="text-lg font-bold">Notes du praticien</h2>
        </template>
        <div class="space-y-4">
          <UTextarea placeholder="Ajouter une note rapide..." :rows="2" class="w-full" />
          <div v-for="note in practitionerNotes" :key="note.date" class="text-sm">
            <p class="truncate">{{ note.text }}</p>
            <p class="text-muted text-xs">{{ note.author }} - {{ note.date }}</p>
          </div>
          <div v-if="practitionerNotes.length === 0" class="text-muted text-sm">Aucune note enregistrée</div>
        </div>
      </UCard>
    </div>

    <!-- Right Column -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Plan de traitement actif -->
      <UCard variant="outline">
        <template v-if="treatmentPlansLoading">
          <div class="flex items-center justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
          </div>
        </template>
        <template v-else-if="treatmentPlansError">
          <div class="py-8 text-center">
            <p class="text-muted">Erreur lors du chargement des plans de traitement</p>
            <UButton variant="ghost" size="sm" @click="fetchTreatmentPlans(props.patient.id)">Réessayer</UButton>
          </div>
        </template>
        <template v-else-if="getActiveTreatmentPlan">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold">Plan de traitement actif</h2>
              <p class="text-muted text-sm">{{ getActiveTreatmentPlan.title }}</p>
            </div>
            <UBadge
              :color="formatTreatmentPlanStatus(getActiveTreatmentPlan.status).color"
              variant="soft"
              size="lg"
              class="rounded-full"
            >
              {{ formatTreatmentPlanStatus(getActiveTreatmentPlan.status).label }}
            </UBadge>
          </div>
          <div class="text-muted mb-5 space-y-3 text-sm">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar" class="shrink-0 text-base" />
              <span>{{ formatDateRange(getActiveTreatmentPlan.startDate, getActiveTreatmentPlan.endDate) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user" class="shrink-0 text-base" />
              <span>Thérapeute: {{ getTherapistName(getActiveTreatmentPlan.therapist) }}</span>
            </div>
          </div>
          <div>
            <div class="text-muted mb-1 flex items-center justify-between text-sm">
              <span>
                Progression ({{ getActiveTreatmentPlan.completedConsultations }}/{{
                  getActiveTreatmentPlan.numberOfSessions || 0
                }}
                séances)
              </span>
              <span>{{ getActiveTreatmentPlan.progress }}%</span>
            </div>
            <UProgress :model-value="getActiveTreatmentPlan.progress" :max="100" color="primary" size="lg" />
          </div>
          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <UButton variant="soft" color="neutral" icon="i-lucide-eye">Voir détail</UButton>
            <UButton variant="soft" color="neutral" icon="i-lucide-edit">Modifier</UButton>
            <UButton variant="soft" color="neutral" icon="i-lucide-archive">Clôturer</UButton>
            <UButton color="primary" icon="i-lucide-plus">Nouveau plan</UButton>
          </div>
        </template>
        <template v-else>
          <div class="py-8 text-center">
            <UIcon name="i-lucide-clipboard-list" class="text-muted mx-auto mb-4 text-4xl" />
            <h3 class="mb-2 text-lg font-semibold">Aucun plan de traitement actif</h3>
            <p class="text-muted mb-4">Commencez par créer un plan de traitement pour ce patient</p>
            <UButton color="primary" icon="i-lucide-plus">Créer un plan</UButton>
          </div>
        </template>
      </UCard>

      <!-- Aperçu des séances -->
      <UCard variant="outline">
        <h2 class="mb-5 text-lg font-bold">Aperçu des prochaines/dernières séances</h2>
        <div class="flow-root">
          <ul class="divide-default -my-4 divide-y">
            <li
              v-for="session in staticData.upcomingSessions"
              :key="session.date"
              class="flex items-center justify-between py-4"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 text-center">
                  <p class="text-sm font-bold">{{ session.date }}</p>
                  <p class="text-muted text-xs">{{ session.month }}</p>
                </div>
                <div>
                  <p class="font-semibold">{{ session.type }}</p>
                  <p class="text-muted text-sm">{{ session.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge :color="getSessionBadgeColor(session.status)" variant="soft" size="sm">
                  {{ getSessionBadgeLabel(session.status) }}
                </UBadge>
                <UButton variant="ghost" size="sm" icon="i-lucide-eye" square />
              </div>
            </li>
          </ul>
        </div>
      </UCard>

      <!-- Documents récents -->
      <UCard variant="outline">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">Documents récents du plan</h2>
          <UButton variant="ghost" class="">Voir tous les documents</UButton>
        </div>
        <div class="space-y-3">
          <div v-for="doc in staticData.recentDocuments" :key="doc.name" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon :name="doc.icon" class="text-primary text-xl" />
              <div>
                <p class="text-sm font-semibold">{{ doc.name }}</p>
                <p class="text-muted text-xs">{{ doc.date }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <UButton variant="ghost" size="sm" icon="i-lucide-eye" square />
              <UButton variant="ghost" size="sm" icon="i-lucide-download" square />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Historique des plans -->
      <UCard variant="outline">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">Historique des plans</h2>
          <UButton variant="ghost" class="">Voir tous les plans</UButton>
        </div>
        <template v-if="treatmentPlansLoading">
          <div class="flex items-center justify-center py-4">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-xl" />
          </div>
        </template>
        <template v-else-if="getTreatmentPlanHistory.length > 0">
          <div class="space-y-3">
            <div
              v-for="plan in getTreatmentPlanHistory"
              :key="plan.id"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex flex-col">
                <p class="font-semibold">{{ plan.title }}</p>
                <p class="text-muted text-xs">{{ formatDateRange(plan.startDate, plan.endDate) }}</p>
              </div>
              <UBadge :color="formatTreatmentPlanStatus(plan.status).color" variant="soft" size="md">
                {{ formatTreatmentPlanStatus(plan.status).label }}
              </UBadge>
            </div>
          </div>
        </template>
        <template v-else>
          <UEmpty icon="i-lucide-history" description="Aucun historique de plans de traitement" class="py-4" />
        </template>
      </UCard>
    </div>
  </div>
</template>
