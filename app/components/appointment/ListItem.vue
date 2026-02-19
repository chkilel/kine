<script setup lang="ts">
  import { LazyTreatmentSessionSlideover } from '#components'

  const { appointment } = defineProps<{ appointment: AppointmentWithSession }>()

  const overlay = useOverlay()
  const activeConsultationOverlay = overlay.create(LazyTreatmentSessionSlideover)

  // Get treatment session from appointment relation
  const treatmentSession = computed(() => appointment.treatmentSession)

  // Computed status flags
  const status = computed(() => ({
    completed: appointment.status === 'completed',
    scheduled: ['scheduled', 'confirmed'].includes(appointment.status),
    inProgress: treatmentSession.value?.status === 'in_progress'
  }))

  // Computed text values
  const timeLabel = computed(() => formatTimeString(appointment.startTime))

  const durationLabel = computed(() => {
    const seconds =
      status.value.completed && treatmentSession.value?.actualDurationSeconds
        ? treatmentSession.value.actualDurationSeconds
        : (appointment.duration + (treatmentSession.value?.extendedDurationMinutes || 0)) * 60
    return formatSecondsAsDuration(seconds)
  })

  const locationLabel = computed(() => {
    if (appointment.location === 'clinic') {
      return appointment.roomName
    }
    return getLocationLabel(appointment.location)
  })

  const locationIcon = computed(() => {
    if (appointment.location === 'clinic') {
      return 'i-hugeicons-door-01'
    }
    return getLocationIcon(appointment.location)
  })

  const locationColor = computed(() => getLocationColor(appointment.location))

  const statusIcon = computed(() => {
    if (status.value.inProgress) return 'i-hugeicons-hourglass'
    return getAppointmentStatusIcon(appointment.status)
  })

  const statusColor = computed(() => {
    if (status.value.inProgress) return 'warning'
    return getAppointmentStatusColor(appointment.status)
  })

  // Dropdown menu items - memoized
  const menuItems = computed(() => [
    [
      {
        label: 'Patient',
        icon: 'i-hugeicons-profile-02',
        to: `/patients/${appointment.patientId}`
      },
      {
        label: 'RDV',
        icon: 'i-hugeicons-appointment-02',
        onSelect: () => console.log('🚀 >>> ', 'RDV')
      }
    ]
  ])

  // Event handlers
  const openSessionSlideover = () => {
    activeConsultationOverlay.open({
      patientId: appointment.patientId,
      appointmentId: appointment.id
    })
  }

  const handleContinueSession = () => {
    activeConsultationOverlay.open({
      patientId: appointment.patientId,
      appointmentId: appointment.id
    })
  }
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-xl p-4 shadow-sm ring transition-all hover:shadow-md"
    :class="[
      status.completed
        ? 'ring-default bg-success/10 opacity-80 shadow-none grayscale-70 hover:shadow-none'
        : status.inProgress
          ? 'ring-warning/30 bg-warning/10'
          : 'ring-info/30 bg-muted'
    ]"
  >
    <AppIconBox :name="statusIcon" :color="statusColor" size="xl" />
    <!-- Time Display -->
    <div class="w-16 shrink-0 text-center">
      <p :class="['text-lg font-bold', status.completed ? 'text-muted' : 'text-default']">{{ timeLabel }}</p>
      <p class="text-muted text-[10px] font-bold">{{ durationLabel }}</p>
    </div>

    <!-- Status Indicator -->
    <div
      class="w-1.5 self-stretch rounded"
      :class="[status.completed && 'bg-success', status.scheduled && 'bg-info', status.inProgress && 'bg-warning']"
    />

    <!-- Patient Info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h4
          :class="['font-bold', status.completed && 'line-through', status.completed ? 'text-muted' : 'text-default']"
        >
          {{ appointment.patientName }}
        </h4>
        <UBadge
          v-if="locationLabel"
          :label="locationLabel"
          :icon="locationIcon"
          :color="locationColor"
          size="sm"
          variant="subtle"
          class="rounded-lg uppercase"
        />
      </div>

      <div class="mt-1 flex items-center gap-4">
        <p v-if="appointment.planTitle" class="text-muted flex items-center gap-1 text-xs">
          <UIcon name="i-hugeicons-file-01" class="text-sm" />
          {{ appointment.planTitle }}
        </p>
        <p class="text-muted flex items-center gap-1 text-xs">
          <UIcon :name="statusIcon" class="text-sm" />
          {{ status.inProgress ? 'En cours' : getAppointmentStatusLabel(appointment.status || 'scheduled') }}
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <UButton
      v-if="status.scheduled && !status.inProgress"
      label="Commencer"
      icon="i-hugeicons-play"
      size="lg"
      color="info"
      variant="solid"
      :ui="{ base: 'rounded-xl' }"
      class="shadow-success/10 shrink-0 font-semibold text-white shadow-lg"
      @click="openSessionSlideover"
    />

    <UButton
      v-else-if="status.inProgress"
      label="Continuer"
      icon="i-hugeicons-hourglass"
      size="lg"
      color="warning"
      variant="solid"
      :ui="{ base: 'rounded-xl' }"
      class="shadow-warning/10 shrink-0 font-semibold text-white shadow-lg"
      @click="handleContinueSession"
    />

    <UBadge
      v-else-if="status.completed"
      label="Terminée"
      size="lg"
      icon="i-hugeicons-checkmark-circle-02"
      color="success"
      variant="subtle"
      class="shrink-0 rounded-full"
      :ui="{ label: 'text-success-600' }"
    />

    <!-- Dropdown Menu -->
    <UDropdownMenu :items="menuItems" :content="{ align: 'center' }" :ui="{ content: 'min-w-0' }">
      <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="primary" square class="rounded-full" />
    </UDropdownMenu>
  </div>
</template>
