<script setup lang="ts">
  import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const { patient } = defineProps<{ patient: Patient }>()

  const fullAddress = computed(() => {
    const parts = []
    if (patient?.address) parts.push(patient.address)
    if (patient?.city) parts.push(patient.city)
    if (patient?.postalCode) parts.push(patient.postalCode)
    if (patient?.country) parts.push(patient.country)
    return parts.join(', ') || '-'
  })

  const insuranceDetails = computed(() => {
    if (patient?.insuranceProvider) {
      let details = patient.insuranceProvider
      if (patient?.insuranceNumber) {
        details += ` (${patient.insuranceNumber})`
      }
      return details
    }
    return '-'
  })

  const practitionerNotes = computed(() => {
    if (patient?.notes && patient.notes.length > 0) {
      return patient.notes.map((note) => ({
        text: note.content,
        author: note.author,
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
  <div class="flex flex-col gap-6 lg:col-span-1">
    <!-- Données administratives -->
    <AppCard variant="outline" title="Données administratives">
      <div class="space-y-3 text-sm">
        <div class="flex items-start gap-3">
          <UBadge icon="i-lucide-home" size="md" color="primary" variant="soft" class="p-1.5" />
          <div>
            <h3 class="text-muted font-semibold">Adresse</h3>
            <p class="font-medium">{{ fullAddress }}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <UBadge icon="i-lucide-heart" size="md" color="primary" variant="soft" class="p-1.5" />
          <div>
            <h3 class="text-muted font-semibold">Assurance/Mutuelle</h3>
            <p class="font-medium">{{ insuranceDetails }}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <UBadge icon="i-lucide-stethoscope" size="md" color="primary" variant="soft" class="p-1.5" />

          <div>
            <h3 class="text-muted font-semibold">Médecin prescripteur</h3>
            <p class="font-medium">{{ patient.referralSource || '-' }}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <UBadge icon="i-lucide-phone-call" size="md" color="primary" variant="soft" class="p-1.5" />
          <div class="w-full">
            <h3 class="text-muted font-semibold">Contacts d'urgence</h3>
            <div class="mt-4 space-y-2">
              <div
                v-for="(contact, index) in patient?.emergencyContacts"
                :key="index"
                class="flex w-full items-start gap-3"
              >
                <UBadge
                  icon="i-lucide-chevron-right"
                  size="sm"
                  color="neutral"
                  variant="soft"
                  class="rounded-full p-1.5"
                />
                <div>
                  <p class="font-semibold">
                    {{ contact.name || 'Sans nom' }}

                    <span v-if="contact.relationship" class="font-normal">
                      ({{ getRelationshipLabel(contact.relationship) }})
                    </span>
                  </p>
                  <p class="font-title">{{ contact.number || '-' }}</p>
                </div>
              </div>
              <div v-if="patient?.emergencyContacts?.length === 0" class="text-muted text-sm">
                Aucun contact d'urgence enregistré
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Données médicales -->
    <AppCard variant="outline">
      <h2 class="mb-5 text-lg font-bold">Données médicales</h2>
      <div class="space-y-3 text-sm">
        <div>
          <h3 class="text-muted mb-2 font-semibold">Allergies / Contre-indications</h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="allergy in patient.allergies"
              :key="allergy"
              color="error"
              variant="subtle"
              class="rounded-full"
            >
              {{ allergy }}
            </UBadge>
            <span v-if="patient.allergies?.length === 0" class="text-muted">Aucune allergie connue</span>
          </div>
        </div>
        <div>
          <h3 class="text-muted mb-2 font-semibold">Chirurgies</h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="surgery in patient.surgeries"
              :key="surgery"
              color="error"
              variant="subtle"
              class="rounded-full"
            >
              {{ surgery }}
            </UBadge>
            <span v-if="patient.surgeries?.length === 0" class="text-muted">Aucune chirurgie connue</span>
          </div>
        </div>
        <div>
          <h3 class="text-muted mb-2 font-semibold">Antécédents médicaux</h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="condition in patient.medicalConditions"
              :key="condition"
              color="warning"
              variant="subtle"
              class="rounded-full"
            >
              {{ condition }}
            </UBadge>
            <span v-if="patient.medicalConditions?.length === 0" class="text-muted">
              Aucun antécédent médical connu
            </span>
          </div>
        </div>
        <div>
          <h3 class="text-muted mb-2 font-semibold">Traitement actuel</h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="medication in patient.medications"
              :key="medication"
              color="primary"
              variant="subtle"
              class="rounded-full"
            >
              {{ medication }}
            </UBadge>
            <span v-if="patient.medications?.length === 0" class="text-muted">Aucun traitement en cours</span>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Notes du praticien -->
    <AppCard variant="outline">
      <template #header>
        <h2 class="text-lg font-bold">Notes du praticien</h2>
      </template>
      <div class="space-y-4">
        <UTextarea placeholder="Ajouter une note rapide..." :rows="2" class="w-full" />
        <div v-for="note in practitionerNotes" :key="note.date" class="text-sm">
          <p class="truncate">{{ note.text }}</p>
          <p class="text-muted text-xs">{{ note.author }} - {{ note.date }}</p>
        </div>
        <div v-if="practitionerNotes.length === 0" class="text-muted text-sm">Aucune note enregistrée</div>
      </div>
    </AppCard>
  </div>
</template>
