<script setup lang="ts">
  import { LazyTreatmentSessionSlideover } from '#components'
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
  const overlay = useOverlay()
  const activeConsultationOverlay = overlay.create(LazyTreatmentSessionSlideover)

  const { getTherapistName } = useOrganizationMembers()
  const { resolveTitle } = useAppointmentTypes()

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

  // ─── Event handlers ──────────────────────────────────────────
  const openSessionSlideover = () => {
    activeConsultationOverlay.open({
      patientId: appointment.patientId,
      appointmentId: appointment.id
    })
  }
</script>

<template>
  <div
    :class="[
      'group bg-muted rounded-lg p-1 pr-4 transition-colors hover:shadow-sm',
      'hover:border-default border border-transparent',
      'flex items-center gap-4',
      'cursor-pointer'
    ]"
    @click="openSessionSlideover"
  >
    <div class="flex flex-1 gap-2 md:items-center">
      <div class="flex">
        <AppDateBadge :date="appointment.date" variant="soft" color="primary" class="h-auto min-h-12 rounded-r-none" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-row items-center gap-4">
          <div class="flex items-center gap-2">
            <UIcon :name="getLocationIcon(appointment.location || 'clinic')" />
            <p class="truncate text-sm font-semibold">
              {{ resolveTitle(appointment.type) }}
            </p>
          </div>
          <UBadge :color="getAppointmentStatusColor(appointment.status)" size="sm" variant="soft">
            {{ getAppointmentStatusLabel(appointment.status) }}
          </UBadge>
        </div>

        <div
          class="text-highlighted md:divide-muted mt-1.5 flex flex-col text-xs md:flex-row md:items-center md:divide-x"
        >
          <div class="flex items-center gap-1 font-medium sm:pr-2">
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
    </div>

    <div class="flex items-center justify-end gap-2">
      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
        <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" size="sm" square @click.stop />
      </UDropdownMenu>
    </div>
  </div>
</template>
