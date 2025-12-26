<script setup lang="ts">
  import { getLocalTimeZone, today } from '@internationalized/date'

  const notes = defineModel<Note[] | null>()

  const { user } = await useAuth()

  const newNote = ref('')

  function addNote() {
    if (!newNote.value.trim()) return

    if (!notes.value) notes.value = []

    notes.value.push({
      content: newNote.value.trim(),
      date: today(getLocalTimeZone()).toString(),
      author: user.value ? `Dr. ${user.value.lastName}` : 'Unknown'
    })

    newNote.value = ''
  }

  function removeNote(index: number) {
    notes.value?.splice(index, 1)
  }
</script>

<template>
  <div class="space-y-4">
    <div>
      <UFormField label="Nouvelle note" name="newNote">
        <UTextarea
          v-model="newNote"
          placeholder="Ajouter une nouvelle note..."
          :rows="3"
          class="w-full"
          @keyup.enter.ctrl="addNote"
        />
      </UFormField>
      <div class="mt-3 flex justify-end gap-3">
        <UButton label="Annuler" color="neutral" variant="subtle" @click="newNote = ''" />
        <UButton label="Enregistrer" color="primary" :disabled="!newNote.trim()" @click="addNote" />
      </div>
    </div>

    <div class="border-default border-t">
      <template v-if="notes && notes.length > 0">
        <h4 class="text-foreground mb-2 text-sm font-semibold">Notes enregistrées</h4>
        <ul class="space-y-3">
          <li v-for="(note, index) in notes" :key="index" class="bg-muted rounded-lg p-2">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-foreground text-sm">{{ note.content }}</p>
                <p class="text-muted-foreground mt-1 text-xs">{{ formatFrenchDate(note.date) }} - {{ note.author }}</p>
              </div>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="removeNote(index)"
                class="ml-2 shrink-0"
              />
            </div>
          </li>
        </ul>
      </template>

      <UEmpty
        v-else
        variant="naked"
        icon="i-lucide-file-text"
        title="Aucune note ajoutée"
        description="Ajoutez des notes pour suivre l'évolution du patient."
        class="p-0"
      />
    </div>
  </div>
</template>
