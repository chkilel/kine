<script setup lang="ts">
  import { LazyTreatmentPlanCreateSlideover } from '#components'
  import { getInsurerLabel, isInsurerSlug } from '~~/shared/utils/constants.insurers'

  const { patient } = defineProps<{ patient: Patient }>()

  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSlideover)
  const router = useRouter()

  const {
    activeTreatmentPlans,
    loading: treatmentPlansLoading,
    latestActiveTreatmentPlan
  } = usePatientTreatmentPlans(() => patient?.id)
  const { getTherapistName } = useOrganizationMembers()

  const displayedPlans = computed(() => {
    const plans = activeTreatmentPlans.value || []
    return plans.slice(0, 5)
  })

  const hasMorePlans = computed(() => {
    return (activeTreatmentPlans.value?.length || 0) > 5
  })

  const remainingCount = computed(() => {
    return (activeTreatmentPlans.value?.length || 0) - 5
  })

  const cardTitle = computed(() => {
    const count = activeTreatmentPlans.value?.length || 0
    if (count === 0) return 'Plan de Traitement Actif'
    if (count === 1) return 'Plan de Traitement Actif'
    return `Plans de Traitement Actifs (${count})`
  })

  function openCreateTreatmentPlan() {
    treatmentPlanCreateOverlay.open({ patient })
  }

  function navigateToTreatmentPlan(planId?: string) {
    if (planId) {
      router.push(`/patients/${patient.id}/plan?planId=${planId}`)
    } else {
      router.push(`/patients/${patient.id}/plan`)
    }
  }

  const planDetails = computed(() => [
    {
      label: 'Fréquence',
      value: `${latestActiveTreatmentPlan.value?.sessionFrequency || 0}x / semaine`,
      icon: 'i-hugeicons-transaction-history',
      color: 'info' as UIColor
    },
    {
      label: 'Prescripteur',
      value: latestActiveTreatmentPlan.value?.prescribingDoctor || 'Non spécifié',
      icon: 'i-hugeicons:chat-user',
      color: 'info' as UIColor
    },
    {
      label: 'Assurance',
      value: latestActiveTreatmentPlan.value?.insuranceInfo || 'Non spécifié',
      icon: 'i-hugeicons-security-check',
      color: 'success' as UIColor,
      isInsurer: true
    },
    {
      label: 'Date',
      value: formatDate(latestActiveTreatmentPlan.value?.prescriptionDate ?? null),
      icon: 'i-hugeicons-calendar-02',
      color: 'info' as UIColor
    }
  ])
</script>

