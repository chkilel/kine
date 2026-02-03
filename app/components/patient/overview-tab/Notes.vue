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

  const router = useRouter()

  function navigateToPlan() {
    router.push(`/patients/${patient.id}/plan`)
  }
</script>

<template>
  <AppCard title="Notes Générales du Patient">
    <template #subtitle>Notes permanentes sur le patient</template>
    <div class="space-y-4">
      <div v-if="practitionerNotes.length > 0" class="space-y-2">
        <div
          v-for="(note, index) in practitionerNotes.slice(0, 3)"
          :key="index"
          class="bg-muted rounded-lg p-2.5 text-xs"
        >
          <p class="text-muted font-medium">{{ note.text }}</p>
          <p class="text-muted mt-1 text-[10px]">{{ note.date }}</p>
        </div>
        <div v-if="practitionerNotes.length > 3" class="text-muted text-center text-xs">
          + {{ practitionerNotes.length - 3 }} note{{ practitionerNotes.length - 3 > 1 ? 's' : '' }} supplémentaire{{
            practitionerNotes.length - 3 > 1 ? 's' : ''
          }}
        </div>
      </div>
      <div v-else class="text-muted mb-3 text-sm">Aucune note enregistrée</div>

      <div class="border-default border-t pt-3">
        <UButton variant="ghost" size="sm" class="text-xs" @click="navigateToPlan">
          Voir les notes de traitement
          <UIcon name="i-lucide-arrow-right" class="size-3" />
        </UButton>
      </div>
    </div>
  </AppCard>
</template>
