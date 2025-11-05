<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'

  interface Props {
    patient: Patient
  }

  const props = defineProps<Props>()

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
      return contact.name || '-'
    }
    return '-'
  })

  const primaryEmergencyPhone = computed(() => {
    if (props.patient?.emergencyContacts && props.patient.emergencyContacts.length > 0) {
      return props.patient.emergencyContacts[0].phone || '-'
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

  // Static data for fields not in database
  const staticData = {
    mainPathology: "Tendinopathie calcifiante de l'épaule",
    treatmentObjective: 'Récupération amplitude & force',
    sessionsCompleted: 10,
    sessionsTotal: 15,
    painLevel: 4,
    coverage: '80%',
    doctor: 'Dr. Leblanc',
    practitionerNotes: [
      { text: 'Amélioration notable de la mobilité en abduction.', author: 'Dr. Martin', date: 'il y a 2 jours' },
      { text: 'Douleur résiduelle à la palpation du tendon.', author: 'Dr. Martin', date: 'il y a 5 jours' }
    ],
    treatmentPlan: {
      name: 'Rééducation épaule droite',
      status: 'Actif',
      startDate: '01/10/2024',
      endDate: '30/11/2024',
      therapist: 'Dr. Martin',
      progress: 67
    },
    upcomingSessions: [
      { date: '18', month: 'OCT', type: 'Renforcement', time: '11:00 - 30 min', status: 'upcoming' },
      { date: '15', month: 'OCT', type: 'Bilan initial', time: '10:00 - 45 min', status: 'completed' },
      { date: '12', month: 'OCT', type: 'Mobilisation', time: '09:00 - 30 min', status: 'missed' }
    ],
    recentDocuments: [
      { name: 'Radio_Epaule_Post-Chute.pdf', date: '02 Oct. 2024', type: 'radiology', icon: 'i-lucide-file-image' },
      { name: 'Rapport_Medecin_Traitant.docx', date: '01 Oct. 2024', type: 'document', icon: 'i-lucide-file-text' }
    ],
    treatmentHistory: [
      { name: 'Lombalgie aiguë', period: 'Juin 2023 - Juil. 2023', status: 'closed' },
      { name: 'Entorse cheville', period: 'Janv. 2022 - Fév. 2022', status: 'closed' }
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
        <h2 class="mb-5 text-lg font-bold">Résumé rapide</h2>
        <div class="space-y-4 text-sm">
          <div>
            <h3 class="text-muted font-semibold">Pathologie principale</h3>
            <p>{{ staticData.mainPathology }}</p>
          </div>
          <div>
            <h3 class="text-muted font-semibold">Objectif du traitement</h3>
            <p>{{ staticData.treatmentObjective }}</p>
          </div>
          <div>
            <h3 class="text-muted mb-1 font-semibold">Niveau de douleur actuel</h3>
            <div class="flex items-center gap-3">
              <UProgress :model-value="staticData.painLevel * 10" :max="100" color="primary" size="md" class="flex-1" />
              <span class="font-semibold">{{ staticData.painLevel }}/10</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Données administratives -->
      <UCard variant="outline">
        <h2 class="mb-5 text-lg font-bold">Données administratives</h2>
        <div class="space-y-3 text-sm">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-home" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Adresse</h3>
              <p class="text-default">{{ fullAddress }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-heart" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Assurance/Mutuelle</h3>
              <p class="text-default">{{ insuranceDetails }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-stethoscope" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Médecin prescripteur</h3>
              <p class="text-default">{{ referralSource }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-phone-call" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Contact d'urgence</h3>
              <p class="text-default">{{ primaryEmergencyContact }} - {{ primaryEmergencyPhone }}</p>
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
          <div v-for="note in staticData.practitionerNotes" :key="note.date" class="text-sm">
            <p class="truncate">{{ note.text }}</p>
            <p class="text-muted text-xs">{{ note.author }} - {{ note.date }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Right Column -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Plan de traitement actif -->
      <UCard variant="outline">
        <div class="mb-4 flex items-start justify-between">
          <div>
            <h2 class="text-lg font-bold">Plan de traitement actif</h2>
            <p class="text-muted text-sm">{{ staticData.treatmentPlan.name }}</p>
          </div>
          <UBadge color="success" variant="soft" size="lg" class="rounded-full">
            {{ staticData.treatmentPlan.status }}
          </UBadge>
        </div>
        <div class="text-muted mb-5 space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="shrink-0 text-base" />
            <span>Début: {{ staticData.treatmentPlan.startDate }} - Fin: {{ staticData.treatmentPlan.endDate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="shrink-0 text-base" />
            <span>Thérapeute: {{ staticData.treatmentPlan.therapist }}</span>
          </div>
        </div>
        <div>
          <div class="text-muted mb-1 flex items-center justify-between text-sm">
            <span>Progression ({{ staticData.sessionsCompleted }}/{{ staticData.sessionsTotal }} séances)</span>
            <span>{{ staticData.treatmentPlan.progress }}%</span>
          </div>
          <UProgress :model-value="staticData.treatmentPlan.progress" :max="100" color="primary" size="lg" />
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <UButton variant="soft" color="neutral" icon="i-lucide-eye">Voir détail</UButton>
          <UButton variant="soft" color="neutral" icon="i-lucide-edit">Modifier</UButton>
          <UButton variant="soft" color="neutral" icon="i-lucide-archive">Clôturer</UButton>
          <UButton color="primary" icon="i-lucide-plus">Nouveau plan</UButton>
        </div>
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
        <div class="space-y-3">
          <div
            v-for="plan in staticData.treatmentHistory"
            :key="plan.name"
            class="flex items-center justify-between text-sm"
          >
            <div class="flex flex-col">
              <p class="font-semibold">{{ plan.name }}</p>
              <p class="text-muted text-xs">{{ plan.period }}</p>
            </div>
            <UBadge color="neutral" variant="soft" size="md">Clôturé</UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
