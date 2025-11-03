<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'

  interface Props {
    patient: Patient
  }

  const props = defineProps<Props>()

  // Hardcoded data for overview tab
  const overviewData = {
    mainPathology: "Tendinopathie calcifiante de l'épaule",
    treatmentObjective: 'Récupération amplitude & force',
    sessionsCompleted: 10,
    sessionsTotal: 15,
    painLevel: 4,
    fullAddress: '123 Rue de la République, 75001 Paris',
    insuranceDetails: 'Mutuelle SantéPlus (Couverture 80%)',
    prescribingDoctor: 'Dr. Leblanc',
    emergencyContactName: 'Sophie Dupont',
    emergencyContactPhone: '06 87 65 43 21',
    allergiesList: ['Aspirine'],
    medicalHistoryList: ['HTA', 'Diabète type 2'],
    currentTreatmentList: ['Metformine'],
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
      { name: 'Radio_Epaule_Post-Chute.pdf', date: '02 Oct. 2024', type: 'radiology', icon: 'i-lucide-radiology' },
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
        <template #header>
          <h2 class="text-lg font-bold">Résumé rapide</h2>
        </template>
        <div class="space-y-4 text-sm">
          <div>
            <h3 class="text-muted font-semibold">Pathologie principale</h3>
            <p class="text-default">{{ overviewData.mainPathology }}</p>
          </div>
          <div>
            <h3 class="text-muted font-semibold">Objectif du traitement</h3>
            <p class="text-default">{{ overviewData.treatmentObjective }}</p>
          </div>
          <div>
            <h3 class="text-muted font-semibold">Séances</h3>
            <p class="text-default">
              {{ overviewData.sessionsCompleted }} / {{ overviewData.sessionsTotal }} effectuées
            </p>
          </div>
          <div>
            <h3 class="text-muted mb-1 font-semibold">Niveau de douleur actuel</h3>
            <div class="flex items-center gap-3">
              <UProgress
                :model-value="overviewData.painLevel * 10"
                :max="100"
                color="primary"
                size="md"
                class="flex-1"
              />
              <span class="text-default font-semibold">{{ overviewData.painLevel }}/10</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Données administratives -->
      <UCard variant="outline">
        <template #header>
          <h2 class="text-lg font-bold">Données administratives</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-home" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Adresse</h3>
              <p class="text-default">{{ overviewData.fullAddress }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-heart" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Assurance/Mutuelle</h3>
              <p class="text-default">{{ overviewData.insuranceDetails }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-stethoscope" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Médecin prescripteur</h3>
              <p class="text-default">{{ overviewData.prescribingDoctor }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-phone-call" class="text-muted mt-0.5 shrink-0 text-base" />
            <div>
              <h3 class="text-muted font-semibold">Contact d'urgence</h3>
              <p class="text-default">
                {{ overviewData.emergencyContactName }} - {{ overviewData.emergencyContactPhone }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Données médicales -->
      <UCard variant="outline">
        <template #header>
          <h2 class="text-lg font-bold">Données médicales</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div>
            <h3 class="text-muted mb-2 font-semibold">Allergies / Contre-indications</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="allergy in overviewData.allergiesList"
                :key="allergy"
                color="error"
                variant="outline"
                size="xs"
              >
                {{ allergy }}
              </UBadge>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Antécédents médicaux</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="condition in overviewData.medicalHistoryList"
                :key="condition"
                color="warning"
                variant="outline"
                size="xs"
              >
                {{ condition }}
              </UBadge>
            </div>
          </div>
          <div>
            <h3 class="text-muted mb-2 font-semibold">Traitement actuel</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="medication in overviewData.currentTreatmentList"
                :key="medication"
                color="primary"
                variant="outline"
                size="xs"
              >
                {{ medication }}
              </UBadge>
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
          <div v-for="note in overviewData.practitionerNotes" :key="note.date" class="text-sm">
            <p class="text-default truncate">{{ note.text }}</p>
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
            <p class="text-muted text-sm">{{ overviewData.treatmentPlan.name }}</p>
          </div>
          <UBadge color="success" variant="outline" size="xs">
            {{ overviewData.treatmentPlan.status }}
          </UBadge>
        </div>
        <div class="text-muted mb-5 space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="shrink-0 text-base" />
            <span>
              Début: {{ overviewData.treatmentPlan.startDate }} - Fin: {{ overviewData.treatmentPlan.endDate }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="shrink-0 text-base" />
            <span>Thérapeute: {{ overviewData.treatmentPlan.therapist }}</span>
          </div>
        </div>
        <div>
          <div class="text-muted mb-1 flex items-center justify-between text-sm">
            <span>Progression ({{ overviewData.sessionsCompleted }}/{{ overviewData.sessionsTotal }} séances)</span>
            <span>{{ overviewData.treatmentPlan.progress }}%</span>
          </div>
          <UProgress :model-value="overviewData.treatmentPlan.progress" max="100" color="primary" size="md" />
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <UButton variant="outline" color="neutral" class="flex-1" icon="i-lucide-edit">Modifier</UButton>
          <UButton variant="outline" color="neutral" class="flex-1" icon="i-lucide-archive">Clôturer</UButton>
          <UButton color="primary" class="flex-1" icon="i-lucide-plus">Nouveau plan</UButton>
        </div>
      </UCard>

      <!-- Aperçu des séances -->
      <UCard variant="outline">
        <template #header>
          <h2 class="text-lg font-bold">Aperçu des prochaines/dernières séances</h2>
        </template>
        <div class="flow-root">
          <ul class="divide-default -my-4 divide-y">
            <li
              v-for="session in overviewData.upcomingSessions"
              :key="session.date"
              class="flex items-center justify-between py-4"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 text-center">
                  <p class="text-default text-sm font-bold">{{ session.date }}</p>
                  <p class="text-muted text-xs">{{ session.month }}</p>
                </div>
                <div>
                  <p class="text-default font-semibold">{{ session.type }}</p>
                  <p class="text-muted text-sm">{{ session.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge :color="getSessionBadgeColor(session.status)" variant="outline" size="xs">
                  {{ getSessionBadgeLabel(session.status) }}
                </UBadge>
                <UButton variant="ghost" size="xs" icon="i-lucide-eye" square />
              </div>
            </li>
          </ul>
        </div>
      </UCard>

      <!-- Documents récents -->
      <UCard variant="outline">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">Documents récents du plan</h2>
          <NuxtLink to="#" class="text-primary text-sm font-semibold hover:underline">Voir tous les documents</NuxtLink>
        </div>
        <div class="space-y-3">
          <div v-for="doc in overviewData.recentDocuments" :key="doc.name" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon :name="doc.icon" class="text-primary text-xl" />
              <div>
                <p class="text-default text-sm font-semibold">{{ doc.name }}</p>
                <p class="text-muted text-xs">{{ doc.date }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <UButton variant="ghost" size="xs" icon="i-lucide-eye" square />
              <UButton variant="ghost" size="xs" icon="i-lucide-download" square />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Historique des plans -->
      <UCard variant="outline">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">Historique des plans</h2>
          <NuxtLink to="#" class="text-primary text-sm font-semibold hover:underline">Voir tous les plans</NuxtLink>
        </div>
        <div class="space-y-3">
          <div
            v-for="plan in overviewData.treatmentHistory"
            :key="plan.name"
            class="flex items-center justify-between text-sm"
          >
            <div class="flex flex-col">
              <p class="text-default font-semibold">{{ plan.name }}</p>
              <p class="text-muted text-xs">{{ plan.period }}</p>
            </div>
            <UBadge color="neutral" variant="outline" size="xs">Clôturé</UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
