<script setup lang="ts">
  import { LazyAppModalConfirm } from '#components'
  import { getInsurerLabel, isInsurerSlug } from '~~/shared/utils/constants.insurers'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const route = useRoute()
  const { latestActiveTreatmentPlan } = usePatientTreatmentPlans(() => route.params.id as string)

  const { openEditSlideover } = useTreatmentPlanSlideover()
  const { openPlanPicker } = useBillingSlideover()

  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const toast = useToast()
  const { getTherapistName } = useOrganizationMembers()

  const planDetails = computed(() => [
    {
      label: 'Suivi par',
      value: getTherapistName(props.treatmentPlan.therapistId),
      suffix: formatDate(props.treatmentPlan.startDate),
      icon: 'i-hugeicons-user-shield-01',
      color: 'info' as UIColor
    },
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
      icon: 'i-hugeicons-chat-user',
      color: 'info' as UIColor
    },
    {
      label: 'Assurance',
      value: props.treatmentPlan.insuranceProvider || 'Non spécifié',
      suffix: props.treatmentPlan.coverageStatus ? getInsuranceCoverageLabel(props.treatmentPlan.coverageStatus) : null,
      icon: 'i-hugeicons-security-check',
      color: 'success' as UIColor,
      isInsurer: true
    }
    /* {
      label: 'Couverture',
      value: props.treatmentPlan.coverageStatus
        ? getInsuranceCoverageLabel(props.treatmentPlan.coverageStatus)
        : 'Non spécifié',
      icon: 'i-hugeicons-shield-user',
      color: 'info' as UIColor
    } */
  ])

  async function handleClosePlan() {
    const confirmed = await confirmModal.open({
      title: 'Clôturer le plan de traitement ?',
      message: `Le plan "${props.treatmentPlan.title || 'sans titre'}" sera archivé. Cette action est irréversible.`,
      confirmText: 'Confirmer la clôture',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-archive'
    })

    if (confirmed) {
      console.log('Close treatment plan')
      toast.add({
        title: 'Plan clôturé',
        description: 'Le plan de traitement a été clôturé.',
        color: 'success'
      })
    }
  }

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
  <AppCard :ui="{ body: 'pt-4 sm:pt-6' }">
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
      <h3 class="min-w-0 flex-1 text-sm font-semibold">{{ treatmentPlan.title || 'Plan sans titre' }}</h3>
      <UIcon name="i-hugeicons-folder-transfer" class="text-toned size-7 shrink-0" />
    </button>

    <div class="flex flex-col gap-2 text-xs">
      <div class="mt-5 space-y-2">
        <div class="space-y-0.5">
          <div class="flex items-start gap-2">
            <AppIconBox size="md" color="primary" name="i-hugeicons-bone-02" class="p-1" />
            <div>
              <h4 class="text-muted text-[10px] uppercase">Diagnostic</h4>
              <p class="text-sm">{{ treatmentPlan.diagnosis || 'Non spécifié' }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-0.5">
          <div class="flex items-start gap-2">
            <AppIconBox size="md" color="primary" name="i-hugeicons-target-02" class="p-1" />
            <div>
              <h4 class="text-muted text-[10px] uppercase">Objectifs de rééducation</h4>
              <p class="text-sm">{{ treatmentPlan.objective || 'Non spécifié' }}</p>
            </div>
          </div>
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
          :ui="{ base: 'bg-default ring-primary/30 ring' }"
        />
      </div>

      <USeparator class="my-1" />

      <div class="grid grid-cols-1 gap-x-2 gap-y-3">
        <div v-for="detail in planDetails" :key="detail.label" class="flex items-start gap-3">
          <AppIconBox size="md" color="primary" :name="detail.icon" class="p-1" />
          <div class="flex-1">
            <h4 class="text-muted text-[9px] tracking-wide uppercase">{{ detail.label }}</h4>
            <div class="flex items-baseline gap-2">
              <p class="text-xs font-medium">
                {{ detail.isInsurer && isInsurerSlug(detail.value) ? getInsurerLabel(detail.value) : detail.value }}
              </p>
              <span v-if="detail.suffix" class="text-[11px]">[ {{ detail.suffix }} ]</span>
            </div>
          </div>
        </div>
      </div>

      <USeparator class="my-1" />

      <div class="flex items-center gap-2 pt-1">
        <UButton
          icon="i-hugeicons-archive-02"
          label="Clôturer"
          variant="soft"
          color="error"
          size="md"
          :ui="{
            base: 'flex-1 flex-col',
            label: 'text-xs'
          }"
          @click="handleClosePlan"
        />
        <UButton
          icon="i-hugeicons-pencil-edit-02"
          label="Modifier"
          variant="solid"
          color="primary"
          size="md"
          :ui="{
            base: 'flex-1 flex-col',
            label: 'text-xs'
          }"
          @click="openEditSlideover(props.patient, props.treatmentPlan)"
        />
      </div>
    </div>
  </AppCard>
</template>
