<script setup lang="ts">
  import { LazyAppModalConfirm } from '#components'

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

  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const { data: patient } = usePatientById(() => props.patientId)
  const { data: consultation, isPending: consultationLoading } = useConsultation(
    () => props.patientId,
    () => props.consultationId
  )
  const { data: allConsultations } = useConsultationsList(() => props.patientId)
  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patientId)

  const painLevelBefore = ref<number>(0)
  const painLevelAfter = ref<number | undefined>(undefined)
  const consultationNotes = ref('')

  const timerSeconds = ref(0)
  const isPaused = ref(false)
  const extendedDurationSeconds = ref(0)
  let timerId: ReturnType<typeof setInterval> | null = null

  function getConsultationStartDateTime(item: { date: string; startTime: string }): Date | null {
    if (!item.date || !item.startTime) return null
    const [hourString, minuteString] = item.startTime.split(':')
    const hour = Number.parseInt(hourString || '0', 10)
    const minute = Number.parseInt(minuteString || '0', 10)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null
    const date = new Date(item.date)
    if (Number.isNaN(date.getTime())) return null
    date.setHours(hour, minute, 0, 0)
    return date
  }

  watch(
    consultation,
    (value) => {
      if (!value) return
      painLevelBefore.value = value.painLevelBefore ?? 0
      painLevelAfter.value = value.painLevelAfter ?? undefined
      consultationNotes.value = value.notes || ''

      const startDateTime = getConsultationStartDateTime({ date: value.date, startTime: value.startTime })
      if (startDateTime) {
        const diffSeconds = Math.floor((Date.now() - startDateTime.getTime()) / 1000)
        timerSeconds.value = Math.max(diffSeconds, 0)
      } else {
        timerSeconds.value = 0
      }

      startTimer()
    },
    { immediate: true }
  )

  const consultationDurationSeconds = computed(() => {
    if (!consultation.value?.duration) return 0
    return consultation.value.duration * 60 + extendedDurationSeconds.value
  })

  const elapsedLabel = computed(() => {
    const total = timerSeconds.value
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `${minutes}:${paddedSeconds}`
  })

  const remainingLabel = computed(() => {
    if (!consultationDurationSeconds.value) return ''
    const remaining = Math.max(consultationDurationSeconds.value - timerSeconds.value, 0)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `${minutes}:${paddedSeconds}`
  })

  const remainingSeconds = computed(() => {
    if (!consultationDurationSeconds.value) return 0
    return Math.max(consultationDurationSeconds.value - timerSeconds.value, 0)
  })

  const showFiveMinuteWarning = computed(() => {
    const currentConsultation = consultation.value
    if (!currentConsultation) return false
    if (currentConsultation.status !== 'in_progress') return false
    if (!consultationDurationSeconds.value) return false
    return remainingSeconds.value > 0 && remainingSeconds.value <= 5 * 60
  })

  const timerProgress = computed(() => {
    if (!consultationDurationSeconds.value) return 0
    return Math.min((timerSeconds.value / consultationDurationSeconds.value) * 100, 100)
  })

  function startTimer() {
    if (timerId) return
    isPaused.value = false
    timerId = setInterval(() => {
      if (!isPaused.value) {
        timerSeconds.value += 1
      }
    }, 1000)
  }

  function pauseTimer() {
    isPaused.value = !isPaused.value
    emit('pause')
  }

  function stopTimer() {
    isPaused.value = true
    timerSeconds.value = 0
    emit('stop')
  }

  onUnmounted(() => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
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

  const evaValues = computed(() => Array.from({ length: 11 }, (_, index) => index))

  function getEvaColor(value: number) {
    if (value <= 3) return 'success'
    if (value <= 5) return 'warning'
    if (value <= 7) return 'orange'
    return 'error'
  }

  function getEvaEmoji(value: number) {
    if (value <= 1) return '😄'
    if (value <= 3) return '🙂'
    if (value <= 5) return '😐'
    if (value <= 7) return '😕'
    if (value <= 9) return '😣'
    return '😭'
  }

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

  const { mutate: updateConsultation } = useUpdateConsultation()
  const { mutate: updateStatus } = useUpdateConsultationStatus()

  function handleExtendFiveMinutes() {
    extendedDurationSeconds.value += 5 * 60
  }

  async function handleComplete() {
    if (!consultation.value) return

    const confirmed = await confirmModal.open({
      title: 'Terminer la consultation',
      message: 'Confirmer la fin de la séance et enregistrer les données ?',
      confirmText: 'Terminer',
      cancelText: 'Annuler',
      confirmColor: 'success',
      icon: 'i-hugeicons-checkmark-circle-01'
    })

    if (!confirmed) return

    updateConsultation({
      patientId: consultation.value.patientId,
      consultationId: consultation.value.id,
      consultationData: {
        notes: consultationNotes.value,
        painLevelBefore: painLevelBefore.value ?? undefined,
        painLevelAfter: painLevelAfter.value ?? undefined
      }
    })

    updateStatus({
      patientId: consultation.value.patientId,
      consultationId: consultation.value.id,
      status: 'completed'
    })

    emit('complete')
    emit('close')
  }

  function handleClose() {
    emit('close')
  }
</script>

<template>
  <USlideover
    :dismissible="false"
    :title="headerTitle"
    :description="headerDescription"
    :ui="{
      content: 'w-full max-w-[1500px] bg-elevated'
    }"
    @close="handleClose"
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
                <UIcon name="i-hugeicons-straighten" class="text-primary text-xl" />
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
                  icon="i-hugeicons-add-01"
                  variant="outline"
                  color="neutral"
                  size="xs"
                  @click="consultationNotes = `${consultationNotes} [${tag}] `"
                >
                  {{ tag }}
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <div class="flex h-full flex-col gap-4 lg:col-span-3">
          <UButton
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
                <UIcon name="i-hugeicons-alarm-clock" class="animate-pulse text-4xl" />
                <div class="font-display text-[48px] leading-none font-bold tracking-tight">
                  {{ remainingLabel || '00:00' }}
                </div>
              </div>
              <div class="text-primary-100 mb-5 text-lg font-medium">restant</div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 font-mono text-sm text-white/90 shadow-sm backdrop-blur-sm"
              >
                <span>Écoulé : {{ elapsedLabel }}</span>
              </div>
            </div>
            <div
              v-if="showFiveMinuteWarning"
              class="bg-elevated border-warning absolute right-3 bottom-3 left-3 z-20 rounded-lg border-l-4 p-3 shadow-xl"
            >
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
          </div>

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

<style scoped>
  .eva-0 {
    background-color: rgb(34 197 94);
  }
  .eva-1 {
    background-color: rgb(74 222 128);
  }
  .eva-2 {
    background-color: rgb(132 204 22);
  }
  .eva-3 {
    background-color: rgb(163 230 53);
  }
  .eva-4 {
    background-color: rgb(234 179 8);
  }
  .eva-5 {
    background-color: rgb(250 204 21);
  }
  .eva-6 {
    background-color: rgb(249 115 22);
  }
  .eva-7 {
    background-color: rgb(251 146 60);
  }
  .eva-8 {
    background-color: rgb(239 68 68);
  }
  .eva-9 {
    background-color: rgb(220 38 38);
  }
  .eva-10 {
    background-color: rgb(220 38 38);
  }
</style>
