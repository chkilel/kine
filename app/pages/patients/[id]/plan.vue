<script setup lang="ts">
  const route = useRoute()
  const toast = useToast()

  const { openCreateSlideover } = useTreatmentPlanSlideover()

  // Fetching data
  const { data: patient, isPending } = usePatientById(() => route.params.id as string)
  const {
    refetchTreatmentPlans,
    treatmentPlans,
    latestActiveTreatmentPlan,
    loading: treatmentPlansLoading,
    error: treatmentPlansError
  } = usePatientTreatmentPlans(() => route.params.id as string)

  // Get selected plan from URL or default to latest active
  const selectedPlanId = computed<string>({
    get: () => {
      const planId = route.query.planId as string | undefined
      if (planId && treatmentPlans.value?.some((p) => p.id === planId)) {
        return planId
      }
      return latestActiveTreatmentPlan.value?.id ?? ''
    },
    set: (id) => {
      navigateTo({
        path: route.path,
        query: { ...route.query, planId: id || undefined }
      })
    }
  })

  const selectedTreatmentPlan = computed((): TreatmentPlanWithProgress | null => {
    if (!treatmentPlans.value || !selectedPlanId.value) return null
    const plan = treatmentPlans.value.find((p) => p.id === selectedPlanId.value)
    return plan ? ({ ...plan } as TreatmentPlanWithProgress) : null
  })

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
  <div v-if="isPending" class="flex justify-center py-8">
    <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
  </div>

  <template v-else-if="patient">
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
    <div v-else-if="!treatmentPlans?.length" class="mt-6">
      <UEmpty
        icon="i-lucide-clipboard-plus"
        title="Aucun plan de traitement"
        description="Ce patient n'a pas encore de plan de traitement. Créez-en un pour commencer le suivi."
        :actions="[
          {
            label: 'Créer un plan',
            icon: 'i-lucide-plus',
            color: 'primary',
            onClick: () => openCreateSlideover(patient!)
          }
        ]"
      />
    </div>

    <!-- Treatment Plan Content -->
    <div v-else class="space-y-4">
      <!-- Plan Selector -->
      <PatientTreatmentPlanTabPlanSelector
        :patient="patient"
        :treatment-plans="(treatmentPlans || []) as readonly TreatmentPlanWithProgress[]"
        v-model:selected-plan-id="selectedPlanId"
      />

      <!-- Selected Plan Content -->
      <div v-if="selectedTreatmentPlan">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Left Column -->
          <div class="flex flex-col gap-6 lg:col-span-1">
            <PatientTreatmentPlanTabSummary :patient="patient" :treatment-plan="selectedTreatmentPlan" />

            <PatientTreatmentPlanTabDetails :treatment-plan="selectedTreatmentPlan" />

            <!-- Documents -->
            <PatientTreatmentPlanTabDocuments :treatment-plan="selectedTreatmentPlan" />
          </div>

          <!-- Right Column -->
          <div class="flex flex-col gap-6 lg:col-span-2">
            <!-- Consultations -->
            <PatientTreatmentPlanTabConsultations :patient="patient" :treatment-plan="selectedTreatmentPlan" />

            <PatientTreatmentPlanTabNotes :patient="patient" :treatment-plan="selectedTreatmentPlan" />
          </div>
        </div>
      </div>

      <!-- No Plan Selected State -->
      <div v-else class="mt-6">
        <UAlert color="warning" icon="i-lucide-alert-circle" title="Plan non trouvé">
          <template #description>Le plan de traitement sélectionné n'existe pas ou a été supprimé.</template>
        </UAlert>
      </div>
    </div>
  </template>
  <!-- <LazyPatientTreatmentPlanTab v-else-if="patient" :patient="patient" /> -->
</template>
