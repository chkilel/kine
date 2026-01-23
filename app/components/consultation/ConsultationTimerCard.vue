<script setup lang="ts">
  import { LazyAppModalConfirm } from '#components'

  const props = defineProps<{
    consultation: Consultation
    timerSeconds: number
    timeSincePause: string | null
    actualStartTime: string | null
    totalPausedSeconds: number
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

  const isPaused = ref(false)
  const isPausing = ref(false)
  const isResuming = ref(false)
  const extendedDurationSeconds = ref(0)

  watch(
    () => props.consultation.pauseStartTime,
    (value) => {
      isPaused.value = value !== null
    },
    { immediate: true }
  )

  const consultationDurationSeconds = computed(() => {
    if (!props.consultation?.duration) return 0
    return props.consultation.duration * 60 + extendedDurationSeconds.value
  })

  const remainingLabel = computed(() => {
    if (!consultationDurationSeconds.value) return ''
    const remaining = Math.max(consultationDurationSeconds.value - props.timerSeconds, 0)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `${minutes}:${paddedSeconds}`
  })

  const remainingSeconds = computed(() => {
    if (!consultationDurationSeconds.value) return 0
    return Math.max(consultationDurationSeconds.value - props.timerSeconds, 0)
  })

  const showFiveMinuteWarning = computed(() => {
    if (props.consultation.status !== 'in_progress') return false
    if (!consultationDurationSeconds.value) return false
    return remainingSeconds.value > 0 && remainingSeconds.value <= 5 * 60
  })

  async function startSession() {
    const actualStartTime = getCurrentTimeHHMMSS()

    try {
      await consultationAction.startAsync({
        id: props.consultation.id,
        actualStartTime
      })
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  async function pauseTimer() {
    const currentTime = getCurrentTimeHHMMSS()

    try {
      await consultationAction.pauseAsync({
        id: props.consultation.id,
        pauseStartTime: currentTime
      })
    } catch (error) {
      console.error('Failed to pause session:', error)
    }
  }

  async function resumeTimer() {
    if (!props.consultation.pauseStartTime) return

    const currentTime = getCurrentTimeHHMMSS()
    const pauseDurationSeconds = calculateTimeDifference(props.consultation.pauseStartTime, currentTime)

    try {
      await consultationAction.resumeAsync({
        id: props.consultation.id,
        pauseDurationSeconds
      })
    } catch (error) {
      console.error('Failed to resume session:', error)
    }
  }

  function handleExtendFiveMinutes() {
    extendedDurationSeconds.value += 5 * 60
  }

  async function endSession() {
    const finalDurationSeconds = Math.max(0, props.timerSeconds + props.totalPausedSeconds)

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

    if (!confirmed) return

    await endSession()
  }
</script>

<template>
  <UButton
    v-if="consultation.status === 'scheduled' || consultation.status === 'confirmed'"
    color="primary"
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
    v-else-if="consultation.status === 'in_progress'"
    color="neutral"
    size="xl"
    variant="solid"
    block
    class="rounded-xl text-lg font-bold shadow-lg"
    icon="i-hugeicons-checkmark-circle-01"
    @click="handleComplete"
  >
    <span>Terminer la séance</span>
  </UButton>
  <div class="bg-primary relative flex flex-col overflow-hidden rounded-xl text-white shadow-lg">
    <div
      class="pointer-events-none absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-black/10 blur-2xl"
    ></div>
    <div class="relative z-10 flex flex-col items-center p-6 pb-28 text-center">
      <div class="mb-1 flex items-center justify-center gap-3">
        <UIcon
          :name="isPaused ? 'i-hugeicons-play-circle' : 'i-hugeicons-pause-circle'"
          :class="isPaused ? '' : 'animate-pulse'"
          class="text-4xl"
        />
        <div class="font-display text-[48px] leading-none font-bold tracking-tight">
          {{ remainingLabel || '00:00' }}
        </div>
      </div>
      <div class="text-primary-100 mb-2 text-lg font-medium">
        {{ isPaused && timeSincePause ? `En pause depuis ${timeSincePause}` : 'restant' }}
      </div>
      <div
        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 font-mono text-sm text-white/90 shadow-sm backdrop-blur-sm"
      >
        <span>Écoulé : {{ formatSecondsAsMMSS(timerSeconds) }}</span>
      </div>
    </div>
    <div class="absolute right-3 bottom-3 left-3 z-20">
      <div v-if="showFiveMinuteWarning" class="bg-elevated border-warning rounded-lg border-l-4 p-3 shadow-xl">
        <div class="mb-3 flex items-start gap-3">
          <span class="text-lg select-none">⚠️</span>
          <div class="flex-1">
            <p class="text-sm leading-tight font-bold">5 minutes restantes</p>
            <p class="text-muted mt-0.5 text-xs">La séance se termine bientôt</p>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton color="success" size="xs" class="flex-1 justify-center font-bold" @click="handleComplete">
            Terminer maintenant
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
      <div v-else-if="consultation.status === 'in_progress' && actualStartTime" class="flex gap-2">
        <UButton
          v-if="isPaused"
          variant="solid"
          color="neutral"
          size="sm"
          :loading="isResuming"
          :disabled="isResuming || isPausing"
          class="flex-1 justify-center font-bold"
          icon="i-hugeicons-play-circle"
          @click="resumeTimer"
        >
          Reprendre
        </UButton>
        <UButton
          v-else
          variant="solid"
          color="neutral"
          size="sm"
          :loading="isPausing"
          :disabled="isResuming || isPausing"
          class="flex-1 justify-center font-bold"
          icon="i-hugeicons-pause-circle"
          @click="pauseTimer"
        >
          Pause
        </UButton>
      </div>
    </div>
  </div>
</template>
