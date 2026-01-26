<script setup lang="ts">
  import { LazyAppModalConfirm } from '#components'

  const props = defineProps<{
    consultation: Consultation
    selectedTags: string[]
    painLevelAfter: number | undefined
    consultationNotes: string
  }>()

  const emit = defineEmits<{
    complete: []
    close: []
  }>()

  const consultationAction = useConsultationAction()
  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)
  const queryCache = useQueryCache()

  // Timer state
  const timerSeconds = ref(0)
  const actualStartTime = ref<string | null>(null)
  const pauseStartTime = ref<string | null>(null)
  const totalPausedSeconds = ref(0)
  const timeSincePause = ref('')

  // Loading states
  const isPausing = ref(false)
  const isResuming = ref(false)

  // Computed
  const isPaused = computed(() => pauseStartTime.value !== null)

  const consultationDurationSeconds = computed(() => {
    if (!props.consultation?.duration) return 0
    return (props.consultation.duration + (props.consultation.extendedDurationMinutes || 0)) * 60
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
      props.consultation.status === 'in_progress' &&
      consultationDurationSeconds.value > 0 &&
      remainingSeconds.value > 0 &&
      remainingSeconds.value <= 300
    )
  })

  const isInProgress = computed(() => props.consultation.status === 'in_progress')
  const isScheduled = computed(() => ['scheduled', 'confirmed'].includes(props.consultation.status))

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
  const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
    () => {
      if (actualStartTime.value && !isPaused.value) {
        calculateElapsedTime()
      }
    },
    1000,
    { immediate: false }
  )

  const { pause: pausePauseTimer, resume: resumePauseTimer } = useIntervalFn(updatePauseDuration, 30000, {
    immediate: false
  })

  // Watchers
  watch(
    () => props.consultation,
    (value) => {
      if (!value) return

      actualStartTime.value = value.actualStartTime || null
      pauseStartTime.value = value.pauseStartTime || null
      totalPausedSeconds.value = value.totalPausedSeconds || 0

      if (value.status === 'in_progress' && actualStartTime.value) {
        calculateElapsedTime()
        resumeTimer()
        if (pauseStartTime.value) {
          resumePauseTimer()
        }
      } else if (value.status !== 'in_progress') {
        timerSeconds.value = 0
        timeSincePause.value = ''
        pauseTimer()
        pausePauseTimer()
      }
    },
    { immediate: true }
  )

  watch(isPaused, (paused) => {
    if (paused) {
      pauseTimer()
      updatePauseDuration()
      resumePauseTimer()
    } else {
      pausePauseTimer()
      resumeTimer()
    }
  })

  // Auto-refresh consultation data
  const { pause: pauseRefresh } = useIntervalFn(() => {
    if (props.consultation?.status === 'in_progress') {
      queryCache.invalidateQueries({ key: ['consultations', props.consultation.id] })
    }
  }, 30000)

  onUnmounted(pauseRefresh)

  // Actions
  async function startSession() {
    try {
      await consultationAction.startAsync({
        id: props.consultation.id,
        actualStartTime: getCurrentTimeHHMMSS()
      })
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  async function handlePauseTimer() {
    if (isPausing.value) return

    isPausing.value = true
    try {
      await consultationAction.pauseAsync({
        id: props.consultation.id,
        pauseStartTime: getCurrentTimeHHMMSS()
      })
    } catch (error) {
      console.error('Failed to pause session:', error)
    } finally {
      isPausing.value = false
    }
  }

  async function handleResumeTimer() {
    if (!props.consultation.pauseStartTime || isResuming.value) return

    isResuming.value = true
    try {
      const pauseDurationSeconds = calculateTimeDifference(props.consultation.pauseStartTime, getCurrentTimeHHMMSS())

      await consultationAction.resumeAsync({
        id: props.consultation.id,
        pauseDurationSeconds
      })
    } catch (error) {
      console.error('Failed to resume session:', error)
    } finally {
      isResuming.value = false
    }
  }

  async function handleExtendFiveMinutes() {
    try {
      await consultationAction.extendAsync({
        id: props.consultation.id,
        extendedDurationMinutes: 5
      })
    } catch (error) {
      console.error('Failed to extend session:', error)
    }
  }

  async function endSession() {
    const finalDurationSeconds = Math.max(0, timerSeconds.value + totalPausedSeconds.value)

    try {
      await consultationAction.endAsync({
        id: props.consultation.id,
        actualDurationSeconds: finalDurationSeconds,
        tags: props.selectedTags,
        painLevelAfter: props.painLevelAfter,
        notes: props.consultationNotes
      })

      emit('complete')
      emit('close')
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  async function handleComplete() {
    const confirmed = await confirmModal.open({
      title: 'Terminer la consultation',
      message: 'Confirmer la fin de la séance et enregistrer les données ?',
      confirmText: 'Terminer',
      cancelText: 'Annuler',
      confirmColor: 'success',
      icon: 'i-hugeicons-checkmark-circle-01'
    })

    if (confirmed) await endSession()
  }

  const togglePause = () => (isPaused.value ? handleResumeTimer() : handlePauseTimer())
</script>

<template>
  <UButton
    v-if="isScheduled"
    color="success"
    size="xl"
    variant="solid"
    block
    class="rounded-xl text-lg font-bold shadow-lg"
    icon="i-hugeicons-play-circle"
    @click="startSession"
  >
    <span>Démarrer la séance</span>
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
    <span>Terminer la séance</span>
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
