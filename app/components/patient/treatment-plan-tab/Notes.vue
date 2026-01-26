<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const toast = useToast()
  const { user } = await useAuth()
  const { getTherapistName } = useOrganizationMembers()
  const { mutate: updateTreatmentPlan, isLoading: isSubmittingNote } = useUpdateTreatmentPlan()

  const newNote = ref('')

  const sortedNotes = computed(() => {
    const notes = (props.treatmentPlan.notes as any[]) || []
    return [...notes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((note, index) => ({
        date: formatRelativeDate(note.date),
        description: note.content,
        author: note.author || 'Auteur inconnu',
        icon: index === 0 ? 'i-hugeicons-checkmark-circle-02' : 'i-hugeicons-circle'
      }))
  })

  const addNote = async () => {
    if (!user.value) {
      toast.add({
        title: 'Erreur',
        description: 'Utilisateur non connecté.',
        color: 'error'
      })
      return
    }

    const content = newNote.value.trim()
    if (!content) {
      toast.add({
        title: 'Erreur',
        description: 'Veuillez entrer une note.',
        color: 'error'
      })
      return
    }

    const newNoteEntry = {
      date: new Date(),
      author: getTherapistName(user.value.id),
      content
    }

    const currentNotes = props.treatmentPlan.notes || []

    updateTreatmentPlan({
      planId: props.treatmentPlan.id,
      data: {
        notes: [...currentNotes, newNoteEntry]
      },
      onSuccess: () => {
        newNote.value = ''
      }
    })
  }
</script>

<template>
  <UCard>
    <h3 class="mb-4! text-base font-bold">Notes &amp; Suivi</h3>
    <div class="space-y-4">
      <UFieldGroup class="w-full">
        <UTextarea
          v-model="newNote"
          variant="soft"
          placeholder="Ajouter une note clinique..."
          :rows="3"
          class="min-h-20 w-full resize-none"
        />
        <UButton
          icon="i-hugeicons-telegram"
          size="sm"
          variant="subtle"
          color="primary"
          class="absolute right-2 bottom-2 rounded-md!"
          :loading="isSubmittingNote"
          :disabled="!newNote.trim() || isSubmittingNote"
          @click="addNote"
        />
      </UFieldGroup>

      <div class="border-default border-t pt-4">
        <div v-if="sortedNotes.length === 0" class="text-center">
          <p class="text-muted text-sm">Aucune note de suivi pour ce plan de traitement</p>
        </div>
        <div v-else class="overflow-y-auto">
          <UTimeline :items="sortedNotes" :default-value="99" size="2xs" :ui="{ wrapper: 'pb-1' }">
            <template #date="{ item }">
              <div class="text-dimmed text-xs/5">{{ item.date }} • {{ item.author }}</div>
            </template>
            <template #description="{ item }">
              <div class="text-toned text-sm">
                {{ item.description }}
              </div>
            </template>
          </UTimeline>
        </div>
      </div>
    </div>
  </UCard>
</template>
