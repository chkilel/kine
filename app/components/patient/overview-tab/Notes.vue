<script setup lang="ts">
  import { LazyAppModalConfirm } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  const { mutate: updatePatient } = useUpdatePatient()
  const { user } = await useAuth()

  const showInput = ref(false)
  const newNoteText = ref('')
  const showAllNotes = ref(false)

  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const editingNoteIndex = ref<number | null>(null)
  const editingNoteText = ref('')

  const practitionerNotes = computed(() => {
    if (patient?.notes && patient.notes.length > 0) {
      const sortedNotes = [...patient.notes].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date
        const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date
        return dateB.getTime() - dateA.getTime()
      })
      return sortedNotes.map((note) => ({
        text: note.content,
        date: formatRelativeDate(note.date),
        author: note.author
      }))
    }
    return []
  })

  function getNoteActions(index: number) {
    return [
      [
        {
          label: 'Modifier',
          icon: 'i-hugeicons-pencil-edit-01',
          onSelect: () => startEditNote(index)
        }
      ],
      [
        {
          label: 'Supprimer',
          icon: 'i-hugeicons-delete-02',
          color: 'error',
          onSelect: () => confirmDeleteNote(index)
        }
      ]
    ]
  }

  function startEditNote(index: number) {
    editingNoteIndex.value = index
    editingNoteText.value = practitionerNotes.value?.[index]?.text || ''
  }

  function cancelEditNote() {
    editingNoteIndex.value = null
    editingNoteText.value = ''
  }

  function saveEditNote() {
    if (editingNoteIndex.value === null || !editingNoteText.value.trim()) return

    const sortedNotes = [...patient.notes].sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date
      return dateB.getTime() - dateA.getTime()
    })

    const noteToEdit = sortedNotes[editingNoteIndex.value]
    const updatedNotes = patient.notes.map((note) =>
      note === noteToEdit ? { ...note, content: editingNoteText.value.trim() } : note
    )

    updatePatient({ patientId: patient.id, patientData: { notes: updatedNotes } })
    cancelEditNote()
  }

  async function confirmDeleteNote(index: number) {
    const sortedNotes = [...patient.notes].sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date
      return dateB.getTime() - dateA.getTime()
    })

    const noteToDelete = sortedNotes[index]

    const confirmed = await confirmModal.open({
      title: 'Supprimer la note',
      message: `Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-delete-02'
    })

    if (confirmed) {
      const updatedNotes = patient.notes.filter((note) => note !== noteToDelete)
      updatePatient({ patientId: patient.id, patientData: { notes: updatedNotes } })
    }
  }

  async function addNote() {
    if (newNoteText.value.trim()) {
      const newNote = {
        content: newNoteText.value.trim(),
        date: new Date(),
        author: user.value ? formatFullName(user.value) : 'Praticien'
      }
      const updatedNotes = patient.notes ? [...patient.notes, newNote] : [newNote]
      updatePatient({ patientId: patient.id, patientData: { notes: updatedNotes } })
      newNoteText.value = ''
      showInput.value = false
    }
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
  <AppCard title="Notes du Patient" description="Notes générales  sur le patient" class="relative">
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
          placeholder="Ajouter une note générale..."
          :rows="3"
          class="min-h-20 w-full resize-none"
        />
        <div class="flex gap-2">
          <UButton size="sm" @click="addNote">Ajouter</UButton>
          <UButton size="sm" variant="ghost" @click="cancelAddNote">Annuler</UButton>
        </div>
      </div>
      <div v-if="practitionerNotes.length > 0" class="space-y-2">
        <div
          v-for="(note, index) in practitionerNotes.slice(0, showAllNotes ? undefined : 3)"
          :key="index"
          class="bg-muted border-default relative gap-4 rounded-md border p-2.5"
        >
          <UTextarea
            v-if="editingNoteIndex === index"
            v-model="editingNoteText"
            variant="soft"
            :rows="3"
            class="mb-2 min-h-16 w-full resize-none"
          />
          <p v-else class="text-muted text-sm font-medium">{{ note.text }}</p>
          <div class="mt-1 flex items-center justify-between text-xs capitalize">
            <div class="text-dimmed text-xs/5">{{ note.date }} • {{ note.author }}</div>
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
        <div v-if="practitionerNotes.length > 3 && !showAllNotes">
          <UButton variant="ghost" size="sm" block @click="showAllNotes = true">
            + {{ practitionerNotes.length - 3 }} note{{ practitionerNotes.length - 3 > 1 ? 's' : '' }} supplémentaire{{
              practitionerNotes.length - 3 > 1 ? 's' : ''
            }}
          </UButton>
        </div>
      </div>
      <UEmpty
        v-else
        size="sm"
        variant="subtle"
        icon="i-hugeicons-note-02"
        title="Aucune note enregistrée"
        description="Aucune note n'a été enregistrée pour ce patient."
      />
    </div>
  </AppCard>
</template>
