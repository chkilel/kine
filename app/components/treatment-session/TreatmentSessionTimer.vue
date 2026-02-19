<script setup lang="ts">
  import { LazyAppModalEVA } from '#components'

  const props = defineProps<{
    treatmentSession?: TreatmentSession | null
    appointment: AppointmentWithSession
    selectedTags: string[]
    sessionNotes: string
  }>()

  const emit = defineEmits<{
    complete: []
    close: []
  }>()

  const treatmentSessionActions = useTreatmentSessionActions()
  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)
  const queryCache = useQueryCache()

  // Timer state - now from treatment session
  const timerSeconds = ref(0)
  const actualStartTime = ref<string | null>(null)
  const pauseStartTime = ref<string | null>(null)
  const totalPausedSeconds = ref(0)
  const timeSincePause = ref('')

  // Computed
  const isPaused = computed(() => pauseStartTime.value !== null)

  const consultationDurationSeconds = computed(() => {
    if (!props.appointment?.duration) return 0
    return (props.appointment.duration + (props.appointment.treatmentSession?.extendedDurationMinutes || 0)) * 60
  })

  const remainingSeconds = computed(() => {
    if (!consultationDurationSeconds.value) return 0
    return Math.max(consultationDurationSeconds.value - timerSeconds.value, 0)
  })

  const remainingLabel = computed(() => {
    if (!consultationDurationSeconds.value) return ''
    return formatSecondsAsHHMMSS(remainingSeconds.value)
  })

  const showFiveMinuteWarning = computed(() => {
    return (
      props.appointment.treatmentSession?.status === 'in_progress' &&
      consultationDurationSeconds.value > 0 &&
      remainingSeconds.value > 0 &&
      remainingSeconds.value <= 300
    )
  })

  const isInProgress = computed(() => props.appointment.treatmentSession?.status === 'in_progress')
  const isCompleted = computed(() => props.appointment.treatmentSession?.status === 'completed')

  const isPausing = computed(() => isPaused.value && treatmentSessionActions.isLoading.value)
  const isResuming = computed(() => !isPaused.value && treatmentSessionActions.isLoading.value)

  // Timer functions
  function calculateElapsedTime() {
    if (!actualStartTime.value) {
      timerSeconds.value = 0
      return
    }

    const currentTime = getCurrentTimeHHMMSS()
    const totalElapsedSeconds = calculateTimeDifference(actualStartTime.value, currentTime)
    let effectivePausedSeconds = totalPausedSeconds.value

    if (pauseStartTime.value) {
      effectivePausedSeconds += calculateTimeDifference(pauseStartTime.value, currentTime)
    }

    timerSeconds.value = Math.max(0, totalElapsedSeconds - effectivePausedSeconds)
  }

  function updatePauseDuration() {
    timeSincePause.value = getTimeSincePause(pauseStartTime.value)
  }

  // Interval management with cleanup
  const { pause: pauseMainTimer, resume: resumeMainTimer } = useIntervalFn(
    () => {
      if (actualStartTime.value && !isPaused.value) calculateElapsedTime()
    },
    1000,
    { immediate: false }
  )

  const { pause: pausePauseTimer, resume: resumePauseTimer } = useIntervalFn(updatePauseDuration, 30000, {
    immediateCallback: true,
    immediate: false
  })

  // Watchers
  watch(
    () => props.appointment.treatmentSession,
    (value) => {
      if (!value) return

      actualStartTime.value = value.actualStartTime || null
      pauseStartTime.value = value.pauseStartTime || null
      totalPausedSeconds.value = value.totalPausedSeconds || 0

      if (value.status === 'in_progress' && actualStartTime.value) {
        calculateElapsedTime()
        if (pauseStartTime.value) {
          resumePauseTimer()
        } else {
          resumeMainTimer()
        }
      } else if (value.status !== 'in_progress') {
        timerSeconds.value = 0
        timeSincePause.value = ''
        pauseMainTimer()
        pausePauseTimer()
      }
    },
    { immediate: true }
  )

  watch(isPaused, (paused) => {
    if (paused) {
      pauseMainTimer()
      updatePauseDuration()
      resumePauseTimer()
    } else {
      pausePauseTimer()
      resumeMainTimer()
    }
  })

  // Auto-refresh treatment session data
  const { pause: pauseRefresh } = useIntervalFn(() => {
    if (props.appointment.treatmentSession?.status === 'in_progress') {
      queryCache.invalidateQueries({ key: ['treatment-sessions', props.appointment.treatmentSession.id] })
    }
  }, 30000)

  onUnmounted(pauseRefresh)

  // Actions
  function handlePauseTimer() {
    if (!props.appointment.treatmentSession) return

    treatmentSessionActions.pause({
      sessionId: props.appointment.treatmentSession.id,
      appointmentId: props.appointment.treatmentSession.appointmentId,
      pauseStartTime: getCurrentTimeHHMMSS()
    })
  }

  function handleResumeTimer() {
    if (!props.appointment.treatmentSession?.pauseStartTime) return

    const pauseDurationSeconds = calculateTimeDifference(
      props.appointment.treatmentSession.pauseStartTime,
      getCurrentTimeHHMMSS()
    )

    treatmentSessionActions.resume({
      sessionId: props.appointment.treatmentSession.id,
      appointmentId: props.appointment.treatmentSession.appointmentId,
      pauseDurationSeconds
    })
  }

  function handleExtendFiveMinutes() {
    if (!props.appointment.treatmentSession) return

    treatmentSessionActions.extend({
      sessionId: props.appointment.treatmentSession.id,
      appointmentId: props.appointment.treatmentSession.appointmentId,
      extendedDurationMinutes: 5
    })
  }

  async function handleComplete() {
    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur finale',
      description: 'Veuillez indiquer le niveau de douleur du patient après la séance',
      confirmText: 'Enregistrer et terminer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue === null) return

    if (!props.appointment.treatmentSession) return

    const finalDurationSeconds = Math.max(0, timerSeconds.value)

    treatmentSessionActions.end({
      sessionId: props.appointment.treatmentSession.id,
      appointmentId: props.appointment.treatmentSession.appointmentId,
      actualDurationSeconds: finalDurationSeconds,
      tags: props.selectedTags,
      painLevelAfter: evaValue,
      notes: props.sessionNotes
    })
  }

  const togglePause = () => (isPaused.value ? handleResumeTimer() : handlePauseTimer())
