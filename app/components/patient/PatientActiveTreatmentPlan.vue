<script setup lang="ts">
  import { LazyTreatmentPlanCreateSlideover } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSlideover)

  // Use treatment plans composable
  const {
    refetchTreatmentPlans,
    getActiveTreatmentPlan,
    loading: treatmentPlansLoading,
    error: treatmentPlansError
  } = usePatientTreatmentPlans(() => patient?.id)

  function openCreateTreatmentPlan() {
    treatmentPlanCreateOverlay.open({ patient })
  }

  function openEditTreatmentPlan() {
    const activePlan = getActiveTreatmentPlan.value
    if (!activePlan) return

    treatmentPlanCreateOverlay.open({
      patient,
      treatmentPlan: activePlan
    })
  }
</script>

<template>
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
        <div class="flex items-center gap-2">
          <UBadge color="success" variant="subtle">Actif</UBadge>
          <UButton
            icon="i-lucide-edit"
            variant="ghost"
            color="neutral"
            size="sm"
            square
            @click="openEditTreatmentPlan"
          />
        </div>
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
</template>
