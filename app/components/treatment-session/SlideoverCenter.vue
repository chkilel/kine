<script setup lang="ts">
  // ─── Constants & Utilities ────────────────────────────────────
  type ClinicalNoteField = 'primaryConcern' | 'treatmentSummary' | 'observations' | 'nextSteps'

  // ─── Props ───────────────────────────────────────────────────
  const { appointment } = defineProps<{ appointment: Appointment }>()

  // ─── Composables ─────────────────────────────────────────────
  const { mutate: updateClinicalNotes, isLoading: isUpdatingClinicalNotes } = useUpdateAppointmentClinicalNotes()

  // ─── Base state ──────────────────────────────────────────────
  const treatmentSummary = ref('')
  const primaryConcern = ref('')
  const observations = ref('')
  const nextSteps = ref('')

  // ─── Computed state ──────────────────────────────────────────
  const showPrimaryConcern = computed(() => !appointment.treatmentPlanId)
  const showObservations = computed(() => ['in_progress', 'finished', 'completed'].includes(appointment.status ?? ''))
  const showNextSteps = computed(() => ['finished', 'completed'].includes(appointment.status ?? ''))
  const isObservationsEditable = computed(() => appointment.status === 'in_progress')
  const isNextStepsEditable = computed(() => appointment.status === 'finished')

  // ─── Watchers ────────────────────────────────────────────────
  watch(
    () => appointment,
    (value) => {
      if (!value) return
      treatmentSummary.value = value.treatmentSummary || ''
      primaryConcern.value = value.primaryConcern || ''
      observations.value = value.observations || ''
      nextSteps.value = value.nextSteps || ''
    },
    { immediate: true }
  )

  // ─── Event handlers ──────────────────────────────────────────
  function handleSaveClinicalNotes(field: ClinicalNoteField) {
    const fieldValues: Record<ClinicalNoteField, string> = {
      primaryConcern: primaryConcern.value,
      treatmentSummary: treatmentSummary.value,
      observations: observations.value,
      nextSteps: nextSteps.value
    }

    if (appointment.status !== 'in_progress' && appointment.status !== 'finished') {
      if (field !== 'primaryConcern' && field !== 'treatmentSummary') return
    }

    updateClinicalNotes({
      appointmentId: appointment.id,
      [field]: fieldValues[field]
    })
  }
</script>

<template>
  <div class="flex flex-col gap-4 lg:col-span-6">
    <UCard v-if="showPrimaryConcern" :ui="{ body: 'p-0 sm:p-0 flex flex-col overflow-hidden' }">
      <div class="border-default bg-muted flex items-center justify-between border-b p-2">
        <div class="text-muted ml-2 text-xs font-bold tracking-wider uppercase">Motif de consultation</div>
        <UButton
          size="xs"
          color="primary"
          variant="ghost"
          icon="i-hugeicons-floppy-disk"
          :loading="isUpdatingClinicalNotes"
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
          :loading="isUpdatingClinicalNotes"
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
          :loading="isUpdatingClinicalNotes"
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
          :loading="isUpdatingClinicalNotes"
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
</template>