</script>

<template>
  <UButton
    v-if="isCompleted"
    color="success"
    size="xl"
    variant="solid"
    block
    class="rounded-xl text-lg font-bold shadow-lg"
    icon="i-hugeicons-checkmark-circle-02"
    disabled
  >
    Séance terminée
  </UButton>

  <UButton
    v-else-if="isInProgress"
    color="neutral"
    size="xl"
    variant="solid"
    block
    class="rounded-xl text-lg font-bold shadow-lg"
    icon="i-hugeicons-checkmark-circle-02"
    @click="handleComplete"
  >
    Terminer la séance
  </UButton>

  <div class="bg-primary relative flex flex-col overflow-hidden rounded-xl text-white shadow-lg">
    <!-- Decorative gradients -->
    <div class="pointer-events-none absolute top-0 right-0 -mt-8 -mr-8 size-40 rounded-full bg-white/30 blur-3xl" />
    <div class="pointer-events-none absolute bottom-0 left-0 -mb-8 -ml-8 size-32 rounded-full bg-black/20 blur-2xl" />

    <!-- Timer display -->
    <div class="relative z-10 flex flex-col items-center p-6 pb-28 text-center">
      <div class="relative mb-1 flex items-center justify-center gap-3">
        <UIcon
          :name="isPaused ? 'i-hugeicons-pause' : 'i-hugeicons-play'"
          :class="{ 'animate-pulse': isPaused }"
          class="absolute left-0 -ml-14 size-12"
        />
        <div class="text-right text-[48px] leading-none font-bold tracking-tight slashed-zero tabular-nums">
          {{ remainingLabel || '00:00' }}
        </div>
      </div>

      <div class="text-primary-100 mb-2 text-lg font-medium">
        {{ isPaused && timeSincePause ? `En pause depuis ${timeSincePause}` : 'restant' }}
      </div>

      <div
        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-right text-sm text-white/90 slashed-zero tabular-nums shadow-sm backdrop-blur-sm"
      >
        Écoulé : {{ formatSecondsAsHHMMSS(timerSeconds) }}
      </div>
    </div>

    <!-- Action buttons -->
    <div class="absolute right-3 bottom-3 left-3 z-20">
      <div v-if="showFiveMinuteWarning" class="bg-elevated border-warning rounded-lg border-l-4 p-3 shadow-xl">
        <div class="text-default mb-3 flex items-start gap-3">
          <UIcon name="i-hugeicons-alert-circle" class="text-lg select-none" />
          <div class="flex-1">
            <p class="text-sm leading-tight font-bold">5 minutes restantes</p>
            <p class="text-muted mt-0.5 text-xs">La séance se termine bientôt</p>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            variant="solid"
            color="neutral"
            size="sm"
            :loading="isPaused ? isResuming : isPausing"
            :disabled="isResuming || isPausing"
            class="flex-1 justify-center font-bold"
            :icon="isPaused ? 'i-hugeicons-play-circle' : 'i-hugeicons-pause-circle'"
            @click="togglePause"
          >
            {{ isPaused ? 'Reprendre' : 'Pause' }}
          </UButton>

          <UButton
            variant="outline"
            color="neutral"
            size="xs"
            class="flex-1 justify-center font-bold"
            @click="handleExtendFiveMinutes"
          >
            Prolonger de 5 min
          </UButton>
        </div>
      </div>

      <div v-else-if="isInProgress && actualStartTime" class="flex gap-2">
        <UButton
          variant="solid"
          color="neutral"
          size="sm"
          :loading="isPaused ? isResuming : isPausing"
          :disabled="isResuming || isPausing"
          class="flex-1 justify-center font-bold"
          :icon="isPaused ? 'i-hugeicons-play-circle' : 'i-hugeicons-pause-circle'"
          @click="togglePause"
        >
          {{ isPaused ? 'Reprendre' : 'Pause' }}
        </UButton>
      </div>
    </div>
  </div>
</template>
