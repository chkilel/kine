<script setup lang="ts">
  interface PlanOption {
    label: string
    value: string
    description: string
    status: TreatmentPlan['status']
  }

  const props = defineProps<{
    patient: Patient
    treatmentPlans: readonly TreatmentPlanWithProgress[]
  }>()

  const selectedPlanId = defineModel<string>('selectedPlanId', { required: true })

  const selectedPlan = computed(() => props.treatmentPlans.find((p) => p.id === selectedPlanId.value) ?? null)

  const planOptions = computed<PlanOption[]>(() => {
    return props.treatmentPlans.map((plan) => ({
      label: plan.title || 'Plan sans titre',
      value: plan.id,
      description: formatFrenchDateRange(plan.startDate, plan.endDate),
      status: plan.status
    }))
  })
</script>

<template>
  <USelectMenu
    v-model="selectedPlanId"
    :items="planOptions"
    value-key="value"
    size="xl"
    variant="outline"
    :search-input="{
      placeholder: 'Rechercher un plan de traitement...',
      icon: 'i-hugeicons-search-01'
    }"
    :ui="{
      base: 'border-primary border ring-0 border-dashed bg-primary/5 hover:bg-default w-full cursor-pointer rounded-xl ',
      trailingIcon: 'size-8'
    }"
  >
    <div v-if="selectedPlan" class="flex w-full items-center gap-3 p-2">
      <AppIconBox
        :name="getTreatmentPlanStatusIcon(selectedPlan.status)"
        :color="getTreatmentPlanStatusColor(selectedPlan.status)"
        size="xl"
        class="shrink-0 rounded"
      />
      <div class="flex-1 text-left">
        <h3 class="text-lg font-bold">
          {{ selectedPlan.title }}
        </h3>
        <p class="text-muted text-xs">
          {{ getTreatmentPlanStatusDescription(selectedPlan.status) }}
        </p>
      </div>
      <UBadge :color="getTreatmentPlanStatusColor(selectedPlan.status)" variant="solid" size="md">
        {{ getTreatmentPlanStatusLabel(selectedPlan.status) }}
      </UBadge>
    </div>
    <template #item="{ item }">
      <div class="flex w-full items-center gap-3 p-2">
        <AppIconBox
          :name="getTreatmentPlanStatusIcon(item.status)"
          :color="getTreatmentPlanStatusColor(item.status)"
          class="shrink-0"
        />
        <div class="flex-1 text-left">
          <h3 class="text-sm font-semibold">
            {{ item.label }}
          </h3>
          <p class="text-muted text-[10px]">
            {{ getTreatmentPlanStatusDescription(item.status) }}
          </p>
        </div>
        <UBadge :color="getTreatmentPlanStatusColor(item.status)" variant="solid" size="md">
          {{ getTreatmentPlanStatusLabel(item.status) }}
        </UBadge>
      </div>
    </template>
  </USelectMenu>
</template>
