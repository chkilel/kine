<script setup lang="ts">
  import type { RadioGroupItem } from '@nuxt/ui'
  import { LazyAppModalConfirm, LazyAppointmentPlanningSlideover } from '#components'
  import { DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date'

  const route = useRoute()

  const { data: patient, isPending } = usePatientById(() => route.params.id as string)

  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyAppointmentPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const { mutate: deleteAppointment } = useDeleteAppointment()

  const searchQuery = ref('')
  const statusFilter = ref<AppointmentStatus | 'all'>('all')
  const dateRange = shallowRef<{ start: DateValue | undefined; end: DateValue | undefined }>({
    start: undefined,
    end: undefined
  })

  const statusFilterItems = computed<RadioGroupItem[]>(() => [
    {
      label: 'Tous',
      value: 'all',
      icon: 'i-hugeicons-filter-01',
      description: 'Afficher toutes les séances'
    },
    ...Object.entries(APPOINTMENT_STATUS_CONFIG).map(([key, item]) => ({
      label: item.label,
      value: key,
      icon: item.icon,
      description: item.description
    }))
  ])

  const queryParams = computed(() => {
    const params: AppointmentQuery = {
      patientId: route.params.id as string,
      onlyIndependent: true
    }
    return params
  })

  const { data, isLoading } = useAppointmentsList(queryParams)
  const appointments = computed(() => data.value?.data)
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

  const navigateToPlans = async () => {
    await navigateTo(`/patients/${route.params.id}/plan`)
  }

  const handleDeleteSession = async (appointment: Appointment) => {
    const confirmed = await confirmModal.open({
      title: 'Supprimer la séance',
      message: `Êtes-vous sûr de vouloir supprimer cette séance du ${formatDate(appointment.date)} ? Cette action est irréversible.`,
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

  <div v-else-if="patient" class="space-y-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <AppCard title="Filtres des séances" description="Affinez les séances par période et statut.">
          <UPopover
            :content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 8
            }"
            class="w-full"
          >
            <UButton color="neutral" variant="subtle" icon="i-hugeicons-calendar-02" class="w-full justify-start">
              <template v-if="dateRange.start">
                <template v-if="dateRange.end">
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} -
                  {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                </template>
                <template v-else>{{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}</template>
              </template>
              <template v-else>Sélectionner une période</template>
            </UButton>

            <template #content>
              <UCalendar v-model="dateRange" class="p-2" :number-of-months="2" range />
            </template>
          </UPopover>

          <h3 class="text-muted mt-4 text-sm font-medium lg:hidden">Statut</h3>
          <USelect
            v-model="statusFilter"
            :items="[{ label: 'Tous', value: 'all', color: 'neutral' }, ...APPOINTMENT_STATUS_OPTIONS]"
            placeholder="Tous les statuts"
            class="mt-2 w-full lg:hidden"
          />
          <URadioGroup
            v-model="statusFilter"
            color="primary"
            variant="table"
            size="sm"
            :default-value="'all'"
            :items="statusFilterItems"
            :ui="{
              root: 'mt-4 hidden lg:block',
              item: 'p-2 first-of-type:rounded-t-md first-of-type:rounded-t-md '
            }"
          />
        </AppCard>
      </div>

      <div class="space-y-4 lg:col-span-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="hugeicons-folder-details" class="text-muted text-xl" />
            <div>
              <h2 class="text-base font-semibold">
                Séances Indépendantes
                <span class="text-muted text-sm">({{ appointmentCount }})</span>
              </h2>
            </div>
          </div>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            size="sm"
            label="Nouvelle Séance"
            @click="handleCreateSession"
          />
        </div>

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

        <UEmpty
          v-else
          icon="i-lucide-search-x"
          title="Aucune consultation trouvée"
          description="Aucune consultation ne correspond à vos critères de recherche."
          :ui="{ body: 'max-w-none' }"
        />
      </div>
    </div>
  </div>
</template>
