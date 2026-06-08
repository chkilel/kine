<script setup lang="ts">
  import { format, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  // ─── Route & date handling ──────────────────────────────────────────────────
  const route = useRoute()

  const currentDate = computed(() => {
    const dateFromQuery = route.query.date as string
    return dateFromQuery || format(new Date(), 'yyyy-MM-dd')
  })

  const formattedDate = computed(() => {
    return format(parseISO(currentDate.value), 'EEEE d MMMM yyyy', { locale: fr })
  })

  // ─── Auth ─────────────────────────────────────────────────────────────────────
  const { user } = await useAuth()
  const therapistId = computed(() => user.value?.id)

  // ─── Actions ───────────────────────────────────────────────────────────────
  const selectDate = async (date: string) => {
    await navigateTo({ path: route.path, query: { date } })
  }

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const { data: appointments, isPending } = useTherapistAppointments(therapistId, currentDate)

  // ─── Computed ───────────────────────────────────────────────────────────────
  const statistics = computed(() => {
    const list = appointments.value || []
    const completed = list.filter((a) => ['finished', 'completed'].includes(a.status))
    const upcoming = list.filter((a) => ['scheduled', 'confirmed'].includes(a.status) && a.status !== 'in_progress')
    const inProgress = list.filter((a) => a.status === 'in_progress')
    const cancelled = list.filter((a) => ['cancelled', 'no_show'].includes(a.status))
    return {
      total: list.length,
      completed: completed.length,
      completedPercentage: list.length ? Math.round((completed.length / list.length) * 100) : 0,
      upcoming: upcoming.length,
      inProgress: inProgress.length,
      cancelled: cancelled.length
    }
  })

  // ─── Filters ────────────────────────────────────────────────────────────────
  const inProgressAppointments = computed(() => appointments.value?.filter((a) => a.status === 'in_progress'))

  const upcomingAppointments = computed(
    () => appointments.value?.filter((a) => ['confirmed', 'scheduled'].includes(a.status)) || []
  )

  const finishedAppointments = computed(
    () => appointments.value?.filter((a) => ['finished', 'completed', 'cancelled', 'no_show'].includes(a.status)) || []
  )

  const activeTab = ref<'upcoming' | 'finished'>('upcoming')

  const tabs = computed(() => [
    {
      label: 'À venir',
      value: 'upcoming',
      slot: 'upcoming',
      icon: 'i-hugeicons-calendar-03',
      badge: upcomingAppointments.value.length
    },
    {
      label: 'Terminé / Annulé',
      value: 'finished',
      slot: 'finished',
      icon: 'i-hugeicons-checkmark-circle-02',
      badge: finishedAppointments.value.length
    }
  ])
</script>

<template>
  <AppDashboardPage id="therapist-day" title="Planning">
    <div class="space-y-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 class="text-default text-2xl font-bold capitalize">{{ formatRelativeDate(currentDate) }}</h1>
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

      <div v-else class="space-y-6 xl:col-span-4">
        <!-- Day Stats -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-5">
          <AppStatCard label="RDVs" :value="statistics.total" unit="RDVs" icon="i-hugeicons-calendar-02" />
          <AppStatCard
            label="Terminées"
            color="success"
            :value="statistics.completed"
            :unit="`${statistics.completedPercentage}%`"
            icon="i-hugeicons-checkmark-circle-02"
          />
          <AppStatCard
            label="En cours"
            color="warning"
            :value="statistics.inProgress"
            unit="séances"
            icon="i-hugeicons-hourglass"
          />
          <AppStatCard
            label="À venir"
            color="primary"
            :value="statistics.upcoming"
            unit="RDVs"
            icon="i-hugeicons-clock-02"
          />
          <AppStatCard
            label="Annulées"
            color="error"
            :value="statistics.cancelled"
            unit="RDVs"
            icon="i-hugeicons-cancel-circle-half-dot"
          />
        </div>

        <!-- In progress treatment sessions -->
        <div class="space-y-4">
          <AppointmentListItem v-for="appointment in inProgressAppointments" :key="appointment.id" :appointment />
        </div>

        <AppCard :ui="{ body: 'p-4 sm:p-6' }">
          <UTabs
            v-if="appointments && appointments.filter((a) => a.status !== 'in_progress').length > 0"
            v-model="activeTab"
            :items="tabs"
            variant="pill"
            :ui="{ content: 'space-y-2', trigger: 'grow' }"
            class="w-full"
          >
            <template #upcoming>
              <AppointmentListItem
                v-for="appointment in upcomingAppointments"
                :key="appointment.id"
                :appointment="appointment"
              />
            </template>
            <template #finished>
              <AppointmentListItem
                v-for="appointment in finishedAppointments"
                :key="appointment.id"
                :appointment="appointment"
              />
            </template>
          </UTabs>
          <UEmpty
            v-else
            icon="i-hugeicons-calendar-remove-01"
            title="Aucun RDV"
            description="Aucun RDV programmé pour cette journée"
          />
          <template #fallback>
            <div class="flex justify-center py-8">
              <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
            </div>
          </template>
        </AppCard>
      </div>
    </div>
  </AppDashboardPage>
</template>
