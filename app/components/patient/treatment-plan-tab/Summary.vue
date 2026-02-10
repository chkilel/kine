<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const { openCreateSlideover, openEditSlideover } = useTreatmentPlanSlideover()

  const toast = useToast()
  const { getTherapistName } = useOrganizationMembers()

  const planDetails = computed(() => [
    {
      label: 'Fréquence',
      value: `${props.treatmentPlan.sessionFrequency || 0}x / semaine`,
      icon: 'i-hugeicons-transaction-history',
      color: 'info' as UIColor
    },
    {
      label: 'Prescripteur',
      value: props.treatmentPlan.prescribingDoctor || 'Non spécifié',
      icon: 'i-hugeicons:chat-user',
      color: 'info' as UIColor
    },
    {
      label: 'Assurance',
      value: props.treatmentPlan.insuranceInfo || 'Non spécifié',
      icon: 'i-hugeicons-security-check',
      color: 'success' as UIColor
    },
    {
      label: 'Date',
      value: formatFrenchDate(props.treatmentPlan.prescriptionDate),
      icon: 'i-hugeicons-calendar-02',
      color: 'info' as UIColor
    }
  ])

  const closeTreatmentPlan = () => {
    console.log('Close treatment plan')
    toast.add({
      title: 'Plan clôturé',
      description: 'Le plan de traitement a été clôturé.',
      color: 'success'
    })
  }

  const dropdownItems = computed(() => [
    {
      label: 'Modifier',
      icon: 'i-hugeicons-pencil-edit-02',
      onSelect: () => openEditSlideover(props.patient, props.treatmentPlan)
    },
    {
      label: 'Clôturer',
      icon: 'i-hugeicons-archive',
      color: 'error' as UIColor,
      onSelect: closeTreatmentPlan
    },
    {
      label: 'Nouveau',
      icon: 'i-hugeicons-plus-sign-square',
      onSelect: () => openCreateSlideover(props.patient)
    }
  ])
</script>

<template>
  <AppCard title="Détail du plan" class="relative">
    <template #actions>
      <ClientOnly>
        <UDropdownMenu :items="dropdownItems" :content="{ align: 'end' }" class="absolute top-3 right-2">
          <UButton icon="i-hugeicons-more-vertical" color="neutral" variant="ghost" size="sm" />
        </UDropdownMenu>
      </ClientOnly>
    </template>
    <div class="flex flex-col gap-4 text-xs">
      <div class="flex items-center justify-between">
        <div class="text-muted">Début</div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-hugeicons-calendar-02" class="text-[16px]" />
          <span class="font-semibold">
            {{ formatFrenchDate(treatmentPlan.startDate) }}
            {{ treatmentPlan.endDate ? ` - ${formatFrenchDate(treatmentPlan.endDate)}` : '' }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-muted">Thérapeute</div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-hugeicons-user" class="size-4" />
          <span class="font-semibold">
            {{ getTherapistName(treatmentPlan.therapistId) }}
          </span>
        </div>
      </div>
      <div class="bg-muted rounded-lg p-2.5">
        <div class="mb-2 flex items-end justify-between">
          <span class="text-muted text-xs font-semibold tracking-wide uppercase">Progression</span>
          <span class="text-primary text-sm font-bold">{{ treatmentPlan.progress || 0 }}%</span>
        </div>
        <UProgress
          :model-value="treatmentPlan.progress || 0"
          size="md"
          :ui="{
            base: 'bg-default ring-default ring'
          }"
        />
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
      <USeparator />
      <div class="space-y-2">
        <h4 class="text-dimmed text-xs font-semibold uppercase">Objectifs thérapeutiques</h4>
        <p class="flex items-baseline gap-2 text-sm leading-relaxed">
          <span class="bg-primary inline-block size-1.5 shrink-0 rounded-full"></span>
          {{ treatmentPlan.objective || 'Non spécifié' }}
        </p>
      </div>

      <div class="space-y-2">
        <h4 class="text-dimmed text-xs font-semibold uppercase">Contexte pathologique</h4>
        <p class="flex items-baseline gap-2 text-sm leading-relaxed">
          <span class="bg-primary inline-block size-1.5 shrink-0 rounded-full" />
          {{ treatmentPlan.diagnosis || 'Non spécifié' }}
        </p>
      </div>

      <USeparator />
      <div class="grid grid-cols-2 gap-4">
        <div v-for="detail in planDetails" :key="detail.label" class="flex items-center gap-3">
          <AppIconBox size="md" :color="detail.color" :name="detail.icon" class="p-1" />
          <div class="flex-1">
            <h4 class="text-dimmed text-[10px] font-bold tracking-wide uppercase">{{ detail.label }}</h4>
            <p class="flex w-full items-center justify-between text-xs font-medium">
              <span>{{ detail.value }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>
