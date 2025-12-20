<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()

  // Use treatment plans composable for history
  const { getTreatmentPlanHistory, loading: treatmentPlansLoading } = usePatientTreatmentPlans(() => patient?.id)
</script>

<template>
  <AppCard variant="outline" title="Historique des plans">
    <template #actions>
      <UButton variant="ghost" class="">Voir tous les plans</UButton>
    </template>

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
          <UBadge :color="getTreatmentPlanStatusColor(plan.status)" variant="soft" size="md">
            {{ getTreatmentPlanStatusLabel(plan.status) }}
          </UBadge>
        </div>
      </div>
    </template>
    <template v-else>
      <UEmpty icon="i-lucide-history" description="Aucun historique de plans de traitement" class="py-4" />
    </template>
  </AppCard>
</template>
