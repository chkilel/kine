<script setup lang="ts">
  import { LazyAppointmentPlanningSlideover, LazyAppModalConfirm } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const toast = useToast()
  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyAppointmentPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  // Fetching/mutating data
  const {
    data: appointments,
    isLoading,
    refetch
  } = useAppointmentsList(() => ({
    patientId: props.patient.id,
    treatmentPlanId: props.treatmentPlan.id
  }))

  const { mutate: deleteAppointment } = useDeleteAppointment()

  // Tab state
  const activeTab = ref<'upcoming' | 'finished'>('upcoming')

  // Filter appointments by status
  const upcomingStatuses: AppointmentStatus[] = ['confirmed', 'scheduled']
  const finishedStatuses: AppointmentStatus[] = ['completed', 'cancelled', 'no_show']

  const upcomingAppointments = computed(
    () => appointments.value?.filter((c) => upcomingStatuses.includes(c.status)) || []
  )

  const finishedAppointments = computed(
    () => appointments.value?.filter((c) => finishedStatuses.includes(c.status)) || []
  )

  const tabs = computed(() => [
    {
      label: 'À venir',
      value: 'upcoming',
      slot: 'upcoming',
      icon: 'i-hugeicons-calendar-03',
      badge: upcomingAppointments.value.length
    },
    {
      label: 'Terminées / Annulées',
      value: 'finished',
      slot: 'finished',
      icon: 'i-hugeicons-checkmark-circle-02',
      badge: finishedAppointments.value.length
    }
  ])

  // Refresh appointments data
  const refreshAppointments = async () => {
    await refetch()
    toast.add({
      title: 'Appointments actualisées',
      description: 'Les rendez-vous ont été rechargées avec succès.',
      color: 'success'
    })
  }

  // Delete appointment function
  async function handleDeleteAppointment(appointment: Appointment) {
    const confirmed = await confirmModal.open({
      title: 'Supprimer la séance',
      message: `Êtes-vous sûr de vouloir supprimer cette séance du ${formatFrenchDate(appointment.date)} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-alert-02'
    })

    if (confirmed) {
      deleteAppointment({
        appointmentId: appointment.id
      })
    }
  }

  // Edit appointment function - opens planning slideover with appointment data
  const editAppointment = (appointment: Appointment) => {
    sessionPlanningOverlay.open({
      patient: props.patient,
      treatmentPlan: props.treatmentPlan,
      appointment
    })
  }

  // Function to open session planning with event handlers
  function openAppointmentPlanning() {
    sessionPlanningOverlay.open({
      patient: props.patient,
      treatmentPlan: props.treatmentPlan
    })
  }
</script>

<template>
  <AppCard title="Aperçu des séances">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-hugeicons-reload"
          variant="outline"
          color="neutral"
          size="sm"
          :loading="isLoading"
          @click="refreshAppointments"
        />
        <UButton
          icon="i-hugeicons-calendar-add-01"
          color="primary"
          size="sm"
          label="Planifier les séances"
          @click="openAppointmentPlanning"
        />
      </div>
    </template>
    <ClientOnly>
      <div v-if="appointments?.length && appointments?.length > 0" class="space-y-4">
        <UTabs v-model="activeTab" :items="tabs" variant="pill" class="w-full">
          <template #upcoming>
            <div class="mt-4 space-y-2.5">
              <AppointmentCard
                v-for="appointment in upcomingAppointments"
                :key="appointment.id"
                :appointment
                @edit="editAppointment($event)"
                @delete="handleDeleteAppointment($event)"
              />
            </div>
          </template>
          <template #finished>
            <div class="mt-4 space-y-2.5">
              <AppointmentCard
                v-for="appointment in finishedAppointments"
                :key="appointment.id"
                :appointment
                @edit="editAppointment($event)"
                @delete="handleDeleteAppointment($event)"
              />
            </div>
          </template>
        </UTabs>
      </div>
      <UEmpty
        v-else
        variant="naked"
        icon="i-hugeicons-calendar-remove-01"
        title="Aucune séance planifiée pour ce plan de traitement."
        description="Commencez à planifier les séances pour ce patient afin de débuter le suivi."
        :ui="{ body: 'max-w-none' }"
        :actions="[
          {
            icon: 'i-hugeicons-add-circle',
            label: 'Planifier les séances du plan',
            size: 'md',
            onClick: openAppointmentPlanning
          },
          {
            icon: 'i-hugeicons-add-01',
            label: 'Créer une consultation indépendante',
            color: 'neutral',
            size: 'md',
            variant: 'outline'
          }
        ]"
      />
      <template #fallback>
        <div class="flex justify-center py-8">
          <UIcon name="i-hugeicons-reload" class="animate-spin text-4xl" />
        </div>
      </template>
    </ClientOnly>
  </AppCard>
</template>
