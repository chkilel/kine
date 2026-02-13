<script setup lang="ts">
  interface PlanOption {
    label: string
    value: string
    description: string
    status: TreatmentPlan['status'] | 'all'
  }

  const selectedPlanId = defineModel<string>('selectedPlanId', { required: true })
  const {
    showAllOption,
    patientId,
    allOptionLabel = 'Tous les plans',
    allOptionDescription = 'Afficher tous les plans de traitement',
    placeholder = 'Sélectionner un plan de traitement...',
    hint
  } = defineProps<{
    patientId: string
    showAllOption?: boolean
    allOptionLabel?: string
    allOptionDescription?: string
    placeholder?: string
    hint?: string
  }>()

  const { getTherapistName } = useOrganizationMembers()
  const { treatmentPlansGroupedByStatus: treatmentPlans } = usePatientTreatmentPlans(() => patientId)

  const selectedPlan = computed(() => treatmentPlans.value.find((p) => p.id === selectedPlanId.value) ?? null)

  const planOptions = computed<PlanOption[]>(() => {
    const allOption: PlanOption | null = showAllOption
      ? {
          label: allOptionLabel,
          value: 'all',
          description: allOptionDescription,
          status: 'all'
        }
      : null

    const planOptions = treatmentPlans.value.map((plan) => ({
      label: plan.title || 'Plan sans titre',
      value: plan.id,
      description: `${formatFrenchDateRange(plan.startDate, plan.endDate)} · ${getTherapistName(plan.therapistId)}`,
      status: plan.status
    }))

    return allOption ? [allOption, ...planOptions] : planOptions
  })

  const isAllSelected = computed(() => selectedPlanId.value === 'all')
</script>

<template>
  <USelectMenu
    v-model="selectedPlanId"
    :items="planOptions"
    value-key="value"
    size="xl"
    variant="outline"
    :placeholder="placeholder"
    :clear="!isAllSelected && showAllOption"
    :search-input="{
      placeholder: 'Rechercher un plan de traitement...',
      icon: 'i-hugeicons-search-01'
    }"
    :ui="{
      base: 'border-primary border ring-0 border-dashed bg-primary/5 hover:bg-default w-full cursor-pointer rounded-xl ',
      trailingIcon: 'size-8'
    }"
    @clear="selectedPlanId = 'all'"
  >
    <div v-if="isAllSelected" class="flex w-full items-center gap-3 p-2">
      <AppIconBox name="i-hugeicons:file-01" color="neutral" size="xl" class="shrink-0 rounded" />
      <div class="flex-1 text-left">
        <h3 class="text-lg font-bold">
          {{ allOptionLabel || 'Tous les plans' }}
        </h3>
        <p class="text-muted text-xs">{{ allOptionDescription || 'Afficher tous les documents' }}</p>
      </div>
    </div>
    <div v-else-if="selectedPlan" class="flex w-full items-center gap-3 p-2">
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
    <div v-else-if="!selectedPlanId" class="flex w-full items-center gap-3 p-2">
      <AppIconBox name="i-hugeicons:first-aid-kit" color="neutral" size="xl" class="shrink-0 rounded" />
      <div class="flex-1 text-left">
        <h3 class="text-lg font-bold">
          {{ placeholder }}
        </h3>
        <p v-if="hint" class="text-muted text-xs">{{ hint }}</p>
      </div>
    </div>
    <template #item="{ item }">
      <div class="flex w-full items-center gap-3 p-2">
        <AppIconBox
          :name="item.status === 'all' ? 'i-hugeicons:file-01' : getTreatmentPlanStatusIcon(item.status)"
          :color="item.status === 'all' ? 'neutral' : getTreatmentPlanStatusColor(item.status)"
          class="shrink-0"
        />
        <div class="flex-1 text-left">
          <h3 class="text-sm font-semibold">
            {{ item.label }}
          </h3>
          <p class="text-muted text-xs">
            {{ item.description }}
          </p>
        </div>
        <UBadge
          v-if="item.status !== 'all'"
          :color="getTreatmentPlanStatusColor(item.status)"
          variant="solid"
          size="md"
        >
          {{ getTreatmentPlanStatusLabel(item.status) }}
        </UBadge>
      </div>
    </template>
  </USelectMenu>
</template>
