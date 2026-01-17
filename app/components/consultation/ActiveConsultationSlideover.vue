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

  const painLevelBefore = ref<number | null>(null)
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
      painLevelBefore.value = value.painLevelBefore ?? null
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
    return allConsultations.value.filter(
      (c) => c.treatmentPlanId === planId && c.status === 'completed'
    ).length
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
    if (value <= 7) return 'warning'
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
      content: 'w-full max-w-6xl bg-elevated'
    }"
    @close="handleClose"
  >
    <template #body>
      <div v-if="consultationLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>
      <div v-else class="grid gap-4 lg:grid-cols-[1.1fr,1.8fr,1.1fr]">
        <div class="space-y-4">
          <UCard>
            <div class="flex items-center gap-3">
              <UAvatar
                :alt="patient ? formatFullName(patient) : ''"
                class="ring-muted size-14 rounded-2xl bg-cover bg-center bg-no-repeat text-xl shadow-inner ring-4"
              />
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold">
                    {{ patient ? formatFullName(patient) : 'Patient' }}
                  </h2>
                  <UBadge v-if="consultation" :color="getConsultationStatusColor(consultation.status)" size="xs">
                    {{ getConsultationStatusLabel(consultation.status) }}
                  </UBadge>
                </div>
                <p v-if="patient?.dateOfBirth" class="text-muted text-xs">
                  {{ calculateAge(patient.dateOfBirth) }} ans
                </p>
              </div>
            </div>
          </UCard>

          <UCard v-if="relatedTreatmentPlan">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold">Plan de traitement</h3>
                <UBadge size="xs" variant="subtle">
                  {{ relatedTreatmentPlan.status === 'ongoing' ? 'En cours' : 'Plan' }}
                </UBadge>
              </div>
              <p class="text-sm font-medium">
                {{ relatedTreatmentPlan.title }}
              </p>
              <div class="space-y-1">
                <div class="flex justify-between text-xs text-muted">
                  <span>Séances terminées</span>
                  <span>{{ completedSessionsCount }} / {{ totalSessionsCount }}</span>
                </div>
                <UProgress :model-value="progressPercentage" :max="100" size="sm" />
              </div>
            </div>
          </UCard>

          <UCard v-if="patient?.medicalConditions?.length">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-hugeicons-healthcare" class="text-primary size-4" />
                <h3 class="text-sm font-semibold">Pathologies principales</h3>
              </div>
              <ul class="space-y-1">
                <li v-for="condition in patient.medicalConditions" :key="condition" class="text-muted text-xs">
                  • {{ condition }}
                </li>
              </ul>
            </div>
          </UCard>

          <UAlert
            v-if="patient?.allergies?.length"
            color="error"
            variant="subtle"
            icon="i-hugeicons-warning-01"
            title="Allergies / alertes médicales"
          >
            <template #description>
              <ul class="space-y-1">
                <li v-for="allergy in patient.allergies" :key="allergy" class="text-xs">
                  • {{ allergy }}
                </li>
              </ul>
            </template>
          </UAlert>
        </div>

        <div class="space-y-4">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold">Niveau de douleur (avant séance)</h3>
                <p class="text-muted text-xs">Échelle EVA de 0 à 10</p>
              </div>
              <div v-if="painLevelBefore !== null" class="flex items-center gap-2 text-sm font-semibold">
                <span>{{ getEvaEmoji(painLevelBefore) }}</span>
                <span>{{ painLevelBefore }}/10</span>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-4 gap-2">
              <UButton
                v-for="value in evaValues"
                :key="value"
                :color="getEvaColor(value)"
                variant="soft"
                size="sm"
                :class="[
                  'flex flex-col items-center justify-center py-2',
                  painLevelBefore === value ? 'ring-2 ring-offset-1 ring-primary' : ''
                ]"
                @click="painLevelBefore = value"
              >
                <span class="text-lg">
                  {{ getEvaEmoji(value) }}
                </span>
                <span class="text-xs font-semibold">
                  {{ value }}
                </span>
              </UButton>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold">Notes de consultation</h3>
              <div class="flex gap-2">
                <UButton
                  v-for="tag in ['Douleur', 'Mobilité', 'Force', 'Éducation']"
                  :key="tag"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="consultationNotes = `${consultationNotes} [${tag}] `"
                >
                  #{{ tag }}
                </UButton>
              </div>
            </div>
            <div class="mt-3">
              <UTextarea
                v-model="consultationNotes"
                :rows="8"
                placeholder="Décrire l'évolution, les exercices réalisés, les réactions du patient..."
              />
            </div>
          </UCard>

          <UCard>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <h3 class="text-sm font-semibold">Niveau de douleur (après séance)</h3>
                <USlider v-model="painLevelAfter" :min="0" :max="10" :step="1" />
                <p class="text-muted text-xs">
                  Valeur actuelle:
                  <span v-if="painLevelAfter !== undefined" class="font-semibold">
                    {{ painLevelAfter }}/10
                  </span>
                  <span v-else>Non renseigné</span>
                </p>
              </div>
              <div class="space-y-2">
                <h3 class="text-sm font-semibold">Résumé rapide</h3>
                <p class="text-muted text-xs">
                  Utiliser le champ de notes principal pour détailler le déroulement de la séance et les recommandations.
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="space-y-4">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold">Durée de la séance</h3>
                <p class="text-muted text-xs">Temps écoulé / temps prévu</p>
              </div>
              <UBadge color="success" variant="subtle" size="xs">
                En cours
              </UBadge>
            </div>
            <div class="mt-4 space-y-3">
              <div class="text-center">
                <div class="text-3xl font-bold">
                  {{ elapsedLabel }}
                </div>
                <p v-if="remainingLabel" class="text-muted text-xs">
                  Reste {{ remainingLabel }}
                </p>
              </div>
              <UProgress :model-value="timerProgress" :max="100" size="lg" />
              <div class="flex justify-center gap-2">
                <UButton
                  icon="i-hugeicons-pause-circle"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click="pauseTimer"
                >
                  {{ isPaused ? 'Reprendre' : 'Pause' }}
                </UButton>
                <UButton
                  icon="i-hugeicons-stop-circle"
                  variant="ghost"
                  color="error"
                  size="sm"
                  @click="stopTimer"
                >
                  Stop
                </UButton>
              </div>
            </div>
          </UCard>

          <UCard>
            <UCollapsible :default-open="false" :ui="{ content: 'space-y-3 pt-3' }">
              <UButton
                color="neutral"
                variant="ghost"
                class="group w-full justify-between"
                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                trailing-icon="i-lucide-chevron-down"
              >
                <span class="text-sm font-semibold">Séances précédentes</span>
              </UButton>
              <template #content>
                <div v-if="previousConsultations.length" class="space-y-3">
                  <UCard
                    v-for="previous in previousConsultations"
                    :key="previous.id"
                    variant="subtle"
                    :ui="{ body: 'p-3 space-y-1' }"
                  >
                    <div class="flex items-center justify-between text-xs text-muted">
                      <span>{{ formatFrenchDate(previous.date) }}</span>
                      <span v-if="previous.painLevelBefore !== null">
                        EVA {{ previous.painLevelBefore }}/10
                      </span>
                    </div>
                    <p class="text-xs">
                      {{ previous.notes || 'Aucune note enregistrée pour cette séance.' }}
                    </p>
                  </UCard>
                </div>
                <div v-else class="text-muted text-xs">
                  Aucune séance précédente enregistrée.
                </div>
              </template>
            </UCollapsible>
          </UCard>

          <UCard>
            <div class="space-y-3">
              <UButton
                color="success"
                size="lg"
                class="w-full justify-center font-semibold"
                icon="i-hugeicons-checkmark-circle-01"
                @click="handleComplete"
              >
                Terminer la consultation
              </UButton>
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                class="w-full justify-center"
                @click="handleClose"
              >
                Fermer sans terminer
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
      <div v-if="showFiveMinuteWarning" class="mt-4">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-hugeicons-alarm-01"
          title="5 minutes restantes"
        >
          <template #description>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-xs sm:text-sm">
                La séance se termine bientôt. Que souhaitez-vous faire ?
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton color="success" size="sm" @click="handleComplete">
                  Terminer maintenant
                </UButton>
                <UButton variant="outline" color="primary" size="sm" @click="handleExtendFiveMinutes">
                  Prolonger 5 min
                </UButton>
              </div>
            </div>
          </template>
        </UAlert>
      </div>
    </template>
  </USlideover>
</template>
