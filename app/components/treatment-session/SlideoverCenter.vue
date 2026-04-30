<script setup lang="ts">
  // ─── Constants & Utilities ────────────────────────────────────
  type ClinicalNoteField = 'primaryConcern' | 'sessionNotes' | 'observations'

  // ─── Props ───────────────────────────────────────────────────
  const { appointment } = defineProps<{ appointment: Appointment }>()

  // ─── Composables ─────────────────────────────────────────────
  const { mutate: updateClinicalNotes, isLoading: isUpdatingClinicalNotes } = useUpdateAppointmentClinicalNotes()

  // ─── Base state ──────────────────────────────────────────────
  const sessionNotes = ref('')
  const primaryConcern = ref('')
  const observations = ref('')

  // ─── Computed state ──────────────────────────────────────────
  const showPrimaryConcern = computed(() => !appointment.treatmentPlanId) // only show primary concern if no treatment plan (i.e. individual/independent session)
  const isObservationsEditable = computed(() => ['confirmed', 'scheduled', 'in_progress'].includes(appointment.status))
  const sessionNotYetstarted = computed(() => ['confirmed', 'scheduled'].includes(appointment.status))

  // ─── Watchers ────────────────────────────────────────────────
  watch(
    () => appointment,
    (value) => {
      if (!value) return
      sessionNotes.value = value.sessionNotes || ''
      primaryConcern.value = value.primaryConcern || ''
      observations.value = value.observations || ''
    },
    { immediate: true }
  )

  // ─── Event handlers ──────────────────────────────────────────
  function handleSaveClinicalNotes(field: ClinicalNoteField) {
    console.info('🚀 ~ handleSaveClinicalNotes ~ field:', field)

    const fieldValues: Record<ClinicalNoteField, string> = {
      primaryConcern: primaryConcern.value,
      sessionNotes: sessionNotes.value,
      observations: observations.value
    }
    console.info('🚀 ~ handleSaveClinicalNotes ~ fieldValues:', fieldValues)

    if (['in_progress', 'finished'].includes(appointment.status)) {
    }

    console.info('🚀 ~ handleSaveClinicalNotes ~ appointment.status:', appointment.status)

    // if (appointment.status !== 'in_progress' && appointment.status !== 'finished') {
    //   if (field !== 'primaryConcern' && field !== 'sessionNotes') return
    // }

    updateClinicalNotes({
      appointmentId: appointment.id,
      [field]: fieldValues[field]
    })
  }
</script>

<template>
  <div class="flex flex-col gap-4 lg:col-span-6">
    <AppCard
      v-if="showPrimaryConcern"
      title="Motif de consultation"
      description="Raison principale de la consultation, exprimée par le patient."
    >
      <template #actions>
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
      </template>
      <UTextarea
        v-model="primaryConcern"
        :rows="3"
        placeholder="Ex: Douleur lombaire depuis 2 semaines après effort physique."
        :ui="{ root: 'w-full' }"
      />
    </AppCard>

    <AppCard title="Observations" description="Constats objectifs: douleur, mobilité, tests, palpation.">
      <template #actions>
        <UButton
          v-if="isObservationsEditable"
          size="xs"
          color="primary"
          variant="ghost"
          icon="i-hugeicons-floppy-disk"
          :loading="isUpdatingClinicalNotes"
          :disabled="!isObservationsEditable"
          @click="handleSaveClinicalNotes('observations')"
        >
          Enregistrer
        </UButton>
      </template>
      <UTextarea
        v-model="observations"
        :rows="4"
        :disabled="!isObservationsEditable"
        placeholder="Ex: Douleur 6/10, mobilité réduite en flexion, contracture lombaire droite"
        :ui="{ root: 'w-full' }"
      />
    </AppCard>

    <AppCard
      title="Compte rendu de séance"
      description="Exercices effectués, réactions du patient, progrès observés et suite à donner."
    >
      <template #actions>
        <UButton
          size="xs"
          color="primary"
          variant="ghost"
          icon="i-hugeicons-floppy-disk"
          :loading="isUpdatingClinicalNotes"
          :disabled="sessionNotYetstarted"
          @click="handleSaveClinicalNotes('sessionNotes')"
        >
          Enregistrer
        </UButton>
      </template>
      <UTextarea
        v-model="sessionNotes"
        :disabled="sessionNotYetstarted"
        :rows="8"
        placeholder="Ex: Mobilisation lombaire + exercices. Douleur réduite à 4/10. À poursuivre, revoir bientôt"
        :ui="{ root: 'w-full' }"
      />
    </AppCard>
  </div>
</template>
