<script setup lang="ts">
  import { LazyTreatmentPlanCreateSideover } from '#components'
  import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const { patient } = defineProps<{ patient: Patient }>()

  // Static data for fields not yet connected to database
  const staticData = {
    upcomingSessions: [
      {
        date: '18',
        month: 'OCT',
        type: 'Renforcement',
        time: '11:00 - 30 min',
        status: 'scheduled' as ConsultationStatus
      },
      {
        date: '15',
        month: 'OCT',
        type: 'Bilan initial',
        time: '10:00 - 45 min',
        status: 'completed' as ConsultationStatus
      },
      {
        date: '12',
        month: 'OCT',
        type: 'Mobilisation',
        time: '09:00 - 30 min',
        status: 'no_show' as ConsultationStatus
      }
    ],
    recentDocuments: [
      { name: 'Radio_Epaule_Post-Chute.pdf', date: '02 Oct. 2024', type: 'radiology', icon: 'i-lucide-file-image' },
      { name: 'Rapport_Medecin_Traitant.docx', date: '01 Oct. 2024', type: 'document', icon: 'i-lucide-file-text' }
    ]
  }

  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSideover)

  // Use treatment plans composable
  const {
    refetchTreatmentPlans,
    getActiveTreatmentPlan,
    getTreatmentPlanHistory,
    loading: treatmentPlansLoading,
    error: treatmentPlansError
  } = usePatientTreatmentPlans(() => patient?.id)

  // Computed properties for database fields
  const fullAddress = computed(() => {
    const parts = []
    if (patient?.address) parts.push(patient.address)
    if (patient?.city) parts.push(patient.city)
    if (patient?.postalCode) parts.push(patient.postalCode)
    if (patient?.country) parts.push(patient.country)
    return parts.join(', ') || '-'
  })

  const insuranceDetails = computed(() => {
    if (patient?.insuranceProvider) {
      let details = patient.insuranceProvider
      if (patient?.insuranceNumber) {
        details += ` (${patient.insuranceNumber})`
      }
      return details
    }
    return '-'
  })

  const allEmergencyContacts = computed(() => {
    if (!patient?.emergencyContacts || patient.emergencyContacts.length === 0) {
      return ['-']
    }

    return patient.emergencyContacts.map((contact) => {
      const name = contact.name || 'Sans nom'
      const relationship = contact.relationship ? `(${getRelationshipLabel(contact.relationship)})` : ''
      const phone = contact.phone || '-'
      return `${name} ${relationship} - ${phone}`
    })
  })

  const practitionerNotes = computed(() => {
    if (patient?.notes && patient.notes.length > 0) {
      return patient.notes.map((note) => ({
        text: note.content,
        author: note.author,
        date: formatDate(note.date)
      }))
    }
    return []
  })

  function formatDate(date: Date | string) {
    const noteDate = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    const diffInDays = differenceInDays(now, noteDate)

    if (diffInDays === 0) return "Aujourd'hui"
    if (diffInDays === 1) return 'Hier'

    return formatDistanceToNow(noteDate, { addSuffix: true, locale: fr })
  }

  function openCreateTreatmentPlan() {
    treatmentPlanCreateOverlay.open({ patient })
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-3">
    <!-- Left Column -->
    <div class="flex flex-col gap-6 lg:col-span-1">
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
              <p class="font-medium">{{ patient.referralSource || '-' }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-phone-call" class="text-muted mt-0.5 shrink-0 text-base" />
            <div class="w-full">
              <h3 class="text-muted font-semibold">Contacts d'urgence</h3>
              <div class="space-y-2">
                <div
                  v-for="(contact, index) in patient?.emergencyContacts"
                  :key="index"
                  class="flex w-full items-center justify-between"
                >
                  <div class="text-gray-800 dark:text-gray-200">
                    <p class="font-semibold">
                      {{ contact.name || 'Sans nom' }}

                      <span v-if="contact.relationship" class="font-normal">
                        ({{ getRelationshipLabel(contact.relationship) }})
                      </span>
                    </p>
                    <p class="font-title">{{ contact.phone || '-' }}</p>
                  </div>
                </div>
                <div v-if="allEmergencyContacts.length === 0" class="text-muted text-sm">
                  Aucun contact d'urgence enregistré
                </div>
              </div>
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
                v-for="allergy in patient.allergies"
                :key="allergy"
                color="error"
                variant="subtle"
                class="rounded-full"
              >
                {{ allergy }}
              </UBadge>
              <span v-if="patient.allergies?.length === 0" class="text-muted">Aucune allergie connue</span>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Chirurgies</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="surgery in patient.surgeries"
                :key="surgery"
                color="error"
                variant="subtle"
                class="rounded-full"
              >
                {{ surgery }}
              </UBadge>
              <span v-if="patient.allergies?.length === 0" class="text-muted">Aucune allergie connue</span>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Antécédents médicaux</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="condition in patient.medicalConditions"
                :key="condition"
                color="warning"
                variant="subtle"
                class="rounded-full"
              >
                {{ condition }}
              </UBadge>
              <span v-if="patient.medicalConditions?.length === 0" class="text-muted">
                Aucun antécédent médical connu
              </span>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Traitement actuel</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="medication in patient.medications"
                :key="medication"
                color="primary"
                variant="subtle"
                class="rounded-full"
              >
                {{ medication }}
              </UBadge>
              <span v-if="patient.medications?.length === 0" class="text-muted">Aucun traitement en cours</span>
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
            <UButton variant="ghost" size="sm" @click="refetchTreatmentPlans()">Réessayer</UButton>
          </div>
        </template>
        <template v-else-if="getActiveTreatmentPlan">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold">Plan de traitement actif</h2>
              <p class="text-muted text-sm">{{ getActiveTreatmentPlan.title }}</p>
            </div>
            <UBadge color="success" variant="subtle">Actif</UBadge>
          </div>
          <div class="mb-5 space-y-4 text-sm">
            <div>
              <h3 class="text-dimmed font-semibold">Pathologie principale</h3>
              <p class="font-medium">{{ getActiveTreatmentPlan.diagnosis }}</p>
            </div>
            <div>
              <h3 class="text-dimmed font-semibold">Objectif du traitement</h3>
              <p class="font-medium">{{ getActiveTreatmentPlan.objective || 'Non spécifié' }}</p>
            </div>
            <div class="text-toned flex items-center gap-20">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar" class="text-muted text-base" />
                <span>{{ formatDateRange(getActiveTreatmentPlan.startDate, getActiveTreatmentPlan.endDate) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user" class="text-muted text-base" />
                <span>Thérapeute: {{ getTherapistName(getActiveTreatmentPlan.therapist ?? undefined) }}</span>
              </div>
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
            <UProgress :model-value="getActiveTreatmentPlan.progress" :max="100" color="primary" size="md" />
          </div>
        </template>
        <template v-else>
          <UEmpty
            icon="i-lucide-clipboard-plus"
            title="Aucun plan de traitement"
            description="Ce patient n'a pas encore de plan de traitement. Créez-en un pour commencer le suivi."
            :actions="[
              { label: 'Créer un plan', icon: 'i-lucide-plus', color: 'primary', onClick: openCreateTreatmentPlan }
            ]"
          />
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
                <UBadge :color="getSessionStatusColor(session.status)" variant="soft" size="sm">
                  {{ getSessionStatusLabel(session.status) }}
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
