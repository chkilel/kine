<script setup lang="ts">
  import { LazyAppModalEVA } from '#components'

  const props = defineProps<{
    treatmentSession?: TreatmentSession | null
    appointment: AppointmentWithSession
  }>()

  const emit = defineEmits<{
    complete: []
    close: []
  }>()

  const treatmentSessionActions = useTreatmentSessionActions()
  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)
  const queryCache = useQueryCache()

  // ─── Timer state (derived from treatment session) ──────────────────────────
  const timerSeconds = ref(0)
  const actualStartTime = ref<string | null>(null)
  const pauseStartTime = ref<string | null>(null)
  const totalPausedSeconds = ref(0)
  const timeSincePause = ref('')

  // ─── Derived state ─────────────────────────────────────────────────────────
  const session = computed(() => props.appointment.treatmentSession)

  const isPaused = computed(() => pauseStartTime.value !== null)

  const sessionStatus = computed(() => session.value?.status)
  const isInProgress = computed(() => sessionStatus.value === 'in_progress')
  const isFinished = computed(() => sessionStatus.value === 'finished')
  const isCompleted = computed(() => sessionStatus.value === 'completed')
  const isEnded = computed(() => isFinished.value || isCompleted.value)

  // All actions share a single useMutation instance, so isLoading alone can't
  // distinguish which action is in flight. Track it explicitly instead.
  const pendingAction = ref<'pause' | 'resume' | null>(null)

  watch(
    () => treatmentSessionActions.isLoading.value,
    (loading) => {
      if (!loading) pendingAction.value = null
    }
  )

  const isPausing = computed(() => pendingAction.value === 'pause' && treatmentSessionActions.isLoading.value)
  const isResuming = computed(() => pendingAction.value === 'resume' && treatmentSessionActions.isLoading.value)

  const consultationDurationSeconds = computed(() => {
    const base = props.appointment.duration ?? 0
    const extended = session.value?.extendedDurationMinutes ?? 0
    return (base + extended) * 60
  })

  const remainingSeconds = computed(() =>
    consultationDurationSeconds.value ? Math.max(consultationDurationSeconds.value - timerSeconds.value, 0) : 0
  )

  const remainingLabel = computed(() =>
    consultationDurationSeconds.value ? formatSecondsAsHHMMSS(remainingSeconds.value) : ''
  )

  const progressPercent = computed(() => {
    if (!consultationDurationSeconds.value) return 0
    return Math.min((timerSeconds.value / consultationDurationSeconds.value) * 100, 100)
  })

  const showFiveMinuteWarning = computed(
    () =>
      isInProgress.value &&
      consultationDurationSeconds.value > 0 &&
      remainingSeconds.value > 0 &&
      remainingSeconds.value <= 300
  )

  // ─── Timer calculations ────────────────────────────────────────────────────
  function calculateElapsedTime() {
    if (!actualStartTime.value) {
      timerSeconds.value = 0
      return
    }

    const now = getCurrentTimeHHMMSS()
    const totalElapsed = calculateTimeDifference(actualStartTime.value, now)
    const currentPause = pauseStartTime.value ? calculateTimeDifference(pauseStartTime.value, now) : 0

    timerSeconds.value = Math.max(0, totalElapsed - totalPausedSeconds.value - currentPause)
  }

  function updatePauseDuration() {
    timeSincePause.value = getTimeSincePause(pauseStartTime.value)
  }

  // ─── Interval management ───────────────────────────────────────────────────
  const { pause: stopMainTimer, resume: startMainTimer } = useIntervalFn(
    () => {
      if (actualStartTime.value && !isPaused.value) calculateElapsedTime()
    },
    1000,
    { immediate: false }
  )

  const { pause: stopPauseTimer, resume: startPauseTimer } = useIntervalFn(updatePauseDuration, 30_000, {
    immediateCallback: true,
    immediate: false
  })

  // Auto-refresh session data every 30s
  const { pause: stopRefresh } = useIntervalFn(() => {
    if (session.value?.status === 'in_progress') {
      queryCache.invalidateQueries({ key: ['treatment-sessions', session.value.id] })
    }
  }, 30_000)

  onUnmounted(stopRefresh)

  // ─── Sync local timer state from session prop ──────────────────────────────
  watch(
    session,
    (value) => {
      if (!value) return

      actualStartTime.value = value.actualStartTime ?? null
      pauseStartTime.value = value.pauseStartTime ?? null
      totalPausedSeconds.value = value.totalPausedSeconds ?? 0

      if (value.status === 'in_progress' && actualStartTime.value) {
        calculateElapsedTime()
        if (pauseStartTime.value) {
          stopMainTimer()
          updatePauseDuration()
          startPauseTimer()
        } else {
          stopPauseTimer()
          startMainTimer()
        }
      } else {
        timerSeconds.value = 0
        timeSincePause.value = ''
        stopMainTimer()
        stopPauseTimer()
      }
    },
    { immediate: true }
  )

  // Sync timer intervals when pause state changes locally
  watch(isPaused, (paused) => {
    if (paused) {
      stopMainTimer()
      updatePauseDuration()
      startPauseTimer()
    } else {
      stopPauseTimer()
      startMainTimer()
    }
  })

  // ─── Actions ───────────────────────────────────────────────────────────────
  function handlePauseTimer() {
    if (!session.value) return
    pendingAction.value = 'pause'
    treatmentSessionActions.pause({
      sessionId: session.value.id,
      appointmentId: session.value.appointmentId,
      pauseStartTime: getCurrentTimeHHMMSS()
    })
  }

  function handleResumeTimer() {
    if (!session.value?.pauseStartTime) return
    pendingAction.value = 'resume'
    const pauseDurationSeconds = calculateTimeDifference(session.value.pauseStartTime, getCurrentTimeHHMMSS())
    treatmentSessionActions.resume({
      sessionId: session.value.id,
      appointmentId: session.value.appointmentId,
      pauseDurationSeconds
    })
  }

  function handleExtendFiveMinutes() {
    if (!session.value) return
    treatmentSessionActions.extend({
      sessionId: session.value.id,
      appointmentId: session.value.appointmentId,
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

    if (evaValue === null || !session.value) return

    treatmentSessionActions.end({
      sessionId: session.value.id,
      appointmentId: session.value.appointmentId,
      actualDurationSeconds: Math.max(0, timerSeconds.value),
      painLevelAfter: evaValue
    })
  }

  function togglePause() {
    isPaused.value ? handleResumeTimer() : handlePauseTimer()
  }

  // ─── SVG progress ring ─────────────────────────────────────────────────────
  const RING_RADIUS = 54
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

  const ringDashoffset = computed(() => RING_CIRCUMFERENCE * (1 - progressPercent.value / 100))
</script>

<template>
  <!-- Ended state -->
  <UButton
    v-if="isEnded"
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

  <!-- Active session -->
  <template v-else-if="isInProgress">
    <!-- Complete button -->
    <UButton
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

    <!-- Timer card -->
    <div class="bg-primary relative flex flex-col overflow-hidden rounded-xl text-white shadow-lg">
      <!-- Ambient gradients -->
      <div class="pointer-events-none absolute top-0 right-0 -mt-8 -mr-8 size-40 rounded-full bg-white/30 blur-3xl" />
      <div class="pointer-events-none absolute bottom-0 left-0 -mb-8 -ml-8 size-32 rounded-full bg-black/20 blur-2xl" />

      <!-- Timer display -->
      <div class="relative z-10 flex flex-col items-center px-6 pt-6 pb-28 text-center">
        <!-- Progress ring + time -->
        <div class="relative mb-4 flex items-center justify-center">
          <!-- SVG ring (only shown when duration is known) -->
          <svg
            v-if="consultationDurationSeconds"
            class="absolute -rotate-90"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            aria-hidden="true"
          >
            <!-- Track -->
            <circle cx="64" cy="64" :r="RING_RADIUS" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4" />
            <!-- Progress -->
            <circle
              cx="64"
              cy="64"
              :r="RING_RADIUS"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              stroke-width="4"
              stroke-linecap="round"
              :stroke-dasharray="RING_CIRCUMFERENCE"
              :stroke-dashoffset="ringDashoffset"
              class="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>

          <!-- Pause icon (centered in ring) -->
          <div class="relative flex size-28 flex-col items-center justify-center gap-1">
            <UIcon
              :name="isPaused ? 'i-hugeicons-pause' : 'i-hugeicons-play'"
              :class="{ 'animate-pulse': isPaused }"
              class="size-6 opacity-70"
            />
            <!-- Remaining time -->
            <div class="text-[32px] leading-none font-bold tracking-tight slashed-zero tabular-nums">
              {{ remainingLabel || '00:00' }}
            </div>
          </div>
        </div>

        <!-- Status label -->
        <div class="text-primary-100 mb-3 text-base font-medium">
          {{ isPaused && timeSincePause ? `En pause depuis ${timeSincePause}` : 'restant' }}
        </div>

        <!-- Elapsed badge -->
        <div
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-sm text-white/90 slashed-zero tabular-nums shadow-sm backdrop-blur-sm"
        >
          Écoulé&nbsp;: {{ formatSecondsAsHHMMSS(timerSeconds) }}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="absolute right-3 bottom-3 left-3 z-20">
        <!-- 5-minute warning panel -->
        <div v-if="showFiveMinuteWarning" class="bg-elevated border-warning rounded-lg border-l-4 p-3 shadow-xl">
          <div class="text-default mb-3 flex items-start gap-3">
            <UIcon name="i-hugeicons-alert-circle" class="mt-0.5 shrink-0 text-lg" />
            <div class="min-w-0">
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
              :disabled="isPausing || isResuming"
              :icon="isPaused ? 'i-hugeicons-play-circle' : 'i-hugeicons-pause-circle'"
              class="flex-1 justify-center font-bold"
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

        <!-- Normal pause/resume button -->
        <div v-else-if="actualStartTime" class="flex gap-2">
          <UButton
            variant="solid"
            color="neutral"
            size="sm"
            :loading="isPaused ? isResuming : isPausing"
            :disabled="isPausing || isResuming"
            :icon="isPaused ? 'i-hugeicons-play-circle' : 'i-hugeicons-pause-circle'"
            class="flex-1 justify-center font-bold"
            @click="togglePause"
          >
            {{ isPaused ? 'Reprendre' : 'Pause' }}
          </UButton>
        </div>
      </div>
    </div>
  </template>
</template>
