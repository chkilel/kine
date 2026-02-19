<script setup lang="ts">
  import { LazyAppModalEVA } from '#components'

  const props = defineProps<{
    patientId: string
    appointmentId: string
  }>()

  const emit = defineEmits<{ close: [] }>()

  // Constants
  const AVAILABLE_TAGS = [
    'Douleur Diminuée',
    'Gain Amplitude',
    'Proprioception',
    'Cryothérapie',
    'Renforcement'
  ] as const

  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)

  const { mutate: createTreatmentSession, isLoading: isCreating } = useCreateTreatmentSession()
  const treatmentSessionActions = useTreatmentSessionActions()
  const isUpdatingTags = computed(() => treatmentSessionActions.isLoading.value)

  // Data fetching
  const { data: patient } = usePatientById(() => props.patientId)
  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patientId)
  const { data: allAppointments } = useAppointmentsListWithSessions(() => ({ patientId: props.patientId, limit: 6 }))
  const { data: appointment, isPending: appointmentLoading } = useAppointment(() => props.appointmentId)

  // Form state for treatment session
  const painLevelBefore = ref<number | undefined>(undefined)
  const painLevelAfter = ref<number | undefined>(undefined)
  const sessionNotes = ref('')
  const selectedTags = ref<string[]>([])

  // Initialize form from treatment session data when available
  watch(
    () => appointment.value?.treatmentSession,
    (value) => {
      if (!value) return

      painLevelBefore.value = value.painLevelBefore ?? undefined
      painLevelAfter.value = value.painLevelAfter ?? undefined
      sessionNotes.value = value.treatmentSummary || ''
      selectedTags.value = parseTagsSafely(value.tags)
    },
    { immediate: true }
  )

  // Helper functions
  function parseTagsSafely(tags: string | null | undefined): string[] {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  function toggleTag(tag: string) {
    if (!appointment.value?.treatmentSession || isUpdatingTags.value) return

    selectedTags.value = selectedTags.value.includes(tag)
      ? selectedTags.value.filter((t) => t !== tag)
      : [...selectedTags.value, tag]

    treatmentSessionActions.updateTags({
      sessionId: appointment.value.treatmentSession.id,
      appointmentId: props.appointmentId,
      tags: selectedTags.value
    })
  }

  // Computed values - memoized for performance
  const previousAppointments = computed(() => {
    const list = allAppointments.value
    const currentAppointment = appointment.value
    if (!list || !currentAppointment) return []

    return list
      .filter((c) => c.id !== currentAppointment.id && c.date <= currentAppointment.date)
      .slice(-5)
      .reverse()
  })

  const relatedTreatmentPlan = computed(() => {
    if (!treatmentPlans.value || !appointment.value?.treatmentPlanId) return null
    return treatmentPlans.value.find((plan) => plan.id === appointment.value?.treatmentPlanId) || null
  })

  const completedSessionsCount = computed(() => {
    if (!allAppointments.value || !appointment.value) return 0
    const planId = appointment.value.treatmentPlanId
    if (!planId) return 0

    return allAppointments.value.filter((c) => c.treatmentPlanId === planId && c.status === 'completed').length
  })

  const totalSessionsCount = computed(() => relatedTreatmentPlan.value?.numberOfSessions || 0)

  const progressPercentage = computed(() => {
    if (!totalSessionsCount.value) return 0
    return Math.min(Math.round((completedSessionsCount.value / totalSessionsCount.value) * 100), 100)
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

  const hasPatientAlerts = computed(() =>
    Boolean(
      patient.value?.allergies?.length ||
      patient.value?.medicalConditions?.length ||
      patient.value?.surgeries?.length ||
      patient.value?.medications?.length
    )
  )

  // Check if session hasn't started yet
  const sessionNotStarted = computed(() => !appointment.value?.treatmentSession)

  // Check if session is in progress
  const sessionInProgress = computed(() => appointment.value?.treatmentSession?.status === 'in_progress')

  // Handler to start a new session
  async function handleStartSession() {
    if (isCreating.value) return

    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur initiale',
      description: 'Veuillez indiquer le niveau de douleur du patient avant la séance',
      confirmText: 'Enregistrer et démarrer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue === null) return

    createTreatmentSession({
      appointmentId: props.appointmentId,
      painLevelBefore: evaValue
    })
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
        <aside class="flex flex-col gap-4 lg:col-span-3">
          <!-- Patient Profile Card -->
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

            <!-- Medical Info Section -->
            <div class="border-default border-t px-6 pt-6 pb-6">
              <!-- Treatment Plan -->
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

              <!-- Medical Alerts -->
              <div v-if="hasPatientAlerts">
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
                    icon="i-hugeicons-hospital-02"
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

          <!-- Stats Card -->
          <UCard :ui="{ body: 'flex items-center justify-between p-4' }">
            <div>
              <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Progression</p>
              <p class="text-lg font-bold">{{ progressPercentage }}%</p>
            </div>
            <div class="bg-border h-8 w-px" />
            <div>
              <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Séances</p>
              <p class="text-lg font-bold">{{ completedSessionsCount }}/{{ totalSessionsCount }}</p>
            </div>
            <div class="bg-border h-8 w-px" />
            <div>
              <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Dernière EVA</p>
              <p class="text-lg font-bold">
                {{ painLevelBefore !== null ? `${painLevelBefore}/10` : '-' }}
              </p>
            </div>
          </UCard>
        </aside>

        <!-- Center Column - Main Content -->
        <div class="flex flex-col gap-4 lg:col-span-6">
          <!-- EVA Cards - Show when session is in progress -->
          <div v-if="sessionInProgress" class="grid grid-cols-2 gap-4">
            <!-- Initial EVA Card -->
            <UCard>
              <div class="flex items-center gap-3">
                <div class="bg-success-10 flex size-10 shrink-0 items-center justify-center rounded-full">
                  <UIcon name="i-hugeicons-straight-edge" class="text-success size-5" />
                </div>
                <div>
                  <p class="text-muted text-xs font-bold uppercase">EVA Initiale</p>
                  <p class="text-2xl font-bold tabular-nums">{{ painLevelBefore }}/10</p>
                </div>
              </div>
            </UCard>

            <!-- End EVA Placeholder Card -->
            <UCard class="border-dashed">
              <div class="flex items-center gap-3">
                <div class="bg-muted-10 flex size-10 shrink-0 items-center justify-center rounded-full">
                  <UIcon name="i-hugeicons-clock-01" class="text-muted size-5" />
                </div>
                <div>
                  <p class="text-muted text-xs font-bold uppercase">EVA Finale</p>
                  <p class="text-muted text-sm">Sera demandé avant de terminer</p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Notes Editor Card -->
          <UCard :ui="{ body: 'p-0 sm:p-0 flex flex-col space-y-2 overflow-hidden' }">
            <!-- Toolbar -->
            <div class="border-default bg-muted-50 flex items-center gap-1 border-b p-2">
              <UButton icon="i-hugeicons-text-bold" variant="ghost" color="neutral" size="xs" square />
              <UButton icon="i-hugeicons-text-italic" variant="ghost" color="neutral" size="xs" square />
              <UButton icon="i-hugeicons-text-underline" variant="ghost" color="neutral" size="xs" square />
              <div class="bg-border mx-2 h-6 w-px" />
              <UButton icon="i-hugeicons-check-list" variant="ghost" color="neutral" size="xs" square />
              <UButton icon="i-hugeicons-left-to-right-list-number" variant="ghost" color="neutral" size="xs" square />
              <div class="flex-1" />
              <div class="text-muted flex items-center gap-1 text-xs">
                <UIcon name="i-hugeicons-cloud-saving-done-01" class="size-4" />
                Sauvegardé
              </div>
            </div>

            <!-- Textarea -->
            <UTextarea
              v-model="sessionNotes"
              :rows="12"
              placeholder="Notes de la séance... Décrivez les exercices effectués, les réactions du patient et les progrès observés."
              class="border-none bg-transparent focus:ring-0"
              :ui="{ root: 'flex-1 h-full' }"
            />

            <!-- Smart Tags Section -->
            <div class="border-default bg-muted-50/50 dark:bg-muted-900/30 border-t p-4">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-muted text-xs font-bold tracking-wider uppercase">Smart Tags</p>
                <UButton variant="ghost" color="primary" size="xs">Gérer les tags</UButton>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="tag in AVAILABLE_TAGS"
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
          <TreatmentSessionTimer
            v-if="appointment"
            :appointment="appointment"
            :selected-tags="selectedTags"
            :session-notes="sessionNotes"
            @close="emit('close')"
          />

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
