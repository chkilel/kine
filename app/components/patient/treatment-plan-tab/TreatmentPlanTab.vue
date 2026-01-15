<script setup lang="ts">
  const props = defineProps<{ patient: Patient }>()

  const toast = useToast()

  const { openCreateSlideover } = useTreatmentPlanSlideover()

  // Use treatment plans composable
  const {
    refetchTreatmentPlans,
    latestActiveTreatmentPlan,
    loading: treatmentPlansLoading,
    error: treatmentPlansError
  } = usePatientTreatmentPlans(() => props.patient?.id)

  // Retry fetch with user feedback
  async function retryFetch() {
    try {
      await refetchTreatmentPlans()
      toast.add({
        title: 'Données actualisées',
        description: 'Les plans de traitement ont été rechargés avec succès.',
        color: 'success'
      })
    } catch (err: any) {
      toast.add({
        title: 'Erreur de chargement',
        description: 'Impossible de recharger les données. Veuillez réessayer plus tard.',
        color: 'error'
      })
    }
  }
</script>

<template>
  <!-- Loading State -->
  <div v-if="treatmentPlansLoading" class="flex items-center justify-center py-12">
    <div class="flex items-center gap-3">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
      <span class="text-muted">Chargement des plans de traitement...</span>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="treatmentPlansError" class="mt-6">
    <UAlert color="error" icon="i-lucide-alert-circle" title="Erreur de chargement">
      <template #description>
        {{ treatmentPlansError?.message || 'Failed to fetch treatment plans' }}
        <UButton @click="retryFetch()" variant="link" color="error" size="sm" class="ml-2">Réessayer</UButton>
      </template>
    </UAlert>
  </div>

  <!-- Empty State -->
  <div v-else-if="!latestActiveTreatmentPlan" class="mt-6">
    <UEmpty
      icon="i-lucide-clipboard-plus"
      title="Aucun plan de traitement"
      description="Ce patient n'a pas encore de plan de traitement. Créez-en un pour commencer le suivi."
      :actions="[
        { label: 'Créer un plan', icon: 'i-lucide-plus', color: 'primary', onClick: () => openCreateSlideover(patient) }
      ]"
    />
  </div>

  <!-- Treatment Plan Content -->
  <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column -->
    <div class="flex flex-col gap-6 lg:col-span-1">
      <PatientTreatmentPlanTabSummary :patient="patient" :treatment-plan="latestActiveTreatmentPlan" />

      <PatientTreatmentPlanTabDetails :treatment-plan="latestActiveTreatmentPlan" />

      <PatientTreatmentPlanTabNotes :patient="patient" :treatment-plan="latestActiveTreatmentPlan" />
    </div>

    <!-- Right Column -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Consultations -->
      <PatientTreatmentPlanTabConsultations :patient="patient" :treatment-plan="latestActiveTreatmentPlan" />

      <!-- Documents -->
      <PatientTreatmentPlanTabDocuments :treatment-plan="latestActiveTreatmentPlan" />
    </div>
  </div>
</template>
