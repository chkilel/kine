<script setup lang="ts">
  const props = defineProps<{
    patientId: string
    consultationId: string
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  // Data fetching
  const { data: patient } = usePatientById(() => props.patientId)
  const { data: consultation, isPending: consultationLoading } = useConsultation(() => props.consultationId)

  // Form state
  const painLevelBefore = ref<number>(0)
  const painLevelAfter = ref<number | undefined>(undefined)
  const consultationNotes = ref('')
  const selectedTags = ref<string[]>([])
  const evaValidated = ref<boolean>(false)
  const evaEnabled = ref<boolean>(false)

  // Initialize form from consultation data
  watch(
    consultation,
    (value) => {
      if (!value) return

      painLevelBefore.value = value.painLevelBefore ?? 0
      painLevelAfter.value = value.painLevelAfter ?? undefined
      consultationNotes.value = value.notes || ''
      selectedTags.value = parseTagsSafely(value.tags)

      // Set EVA as validated if consultation is already started or has a pain level
      evaValidated.value =
        ['in_progress', 'completed'].includes(value.status) ||
        (value.painLevelBefore !== null && value.painLevelBefore !== undefined)

      // Set EVA as disabled if pain level is explicitly set to null
      evaEnabled.value = value.painLevelBefore === null
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

  // Computed values - memoized for performance
  const headerTitle = computed(() =>
    patient.value ? `${patient.value.firstName} ${patient.value.lastName}` : 'Séance active'
  )

  const headerDescription = computed(() => {
    if (!consultation.value) return ''
    const typeLabel = getConsultationTypeLabel(consultation.value.type || 'follow_up')
    const totalDuration = consultation.value.duration + (consultation.value.extendedDurationMinutes || 0)
    const durationLabel = totalDuration ? `${totalDuration} min` : ''
    return [typeLabel, durationLabel].filter(Boolean).join(' • ')
  })

  const canStartSession = computed(() => evaValidated.value || evaEnabled.value)
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
      <div v-if="consultationLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>

      <!-- Main Content -->
      <div v-else class="grid h-full gap-6 lg:grid-cols-12">
        <!-- Left Sidebar - Patient Info -->
        <ConsultationPatientProfileCard
          v-if="patient && consultation"
          :patient="patient"
          :consultation="consultation"
        />

        <!-- Center Column - Main Content -->
        <div class="flex flex-col gap-4 lg:col-span-6">
          <!-- EVA Pain Scale Card -->
          <ConsultationEvaCard
            v-model:pain-level-before="painLevelBefore"
            v-model:eva-validated="evaValidated"
            v-model:eva-enabled="evaEnabled"
          />

          <ConsultationEditor
            v-model="consultationNotes"
            v-model:selected-tags="selectedTags"
            :consultation-id="consultationId"
          />
        </div>

        <!-- Right Sidebar - Timer & History -->
        <div class="flex h-full flex-col gap-4 lg:col-span-3">
          <!-- Timer Card -->
          <ConsultationTimerCard
            v-if="consultation"
            :consultation="consultation"
            :selected-tags="selectedTags"
            :pain-level-after="painLevelAfter"
            :consultation-notes="consultationNotes"
            :can-start-session="canStartSession"
            @close="emit('close')"
          />

          <ConsultationPreviousNotes :patient-id="patientId" :consultation-id="consultationId" />
        </div>
      </div>
    </template>
  </USlideover>
</template>
