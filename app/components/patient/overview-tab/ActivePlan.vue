<script setup lang="ts">
  import { LazyTreatmentSessionSlideover, LazyTreatmentPlanCreateSlideover } from '#components'

  // ─── Props ───────────────────────────────────────────────────
  const { patient } = defineProps<{ patient: Patient }>()

  // ─── Composables ─────────────────────────────────────────────
  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSlideover)
  const activeConsultationOverlay = overlay.create(LazyTreatmentSessionSlideover)
  const { loading: treatmentPlansLoading, latestActiveTreatmentPlan } = usePatientTreatmentPlans(() => patient?.id)
  const { data: appointments } = useAppointmentsList(() => ({
    patientId: patient.id,
    treatmentPlanId: latestActiveTreatmentPlan.value?.id,
    limit: 3
  }))
  const { getTherapistName } = useOrganizationMembers()

  // ─── Computed state ──────────────────────────────────────────
  const planDetails = computed(() => {
    if (!latestActiveTreatmentPlan.value) return null
    const { sessionFrequency, startDate, prescribingDoctor, insuranceInfo, prescriptionDate, therapistId } =
      latestActiveTreatmentPlan.value
    return [
      {
        label: 'Fréquence',
        value: `${sessionFrequency || 0}x / semaine`,
        icon: 'i-hugeicons-transaction-history',
        color: 'info' as UIColor
      },
      {
        label: 'suivi par',
        value: getTherapistName(therapistId),
        suffix: formatDate(startDate),
        icon: 'i-hugeicons-user',
        color: 'info' as UIColor
      },
      {
        label: 'Prescrit par',
        value: prescribingDoctor || 'Non spécifié',
        suffix: prescriptionDate && `${formatDate(prescriptionDate)}`,
        icon: 'i-hugeicons:chat-user',
        color: 'info' as UIColor
      },
      {
        label: 'Assurance',
        value: insuranceInfo || 'Non spécifié',
        icon: 'i-hugeicons-security-check',
        color: 'success' as UIColor
      }
    ]
  })

  // ─── Event handlers ──────────────────────────────────────────
  async function navigateToPlan(planId?: string) {
    await navigateTo({ path: `/patients/${patient.id}/plan`, query: { planId } })
  }

  function openCreateTreatmentPlan() {
    treatmentPlanCreateOverlay.open({ patient })
  }

  function openAppointmentSlideover(appointment: Appointment) {
    activeConsultationOverlay.open({
      patientId: patient.id,
      appointmentId: appointment.id
    })
  }
</script>

