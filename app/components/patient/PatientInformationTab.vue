<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'
  import { format, differenceInYears, parseISO } from 'date-fns'
  import { fr } from 'date-fns/locale'

  interface Props {
    patient: Patient
  }

  const props = defineProps<Props>()

  // Static data for demo purposes when API data is not available
  const staticPatientData = {
    phone: '06 12 34 56 78',
    email: 'jean.dupont@email.com',
    address: '123 Rue de la Santé',
    city: '75001 Paris, France',
    insurance: 'Harmonie Mutuelle',
    insuranceNumber: 'HM123456789',
    coverage: '100%',
    doctor: 'Dr. Leroy (Généraliste)',
    prescriptionDate: '12/08/2024',
    emergencyContact: 'Sophie Dupont (Épouse)',
    emergencyPhone: '06 87 65 43 21',
    nextAppointment: '15 Oct. 2024 à 10:00',
    pathology: 'Lombalgie chronique',
    treatmentGoal: 'Réduction douleur & mobilité',
    sessionsCompleted: 8,
    sessionsTotal: 15,
    painLevel: 6,
    allergies: 'Pénicilline, Pacemaker',
    medicalHistory: 'Hernie discale L4-L5 en 2018. Arthrose légère du genou droit.',
    currentTreatment: 'Anti-inflammatoires non stéroïdiens (si besoin).',
    notes:
      "Patient motivé. Bonne progression sur les exercices de renforcement du tronc. Penser à intégrer des exercices d'étirement la prochaine séance."
  }

  function formatDate(date?: Date | string) {
    if (!date) return '-'
    try {
      let dateObj: Date
      if (date instanceof Date) {
        dateObj = date
      } else if (typeof date === 'string') {
        dateObj = parseISO(date)
      } else {
        return '-'
      }
      return format(dateObj, 'dd/MM/yyyy', { locale: fr })
    } catch (error) {
      console.error('Error formatting date:', error, date)
      return '-'
    }
  }

  function formatFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`
  }

  function getAge(dateOfBirth?: Date | string) {
    if (!dateOfBirth) return ''
    try {
      let birth: Date
      if (dateOfBirth instanceof Date) {
        birth = dateOfBirth
      } else if (typeof dateOfBirth === 'string') {
        birth = parseISO(dateOfBirth)
      } else {
        return ''
      }
      const age = differenceInYears(new Date(), birth)
      return age.toString()
    } catch (error) {
      console.error('Error calculating age:', error, dateOfBirth)
      return ''
    }
  }
</script>

<template>
  <div class="mt-6 space-y-6">
    <!-- Quick Summary -->
    <h2 class="mb-3 text-lg font-bold">Résumé rapide</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard variant="outline">
        <div class="mb-1 flex items-center gap-2">
          <UIcon name="i-lucide-heart-pulse" class="text-primary text-lg" />
          <p class="text-muted text-sm font-medium">Pathologie principale</p>
        </div>
        <p class="font-semibold">
          {{ staticPatientData.pathology }}
        </p>
      </UCard>
      <UCard variant="outline">
        <div class="mb-1 flex items-center gap-2">
          <UIcon name="i-lucide-target" class="text-primary text-lg" />
          <p class="text-muted text-sm font-medium">Objectif du traitement</p>
        </div>
        <p class="font-semibold">
          {{ staticPatientData.treatmentGoal }}
        </p>
      </UCard>
      <UCard variant="outline">
        <div class="mb-1 flex items-center gap-2">
          <UIcon name="i-lucide-calendar-check" class="text-primary text-lg" />
          <p class="text-muted text-sm font-medium">Séances</p>
        </div>
        <p class="font-semibold">
          {{ staticPatientData.sessionsCompleted }} / {{ staticPatientData.sessionsTotal }} effectuées
        </p>
      </UCard>
      <UCard variant="outline">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-lucide-thermometer" class="text-primary text-lg" />
          <p class="text-muted text-sm font-medium">Niveau de douleur actuel</p>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="bg-muted h-2.5 flex-1 rounded-full">
            <div class="bg-warning h-2.5 rounded-full" :style="`width: ${staticPatientData.painLevel * 10}%`"></div>
          </div>
          <span class="text-warning font-bold">{{ staticPatientData.painLevel }}/10</span>
        </div>
      </UCard>
    </div>

    <!-- Administrative Data -->
    <h2 class="mt-8 mb-3 text-lg font-bold">Données administratives</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
      <UCard variant="outline">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-lucide-map-pin" class="text-primary text-lg" />
          <h3 class="font-semibold">Adresse</h3>
        </div>
        <p class="text-toned text-sm">
          {{ patient.address || '-' }}
          <br v-if="patient.address && patient.city" />
          {{ patient.city || '' }}{{ patient.postalCode ? ` ${patient.postalCode}` : ''
          }}{{ patient.country ? `, ${patient.country}` : '' }}
        </p>
      </UCard>
      <UCard variant="outline">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-lucide-shield-check" class="text-primary text-lg" />
          <h3 class="font-semibold">Assurance / Mutuelle</h3>
        </div>
        <p class="text-toned text-sm">
          {{ patient.insuranceProvider || '-' }}
          <br v-if="patient.insuranceProvider" />
          N°: {{ patient.insuranceNumber || '-' }}
        </p>
      </UCard>
      <UCard variant="outline">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-lucide-user-check" class="text-primary text-lg" />
          <h3 class="font-semibold">Médecin prescripteur</h3>
        </div>
        <p class="text-toned text-sm">
          {{ patient.referralSource || '-' }}
          <br v-if="patient.referralSource && patient.referralDate" />
          Prescription du: {{ patient.referralDate ? formatDate(patient.referralDate) : '-' }}
        </p>
      </UCard>
      <UCard variant="outline">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-lucide-phone-call" class="text-primary text-lg" />
          <h3 class="font-semibold">Contact d'urgence</h3>
        </div>
        <p class="text-toned text-sm">
          <template v-if="patient.emergencyContacts && patient.emergencyContacts.length > 0">
            {{ patient.emergencyContacts[0]?.name }}
            ({{ patient.emergencyContacts[0]?.relationship }})
            <br />
            Tél: {{ patient.emergencyContacts[0]?.phone }}
          </template>
          <template v-else>Aucun contact d'urgence enregistré</template>
        </p>
      </UCard>
    </div>

    <!-- Medical Data -->
    <h2 class="mt-8 mb-3 text-lg font-bold">Données médicales</h2>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div class="flex flex-col gap-6">
        <UCard class="border-l-primary border-l-4">
          <div class="mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-alert-triangle" class="text-primary text-lg" />
            <h3 class="font-semibold">Allergies & Contre-indications</h3>
          </div>
          <div v-if="patient.allergies && patient.allergies.length > 0" class="flex gap-1.5">
            <UBadge
              variant="outline"
              color="warning"
              v-for="allergy in patient.allergies"
              :key="allergy"
              class="rounded-full"
            >
              {{ allergy }}
            </UBadge>
          </div>
          <p v-else class="text-toned text-sm">Aucune allergie connue</p>
        </UCard>
        <UCard class="border-l-primary border-l-4">
          <div class="mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-slice" class="text-primary text-lg" />
            <h3 class="font-semibold">Chirurgies</h3>
          </div>
          <div v-if="patient.surgeries && patient.surgeries.length > 0" class="flex gap-1.5">
            <UBadge
              variant="outline"
              color="primary"
              v-for="surgery in patient.surgeries"
              :key="surgery"
              class="rounded-full"
            >
              {{ surgery }}
            </UBadge>
          </div>
          <p v-else class="text-toned text-sm">Aucune chirurgie enregistrée</p>
        </UCard>

        <UCard class="border-l-primary border-l-4">
          <div class="mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-clipboard-list" class="text-primary text-lg" />
            <h3 class="font-semibold">Antécédents médicaux</h3>
          </div>

          <div v-if="patient.medicalConditions && patient.medicalConditions.length > 0" class="flex gap-1.5">
            <UBadge
              variant="outline"
              color="primary"
              v-for="condition in patient.medicalConditions"
              :key="condition"
              class="rounded-full"
            >
              {{ condition }}
            </UBadge>
          </div>
          <p v-else class="text-toned text-sm">Aucun antécédent médical enregistré</p>
        </UCard>
        <UCard class="border-l-neutral border-l-4">
          <div class="mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-pill" class="text-primary text-lg" />
            <h3 class="font-semibold">Médicaments actuels</h3>
          </div>

          <div v-if="patient.medications && patient.medications.length > 0" class="flex gap-1.5">
            <UBadge
              variant="outline"
              color="neutral"
              v-for="medication in patient.medications"
              :key="medication"
              class="rounded-full"
            >
              {{ medication }}
            </UBadge>
          </div>
          <p v-else class="text-toned text-sm">Aucun médicament enregistré</p>
        </UCard>
      </div>
      <!-- Notes -->
      <UCard variant="outline">
        <div class="mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="text-primary text-lg" />
          <h2 class="text-lg font-bold">Notes du praticien</h2>
        </div>
        <UCard variant="outline">
          <textarea
            v-model="patient.notes"
            class="text-toned w-full resize-none border-0 bg-transparent p-0 text-sm focus:ring-0"
            rows="4"
            placeholder="Ajouter des notes sur le patient..."
          ></textarea>
        </UCard>
      </UCard>
    </div>
  </div>
</template>
