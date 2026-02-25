<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'

  const {
    appointment,
    canEdit = true,
    canDelete = true
  } = defineProps<{
    appointment: Appointment
    canEdit?: boolean
    canDelete?: boolean
  }>()

  const emit = defineEmits<{
    edit: [appointment: Appointment]
    delete: [appointment: Appointment]
  }>()

  const { getTherapistName } = useOrganizationMembers()

  const isIndependent = computed(() => !appointment.treatmentPlanId)

  const menuItems = computed<DropdownMenuItem[][]>(() => [
    [
      {
        label: 'Modifier',
        icon: 'i-hugeicons-pencil-edit-01',
        color: 'info',
        disabled: !canEdit,
        onSelect: () => canEdit && emit('edit', appointment)
      },
      {
        label: 'Supprimer',
        icon: 'i-hugeicons-delete-02',
        color: 'error',
        disabled: !canDelete,
        onSelect: () => canDelete && emit('delete', appointment)
      }
    ]
  ])
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center"
    :class="
      isIndependent
        ? 'border-warning/30 bg-warning/5 hover:border-warning/50'
        : 'bg-muted hover:border-default border-transparent'
    "
  >
    <div class="flex flex-1 items-center gap-4">
      <div class="flex">
        <AppDateBadge :date="appointment.date" variant="solid" color="info" class="rounded-r-none" />
        <AppTimeBadge
          :date="appointment.date"
          :time="appointment.startTime"
          color="info"
          variant="soft"
          class="rounded-l-none"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <UIcon :name="getLocationIcon(appointment.location || 'clinic')" />
          <p class="text-default truncate font-semibold">
            {{ getAppointmentTypeLabel(appointment.type || 'follow_up') }}
          </p>
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
            <p>{{ appointment.duration + (appointment.treatmentSession?.extendedDurationMinutes || 0) }} min</p>
          </div>

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
    </div>

    <div class="flex items-center justify-end gap-2">
      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
        <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" size="sm" square />
      </UDropdownMenu>
    </div>
  </div>
</template>