<template>
  <AppCard>
    <template v-if="treatmentPlansLoading">
      <div class="bg-default flex h-full flex-col rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-center py-8">
          <UIcon name="i-hugeicons-loading-03" class="text-muted animate-spin text-3xl" />
        </div>
      </div>
    </template>

    <div v-else-if="latestActiveTreatmentPlan" class="flex flex-col gap-4">
      <div class="flex items-start gap-4">
        <div>
          <h4 class="text-base font-semibold">{{ latestActiveTreatmentPlan.title }}</h4>

          <UBadge
            :color="getTreatmentPlanStatusColor(latestActiveTreatmentPlan.status)"
            variant="subtle"
            size="md"
            class="text-success-600 rounded-full px-5 py-0.5"
          >
            {{ getTreatmentPlanStatusLabel(latestActiveTreatmentPlan.status) }}
          </UBadge>
        </div>
        <UButton
          size="sm"
          variant="ghost"
          color="primary"
          trailingIcon="i-hugeicons-arrow-right-02"
          label="Voir Détail"
          class="ml-auto"
          :to="`/patients/${patient.id}/plan?planId=${latestActiveTreatmentPlan.id}`"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div v-for="detail in planDetails" :key="detail.label" class="flex items-center gap-3">
          <AppIconBox size="md" :color="detail.color" :name="detail.icon" class="p-1" />
          <div class="flex-1">
            <h4 class="text-toned text-[10px] tracking-wide uppercase">{{ detail.label }}</h4>
            <p class="text-[13px] font-medium">
              {{ detail.value }}
              <span v-if="detail.suffix" class="text-[11px]">• {{ detail.suffix }}</span>
            </p>
          </div>
        </div>
      </div>
      <div class="bg-elevated rounded-lg p-2.5">
        <div class="mb-2 flex items-end justify-between">
          <div class="text-muted mt-1.5 flex justify-between gap-1 text-xs font-semibold tracking-wide uppercase">
            <span>Séances:</span>
            <span>
              {{ latestActiveTreatmentPlan.completedAppointments || 0 }} sur
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
    </div>
    <UEmpty
      v-else
      icon="i-hugeicons-note-add"
      title="Aucun plan de traitement"
      description="Ce patient n'a pas encore de plan de traitement."
      variant="naked"
      :actions="[
        {
          label: 'Créer un plan',
          color: 'primary',
          size: 'sm',
          onClick: openCreateTreatmentPlan
        }
      ]"
    />

    <div class="mt-6 flex flex-col gap-2">
      <h4 class="text-toned text-[13px] font-semibold tracking-wide uppercase">Prochaines séances</h4>

      <div
        v-if="appointments"
        v-for="appointment in appointments"
        :key="appointment.id"
        class="group border-default bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border p-1 pr-2 transition-colors hover:shadow-md"
        @click="openAppointmentSlideover(appointment)"
      >
        <AppDateBadge :date="appointment.date" color="info" variant="soft" size="lg" class="rounded-r-none" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <UIcon :name="getLocationIcon(appointment.location || 'clinic')" />
              <p class="truncate text-sm font-semibold">
                {{ getAppointmentTypeLabel(appointment.type || 'follow_up') }}
              </p>
            </div>
            <UBadge
              :color="getAppointmentStatusColor(appointment.status)"
              size="sm"
              variant="subtle"
              class="rounded-full"
            >
              {{ getAppointmentStatusLabel(appointment.status) }}
            </UBadge>
          </div>

          <div class="text-muted sm:divide-muted mt-1.5 flex flex-col text-xs sm:flex-row sm:items-center sm:divide-x">
            <div class="flex items-center gap-1 sm:pr-2">
              <UIcon name="i-hugeicons-clock-01" />
              <p>{{ formatTimeString(appointment.startTime) }}</p>
            </div>
            <!-- <div class="flex items-center gap-1 sm:px-2">
              <UIcon name="i-hugeicons-hourglass" />
              <p>{{ appointment.duration }} min</p>
            </div> -->

            <div v-if="appointment.roomName" class="flex items-center gap-1 sm:px-2">
              <UIcon name="i-hugeicons-door-01" />
              <p>{{ appointment.roomName }}</p>
            </div>
            <div v-if="appointment.therapistId" class="flex items-center gap-1 sm:px-2">
              <UIcon name="i-hugeicons-user" />
              <p>{{ getTherapistName(appointment.therapistId) }}</p>
            </div>
          </div>
        </div>

        <UIcon
          name="i-lucide-chevron-right"
          class="group-hover:text-primary text-muted size-5 transition-all group-hover:-mr-1"
        />
      </div>
      <UEmpty
        v-else
        icon="hugeicons-calendar-remove-02"
        title="Aucune séance planifiée"
        description="Ce patient n'a pas encore de séance planifiée."
      />
    </div>
    <UButton
      size="sm"
      variant="ghost"
      color="primary"
      trailing-icon="hugeicons-arrow-right-02"
      label="Voir toutes les séances"
      block
      class="mt-4"
      :ui="{ trailingIcon: 'ms-0' }"
      @click="navigateToPlan(latestActiveTreatmentPlan?.id || undefined)"
    />
  </AppCard>
</template>
