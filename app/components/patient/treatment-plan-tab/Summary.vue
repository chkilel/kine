<script setup lang="ts">
  import { getInsurerLabel, isInsurerSlug } from '~~/shared/utils/constants.insurers'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const route = useRoute()
  const { latestActiveTreatmentPlan } = usePatientTreatmentPlans(() => route.params.id as string)

  const { openCreateSlideover, openEditSlideover } = useTreatmentPlanSlideover()
  const { openPlanPicker } = useBillingSlideover()

  const toast = useToast()
  const { getTherapistName } = useOrganizationMembers()

  const planDetails = computed(() => [
    {
      label: 'Fréquence',
      value: `${props.treatmentPlan.sessionFrequency || 0}x /semaine`,
      icon: 'i-hugeicons-transaction-history',
      color: 'info' as UIColor
    },
    {
      label: 'Prescrit par',
      value: props.treatmentPlan.prescribingDoctor || 'Non spécifié',
      suffix: formatDate(props.treatmentPlan.prescriptionDate),
      icon: 'i-hugeicons:chat-user',
      color: 'info' as UIColor
    },
    {
      label: 'Assurance',
      value: props.treatmentPlan.insuranceInfo || 'Non spécifié',
      icon: 'i-hugeicons-security-check',
      color: 'success' as UIColor,
      isInsurer: true
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

  const selectedPlanId = computed({
    get: () => {
      const routePlanId = route.query.planId as string | undefined

      return routePlanId ?? latestActiveTreatmentPlan.value?.id ?? ''
    },
    set: async (id) => {
      await navigateTo({
        path: route.path,
        query: { ...route.query, planId: id || undefined }
      })
    }
  })

  function handleOpenPlanPicker() {
    openPlanPicker(props.patient.id, selectedPlanId.value || null, (planId: string) => {
      selectedPlanId.value = planId
    })
  }
</script>

<template>
  <AppCard title="Plan de traitement" class="relative">
    <button
      type="button"
      class="border-default bg-muted hover:bg-elevated focus:border-primary/80 flex min-h-18 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus:outline-none"
      @click="handleOpenPlanPicker"
    >
      <AppIconBox
        :name="getTreatmentPlanStatusIcon(treatmentPlan.status)"
        :color="getTreatmentPlanStatusColor(treatmentPlan.status)"
        size="xl"
        variant="soft"
        class="shrink-0"
      />

      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-semibold">{{ treatmentPlan.title || 'Plan sans titre' }}</h3>
        <!-- <p class="text-muted text-xs">
          {{ treatmentPlan.completedAppointments || 0 }} / {{ treatmentPlan.numberOfSessions || '?' }} séances
        </p> -->
      </div>

      <UIcon name="i-hugeicons-folder-transfer" class="text-toned size-7 shrink-0" />
    </button>

    <div class="flex flex-col gap-2 text-xs">
      <!-- <UBadge :color="getTreatmentPlanStatusColor(treatmentPlan.status)" variant="solid" size="md" class="rounded-full"> -->
      <!-- {{ getTreatmentPlanStatusLabel(treatmentPlan.status) }} -->
      <!-- </UBadge> -->
      <ClientOnly>
        <UDropdownMenu :items="dropdownItems" :content="{ align: 'end' }" class="absolute top-3 right-2">
          <UButton icon="i-hugeicons-more-vertical" color="neutral" variant="ghost" size="sm" />
        </UDropdownMenu>
      </ClientOnly>

      <div class="mt-5 space-y-2">
        <div class="flex items-center gap-2">
          <AppIconBox size="md" color="primary" name="i-hugeicons-user" class="p-1" />

          <span class="font-semibold">
            {{ getTherapistName(treatmentPlan.therapistId) }}
            <span class="font-normal">• depuis {{ formatDate(treatmentPlan.startDate) }}</span>
          </span>
        </div>
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <AppIconBox size="md" color="primary" name="i-hugeicons-target-02" class="p-1" />
            <h4 class="text-muted text-[10px] font-medium uppercase">Objectifs de rééducation</h4>
          </div>
          <p class="pl-8 text-sm">{{ treatmentPlan.objective || 'Non spécifié' }}</p>
        </div>

        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <AppIconBox size="md" color="primary" name="i-hugeicons-bone-02" class="p-1" />
            <h4 class="text-muted text-[10px] font-medium uppercase">Diagnostic</h4>
          </div>
          <p class="pl-8 text-sm leading-relaxed">
            {{ treatmentPlan.diagnosis || 'Non spécifié' }}
          </p>
        </div>
      </div>

      <div class="bg-muted rounded-lg p-2.5">
        <div class="mb-1 flex items-end justify-between">
          <div class="text-xs font-medium tracking-wide uppercase">
            Séances: {{ treatmentPlan.completedAppointments || 0 }}/{{ treatmentPlan.numberOfSessions || 0 }}
          </div>

          <span class="text-primary text-sm font-bold">{{ treatmentPlan.progress || 0 }}%</span>
        </div>
        <UProgress
          :model-value="treatmentPlan.progress || 0"
          size="md"
          :ui="{ base: 'bg-default ring-default ring' }"
        />
      </div>

      <USeparator class="my-1" />

      <div class="grid grid-cols-1 gap-x-2 gap-y-2">
        <div v-for="detail in planDetails" :key="detail.label" class="flex items-start gap-3">
          <AppIconBox size="md" color="primary" :name="detail.icon" class="p-1" />
           <div class="flex-1">
             <h4 class="text-toned text-[10px] tracking-wide uppercase">{{ detail.label }}</h4>
             <div class="flex items-baseline gap-2">
               <p class="text-[13px] font-medium">
                 {{ detail.isInsurer && isInsurerSlug(detail.value) ? getInsurerLabel(detail.value) : detail.value }}
               </p>
               <span v-if="detail.suffix" class="text-[11px]">le {{ detail.suffix }}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>
