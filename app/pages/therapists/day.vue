<script setup lang="ts">
  import { LazyConsultationSlideover, LazyAppointmentOnGoingCard, LazyAppointmentListItem } from '#components'
  import { format, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const notes = ref('')

  const todoItems = ref([
    { id: 1, text: 'Relancer factures impayées', done: false },
    { id: 2, text: 'Préparer bilan J. Dupont', done: true },
    { id: 3, text: 'Commander matériel', done: false },
    { id: 4, text: 'Mise à jour logiciel', done: false }
  ])

  const route = useRoute()
  const overlay = useOverlay()

  const activeConsultationOverlay = overlay.create(LazyConsultationSlideover)

  const currentDate = computed(() => {
    const dateFromQuery = route.query.date as string
    return dateFromQuery || format(new Date(), 'yyyy-MM-dd')
  })

  const formattedDate = computed(() => {
    return format(parseISO(currentDate.value), 'EEEE d MMMM yyyy', { locale: fr })
  })

  const relativeDate = computed(() => {
    const date = parseISO(currentDate.value)
    const distance = formatRelativeDate(date)
    return distance
  })

  const selectDate = (date: string) => {
    navigateTo({ path: route.path, query: { date } })
  }

  const { user } = await useAuth()
  const { data: appointments, isPending } = useTherapistAppointments(() => user.value?.id, currentDate)

  const stats = computed(() => {
    const list = appointments.value || []
    const completed = list.filter((a) => a.status === 'completed').length
    const upcoming = list.filter((a) => ['scheduled', 'confirmed'].includes(a.status) && !a.treatmentSession).length
    const inProgress = list.filter((a) => a.treatmentSession?.status === 'in_progress').length
    const cancelled = list.filter((a) => ['cancelled', 'no_show'].includes(a.status)).length
    return {
      total: list.length,
      completed,
      completedPercentage: list.length ? Math.round((completed / list.length) * 100) : 0,
      upcoming,
      inProgress,
      cancelled
    }
  })

  const inProgressAppointments = computed(() =>
    appointments.value?.filter((a) => a.treatmentSession?.status === 'in_progress')
  )

  // Show all appointments except in_progress
  const nonInProgressAppointments = computed(() =>
    appointments.value?.filter((a) => a.treatmentSession?.status !== 'in_progress')
  )

  // Create treatment session composable
  const createTreatmentSession = useCreateTreatmentSession()

  const handleStartSession = async (appointment: Appointment) => {
    try {
      // Create treatment session from appointment
      const result = await createTreatmentSession.mutateAsync({
        appointmentId: appointment.id
      })

      // Open consultation slideover with the new treatment session
      if (result?.data?.id) {
        activeConsultationOverlay.open({
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          treatmentSessionId: result.data.id
        })
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handleContinueSession = (appointment: Appointment, treatmentSessionId?: string) => {
    activeConsultationOverlay.open({
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      treatmentSessionId
    })
  }

  const handleViewSession = (appointment: Appointment, treatmentSessionId?: string) => {
    activeConsultationOverlay.open({
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      treatmentSessionId
    })
  }

  function handleViewPatient(patientId: string) {
    navigateTo(`/patients/${patientId}`)
  }
</script>

<template>
  <AppDashboardPage id="therapist-day" title="Planning">
    <div class="space-y-8">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 class="text-default text-3xl font-bold capitalize">{{ relativeDate }}</h1>
          <p class="text-muted mt-1 flex items-center gap-2 capitalize">
            <UIcon name="i-hugeicons-calendar-03" class="size-4" />
            {{ formattedDate }}
          </p>
        </div>
        <AppMiniCalendar :current-date="currentDate" disablePreviousWeek @select-date="selectDate" />
      </div>

      <div v-if="isPending" class="flex justify-center py-8">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>

      <div v-else class="grid grid-cols-1 gap-8 xl:grid-cols-6">
        <div class="space-y-6 xl:col-span-4">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-5">
            <AppStatCard label="RDVs" :value="stats.total" unit="RDVs" icon="i-hugeicons-calendar-02" />
            <AppStatCard
              label="Terminées"
              color="success"
              :value="stats.completed"
              :unit="`${stats.completedPercentage}%`"
              icon="i-hugeicons-checkmark-circle-02"
            />
            <AppStatCard
              label="En cours"
              color="warning"
              :value="stats.inProgress"
              unit="séances"
              icon="i-hugeicons-hourglass"
            />
            <AppStatCard
              label="À venir"
              color="primary"
              :value="stats.upcoming"
              unit="RDVs"
              icon="i-hugeicons-clock-02"
            />
            <AppStatCard
              label="Annulées"
              color="error"
              :value="stats.cancelled"
              unit="RDVs"
              icon="i-hugeicons-cancel-circle-half-dot"
            />
          </div>

          <div class="space-y-4">
            <LazyAppointmentOnGoingCard
              v-for="appointment in inProgressAppointments"
              :key="appointment.id"
              :appointment
              @view-session="handleViewSession"
              @view-patient="handleViewPatient"
            />
          </div>

          <AppCard title="Planning de la journée" icon="i-hugeicons-task-daily-01">
            <template #actions>
              <div class="flex gap-2">
                <UButton icon="i-hugeicons-list-view" variant="soft" color="primary" square size="sm" />
                <UButton icon="i-hugeicons-calendar-02" variant="ghost" color="neutral" square size="sm" />
              </div>
            </template>
            <div class="space-y-4">
              <div v-if="nonInProgressAppointments && nonInProgressAppointments.length > 0" class="space-y-3">
                <LazyAppointmentListItem
                  v-for="appointment in nonInProgressAppointments"
                  :key="appointment.id"
                  :appointment="appointment"
                  @start-session="handleStartSession"
                  @continue-session="handleContinueSession"
                />
              </div>

              <UEmpty
                v-else
                icon="i-hugeicons-calendar-remove-01"
                title="Aucun RDV"
                description="Aucun RDV programmé pour cette journée"
              />
            </div>
          </AppCard>
        </div>

        <div class="space-y-8 xl:col-span-2">
          <UCard :ui="{ body: 'p-5', root: 'shadow-sm overflow-hidden flex flex-col' }">
            <template #header>
              <div class="border-default bg-warning/10 flex items-center justify-between border-b p-5">
                <h3 class="text-default flex items-center gap-2 font-bold">
                  <UIcon name="i-hugeicons-sticky-note-01" class="text-warning" />
                  Notes du jour
                </h3>
                <UButton icon="i-hugeicons-edit-01" variant="ghost" color="neutral" square size="sm" />
              </div>
            </template>
            <div class="p-5">
              <UTextarea
                v-model="notes"
                placeholder="Une note pour aujourd'hui ?"
                :ui="{
                  base: 'bg-transparent border-none focus:ring-0 text-sm text-muted resize-none min-h-[120px] scrollbar-hide'
                }"
              />
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-2', root: 'shadow-sm overflow-hidden flex flex-col' }">
            <template #header>
              <div class="border-default flex items-center justify-between border-b p-5">
                <h3 class="text-default flex items-center gap-2 font-bold">
                  <UIcon name="i-hugeicons-checkmark-circle-02" class="text-primary" />
                  À faire
                </h3>
                <UButton
                  icon="i-hugeicons-add-01"
                  size="xs"
                  color="primary"
                  square
                  class="flex h-8 w-8 items-center justify-center rounded-full"
                />
              </div>
            </template>
            <div class="space-y-1">
              <div
                v-for="item in todoItems"
                :key="item.id"
                class="group hover:bg-muted flex cursor-pointer items-center gap-3 rounded-xl p-3"
              >
                <UCheckbox v-model="item.done" color="primary" size="md" />
                <span
                  :class="[
                    'text-sm transition-colors',
                    item.done ? 'text-success line-through' : 'group-hover:text-primary text-muted'
                  ]"
                >
                  {{ item.text }}
                </span>
              </div>
            </div>
          </UCard>

          <div class="border-muted bg-muted rounded-2xl border-2 border-dashed p-6">
            <div class="mb-4 flex items-center justify-between">
              <span class="text-toned text-xs font-bold tracking-widest uppercase">Demain</span>
              <span class="text-primary text-xs font-medium">8 rendez-vous</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                <div v-for="i in 3" :key="i" class="border-default bg-elevated h-8 w-8 rounded-full border-2" />
              </div>
              <span class="text-toned text-xs font-medium">+5 patients</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppDashboardPage>
</template>
