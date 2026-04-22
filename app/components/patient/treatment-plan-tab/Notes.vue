<script setup lang="ts">
  import { LazyAppModalConfirm } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const confirmModal = useOverlay().create(LazyAppModalConfirm)
  const { user } = await useAuth()
  const { getTherapistName } = useOrganizationMembers()
  const { mutate: updateTreatmentPlan } = useUpdateTreatmentPlan()

  const showInput = ref(false)
  const newNoteText = ref('')
  const showAllNotes = ref(false)
  const editingNoteIndex = ref<number | null>(null)
  const editingNoteText = ref('')

  const sortedNotes = computed(() => {
    const notes = props.treatmentPlan.notes || []
    return [...notes]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((note) => ({
        text: note.content,
        date: formatRelativeDate(note.date),
        author: note.author || 'Auteur inconnu'
      }))
  })

  function getNoteActions(index: number) {
    return [
      {
        label: 'Modifier',
        icon: 'i-hugeicons-pencil-edit-01',
        onSelect: () => startEditNote(index)
      },
      {
        label: 'Supprimer',
        icon: 'i-hugeicons-delete-02',
        color: 'error' as const,
        onSelect: () => confirmDeleteNote(index)
      }
    ]
  }

  function startEditNote(index: number) {
    editingNoteIndex.value = index
    editingNoteText.value = sortedNotes.value?.[index]?.text || ''
  }

  function cancelEditNote() {
    editingNoteIndex.value = null
    editingNoteText.value = ''
  }

  function saveEditNote() {
    if (editingNoteIndex.value === null || !editingNoteText.value.trim()) return

    const notes = [...(props.treatmentPlan.notes || [])].sort((a, b) => b.date.getTime() - a.date.getTime())
    const noteToEdit = notes[editingNoteIndex.value]

    const updatedNotes = (props.treatmentPlan.notes || []).map((note) =>
      note === noteToEdit ? { ...note, content: editingNoteText.value.trim() } : note
    )

    updateTreatmentPlan({
      planId: props.treatmentPlan.id,
      data: { notes: updatedNotes }
    })
    cancelEditNote()
  }

  async function confirmDeleteNote(index: number) {
    const notes = [...(props.treatmentPlan.notes || [])].sort((a, b) => a.date.getTime() - b.date.getTime())
    const noteToDelete = notes[index]

    const confirmed = await confirmModal.open({
      title: 'Supprimer la note',
      message: 'Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-delete-02'
    })

    if (confirmed) {
      const updatedNotes = (props.treatmentPlan.notes || []).filter((note) => note !== noteToDelete)
      updateTreatmentPlan({
        planId: props.treatmentPlan.id,
        data: { notes: updatedNotes }
      })
    }
  }

  async function addNote() {
    if (!newNoteText.value.trim()) return

    const newNoteEntry = {
      date: new Date(),
      author: user.value ? getTherapistName(user.value.id) : 'Praticien',
      content: newNoteText.value.trim()
    }

    const currentNotes = props.treatmentPlan.notes || []
    updateTreatmentPlan({
      planId: props.treatmentPlan.id,
      data: { notes: [...currentNotes, newNoteEntry] }
    })
    newNoteText.value = ''
    showInput.value = false
  }

  function cancelAddNote() {
    newNoteText.value = ''
    showInput.value = false
  }

  onKeyStroke('Escape', () => {
    if (editingNoteIndex.value !== null) {
      cancelEditNote()
    }
  })
</script>

<template>
  <AppCard title="Notes" description="Notes de suivi du plan de traitement" class="relative">
    <template #actions>
      <UButton
        variant="ghost"
        color="primary"
        icon="i-hugeicons-add-01"
        square
        @click="showInput = true"
        class="absolute top-3 right-3"
      />
    </template>
    <div class="space-y-4">
      <div v-if="showInput" class="space-y-2">
        <UTextarea
          v-model="newNoteText"
          variant="soft"
          placeholder="Ajouter une note clinique..."
          :rows="3"
          class="min-h-20 w-full resize-none"
        />
        <div class="flex gap-2">
          <UButton size="sm" @click="addNote">Ajouter</UButton>
          <UButton size="sm" variant="ghost" @click="cancelAddNote">Annuler</UButton>
        </div>
      </div>
      <div v-if="sortedNotes.length > 0" class="space-y-2">
        <div
          v-for="(note, index) in sortedNotes.slice(0, showAllNotes ? undefined : 3)"
          :key="index"
          class="bg-muted hover:border-default rounded-lg border border-transparent p-2 transition-colors hover:shadow-sm"
        >
          <UTextarea
            v-if="editingNoteIndex === index"
            v-model="editingNoteText"
            variant="soft"
            :rows="3"
            class="mb-2 min-h-16 w-full resize-none"
          />
          <p v-else class="text-highlighted text-[13px] whitespace-pre-line">{{ note.text }}</p>
          <div class="flex items-end justify-between text-xs capitalize">
            <div class="text-muted text-[11px]">{{ note.date }} • {{ note.author }}</div>
            <ClientOnly>
              <div v-if="editingNoteIndex === index" class="flex gap-1">
                <UButton size="xs" variant="ghost" @click="cancelEditNote">Annuler</UButton>
                <UButton size="xs" @click="saveEditNote">Enregistrer</UButton>
              </div>
              <UDropdownMenu v-else size="sm" :items="getNoteActions(index)" :content="{ align: 'end' }">
                <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" size="xs" square />
              </UDropdownMenu>
            </ClientOnly>
          </div>
        </div>
        <UButton v-if="sortedNotes.length > 3" variant="ghost" size="sm" block @click="showAllNotes = !showAllNotes">
          {{ showAllNotes ? 'Afficher moins' : `+ ${sortedNotes.length - 3} note${sortedNotes.length - 3 > 1 ? 's' : ''} supplémentaire${sortedNotes.length - 3 > 1 ? 's' : ''}` }}
        </UButton>
      </div>
      <UEmpty
        v-else
        size="xs"
        variant="subtle"
        icon="i-hugeicons-note-02"
        title="Aucune note enregistrée"
        description="Aucune note de suivi pour ce plan de traitement."
      />
    </div>
  </AppCard>
</template>
