<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    consultation: Consultation
  }>()

  const emit = defineEmits<{
    stopSession: []
  }>()

  const consultationNotes = ref('')
  const selectedTags = ref<string[]>([])
  const painLevelAfter = ref<number | undefined>(undefined)
  const painLevelBefore = ref<number | undefined>(undefined)
  const evaValidated = ref<boolean>(false)
  const evaEnabled = ref<boolean>(false)

  const canStartSession = computed(() => evaValidated.value || evaEnabled.value)

  watch(
    () => props.consultation,
    (value) => {
      if (!value) return

      consultationNotes.value = value.notes || ''
      selectedTags.value = parseTagsSafely(value.tags)

      painLevelBefore.value = value.painLevelBefore ?? undefined

      evaValidated.value =
        ['in_progress', 'completed'].includes(value.status) ||
        (value.painLevelBefore !== null && value.painLevelBefore !== undefined)

      evaEnabled.value = value.painLevelBefore === null
    },
    { immediate: true }
  )

  function parseTagsSafely(tags: string | null | undefined): string[] {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  async function handleStopSession() {
    emit('stopSession')
  }
</script>

<template>
  <div class="grid h-full gap-6 lg:grid-cols-9">
    <div class="flex flex-col gap-4 lg:col-span-6">
      <ConsultationEvaCard
        v-model:pain-level-before="painLevelBefore"
        v-model:eva-validated="evaValidated"
        v-model:eva-enabled="evaEnabled"
      />

      <ConsultationEditor
        v-model="consultationNotes"
        v-model:selected-tags="selectedTags"
        :consultation-id="consultation.id"
      />
    </div>

    <div class="flex h-full flex-col gap-4 lg:col-span-3">
      <ConsultationTimerCard
        :consultation="consultation"
        :selected-tags="selectedTags"
        :pain-level-after="painLevelAfter"
        :consultation-notes="consultationNotes"
        :can-start-session="canStartSession"
        @complete="handleStopSession"
      />

      <ConsultationPreviousNotes :patient-id="patient.id" :consultation-id="consultation.id" />
    </div>
  </div>
</template>
