<script setup lang="ts">
  const { appointment } = defineProps<{ appointment: AppointmentWithSession }>()

  // --- Constants & pure utilities (module scope, not re-created per mount) ---

  const AVAILABLE_TAGS = [
    'Douleur Diminuée',
    'Gain Amplitude',
    'Proprioception',
    'Cryothérapie',
    'Renforcement'
  ] as const

  type ClinicalNoteField = 'primaryConcern' | 'treatmentSummary' | 'observations' | 'nextSteps'

  // Moved outside component — pure utility, no reactive deps
  function parseTagsSafely(tags: string | null | undefined): string[] {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  // --- Composables ---

  const { mutate: createTreatmentSession, isLoading: isCreatingSession } = useCreateTreatmentSession()
  const { updateClinicalNotes, updateTags, isLoading: isUpdating } = useTreatmentSessionActions()
  const { activeOrganization } = useOrganization()
  const organization = computed(() => (activeOrganization.value?.data as Organization | null) ?? null)

  // --- Reactive state ---

  const painLevelBefore = ref<number | undefined>(undefined)
  const painLevelAfter = ref<number | undefined>(undefined)
  const treatmentSummary = ref('')
  const primaryConcern = ref('')
  const observations = ref('')
  const nextSteps = ref('')
  const selectedTags = ref<string[]>([])

  // Track saving state per field (a Set) so concurrent saves don't
  // cross-contaminate spinners. Use reassignment to the ref to ensure
  // Vue reactivity picks up Set changes.
  const savingFields = ref(new Set<ClinicalNoteField>())

  function isSaving(field: ClinicalNoteField) {
    return savingFields.value.has(field)
  }

  // --- Watchers ---

  // Added `deep: true` — nested property mutations (cost, status, etc.)
  // now correctly re-sync local state after mutation cache updates.
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
    { immediate: true, deep: true }
  )

  // --- Derived state ---

  const sessionStatus = computed(() => appointment.treatmentSession?.status)
  const showPrimaryConcern = computed(() => !appointment.treatmentPlanId)
  const showObservations = computed(() => ['in_progress', 'finished', 'completed'].includes(sessionStatus.value ?? ''))
  const showNextSteps = computed(() => ['finished', 'completed'].includes(sessionStatus.value ?? ''))
  const isObservationsEditable = computed(() => sessionStatus.value === 'in_progress')
  const isNextStepsEditable = computed(() => sessionStatus.value === 'finished')
  const sessionInProgress = computed(() => sessionStatus.value === 'in_progress')
  const shouldShowEVACards = computed(() => sessionInProgress.value || !!appointment.treatmentSession?.painLevelAfter)

  // --- Handlers ---

  function handleSaveClinicalNotes(field: ClinicalNoteField) {
    const sessionId = appointment.treatmentSession?.id

    const fieldValues: Record<ClinicalNoteField, string> = {
      primaryConcern: primaryConcern.value,
      treatmentSummary: treatmentSummary.value,
      observations: observations.value,
      nextSteps: nextSteps.value
    }

    if (!sessionId) {
      // Only attempt creation for two fields that bootstrap session.
      // Other fields silently fail without a session — now we guard explicitly.
      if (field !== 'primaryConcern' && field !== 'treatmentSummary') return

      // Add field in a way that triggers reactivity
      savingFields.value = new Set([...savingFields.value, field])

      createTreatmentSession({
        appointmentId: appointment.id,
        primaryConcern: fieldValues.primaryConcern,
        treatmentSummary: fieldValues.treatmentSummary,
        onSuccess: () => {
          // reset the savingFields
          savingFields.value = new Set([...savingFields.value].filter((f) => f !== field))
        }
      })
      return
    }

    // Add field in a way that triggers reactivity
    savingFields.value = new Set([...savingFields.value, field])

    updateClinicalNotes({
      sessionId,
      appointmentId: appointment.id,
      [field]: fieldValues[field],
      onSuccess: () => {
        // reset the savingFields
        savingFields.value = new Set([...savingFields.value].filter((f) => f !== field))
      }
    })
  }

  function toggleTag(tag: string) {
    if (!appointment.treatmentSession || isUpdating.value) return

    const previous = [...selectedTags.value]

    // Optimistic update
    selectedTags.value = selectedTags.value.includes(tag)
      ? selectedTags.value.filter((t) => t !== tag)
      : [...selectedTags.value, tag]

    updateTags({
      sessionId: appointment.treatmentSession.id,
      appointmentId: appointment.id,
      tags: selectedTags.value
    })
  }

  // Fallback: some mutation helpers return void (mutate) and don't expose
  // a Promise. Watch the mutation loading flags and clear any remaining
  // saving flags when all mutation activity finishes.
  watch([isCreatingSession, isUpdating], ([creating, updating]) => {
    if (!creating && !updating) {
      savingFields.value = new Set()
    }
  })
</script>

<template>
  <div class="flex flex-col gap-4 lg:col-span-6">
    <TreatmentSessionPrice :appointment="appointment" :organization="organization" />

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
