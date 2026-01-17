<script setup lang="ts">
  import { LazyAppModalConfirm, LazyConsultationActiveConsultationSlideover } from '#components'
  import type { BreadcrumbItem } from '@nuxt/ui'
  import { addDays, subDays, format, parseISO } from 'date-fns'
  import { fr as frLocale } from 'date-fns/locale'

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Planning quotidien', icon: 'i-hugeicons-calendar-02' }
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
    return format(parseISO(currentDate.value), 'EEEE d MMMM yyyy', { locale: frLocale })
  })

  const previousDate = () => {
    const newDate = subDays(parseISO(currentDate.value), 1)
    router.push({ path: route.path, query: { date: format(newDate, 'yyyy-MM-dd') } })
  }

  const nextDate = () => {
    const newDate = addDays(parseISO(currentDate.value), 1)
    router.push({ path: route.path, query: { date: format(newDate, 'yyyy-MM-dd') } })
  }

  const { data: consultations, isPending } = useTherapistConsultations(currentDate)

  const stats = computed(() => {
    const list = consultations.value || []
    return {
      total: list.length,
      completed: list.filter((c) => c.status === 'completed').length,
      upcoming: list.filter((c) => ['scheduled', 'confirmed'].includes(c.status)).length,
      cancelled: list.filter((c) => ['cancelled', 'no_show'].includes(c.status)).length
    }
  })

  const canStartSession = (status: ConsultationStatus) => {
    return ['scheduled', 'confirmed'].includes(status)
  }

  const canViewSession = (status: ConsultationStatus) => {
    return status === 'in_progress'
  }

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
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>Planning quotidien</template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="space-y-6">
          <UBreadcrumb :items="breadcrumbItems" />

          <UCard :ui="{ body: 'p-6' }">
            <div class="flex items-center justify-between">
              <UButton icon="i-hugeicons-arrow-left-01" variant="ghost" @click="previousDate" />

              <div class="text-center">
                <h2 class="text-2xl font-bold capitalize">{{ formattedDate }}</h2>
              </div>

              <UButton icon="i-hugeicons-arrow-right-01" variant="ghost" @click="nextDate" />
            </div>
          </UCard>

          <div v-if="isPending" class="flex justify-center py-8">
            <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
          </div>

          <div v-else class="space-y-6">
            <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
              <UCard>
                <div class="text-center">
                  <p class="text-muted text-sm">Total</p>
                  <p class="text-3xl font-bold">{{ stats.total }}</p>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <p class="text-muted text-sm">Terminées</p>
                  <p class="text-success text-3xl font-bold">{{ stats.completed }}</p>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <p class="text-muted text-sm">À venir</p>
                  <p class="text-info text-3xl font-bold">{{ stats.upcoming }}</p>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <p class="text-muted text-sm">Annulées</p>
                  <p class="text-error text-3xl font-bold">{{ stats.cancelled }}</p>
                </div>
              </UCard>
            </div>

            <UCard v-if="consultations && consultations.length > 0">
              <template #title>Consultations</template>

              <div class="space-y-3">
                <div
                  v-for="consultation in consultations"
                  :key="consultation.id"
                  class="bg-muted hover:border-default flex flex-col gap-3 rounded-lg border border-transparent p-4 transition-colors sm:flex-row sm:items-center"
                >
                  <div class="flex-1">
                    <div class="mb-2 flex items-center gap-2">
                      <span class="text-lg font-bold">{{ consultation.startTime }} - {{ consultation.endTime }}</span>
                      <UBadge :color="getConsultationStatusColor(consultation.status)" variant="subtle" size="sm">
                        {{ getConsultationStatusLabel(consultation.status) }}
                      </UBadge>
                    </div>

                    <h3 class="text-xl font-semibold">{{ consultation.patientName }}</h3>

                    <div class="text-muted mt-1 flex flex-wrap gap-4 text-sm">
                      <span>{{ getConsultationTypeLabel(consultation.type || 'follow_up') }}</span>
                      <span v-if="consultation.roomName">{{ consultation.roomName }}</span>
                      <span>{{ consultation.duration }} min</span>
                      <span v-if="consultation.chiefComplaint">{{ consultation.chiefComplaint }}</span>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <UButton
                      v-if="canStartSession(consultation.status)"
                      icon="i-hugeicons-play-circle"
                      color="primary"
                      size="sm"
                      @click="handleStartSession(consultation)"
                    >
                      Démarrer
                    </UButton>

                    <UButton
                      v-if="canViewSession(consultation.status)"
                      icon="i-hugeicons-view-01"
                      color="success"
                      size="sm"
                      @click="handleViewSession(consultation)"
                    >
                      Voir la séance
                    </UButton>

                    <UButton
                      icon="i-hugeicons-view-01"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      :to="`/patients/${consultation.patientId}`"
                    >
                      Patient
                    </UButton>
                  </div>
                </div>
              </div>
            </UCard>

            <UEmpty
              v-else
              icon="i-hugeicons-calendar-x"
              title="Aucune consultation"
              description="Aucune consultation programmée pour cette journée"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
