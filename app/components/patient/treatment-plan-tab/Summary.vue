<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const { openCreateSlideover, openEditSlideover } = useTreatmentPlanSlideover()

  const toast = useToast()
  const { getTherapistName } = useOrganizationMembers()

  const closeTreatmentPlan = () => {
    console.log('Close treatment plan')
    toast.add({
      title: 'Plan clôturé',
      description: 'Le plan de traitement a été clôturé.',
      color: 'success'
    })
  }
</script>

<template>
  <AppCard :title="treatmentPlan.title">
    <template #actions>
      <UBadge :color="getTreatmentPlanStatusColor(treatmentPlan.status)" variant="soft" class="rounded-full">
        {{ getTreatmentPlanStatusLabel(treatmentPlan.status) }}
      </UBadge>
    </template>
    <div class="flex flex-col gap-4">
      <div class="space-y-1">
        <p class="text-primary text-sm font-medium">{{ treatmentPlan.diagnosis || 'Non spécifié' }}</p>
        <p class="text-muted mt-1 text-xs">Objectif principal : {{ treatmentPlan.objective || 'Non spécifié' }}</p>
      </div>
      <div class="border-default text-muted flex flex-col gap-2 border-t py-4 text-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-hugeicons-calendar-02" class="text-[16px]" />
            <span>
              {{ formatFrenchDate(treatmentPlan.startDate) }}
              {{ treatmentPlan.endDate ? ` - ${formatFrenchDate(treatmentPlan.endDate)}` : '' }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-hugeicons-user" class="size-4" />
            <span class="text-toned font-medium">
              {{ getTherapistName(treatmentPlan.therapistId) }}
            </span>
          </div>
        </div>
      </div>
      <div>
        <div class="mb-2 flex items-end justify-between">
          <span class="text-muted text-xs font-bold tracking-wide">Progression</span>
          <span class="text-primary text-sm font-bold">{{ treatmentPlan.progress || 0 }}%</span>
        </div>
        <UProgress :model-value="treatmentPlan.progress || 0" size="lg" />
        <div class="mt-1.5 flex justify-between text-[11px] font-medium text-gray-400">
          <span>
            {{ treatmentPlan.completedConsultations || 0 }} / {{ treatmentPlan.numberOfSessions || 0 }} séances
          </span>
          <span>
            Reste:
            {{ (treatmentPlan.numberOfSessions || 0) - (treatmentPlan.completedConsultations || 0) }}
          </span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <button
          class="hover:text-primary bg-muted hover:bg-elevated flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors"
          @click="openEditSlideover(patient, treatmentPlan)"
        >
          <UIcon name="i-hugeicons-pencil-edit-02" class="text-[20px]" />
          <span class="text-[10px] font-bold">Modifier</span>
        </button>
        <button
          class="bg-muted hover:bg-elevated hover:text-error flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
          @click="closeTreatmentPlan"
        >
          <UIcon name="i-hugeicons-archive" class="text-[20px]" />
          <span class="text-[10px] font-bold">Clôturer</span>
        </button>
        <button
          class="bg-primary-50 hover:bg-primary-100 text-primary flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors"
          @click="openCreateSlideover(patient)"
        >
          <UIcon name="i-hugeicons-plus-sign-square" class="text-[20px]" />
          <span class="text-[10px] font-bold">Nouveau</span>
        </button>
      </div>
    </div>
  </AppCard>
</template>
