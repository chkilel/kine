<script setup lang="ts">
  import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const { patient } = defineProps<{ patient: Patient }>()

  const practitionerNotes = computed(() => {
    if (patient?.notes && patient.notes.length > 0) {
      return patient.notes.map((note) => ({
        text: note.content,
        date: formatHumanDate(note.date)
      }))
    }
    return []
  })

  function formatHumanDate(date: Date | string) {
    const noteDate = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    const diffInDays = differenceInDays(now, noteDate)

    if (diffInDays === 0) return "Aujourd'hui"
    if (diffInDays === 1) return 'Hier'

    return formatDistanceToNow(noteDate, { addSuffix: true, locale: fr })
  }
</script>

<template>
  <AppCard title="Notes du praticien">
    <div class="space-y-4">
      <div v-if="practitionerNotes.length > 0" class="space-y-2">
        <div v-for="(note, index) in practitionerNotes" :key="index" class="bg-muted rounded-lg p-2.5 text-xs">
          <p class="text-muted font-medium">{{ index + 1 }}. {{ note.text }}</p>
          <p class="text-muted mt-1 text-[10px]">{{ note.date }}</p>
        </div>
      </div>
      <div v-else class="text-muted mb-3 text-sm">Aucune note enregistrée</div>
    </div>
  </AppCard>
</template>
