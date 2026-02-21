<script setup lang="ts">
  import { LazyAppModalEVA } from '#components'

  const props = defineProps<{
    patientId: string
    appointmentId: string
  }>()

  const emit = defineEmits<{ close: [] }>()

  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)

  const { mutateAsync: createTreatmentSessionAsync, isLoading: isCreating } = useCreateTreatmentSession()
  const treatmentSessionActions = useTreatmentSessionActions()

  // Data fetching
  const { data: patient } = usePatientById(() => props.patientId)
  const { data: allAppointments } = useAppointmentsListWithSessions(() => ({ patientId: props.patientId, limit: 6 }))
  const {
    data: appointment,
    isPending: appointmentLoading,
    refetch: refetchAppointment
  } = useAppointment(() => props.appointmentId)

  const previousAppointments = computed(() => {
    const list = allAppointments.value
    const currentAppointment = appointment.value
    if (!list || !currentAppointment) return []

    return list
      .filter((c) => c.id !== currentAppointment.id && c.date <= currentAppointment.date)
      .slice(-5)
      .reverse()
  })

  const headerTitle = computed(() =>
    patient.value ? `${patient.value.firstName} ${patient.value.lastName}` : 'Séance active'
  )

  const headerDescription = computed(() => {
    if (!appointment.value) return ''
    const typeLabel = getAppointmentTypeLabel(appointment.value.type || 'follow_up')
    const totalDuration =
      appointment.value.duration + (appointment.value?.treatmentSession?.extendedDurationMinutes || 0)
    const durationLabel = totalDuration ? `${totalDuration} min` : ''
    return [typeLabel, durationLabel].filter(Boolean).join(' • ')
  })

  // Check if session hasn't started yet
  const sessionNotStarted = computed(
    () => !appointment.value?.treatmentSession || appointment.value?.treatmentSession?.status === 'pre_session'
  )

  // Handler to start a new session
  async function handleStartSession() {
    if (isCreating.value || treatmentSessionActions.isLoading.value) return

    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur initiale',
      description: 'Veuillez indiquer le niveau de douleur du patient avant la séance',
      confirmText: 'Enregistrer et démarrer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue === null) return

    try {
      let sessionId = appointment.value?.treatmentSession?.id

      if (!sessionId) {
        try {
          const result = await createTreatmentSessionAsync({ appointmentId: props.appointmentId })
          sessionId = result?.data?.id
        } catch (error) {
          const parsedError = parseError(error, 'Impossible de créer la séance de traitement')
          if (parsedError.statusCode === 409) {
            await refetchAppointment()
            sessionId = appointment.value?.treatmentSession?.id
          } else {
            throw error
          }
        }
      }

      if (!sessionId) {
        await refetchAppointment()
        sessionId = appointment.value?.treatmentSession?.id
      }

      if (!sessionId) throw new Error('Failed to create session')

      await treatmentSessionActions.startAsync({
        sessionId,
        appointmentId: props.appointmentId,
        actualStartTime: getCurrentTimeHHMMSS(),
        painLevelBefore: evaValue
      })

      await refetchAppointment()
    } catch (error) {
      const parsedError = parseError(error, 'Impossible de démarrer la séance')
      useToast().add({
        title: 'Erreur',
        description: parsedError.message,
        color: 'error'
      })
    }
  }
</script>

<template>
  <USlideover
    :dismissible="false"
    :title="headerTitle"
    :description="headerDescription"
    :ui="{ content: 'w-full max-w-[1500px] bg-elevated' }"
    @close="emit('close')"
  >
    <template #body>
      <!-- Loading State -->
      <div v-if="appointmentLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>

      <!-- Main Content -->
      <div v-else class="grid h-full gap-6 lg:grid-cols-12">
        <!-- Left Sidebar - Patient Info -->
        <TreatmentSessionSlideoverLeftSide
          v-if="patient && appointment"
          :patient="patient"
          :appointment="appointment"
        />

        <TreatmentSessionSlideoverCenter v-if="appointment" :appointment="appointment" />

        <!-- Right Sidebar - Timer & History -->
        <div class="flex h-full flex-col gap-4 lg:col-span-3">
          <!-- Start Session Button - Only show when no session exists -->
          <UButton
            v-if="sessionNotStarted"
            size="xl"
            color="primary"
            variant="solid"
            block
            class="rounded-xl text-lg font-bold shadow-lg"
            icon="i-hugeicons-play-circle"
            :loading="isCreating"
            @click="handleStartSession"
          >
            Démarrer la séance
          </UButton>

          <!-- Timer Card - Now uses treatment session -->
          <TreatmentSessionTimer v-if="appointment" :appointment="appointment" @close="emit('close')" />

          <!-- Session Timing Information Card -->
          <TreatmentSessionTimingCard v-if="appointment" :appointment="appointment" />

          <!-- Previous Appointments Card -->
          <UCard>
            <UCollapsible :default-open="false" :ui="{ content: 'space-y-3 pt-3' }">
              <UButton
                color="neutral"
                variant="ghost"
                class="group w-full justify-between"
                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                trailing-icon="i-lucide-chevron-down"
              >
                <span class="flex items-center gap-3 text-sm font-semibold">
                  <div class="bg-error-5 dark:bg-error-950/20 rounded-lg p-2">
                    <UIcon name="i-hugeicons-pulse-01" class="text-error animate-pulse" />
                  </div>
                  Notes des séances précédentes
                </span>
              </UButton>

              <template #content>
                <div v-if="previousAppointments.length" class="space-y-5 pt-3">
                  <div v-for="previous in previousAppointments" :key="previous.id">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-sm font-bold">{{ formatFrenchDate(previous.date) }}</span>
                      <span
                        v-if="previous.treatmentSession?.painLevelBefore !== null"
                        class="text-muted bg-muted-100 dark:bg-muted-800 rounded px-2 py-0.5 text-xs"
                      >
                        EVA {{ previous.treatmentSession?.painLevelBefore }}/10
                      </span>
                    </div>
                    <p class="text-muted line-clamp-3 text-sm leading-relaxed">
                      {{ previous.treatmentSession?.treatmentSummary || 'Aucune note enregistrée pour cette séance.' }}
                    </p>
                  </div>
                </div>
                <div v-else class="text-muted pt-3 text-xs">Aucune séance précédente enregistrée.</div>
              </template>
            </UCollapsible>
          </UCard>
        </div>
      </div>
    </template>
  </USlideover>
</template>
