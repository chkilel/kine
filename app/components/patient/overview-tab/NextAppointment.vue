<script setup lang="ts">
  import { LazyTreatmentSessionSlideover } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  const overlay = useOverlay()
  const { orgNavigateTo } = await useOrgRoute()
  const activeConsultationOverlay = overlay.create(LazyTreatmentSessionSlideover)

  const { data: appointments } = useAppointmentsList(() => ({ patientId: patient?.id }))

  const nextAppointment = computed(() => {
    if (!appointments.value) return null
    const upcoming = appointments.value
      .filter((a) => {
        const appointmentDate = new Date(a.date)
        return !isDateDisabled(appointmentDate)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return upcoming[0] || null
  })

  function navigateToPlan(planId?: string) {
    const path = `/patients/${patient.id}/plan`
    if (planId) {
      orgNavigateTo({ path, query: { planId } })
    } else {
      orgNavigateTo(path)
    }
  }

  function openAppointmentSlideover(appointment: Appointment) {
    activeConsultationOverlay.open({
      patientId: patient.id,
      appointmentId: appointment.id
    })
  }
</script>

<template>
  <AppCard title="Prochaine Séance">
    <div v-if="nextAppointment" class="flex flex-col gap-4">
      <div
        class="group border-default bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors hover:shadow-md"
        @click="openAppointmentSlideover(nextAppointment)"
      >
        <AppDateBadge :date="nextAppointment.date" color="info" variant="soft" size="lg" />

        <div class="min-w-0 flex-1">
          <p class="text-default truncate font-semibold">
            {{ getAppointmentTypeLabel(nextAppointment.type || 'follow_up') }}
          </p>
          <p class="text-muted text-sm">
            <span class="font-medium capitalize">
              {{ extractDayAndMonth(nextAppointment.date).dayNameShort }}
              {{ extractDayAndMonth(nextAppointment.date).month }}
            </span>
            à
            <span class="font-semibold">
              {{ formatTimeString(nextAppointment.startTime) }}
            </span>
            - {{ nextAppointment.duration }} min
          </p>
        </div>
        <UIcon
          name="i-lucide-chevron-right"
          class="group-hover:text-primary text-muted size-5 transition-all group-hover:-mr-1"
        />
      </div>

      <UButton
        size="sm"
        variant="ghost"
        color="primary"
        trailing-icon="hugeicons-arrow-right-02"
        label="Voir toutes les séances"
        class="justify-center"
        @click="navigateToPlan(nextAppointment.treatmentPlanId || undefined)"
      />
    </div>

    <UEmpty
      v-else
      icon="hugeicons-calendar-remove-02"
      title="Aucune séance planifiée"
      description="Ce patient n'a pas encore de séance planifiée."
    />
  </AppCard>
</template>
