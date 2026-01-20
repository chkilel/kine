<script setup lang="ts">
  import LazyConsultationActiveCard from '~/components/consultation/ConsultationActiveCard.vue'
  import LazyConsultationListItem from '~/components/consultation/ConsultationListItem.vue'
  import { LazyAppModalConfirm, LazyConsultationActiveConsultationSlideover } from '#components'
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
  const router = useRouter()
  const overlay = useOverlay()

  const confirmModal = overlay.create(LazyAppModalConfirm)
  const activeConsultationOverlay = overlay.create(LazyConsultationActiveConsultationSlideover)
  const { mutate: updateStatus } = useUpdateConsultationStatus()

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
    router.push({ path: route.path, query: { date } })
  }

  const { data: consultations, isPending } = useTherapistConsultations(currentDate)

  const stats = computed(() => {
    const list = consultations.value || []
    const completed = list.filter((c) => c.status === 'completed').length
    const upcoming = list.filter((c) => ['scheduled', 'confirmed'].includes(c.status)).length
    const cancelled = list.filter((c) => ['cancelled', 'no_show'].includes(c.status)).length
    return {
      total: list.length,
      completed,
      completedPercentage: list.length ? Math.round((completed / list.length) * 100) : 0,
      upcoming,
      cancelled
    }
  })

  const inProgressConsultations = computed(() => consultations.value?.filter((c) => c.status === 'in_progress'))
  const upcomingConsultations = computed(() => consultations.value?.filter((c) => c.status !== 'in_progress'))

  const handleStartSession = async (consultation: TherapistConsultation) => {
    const confirmed = await confirmModal.open({
      title: 'Démarrer la consultation',
      message: `Démarrer la consultation avec ${consultation.patientName} à ${consultation.startTime} ?`,
      confirmText: 'Démarrer',
      cancelText: 'Annuler',
      confirmColor: 'primary',
      icon: 'i-hugeicons-play-circle'
    })

    if (!confirmed) return

    updateStatus({
      patientId: consultation.patientId,
      consultationId: consultation.id,
      status: 'in_progress'
    })

    activeConsultationOverlay.open({
      patientId: consultation.patientId,
      consultationId: consultation.id
    })
  }

  const handleViewSession = (consultation: TherapistConsultation) => {
    activeConsultationOverlay.open({
      patientId: consultation.patientId,
      consultationId: consultation.id
    })
  }
</script>

<template>
  <UDashboardPanel id="therapist-day" class="bg-elevated">
    <template #header>
      <UDashboardNavbar class="bg-default/75">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>Planning</template>
      </UDashboardNavbar>
    </template>

    <template #body>
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
            <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
              <AppStatCard label="Consultations" :value="stats.total" unit="rdvs" icon="i-hugeicons-calendar-02" />
              <AppStatCard
                label="Terminées"
                color="success"
                :value="stats.completed"
                :unit="`/ ${stats.completedPercentage}%`"
                icon="i-hugeicons-checkmark-circle-02"
              />
              <AppStatCard
                label="À venir"
                color="primary"
                :value="stats.upcoming"
                unit="restant"
                icon="i-hugeicons-clock-01"
              />
              <AppStatCard
                label="Annulées"
                color="error"
                :value="stats.cancelled"
                unit="rdvs"
                icon="i-hugeicons-cancel-circle-half-dot"
              />
            </div>

            <div class="space-y-4">
              <LazyConsultationActiveCard
                v-for="consultation in inProgressConsultations"
                :key="consultation.id"
                :consultation
                @view="handleViewSession"
                @complete="handleViewSession"
              />
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between px-2">
                <h3 class="text-default flex items-center gap-2 text-lg font-bold">
                  <UIcon name="i-hugeicons-task-daily-01" class="text-primary" />
                  Planning de la journée
                </h3>
                <div class="flex gap-2">
                  <UButton icon="i-hugeicons-list-view" variant="soft" color="primary" square size="sm" />
                  <UButton icon="i-hugeicons-calendar-02" variant="ghost" color="neutral" square size="sm" />
                </div>
              </div>

              <div v-if="upcomingConsultations && upcomingConsultations.length > 0" class="space-y-3">
                <LazyConsultationListItem
                  v-for="consultation in upcomingConsultations"
                  :key="consultation.id"
                  :consultation="consultation"
                  @start="handleStartSession"
                  @view="handleViewSession"
                />
              </div>

              <UEmpty
                v-else
                icon="i-hugeicons-calendar-remove-01"
                title="Aucune consultation"
                description="Aucune consultation programmée pour cette journée"
              />
            </div>
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
    </template>
  </UDashboardPanel>
</template>
