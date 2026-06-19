<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const { user } = await useAuth()
  const { getTherapistName } = useOrganizationMembers()
  const { mutate: updateTreatmentPlan } = useUpdateTreatmentPlan()

  const currentAuthor = computed(() => (user.value ? getTherapistName(user.value.id) : 'Praticien'))

  function onUpdateNotes(notes: Note[]) {
    updateTreatmentPlan({ planId: props.treatmentPlan.id, data: { notes } })
  }
</script>

<template>
  <PatientNotesEditor
    :notes="treatmentPlan.notes ?? []"
    title="Notes"
    description="Notes de suivi du plan de traitement"
    placeholder="Ajouter une note clinique..."
    empty-description="Aucune note de suivi pour ce plan de traitement."
    :current-author="currentAuthor"
    @update="onUpdateNotes"
  />
</template>
