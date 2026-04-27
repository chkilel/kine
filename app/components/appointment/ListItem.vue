<script setup lang="ts">
  import { LazyTreatmentSessionSlideover, LazyAppointmentPlanningSlideover, LazyAppModalConfirm } from '#components'
  import { parseTime } from '@internationalized/date'

  // ─── Props ───────────────────────────────────────────────────
  const { appointment } = defineProps<{ appointment: Appointment }>()

  // ─── Composables ─────────────────────────────────────────────
  const overlay = useOverlay()
  const activeConsultationOverlay = overlay.create(LazyTreatmentSessionSlideover)
  const planningOverlay = overlay.create(LazyAppointmentPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const { mutate: updateAppointmentStatus } = useUpdateAppointmentStatus()
  const { data: patient } = usePatientById(() => appointment.patientId)
  const { treatmentPlans } = usePatientTreatmentPlans(() => appointment.patientId)
  const { getTherapistName } = useOrganizationMembers()

  // ─── Status flags ─────────────────────────────────────────────
  const status = computed(() => ({
    completed: ['completed', 'finished'].includes(appointment.status),
    scheduled: ['scheduled', 'confirmed'].includes(appointment.status),
    inProgress: appointment.status === 'in_progress',
    cancelled: appointment.status === 'cancelled'
  }))

  const appointmentHasStarted = computed(() => status.value.inProgress || status.value.completed)

  // ─── Computed state ──────────────────────────────────────────
  const timeLabel = computed(() => {
    const parsedTime = parseTime(appointment.startTime)
    return {
      h: String(parsedTime.hour).padStart(2, '0'),
      min: String(parsedTime.minute).padStart(2, '0')
    }
  })

  const durationLabel = computed(() => {
    const seconds =
      status.value.completed && appointment.actualDurationSeconds
        ? appointment.actualDurationSeconds
        : appointment.duration * 60
    return formatSecondsAsDuration(seconds)
  })

  // ─── Menu items ──────────────────────────────────────────────
  const menuItems = computed(() => {
    if (appointmentHasStarted.value) {
      return [
        {
          label: 'Patient',
          icon: 'i-hugeicons-profile-02',
          to: `/patients/${appointment.patientId}`
        },
        {
          label: 'Séance',
          icon: 'i-hugeicons-file-01',
          onSelect: () => openSessionSlideover()
        }
      ]
    }

    return [
      {
        label: 'Patient',
        icon: 'i-hugeicons-profile-02',
        to: `/patients/${appointment.patientId}`
      },
      {
        label: 'Annuler',
        icon: 'i-hugeicons-cancel-circle-half-dot',
        onSelect: () => handleCancelAppointment()
      },
      {
        label: 'Reporter',
        icon: 'i-hugeicons-calendar-02',
        onSelect: () => handlePostponeAppointment()
      },
      {
        label: 'Notes pré-séance',
        icon: 'i-hugeicons-sticky-note-01',
        onSelect: () => openSessionSlideover()
      }
    ]
  })

  // ─── Event handlers ──────────────────────────────────────────
  const openSessionSlideover = () => {
    activeConsultationOverlay.open({
      patientId: appointment.patientId,
      appointmentId: appointment.id
    })
  }

  const handleCancelAppointment = async () => {
    const confirmed = await confirmModal.open({
      title: 'Annuler le rendez-vous',
      message: 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-alert-02'
    })

    if (confirmed) {
      updateAppointmentStatus({
        appointmentId: appointment.id,
        status: 'cancelled',
        patientId: appointment.patientId
      })
    }
  }

  const handlePostponeAppointment = () => {
    if (!patient.value) return
    const treatmentPlan = appointment.treatmentPlanId
      ? treatmentPlans.value?.find((p) => p.id === appointment.treatmentPlanId)
      : null
    planningOverlay.open({
      patient: patient.value,
      treatmentPlan: treatmentPlan ? { ...treatmentPlan, notes: [...treatmentPlan.notes] } : null,
      appointment
    })
  }
</script>

<template>
  <div
    :class="[
      'relative flex items-center gap-4 overflow-hidden',
      'rounded-lg p-4 pl-0 hover:shadow-sm',
      'bg-muted hover:border-default cursor-pointer border border-transparent transition-colors'
    ]"
    @click="openSessionSlideover"
  >
    <!-- Status Indicator -->
    <div
      class="w-1.5 self-stretch rounded-r-full"
      :class="[status.completed && 'bg-success', status.scheduled && 'bg-info', status.inProgress && 'bg-warning']"
    />

    <!-- Vertical Time Card -->
    <UBadge
      color="primary"
      variant="subtle"
      class="flex w-16 flex-col items-center justify-center gap-0 self-stretch rounded-2xl"
    >
      <span class="text-primary text-2xl leading-none font-bold">{{ timeLabel.h }}</span>
      <div class="bg-primary/20 my-1 h-px w-4"></div>
      <span class="text-primary/70 text-sm leading-none font-semibold">{{ timeLabel.min }}</span>
    </UBadge>

    <!-- Patient Info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-3">
        <h4 class="font-semibold">{{ appointment.patientName }}</h4>

        <UBadge
          :label="getAppointmentStatusLabel(appointment.status)"
          :color="getAppointmentStatusColor(appointment.status)"
          :icon="getAppointmentStatusIcon(appointment.status)"
          variant="solid"
          size="sm"
          class="rounded-full font-bold uppercase"
        />
      </div>

      <div class="text-highlighted flex items-center gap-1 text-xs">
        <UIcon name="i-hugeicons-first-aid-kit" />
        <span v-if="appointment.planTitle">{{ appointment.planTitle }}</span>
        <span v-else>Séance hors plan de traitement</span>
      </div>

      <div class="text-highlighted divide-muted mt-1.5 flex items-center divide-x text-sm">
        <div class="flex items-center gap-1 font-medium sm:pr-2">
          <UIcon name="i-hugeicons-time-quarter-02" />
          <span>{{ durationLabel }}</span>
        </div>

        <div v-if="appointment.roomName" class="flex items-center gap-1 sm:px-2">
          <UIcon name="i-hugeicons-door-01" />
          <span>{{ appointment.roomName }}</span>
        </div>
        <div v-if="appointment.therapistId" class="flex items-center gap-1 sm:px-2">
          <UIcon name="i-hugeicons-user" />
          <span>{{ getTherapistName(appointment.therapistId) }}</span>
        </div>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{ content: 'min-w-0' }">
      <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="primary" square @click.stop />
    </UDropdownMenu>
  </div>
</template>
