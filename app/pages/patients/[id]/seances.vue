<script setup lang="ts">
  import { LazyAppModalConfirm, LazyAppointmentPlanningSlideover } from '#components'
  import { DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date'

  const route = useRoute()

  const { data: patient, isPending } = usePatientById(() => route.params.id as string)

  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyAppointmentPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  // Mutating Data
  const { mutate: deleteAppointment } = useDeleteAppointment()

  const searchQuery = ref('')
  const statusFilter = ref<AppointmentStatus | 'all'>('all')
  const dateRange = shallowRef<{ start: DateValue | undefined; end: DateValue | undefined }>({
    start: undefined,
    end: undefined
  })

  const queryParams = computed(() => {
    const params: AppointmentQuery = {
      patientId: route.params.id as string,
      onlyIndependent: true
    }
    return params
  })

  const { data: appointments, isLoading } = useAppointmentsList(queryParams)

  const appointmentCount = computed(() => appointments.value?.length || 0)

  const filteredAppointments = computed(() => {
    let filtered = appointments.value || []

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter((c) =>
        getAppointmentTypeLabel(c.type || 'follow_up')
          .toLowerCase()
          .includes(query)
      )
    }

    if (statusFilter.value && statusFilter.value !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter.value)
    }

    if (dateRange.value.start) {
      const startDate = dateRange.value.start.toString()
      filtered = filtered.filter((c) => c.date >= startDate)
    }
    if (dateRange.value.end) {
      const endDate = dateRange.value.end.toString()
      filtered = filtered.filter((c) => c.date <= endDate)
    }

    return filtered
  })

  const handleCreateSession = () => {
    if (!patient.value) return
    sessionPlanningOverlay.open({
      patient: patient.value
    })
  }

  const navigateToPlans = () => {
    navigateTo(`/patients/${route.params.id}/plan`)
  }

  const handleDeleteSession = async (appointment: Appointment) => {
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
        patientId: route.params.id as string,
        appointmentId: appointment.id
      })
    }
  }

  const handleEditSession = (appointment: Appointment) => {
    if (!patient.value) return
    sessionPlanningOverlay.open({
      patient: patient.value,
      appointment
    })
  }

  const df = new DateFormatter('fr-FR', {
    dateStyle: 'medium'
  })
</script>
<template>
  <div v-if="isPending" class="flex justify-center py-8">
    <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
  </div>

  <div v-else-if="patient">
    <AppCard
      icon="hugeicons-folder-details"
      :description="`${appointmentCount} Appointment${appointmentCount > 1 ? 's' : ''} indépendante${appointmentCount > 1 ? 's' : ''}`"
    >
      <!-- Header -->
      <template #title>
        <span>Séances Indépendantes</span>
      </template>
      <template #actions>
        <UButton icon="i-lucide-plus" color="primary" size="sm" label="Nouvelle Séance" @click="handleCreateSession" />
      </template>

      <!-- Filter Bar (expandable) -->
      <div class="mb-4 flex justify-end gap-4">
        <UFormField class="min-w-36">
          <USelect
            v-model="statusFilter"
            :items="[
              {
                label: 'Tous',
                value: 'all',
                color: 'neutral'
              },
              ...APPOINTMENT_STATUS_OPTIONS
            ]"
            placeholder="Tous les statuts"
            class="w-full"
          />
        </UFormField>

        <UPopover
          :content="{
            align: 'end',
            side: 'bottom',
            sideOffset: 8
          }"
          class="min-w-64"
        >
          <UButton color="neutral" variant="subtle" icon="i-hugeicons-calendar-02">
            <template v-if="dateRange.start">
              <template v-if="dateRange.end">
                {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} -
                {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
              </template>

              <template v-else>
                {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
              </template>
            </template>
            <template v-else>Sélectionner une période</template>
          </UButton>

          <template #content>
            <UCalendar v-model="dateRange" class="p-2" :number-of-months="2" range />
          </template>
        </UPopover>
      </div>

      <!-- Session List -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="text-muted animate-spin text-4xl" />
      </div>

      <div v-else-if="filteredAppointments.length > 0" class="space-y-3">
        <AppointmentCard
          v-for="appointment in filteredAppointments"
          :key="appointment.id"
          :appointment
          :can-edit="true"
          :can-delete="true"
          @edit="handleEditSession"
          @delete="handleDeleteSession"
        />
      </div>

      <!-- Empty State for Independent Appointments -->
      <UEmpty
        v-else-if="!searchQuery && statusFilter === 'all' && !dateRange.start && !dateRange.end"
        icon="hugeicons-folder-details"
        title="Aucune consultation indépendante"
        description="Toutes vos séances sont liées à des plans de traitement. Vous pouvez créer une consultation indépendante ou gérer vos plans existants."
        :ui="{ body: 'max-w-none' }"
        :actions="[
          {
            label: 'Créer une consultation',
            icon: 'i-lucide-plus',
            color: 'primary',
            onClick: handleCreateSession
          },
          {
            label: 'Voir les plans de traitement',
            icon: 'hugeicons-first-aid-kit',
            color: 'neutral',
            variant: 'outline',
            onClick: navigateToPlans
          }
        ]"
      />

      <!-- Empty State for Filters -->
      <UEmpty
        v-else
        icon="i-lucide-search-x"
        title="Aucune consultation trouvée"
        description="Aucune consultation ne correspond à vos critères de recherche."
        :ui="{ body: 'max-w-none' }"
      />
    </AppCard>
  </div>
</template>
