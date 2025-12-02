<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()

  // Use treatment plans composable for history
  const { getTreatmentPlanHistory, loading: treatmentPlansLoading } = usePatientTreatmentPlans(() => patient?.id)
</script>

<template>
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
        <div v-for="plan in getTreatmentPlanHistory" :key="plan.id" class="flex items-center justify-between text-sm">
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
</template>
