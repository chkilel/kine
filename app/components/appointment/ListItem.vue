<script setup lang="ts">
  const { appointment } = defineProps<{
    appointment: Appointment
  }>()

  const emit = defineEmits<{
    'start-session': [appointment: Appointment]
    'view-patient': [patientId: string]
    'view-appointment': [appointment: Appointment]
  }>()

  // Computed status flags
  const status = computed(() => ({
    completed: appointment.status === 'completed',
    scheduled: ['scheduled', 'confirmed'].includes(appointment.status)
  }))

  // Computed text values
  const timeLabel = computed(() => formatTimeString(appointment.startTime))

  const durationLabel = computed(() => {
    const seconds =
      status.value.completed && appointment.actualDurationSeconds
        ? appointment.actualDurationSeconds
        : (appointment.duration + (appointment.extendedDurationMinutes || 0)) * 60
    return formatSecondsAsDuration(seconds)
  })

  const locationLabel = computed(() => {
    if (appointment.location === 'clinic') {
      return appointment.roomName
    }
    return getLocationLabel(appointment.location || 'clinic')
  })

  const locationIcon = computed(() => {
    if (appointment.location === 'clinic') {
      return 'i-hugeicons-door-01'
    }
    return getLocationIcon(appointment.location || 'clinic')
  })

  const locationColor = computed(() => getLocationColor(appointment.location || 'clinic'))

  const statusIcon = computed(() => getAppointmentStatusIcon(appointment.status))
  const statusColor = computed(() => getAppointmentStatusColor(appointment.status))

  // Dropdown menu items - memoized
  const menuItems = computed(() => [
    [
      {
        label: 'Patient',
        icon: 'i-hugeicons-profile-02',
        onSelect: () => emit('view-patient', appointment.patientId),
        to: `/patients/${appointment.patientId}`
      },
      {
        label: 'RDV',
        icon: 'i-hugeicons-appointment-02',
        onSelect: () => emit('view-appointment', appointment)
      }
    ]
  ])

  // Event handlers
  const handleStartSession = () => emit('start-session', appointment)
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-xl p-4 shadow-sm ring transition-all hover:shadow-md"
    :class="[
      status.completed
        ? 'ring-default bg-success/10 opacity-80 shadow-none grayscale-70 hover:shadow-none'
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
      :class="[status.completed && 'bg-success', status.scheduled && 'bg-info']"
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
          <UIcon :name="getAppointmentStatusIcon(appointment.status)" class="text-sm" />
          {{ getAppointmentStatusLabel(appointment.status || 'follow_up') }}
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <UButton
      v-if="status.scheduled"
      label="Commencer"
      icon="i-hugeicons-play"
      size="lg"
      color="info"
      variant="solid"
      :ui="{ base: 'rounded-xl' }"
      class="shadow-success/10 shrink-0 font-semibold text-white shadow-lg"
      @click="handleStartSession"
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
