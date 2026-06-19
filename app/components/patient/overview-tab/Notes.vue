<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()

  const { mutate: updatePatient } = useUpdatePatient()
  const { user } = await useAuth()

  const currentAuthor = computed(() => (user.value ? formatFullName(user.value) : 'Praticien'))

  function onUpdateNotes(notes: Note[]) {
    updatePatient({ patientId: patient.id, patientData: { notes } })
  }
</script>

<template>
  <PatientNotesEditor
    :notes="patient.notes ?? []"
    title="Notes"
    description="Notes générales relative au patient"
    placeholder="Ajouter une note générale..."
    empty-description="Aucune note n'a été enregistrée pour ce patient."
    :current-author="currentAuthor"
    @update="onUpdateNotes"
  />
</template>
