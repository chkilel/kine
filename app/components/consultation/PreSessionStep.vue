<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    consultation: Consultation
  }>()

  const emit = defineEmits<{
    startSession: []
  }>()

  const consultationAction = useConsultationAction()

  const painLevelBefore = ref<number | undefined>(undefined)
  const evaValidated = ref<boolean>(false)
  const evaEnabled = ref<boolean>(true)

  const isAlreadyInProgress = computed(() => props.consultation.status === 'in_progress')
  const canStartSession = computed(() => (evaValidated.value || evaEnabled.value) && !isAlreadyInProgress.value)

  const consultationDurationSeconds = computed(() => {
    if (!props.consultation?.duration) return 0
    return (props.consultation.duration + (props.consultation.extendedDurationMinutes || 0)) * 60
  })

  const timeLabel = computed(() => {
    if (!consultationDurationSeconds.value) return ''
    return formatSecondsAsHHMMSS(consultationDurationSeconds.value)
  })

  watch(
    () => props.consultation,
    (value) => {
      if (!value) return

      painLevelBefore.value = value.painLevelBefore ?? undefined
      evaValidated.value =
        ['in_progress', 'completed'].includes(value.status) ||
        (value.painLevelBefore !== null && value.painLevelBefore !== undefined)

      evaEnabled.value = value.painLevelBefore === null
    },
    { immediate: true }
  )

  watch(evaEnabled, (newValue) => {
    if (newValue) {
      painLevelBefore.value = 0
    } else {
      painLevelBefore.value = undefined
    }
  })

  async function handleStartSession() {
    try {
      await consultationAction.startAsync({
        id: props.consultation.id,
        actualStartTime: getCurrentTimeHHMMSS()
      })
      emit('startSession')
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }
</script>

<template>
  <UAlert
    v-if="isAlreadyInProgress"
    icon="i-hugeicons-alert-circle"
    color="warning"
    variant="subtle"
    class="mb-6"
    :ui="{
      description: 'text-sm font-medium',
      icon: 'size-5'
    }"
  >
    <template #title>Cette séance est déjà en cours. Allez à l'étape "En cours" pour continuer.</template>
  </UAlert>

  <div class="grid gap-6 lg:grid-cols-9">
    <div class="lg:col-span-6">
      <ConsultationEvaCard
        v-model:pain-level-before="painLevelBefore"
        v-model:eva-validated="evaValidated"
        v-model:eva-enabled="evaEnabled"
        :disabled="isAlreadyInProgress"
      />
    </div>

    <div class="lg:col-span-3">
      <UCard :ui="{ body: 'p-6' }">
        <p class="text-muted mb-4 text-center text-[10px] font-bold tracking-wider uppercase">Durée prévue</p>

        <div class="mb-6 flex gap-2 px-0 py-2">
          <div class="flex flex-1 basis-0 flex-col items-center gap-1">
            <div class="bg-muted flex h-12 w-full items-center justify-center rounded-lg opacity-40">
              <p class="text-muted text-xl font-bold tracking-tighter">
                {{ timeLabel.split(':')[0] }}
              </p>
            </div>
            <p class="text-muted text-[10px] font-bold uppercase">Heures</p>
          </div>
          <div class="flex flex-1 basis-0 flex-col items-center gap-1">
            <div class="bg-muted flex h-12 w-full items-center justify-center rounded-lg opacity-40">
              <p class="text-muted text-xl font-bold tracking-tighter">
                {{ timeLabel.split(':')[1] }}
              </p>
            </div>
            <p class="text-muted text-[10px] font-bold uppercase">Min</p>
          </div>
          <div class="flex flex-1 basis-0 flex-col items-center gap-1">
            <div class="bg-muted flex h-12 w-full items-center justify-center rounded-lg opacity-40">
              <p class="text-muted text-xl font-bold tracking-tighter">
                {{ timeLabel.split(':')[2] }}
              </p>
            </div>
            <p class="text-muted text-[10px] font-bold uppercase">Sec</p>
          </div>
        </div>

        <UButton
          v-if="!canStartSession"
          color="neutral"
          variant="solid"
          size="lg"
          block
          disabled
          class="font-bold"
          icon="i-hugeicons-play-circle-02"
        >
          Démarrer la séance
        </UButton>

        <UButton
          v-else
          color="success"
          size="xl"
          variant="solid"
          block
          class="rounded-xl text-lg font-bold shadow-lg"
          icon="i-hugeicons-play-circle"
          @click="handleStartSession"
        >
          Démarrer la séance
        </UButton>

        <p v-if="!canStartSession && !isAlreadyInProgress" class="text-muted mt-3 text-center text-[10px] italic">
          Débloquez ce bouton en validant l'EVA
        </p>
      </UCard>
    </div>
  </div>
</template>
