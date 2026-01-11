<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()

  const { getTreatmentPlanHistory, loading } = usePatientTreatmentPlans(() => patient?.id)
</script>

<template>
  <AppCard title="Historique Plans">
    <template v-if="loading">
      <div class="flex items-center justify-center py-4">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-xl" />
      </div>
    </template>

    <template v-else-if="getTreatmentPlanHistory.length > 0">
      <div class="space-y-3">
        <div
          v-for="plan in getTreatmentPlanHistory"
          :key="plan.id"
          class="bg-muted hover:border-default flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all"
        >
          <div>
            <p class="text-sm font-semibold">{{ plan.title }}</p>
            <p class="text-muted-foreground text-xs">
              {{ formatFrenchDateRange(plan.startDate, plan.endDate) }}
            </p>
          </div>
          <UBadge :color="getTreatmentPlanStatusColor(plan.status)" variant="subtle" size="md">
            {{ getTreatmentPlanStatusLabel(plan.status) }}
          </UBadge>
        </div>
      </div>

      <div v-if="getTreatmentPlanHistory.length > 0" class="mt-3 text-center">
        <UButton variant="ghost" size="sm" class="text-xs">Voir tous les anciens plans</UButton>
      </div>
    </template>

    <UEmpty v-else variant="naked" icon="i-hugeicons-clock-03" description="Aucun historique de plans de traitement" />
  </AppCard>
</template>