<template>
  <template v-if="treatmentPlansLoading">
    <div class="bg-default flex h-full flex-col rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-center py-8">
        <UIcon name="i-hugeicons-loading-03" class="text-muted animate-spin text-3xl" />
      </div>
    </div>
  </template>

  <AppCard v-else-if="activeTreatmentPlans && activeTreatmentPlans.length > 0" :title="cardTitle">
    <AppCard class="relative" :ui="{ header: 'p-0 sm:p-0', body: 'relative' }">
      <div v-if="latestActiveTreatmentPlan" class="flex flex-col gap-2">
        <h4 class="text-base font-semibold">{{ latestActiveTreatmentPlan.title }}</h4>

        <div class="flex items-center justify-between">
          <div class="flex items-center justify-between gap-2 text-sm">
            <UBadge
              :color="getTreatmentPlanStatusColor(latestActiveTreatmentPlan.status)"
              variant="solid"
              size="md"
              class="rounded-full"
            >
              {{ getTreatmentPlanStatusLabel(latestActiveTreatmentPlan.status) }}
            </UBadge>
            <div class="flex items-center gap-1">
              <AppIconBox size="md" color="primary" name="i-hugeicons-user" class="p-1" />
              <div class="text-muted">Thérapeute</div>
              <span class="font-semibold">
                {{ getTherapistName(latestActiveTreatmentPlan.therapistId) }}
              </span>
            </div>
          </div>
          <UButton label="Détails" size="sm" variant="subtle" color="neutral" />
        </div>
        <div class="bg-muted rounded-lg p-2.5">
          <div class="mb-2 flex items-end justify-between">
            <div class="text-muted mt-1.5 flex justify-between gap-1 text-xs font-semibold tracking-wide uppercase">
              <span>Séances:</span>
              <span>
                {{ latestActiveTreatmentPlan.finishedCount || 0 }} sur
                {{ latestActiveTreatmentPlan.numberOfSessions || 0 }}
              </span>
            </div>
            <span class="text-primary text-sm font-bold">{{ latestActiveTreatmentPlan.progress || 0 }}%</span>
          </div>
          <UProgress
            :model-value="latestActiveTreatmentPlan.progress || 0"
            size="md"
            :ui="{
              base: 'bg-default ring-default ring'
            }"
          />
        </div>
        <USeparator class="my-1" />
        <div class="space-y-2">
          <h4 class="text-dimmed text-xs font-semibold uppercase">Objectifs thérapeutiques</h4>
          <p class="flex items-baseline gap-2 text-sm leading-relaxed">
            <span class="bg-primary inline-block size-1.5 shrink-0 rounded-full"></span>
            {{ latestActiveTreatmentPlan.objective || 'Non spécifié' }}
          </p>
        </div>

        <div class="space-y-2">
          <h4 class="text-dimmed text-xs font-semibold uppercase">Contexte pathologique</h4>
          <p class="flex items-baseline gap-2 text-sm leading-relaxed">
            <span class="bg-primary inline-block size-1.5 shrink-0 rounded-full" />
            {{ latestActiveTreatmentPlan.diagnosis || 'Non spécifié' }}
          </p>
        </div>

        <USeparator />
        <div class="grid grid-cols-2 gap-4">
          <div v-for="detail in planDetails" :key="detail.label" class="flex items-center gap-3">
            <AppIconBox size="md" :color="detail.color" :name="detail.icon" class="p-1" />
            <div class="flex-1">
              <h4 class="text-dimmed text-[10px] font-bold tracking-wide uppercase">{{ detail.label }}</h4>
              <p class="flex w-full items-center justify-between text-xs font-medium">
                <span>{{ detail.isInsurer && isInsurerSlug(detail.value) ? getInsurerLabel(detail.value) : detail.value }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
    <UScrollArea orientation="horizontal" class="h-45 w-full" :ui="{ viewport: 'flex gap-3 pb-2' }">
      <!-- Treatment Plan Cards -->
      <div
        v-for="plan in displayedPlans"
        :key="plan.id"
        class="group border-default bg-muted relative flex h-40 w-50 shrink-0 cursor-pointer flex-col justify-between rounded-lg border p-4 transition-shadow hover:shadow-md"
        @click="navigateToTreatmentPlan(plan.id)"
      >
        <!-- Header: Status dot + Badge -->
        <div class="flex items-start justify-between">
          <UChip standalone inset size="3xl" :color="getTreatmentPlanStatusColor(plan.status)" />
          <UBadge :color="getTreatmentPlanStatusColor(plan.status)" variant="soft" size="sm" class="text-[10px]">
            {{ getTreatmentPlanStatusLabel(plan.status) }}
          </UBadge>
        </div>

        <!-- Content: Title & Diagnosis -->
        <div class="min-h-0 flex-1">
          <p class="text-highlighted truncate text-sm font-bold">{{ plan.title }}</p>
          <p v-if="plan.diagnosis" class="text-muted mt-0.5 truncate text-xs">{{ plan.diagnosis }}</p>
        </div>

        <!-- Footer: Date, Sessions & Progress -->
        <div class="space-y-1">
          <div class="text-muted flex items-center gap-1.5 text-xs">
            <UIcon name="i-hugeicons-calendar-02" class="size-3.5" />
            <span>{{ formatDate(plan.startDate) }}</span>
          </div>
          <div v-if="plan.numberOfSessions" class="text-muted flex items-center gap-1.5 text-xs">
            <UIcon name="i-hugeicons-target-02" class="size-3.5" />
            <span>{{ plan.numberOfSessions }} séance{{ plan.numberOfSessions > 1 ? 's' : '' }}</span>
          </div>
          <div v-if="plan.progress !== undefined" class="flex items-center gap-1.5 text-xs">
            <UIcon name="i-hugeicons-chart-line-data-01" class="text-primary size-3.5" />
            <span class="text-primary font-medium">{{ plan.progress }}%</span>
          </div>
        </div>
      </div>

      <!-- Create New Plan Card -->
      <div
        class="border-primary/30 text-primary/60 hover:text-primary hover:border-primary hover:bg-primary/5 flex h-40 w-50 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all"
        @click="openCreateTreatmentPlan"
      >
        <UIcon name="i-hugeicons-add-01" class="size-8" />
        <span class="text-sm font-medium">Nouveau plan</span>
      </div>
    </UScrollArea>

    <!-- Show More Link -->
    <UButton
      v-if="hasMorePlans"
      trailing-icon="hugeicons-arrow-right-02"
      variant="ghost"
      size="sm"
      class="mt-3 w-full justify-center"
      @click="navigateToTreatmentPlan()"
    >
      Voir {{ remainingCount }} plan{{ remainingCount > 1 ? 's' : '' }} de plus
    </UButton>
  </AppCard>

  <UEmpty
    v-else
    icon="i-hugeicons-note-add"
    title="Aucun plan de traitement"
    description="Ce patient n'a pas encore de plan de traitement."
    :actions="[
      {
        label: 'Créer un plan',
        color: 'primary',
        size: 'sm',
        onClick: openCreateTreatmentPlan
      }
    ]"
  />
</template>
