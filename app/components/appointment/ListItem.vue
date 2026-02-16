<script setup lang="ts">
  const { consultation } = defineProps<{
    consultation: Consultation
  }>()

  const emit = defineEmits<{
    'start-session': [consultation: Consultation]
    'view-patient': [patientId: string]
    'view-consultation': [consultation: Consultation]
  }>()

  // Computed status flags
  const status = computed(() => ({
    completed: consultation.status === 'completed',
    scheduled: ['scheduled', 'confirmed'].includes(consultation.status)
  }))

  // Computed text values
  const timeLabel = computed(() => formatTimeString(consultation.startTime))

  const durationLabel = computed(() => {
    const seconds =
      status.value.completed && consultation.actualDurationSeconds
        ? consultation.actualDurationSeconds
        : (consultation.duration + (consultation.extendedDurationMinutes || 0)) * 60
    return formatSecondsAsDuration(seconds)
  })

  const locationLabel = computed(() => {
    if (consultation.location === 'clinic') {
      return consultation.roomName
    }
    return getLocationLabel(consultation.location || 'clinic')
  })

  const locationIcon = computed(() => {
    if (consultation.location === 'clinic') {
      return 'i-hugeicons-door-01'
    }
    return getLocationIcon(consultation.location || 'clinic')
  })

  const locationColor = computed(() => getLocationColor(consultation.location || 'clinic'))

  const statusIcon = computed(() => getConsultationStatusIcon(consultation.status))
  const statusColor = computed(() => getConsultationStatusColor(consultation.status))

  // Dropdown menu items - memoized
  const menuItems = computed(() => [
    [
      {
        label: 'Patient',
        icon: 'i-hugeicons-profile-02',
        onSelect: () => emit('view-patient', consultation.patientId),
        to: `/patients/${consultation.patientId}`
      },
      {
        label: 'RDV',
        icon: 'i-hugeicons-appointment-02',
        onSelect: () => emit('view-consultation', consultation)
      }
    ]
  ])

  // Event handlers
  const handleStartSession = () => emit('start-session', consultation)
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
          {{ consultation.patientName }}
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
        <p v-if="consultation.planTitle" class="text-muted flex items-center gap-1 text-xs">
          <UIcon name="i-hugeicons-file-01" class="text-sm" />
          {{ consultation.planTitle }}
        </p>
        <p class="text-muted flex items-center gap-1 text-xs">
          <UIcon :name="getConsultationStatusIcon(consultation.status)" class="text-sm" />
          {{ getConsultationStatusLabel(consultation.status || 'follow_up') }}
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
