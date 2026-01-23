<script setup lang="ts">
  const props = defineProps<{
    patientId: string
    consultationId: string
  }>()

  const emit = defineEmits<{
    close: []
    complete: []
    pause: []
    stop: []
  }>()

  const { data: patient } = usePatientById(() => props.patientId)
  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patientId)
  const { data: allConsultations } = useConsultationsList(() => props.patientId)
  const { data: consultation, isPending: consultationLoading } = useConsultation(
    () => props.patientId,
    () => props.consultationId
  )
  const queryCache = useQueryCache()

  let syncInterval: ReturnType<typeof setInterval> | null = null
  let timerId: ReturnType<typeof setInterval> | null = null

  const painLevelBefore = ref<number>(0)
  const painLevelAfter = ref<number | undefined>(undefined)
  const consultationNotes = ref('')
  const selectedTags = ref<string[]>([])

  const timerSeconds = ref(0)
  const isPaused = ref(false)

  const actualStartTime = ref<string | null>(null)
  const pauseStartTime = ref<string | null>(null)
  const totalPausedSeconds = ref(0)
  const actualDurationSeconds = ref(0)

  watch(
    consultation,
    (value) => {
      if (!value) return
      painLevelBefore.value = value.painLevelBefore ?? 0
      painLevelAfter.value = value.painLevelAfter ?? undefined
      consultationNotes.value = value.notes || ''

      if (value.tags) {
        try {
          selectedTags.value = JSON.parse(value.tags)
        } catch (e) {
          selectedTags.value = []
        }
      } else {
        selectedTags.value = []
      }

      actualStartTime.value = value.actualStartTime || null
      pauseStartTime.value = value.pauseStartTime || null
      totalPausedSeconds.value = value.totalPausedSeconds || 0
      actualDurationSeconds.value = value.actualDurationSeconds || 0

      if (value.status === 'in_progress' && actualStartTime.value) {
        calculateElapsedTime()
        startTimer()
      } else if (value.status !== 'in_progress') {
        timerSeconds.value = 0
        if (timerId) {
          clearInterval(timerId)
          timerId = null
        }
      }
    },
    { immediate: true }
  )

  function calculateElapsedTime() {
    if (!actualStartTime.value) {
      timerSeconds.value = 0
      return
    }

    const currentTime = getCurrentTimeHHMMSS()
    const totalElapsedSeconds = calculateTimeDifference(actualStartTime.value, currentTime)

    timerSeconds.value = Math.max(0, totalElapsedSeconds - totalPausedSeconds.value)
  }

  async function toggleTag(tag: string) {
    if (!consultation.value) return

    const previousTags = [...selectedTags.value]

    if (selectedTags.value.includes(tag)) {
      selectedTags.value = selectedTags.value.filter((t) => t !== tag)
    } else {
      selectedTags.value = [...selectedTags.value, tag]
    }

    try {
      await consultationAction.updateTagsAsync({
        id: consultation.value.id,
        patientId: props.patientId,
        tags: selectedTags.value
      })
    } catch (error) {
      console.error('Failed to save tags:', error)
      selectedTags.value = previousTags
    }
  }

  function startTimer() {
    if (timerId) return
    isPaused.value = false
    timerId = setInterval(() => {
      if (!isPaused.value && actualStartTime.value) {
        calculateElapsedTime()
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  })

  const previousConsultations = computed(() => {
    const list = allConsultations.value
    const currentConsultation = consultation.value
    if (!list || !currentConsultation) return []
    return list
      .filter((c) => c.id !== currentConsultation.id && c.date <= currentConsultation.date)
      .slice(-5)
      .reverse()
  })

  const relatedTreatmentPlan = computed(() => {
    if (!treatmentPlans.value || !consultation.value?.treatmentPlanId) return null
    return treatmentPlans.value.find((plan) => plan.id === consultation.value?.treatmentPlanId) || null
  })

  const completedSessionsCount = computed(() => {
    if (!allConsultations.value || !consultation.value) return 0
    const planId = consultation.value.treatmentPlanId
    if (!planId) return 0
    return allConsultations.value.filter((c) => c.treatmentPlanId === planId && c.status === 'completed').length
  })

  const totalSessionsCount = computed(() => {
    if (!relatedTreatmentPlan.value) return 0
    return relatedTreatmentPlan.value.numberOfSessions || 0
  })

  const progressPercentage = computed(() => {
    if (!totalSessionsCount.value) return 0
    return Math.min(Math.round((completedSessionsCount.value / totalSessionsCount.value) * 100), 100)
  })

  const headerTitle = computed(() => {
    if (!patient.value) return 'Séance active'
    return `${patient.value.firstName} ${patient.value.lastName}`
  })

  const headerDescription = computed(() => {
    if (!consultation.value) return ''
    const typeLabel = getConsultationTypeLabel(consultation.value.type || 'follow_up')
    const durationLabel = consultation.value.duration ? `${consultation.value.duration} min` : ''
    return [typeLabel, durationLabel].filter(Boolean).join(' • ')
  })

  const timeSincePause = computed(() => {
    return getTimeSincePause(pauseStartTime.value)
  })

  onMounted(() => {
    syncInterval = setInterval(() => {
      if (consultation.value && consultation.value.status === 'in_progress') {
        queryCache.invalidateQueries({ key: ['consultations', props.patientId, props.consultationId] })
      }
    }, 30000)
  })
</script>

<template>
  <USlideover
    :dismissible="false"
    :title="headerTitle"
    :description="headerDescription"
    :ui="{
      content: 'w-full max-w-[1500px] bg-elevated'
    }"
    @close="emit('close')"
  >
    <template #body>
      <div v-if="consultationLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>
      <div v-else class="grid h-full gap-6 lg:grid-cols-12">
        <aside class="flex flex-col gap-4 lg:col-span-3">
          <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <div class="flex flex-col items-center p-6">
              <div class="bg-primary-50 mb-4 size-28 rounded-full p-2">
                <UAvatar :alt="patient ? formatFullName(patient) : ''" class="h-full w-full" size="3xl" />
              </div>
              <div class="text-center">
                <h2 class="text-xl font-extrabold">
                  {{ patient ? formatFullName(patient) : 'Patient' }}
                </h2>
                <p v-if="patient?.dateOfBirth" class="text-muted mt-1 text-sm font-semibold">
                  {{ calculateAge(patient.dateOfBirth) }} ans • {{ getGenderLabel(patient.gender) }}
                </p>
              </div>
            </div>
            <div class="border-default border-t px-6 pt-6 pb-6">
              <div v-if="relatedTreatmentPlan" class="mb-5">
                <p class="text-muted mb-3 text-[10px] font-extrabold tracking-widest uppercase">Diagnostic Principal</p>
                <UAlert
                  :title="relatedTreatmentPlan.title"
                  :description="relatedTreatmentPlan.diagnosis"
                  icon="i-hugeicons-healtcare"
                  variant="subtle"
                  :ui="{
                    title: 'text-sm leading-snug font-bold text-default',
                    description: 'text-sm opacity-90',
                    icon: 'size-6'
                  }"
                />
              </div>
              <div
                v-if="
                  patient?.allergies?.length ||
                  patient?.medicalConditions?.length ||
                  patient?.surgeries?.length ||
                  patient?.medications?.length
                "
              >
                <p class="text-muted mb-3 text-[10px] font-extrabold tracking-widest uppercase">Alertes Médicales</p>

                <div class="space-y-3">
                  <UAlert
                    v-if="patient?.allergies?.length"
                    title="Allergie"
                    :description="patient.allergies.join(', ')"
                    icon="i-hugeicons-alert-01"
                    color="error"
                    variant="subtle"
                    :ui="{
                      title: 'text-sm leading-snug font-bold text-error-700',
                      description: 'text-sm opacity-90',
                      icon: 'size-6'
                    }"
                  />

                  <UAlert
                    v-if="patient?.medicalConditions?.length"
                    title="Antécédents médicaux"
                    :description="patient.medicalConditions.join(', ')"
                    icon="i-hugeicons-medical-file"
                    color="warning"
                    variant="subtle"
                    :ui="{
                      title: 'text-sm leading-snug font-bold text-warning-600',
                      description: 'text-sm opacity-90',
                      icon: 'size-6'
                    }"
                  />

                  <UAlert
                    v-if="patient?.surgeries?.length"
                    title="Chirurgies"
                    :description="patient.surgeries.join(', ')"
                    icon="i-hugeicons-hospital"
                    color="info"
                    variant="subtle"
                    :ui="{
                      title: 'text-sm leading-snug font-bold text-info-800',
                      description: 'text-sm opacity-90',
                      icon: 'size-6'
                    }"
                  />

                  <UAlert
                    v-if="patient?.medications?.length"
                    title="Médicaments"
                    :description="patient.medications.join(', ')"
                    icon="i-hugeicons-give-pill"
                    color="neutral"
                    variant="subtle"
                    :ui="{
                      title: 'text-sm leading-snug font-bold text-neutral-700',
                      description: 'text-sm opacity-90',
                      icon: 'size-6'
                    }"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'flex items-center justify-between p-4' }">
            <div>
              <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Progression</p>
              <p class="text-lg font-bold">{{ progressPercentage }}%</p>
            </div>
            <div class="bg-border h-8 w-px"></div>
            <div>
              <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Séances</p>
              <p class="text-lg font-bold">{{ completedSessionsCount }}/{{ totalSessionsCount }}</p>
            </div>
            <div class="bg-border h-8 w-px"></div>
            <div>
              <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Dernière EVA</p>
              <p class="text-lg font-bold">
                {{ painLevelBefore !== null ? `${painLevelBefore}/10` : '-' }}
              </p>
            </div>
          </UCard>
        </aside>

        <div class="flex flex-col gap-4 lg:col-span-6">
          <UCard>
            <div class="mb-6 flex items-center justify-between">
              <h3 class="flex items-center gap-2 text-base font-bold">
                <UIcon name="i-hugeicons-straight-edge" class="text-primary text-xl" />
                Niveau de Douleur (EVA)
              </h3>
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  <span class="size-2 rounded-full bg-green-500"></span>
                  Aucun
                </span>
                <span class="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  <span class="size-2 rounded-full bg-red-600"></span>
                  Intense
                </span>
                <UBadge variant="subtle" size="xs" class="ml-2">Aujourd'hui</UBadge>
              </div>
            </div>
            <div class="flex justify-between text-sm">
              <span
                v-for="(item, index) in [...Array(11).keys()]"
                :key="index"
                :class="[
                  'inline-flex w-[2ch] justify-center border-t-3 p-0.5 tabular-nums transition-all',
                  painLevelBefore === item ? 'text-error border-error font-bold' : 'border-transparent'
                ]"
              >
                {{ item.toFixed(0).padStart(2, ' ') }}
              </span>
            </div>
            <USlider
              v-model="painLevelBefore"
              :min="0"
              :max="10"
              :step="1"
              :ui="{
                root: 'w-full flex-1 mt-2',
                track: 'bg-gradient-to-r from-green-600 via-yellow-400 to-red-500',
                range: 'bg-transparent',
                thumb: 'bg-error ring-error focus-visible:outline-error/50'
              }"
              class="w-full flex-1"
            />
          </UCard>

          <UCard :ui="{ body: 'p-0 sm:p-0 flex flex-col space-y-2 overflow-hidden' }">
            <div class="border-default bg-muted-50 flex items-center gap-1 border-b p-2">
              <UButton icon="i-hugeicons-text-bold" variant="ghost" color="neutral" size="xs" square />
              <UButton icon="i-hugeicons-text-italic" variant="ghost" color="neutral" size="xs" square />
              <UButton icon="i-hugeicons-text-underline" variant="ghost" color="neutral" size="xs" square />
              <div class="bg-border mx-2 h-6 w-px"></div>
              <UButton icon="i-hugeicons-check-list" variant="ghost" color="neutral" size="xs" square />
              <UButton icon="i-hugeicons-left-to-right-list-number" variant="ghost" color="neutral" size="xs" square />
              <div class="flex-1"></div>
              <div class="text-muted flex items-center gap-1 text-xs">
                <UIcon name="i-hugeicons-cloud-saving-done-01" class="size-4" />
                Sauvegardé
              </div>
            </div>
            <UTextarea
              v-model="consultationNotes"
              :rows="12"
              placeholder="Notes de la séance... Décrivez les exercices effectués, les réactions du patient et les progrès observés."
              class="border-none bg-transparent focus:ring-0"
              :ui="{ root: 'flex-1 h-full' }"
            />
            <div class="border-default bg-muted-50/50 dark:bg-muted-900/30 border-t p-4">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-muted text-xs font-bold tracking-wider uppercase">Smart Tags</p>
                <UButton variant="ghost" color="primary" size="xs">Gérer les tags</UButton>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="tag in [
                    'Douleur Diminuée',
                    'Gain Amplitude',
                    'Proprioception',
                    'Cryothérapie',
                    'Renforcement'
                  ]"
                  :key="tag"
                  :icon="selectedTags.includes(tag) ? 'i-hugeicons-checkmark-circle-01' : 'i-hugeicons-add-01'"
                  :variant="selectedTags.includes(tag) ? 'solid' : 'outline'"
                  :color="selectedTags.includes(tag) ? 'primary' : 'neutral'"
                  size="xs"
                  @click="toggleTag(tag)"
                >
                  {{ tag }}
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <div class="flex h-full flex-col gap-4 lg:col-span-3">
          <ConsultationTimerCard
            v-if="consultation"
            :consultation="consultation"
            :timer-seconds="timerSeconds"
            :time-since-pause="timeSincePause"
            :actual-start-time="actualStartTime"
            :total-paused-seconds="totalPausedSeconds"
            :selected-tags="selectedTags"
            :pain-level-after="painLevelAfter"
            :consultation-notes="consultationNotes"
            @complete="emit('complete')"
            @close="emit('close')"
          />

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
                <div v-if="previousConsultations.length" class="space-y-5 pt-3">
                  <div v-for="previous in previousConsultations" :key="previous.id">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-sm font-bold">{{ formatFrenchDate(previous.date) }}</span>
                      <span
                        v-if="previous.painLevelBefore !== null"
                        class="text-muted bg-muted-100 dark:bg-muted-800 rounded px-2 py-0.5 text-xs"
                      >
                        EVA {{ previous.painLevelBefore }}/10
                      </span>
                    </div>
                    <p class="text-muted line-clamp-3 text-sm leading-relaxed">
                      {{ previous.notes || 'Aucune note enregistrée pour cette séance.' }}
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
