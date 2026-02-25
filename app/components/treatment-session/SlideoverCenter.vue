<script setup lang="ts">
  const { appointment } = defineProps<{ appointment: AppointmentWithSession }>()

  const AVAILABLE_TAGS = [
    'Douleur Diminuée',
    'Gain Amplitude',
    'Proprioception',
    'Cryothérapie',
    'Renforcement'
  ] as const

  type ClinicalNoteField = 'primaryConcern' | 'treatmentSummary' | 'observations' | 'nextSteps'

  const { mutate: createTreatmentSession, isLoading: isCreatingSession } = useCreateTreatmentSession()
  const { updateClinicalNotes, updateTags, isLoading: isUpdating } = useTreatmentSessionActions()

  const painLevelBefore = ref<number | undefined>(undefined)
  const painLevelAfter = ref<number | undefined>(undefined)
  const treatmentSummary = ref('')
  const primaryConcern = ref('')
  const observations = ref('')
  const nextSteps = ref('')
  const selectedTags = ref<string[]>([])

  const savingField = ref<ClinicalNoteField | null>(null)

  function isSaving(field: ClinicalNoteField) {
    return savingField.value === field && (isCreatingSession.value || isUpdating.value)
  }

  watch([isCreatingSession, isUpdating], ([creating, updating]) => {
    if (!creating && !updating) savingField.value = null
  })

  watch(
    () => appointment.treatmentSession,
    (session) => {
      if (!session) return
      painLevelBefore.value = session.painLevelBefore ?? undefined
      painLevelAfter.value = session.painLevelAfter ?? undefined
      treatmentSummary.value = session.treatmentSummary || ''
      primaryConcern.value = session.primaryConcern || ''
      observations.value = session.observations || ''
      nextSteps.value = session.nextSteps || ''
      selectedTags.value = parseTagsSafely(session.tags)
    },
    { immediate: true }
  )

  const sessionStatus = computed(() => appointment.treatmentSession?.status)
  const showPrimaryConcern = computed(() => !appointment.treatmentPlanId)
  const showObservations = computed(() => ['in_progress', 'finished', 'completed'].includes(sessionStatus.value ?? ''))
  const showNextSteps = computed(() => ['finished', 'completed'].includes(sessionStatus.value ?? ''))
  const isObservationsEditable = computed(() => sessionStatus.value === 'in_progress')
  const isNextStepsEditable = computed(() => sessionStatus.value === 'finished')
  const sessionInProgress = computed(() => sessionStatus.value === 'in_progress')
  const shouldShowEVACards = computed(() => sessionInProgress.value || !!appointment.treatmentSession?.painLevelAfter)

  function handleSaveClinicalNotes(field: ClinicalNoteField) {
    savingField.value = field

    const sessionId = appointment.treatmentSession?.id

    const fieldValues: Record<ClinicalNoteField, string> = {
      primaryConcern: primaryConcern.value,
      treatmentSummary: treatmentSummary.value,
      observations: observations.value,
      nextSteps: nextSteps.value
    }

    if (!sessionId) {
      if (field === 'primaryConcern' || field === 'treatmentSummary') {
        createTreatmentSession({
          appointmentId: appointment.id,
          primaryConcern: fieldValues.primaryConcern,
          treatmentSummary: fieldValues.treatmentSummary
        })
      }
      return
    }

    updateClinicalNotes({
      sessionId,
      appointmentId: appointment.id,
      [field]: fieldValues[field]
    })
  }

  function parseTagsSafely(tags: string | null | undefined): string[] {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  function toggleTag(tag: string) {
    if (!appointment.treatmentSession || isUpdating.value) return

    selectedTags.value = selectedTags.value.includes(tag)
      ? selectedTags.value.filter((t) => t !== tag)
      : [...selectedTags.value, tag]

    updateTags({
      sessionId: appointment.treatmentSession.id,
      appointmentId: appointment.id,
      tags: selectedTags.value
    })
  }
</script>

<template>
  <div class="flex flex-col gap-4 lg:col-span-6">
    <div v-if="shouldShowEVACards" class="grid grid-cols-2 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="bg-success-10 flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon name="i-hugeicons-straight-edge" class="text-success size-5" />
          </div>
          <div>
            <p class="text-muted text-xs font-bold uppercase">Évaluation de la douleur</p>
            <p class="text-2xl font-bold tabular-nums">
              {{ painLevelBefore }}/10
              <span class="text-muted text-xs">Initiale</span>
            </p>
          </div>
        </div>
      </UCard>

      <UCard :class="{ 'opacity-60': !painLevelAfter }">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
            :class="painLevelAfter ? 'bg-success-10' : 'bg-muted-10'"
          >
            <UIcon
              class="size-5"
              :name="painLevelAfter ? 'i-hugeicons-straight-edge' : 'i-hugeicons-clock-01'"
              :class="painLevelAfter ? 'text-success' : 'text-muted'"
            />
          </div>
          <div>
            <p class="text-muted text-xs font-bold uppercase">Évaluation de la douleur</p>
            <p v-if="painLevelAfter" class="text-2xl font-bold tabular-nums">
              {{ painLevelAfter }}/10
              <span class="text-muted text-xs">Finale</span>
            </p>
            <p v-else class="text-muted text-sm">Sera demandé avant de terminer la séance</p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="flex flex-col gap-4">
      <UCard v-if="showPrimaryConcern" :ui="{ body: 'p-0 sm:p-0 flex flex-col overflow-hidden' }">
        <div class="border-default bg-muted-50 flex items-center justify-between border-b p-2">
          <div class="text-muted-500 ml-2 text-xs font-bold tracking-wider uppercase">Motif de consultation</div>
          <UButton
            size="xs"
            color="primary"
            variant="ghost"
            icon="i-hugeicons-floppy-disk"
            :loading="isSaving('primaryConcern')"
            @click="handleSaveClinicalNotes('primaryConcern')"
          >
            Enregistrer
          </UButton>
        </div>
        <UTextarea
          v-model="primaryConcern"
          :rows="3"
          placeholder="Décrivez le motif principal de la consultation..."
          class="border-none bg-transparent focus:ring-0"
          :ui="{ root: 'flex-1' }"
        />
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0 flex flex-col overflow-hidden' }">
        <div class="border-default bg-muted-50 flex items-center justify-between border-b p-2">
          <div class="text-muted-500 ml-2 text-xs font-bold tracking-wider uppercase">Résumé de la séance</div>
          <UButton
            size="xs"
            color="primary"
            variant="ghost"
            icon="i-hugeicons-floppy-disk"
            :loading="isSaving('treatmentSummary')"
            @click="handleSaveClinicalNotes('treatmentSummary')"
          >
            Enregistrer
          </UButton>
        </div>
        <UTextarea
          v-model="treatmentSummary"
          :rows="8"
          placeholder="Notes de la séance... Décrivez les exercices effectués, les réactions du patient et les progrès observés."
          class="border-none bg-transparent focus:ring-0"
          :ui="{ root: 'flex-1' }"
        />
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

      <UCard v-if="showObservations" :ui="{ body: 'p-0 sm:p-0 flex flex-col overflow-hidden' }">
        <div class="border-default bg-muted-50 flex items-center justify-between border-b p-2">
          <div class="text-muted-500 ml-2 text-xs font-bold tracking-wider uppercase">Observations</div>
          <UButton
            v-if="isObservationsEditable"
            size="xs"
            color="primary"
            variant="ghost"
            icon="i-hugeicons-floppy-disk"
            :loading="isSaving('observations')"
            @click="handleSaveClinicalNotes('observations')"
          >
            Enregistrer
          </UButton>
        </div>
        <UTextarea
          v-model="observations"
          :rows="4"
          :disabled="!isObservationsEditable"
          placeholder="Observations pendant la séance..."
          class="border-none bg-transparent focus:ring-0"
          :ui="{ root: 'flex-1' }"
        />
      </UCard>

      <UCard v-if="showNextSteps" :ui="{ body: 'p-0 sm:p-0 flex flex-col overflow-hidden' }">
        <div class="border-default bg-muted-50 flex items-center justify-between border-b p-2">
          <div class="text-muted-500 ml-2 text-xs font-bold tracking-wider uppercase">Prochaines étapes</div>
          <UButton
            v-if="isNextStepsEditable"
            size="xs"
            color="primary"
            variant="ghost"
            icon="i-hugeicons-floppy-disk"
            :loading="isSaving('nextSteps')"
            @click="handleSaveClinicalNotes('nextSteps')"
          >
            Enregistrer
          </UButton>
        </div>
        <UTextarea
          v-model="nextSteps"
          :rows="3"
          :disabled="!isNextStepsEditable"
          placeholder="Plan pour la prochaine séance..."
          class="border-none bg-transparent focus:ring-0"
          :ui="{ root: 'flex-1' }"
        />
      </UCard>
    </div>
  </div>
</template>
