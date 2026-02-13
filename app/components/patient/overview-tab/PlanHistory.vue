<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()

  const router = useRouter()

  const { archivedTreatmentPlans, loading } = usePatientTreatmentPlans(() => patient?.id)

  const isExpanded = ref(false)

  const displayedPlans = computed(() => {
    const plans = archivedTreatmentPlans.value || []
    if (isExpanded.value) {
      return plans
    }
    return plans.slice(0, 3)
  })

  const hasMorePlans = computed(() => {
    return (archivedTreatmentPlans.value?.length || 0) > 3
  })

  const remainingCount = computed(() => {
    return (archivedTreatmentPlans.value?.length || 0) - 3
  })

  function navigateToPlan(planId?: string) {
    if (planId) {
      router.push(`/patients/${patient.id}/plan?planId=${planId}`)
    } else {
      router.push(`/patients/${patient.id}/plan`)
    }
  }
</script>

<template>
  <AppCard title="Historique Plans">
    <template v-if="loading">
      <div class="flex items-center justify-center py-4">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-xl" />
      </div>
    </template>

    <template v-else-if="archivedTreatmentPlans.length > 0">
      <div class="space-y-3">
        <div
          v-for="plan in displayedPlans"
          :key="plan.id"
          class="bg-muted border-default flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all hover:shadow-md"
          @click="navigateToPlan(plan.id)"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">{{ plan.title }}</p>
            <p class="text-muted-foreground text-xs">
              {{ formatFrenchDateRange(plan.startDate, plan.endDate) }}
            </p>
          </div>
          <UBadge :color="getTreatmentPlanStatusColor(plan.status)" variant="subtle" size="md">
            {{ getTreatmentPlanStatusLabel(plan.status) }}
          </UBadge>
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-2">
        <UButton
          v-if="hasMorePlans"
          variant="ghost"
          color="neutral"
          size="sm"
          :trailing-icon="isExpanded ? 'hugeicons-arrow-up-01' : 'hugeicons-arrow-down-01'"
          :label="isExpanded ? 'Réduire' : ``"
          class="self-end"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? 'Réduire' : `Voir ${remainingCount} plan${remainingCount > 1 ? 's' : ''} de plus` }}
        </UButton>

        <UButton
          variant="ghost"
          size="sm"
          trailing-icon="hugeicons-arrow-right-02"
          label="Voir tout l'historique dans l'onglet Plan"
          class="justify-center"
          @click="() => navigateToPlan()"
        />
      </div>
    </template>

    <UEmpty v-else variant="naked" icon="i-hugeicons-clock-03" description="Aucun historique de plans de traitement" />
  </AppCard>
</template>
