<script setup lang="ts">
  const props = defineProps<{ activePlanningTab: string; patientId: string }>()

  const deleteAppointmentMutation = useDeleteAppointment()
  const { data: appointmentsData } = useAppointmentsList(() => ({ patientId: props.patientId }))

  const deleteAppointment = async (appointmentId: string) => {
    await deleteAppointmentMutation.mutateAsync({
      appointmentId
    })
  }
  const selectedAppointments = ref<string[]>([])

  const toggleAppointmentSelection = (appointmentId: string) => {
    const index = selectedAppointments.value.indexOf(appointmentId)
    if (index > -1) {
      selectedAppointments.value.splice(index, 1)
    } else {
      selectedAppointments.value.push(appointmentId)
    }
  }

  const postponeAppointment = () => {}
  const changeStatusAppointment = () => {}
  const handleDeleteAppointment = async () => {}
</script>

<template>
  <AppCard title="Gestion des Séances" icon="i-lucide-list" iconColor="info">
    <div v-if="appointmentsData && appointmentsData.length > 0" class="space-y-3">
      <ul class="space-y-2">
        <li
          v-for="appointment in appointmentsData"
          :key="appointment.id"
          class="bg-muted hover:bg-elevated flex items-center justify-between rounded-lg p-2.5 py-2"
        >
          <div class="flex flex-1 items-center justify-between">
            <div class="flex items-center gap-4">
              <AppDateBadge :date="appointment.date" color="neutral" variant="subtle" class="bg-default" />
              <div>
                <div class="flex items-center gap-2">
                  <UIcon
                    v-if="appointment.location"
                    :name="getLocationIcon(appointment.location)"
                    class="text-muted"
                    :class="getLocationColor(appointment.location)"
                  />
                  <p class="font-semibold">
                    {{ formatTimeString(appointment.startTime) }} -
                    {{
                      formatTimeString(
                        addMinutesToTime(
                          appointment.startTime,
                          appointment.duration + (appointment.treatmentSession?.extendedDurationMinutes || 0)
                        )
                      )
                    }}
                  </p>
                </div>
                <div class="text-muted text-xs">
                  {{ getAppointmentTypeLabel(appointment.type || 'follow_up') }} ·
                  {{ appointment.duration + (appointment.treatmentSession?.extendedDurationMinutes || 0) }} min
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="getAppointmentStatusColor(appointment.status)"
                variant="soft"
                size="md"
                class="rounded-full"
              >
                {{ getAppointmentStatusLabel(appointment.status) }}
              </UBadge>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <USeparator orientation="vertical" class="h-8 pl-4" />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              square
              @click="deleteAppointment(appointment.id)"
            />
          </div>
        </li>
      </ul>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-calendar-x"
      title="Aucune séance planifiée"
      description="Aucune séance n'a été planifiée pour ce patient."
    />
    <div class="border-border bg-muted/50 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div class="text-muted-foreground text-sm font-medium">
        <span class="text-foreground font-bold">{{ selectedAppointments.length }}</span>
        séances sélectionnées
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-skip-forward"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="selectedAppointments.length === 0"
          @click="postponeAppointment"
        >
          Reporter
        </UButton>
        <UButton
          icon="i-lucide-check-square"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="selectedAppointments.length === 0"
          @click="changeStatusAppointment"
        >
          Changer statut
        </UButton>
        <UButton
          icon="i-lucide-trash"
          variant="outline"
          color="error"
          size="sm"
          :disabled="selectedAppointments.length === 0"
          @click="handleDeleteAppointment"
        >
          Supprimer
        </UButton>
      </div>
    </div>
  </AppCard>
</template>
