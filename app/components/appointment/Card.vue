<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'

  // ─── Props / Emits ───────────────────────────────────────────
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

  // ─── Composables ─────────────────────────────────────────────
  const { getTherapistName } = useOrganizationMembers()

  // ─── Computed state ──────────────────────────────────────────
  const menuItems = computed<DropdownMenuItem[]>(() => [
    {
      label: 'Modifier',
      icon: 'i-hugeicons-pencil-edit-01',
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
  ])
</script>

<template>
  <div
    :class="[
      'group bg-muted rounded-lg p-1 pr-4 transition-colors hover:shadow-sm',
      'hover:border-default border border-transparent',
      'flex items-center gap-4'
    ]"
  >
    <div class="flex flex-1 items-center gap-2">
      <div class="flex">
        <AppDateBadge :date="appointment.date" variant="soft" color="info" class="rounded-r-none" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-row items-center justify-between gap-2">
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

        <div class="text-highlighted divide-muted mt-1.5 flex items-center divide-x text-xs">
          <div class="flex items-center gap-1 font-medium sm:pr-2">
            <UIcon name="i-hugeicons-clock-01" />
            <p>{{ formatTimeString(appointment.startTime) }}</p>
          </div>
          <!-- <UBadge icon="i-hugeicons-clock-01"" variant="subtle">
            <p>{{ formatTimeString(appointment.startTime) }}</p>
          </Ubadge> -->
          <!-- <div class="flex items-center gap-1 sm:px-2"> -->
          <!-- <UIcon name="i-hugeicons-hourglass" /> -->
          <!-- <p>{{ appointment.duration }} min</p> -->
          <!-- </div> -->

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
