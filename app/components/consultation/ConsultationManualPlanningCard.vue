<script setup lang="ts">
  import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
  import { computed } from 'vue'

  const props = defineProps<{
    therapists: User[]
    treatmentPlan: TreatmentPlan
  }>()

  // Time slots configuration
  const TIME_SLOTS = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30'
  ]

  const unavailableSlots = new Set(['10:30', '11:30', '16:30'])

  // State management
  const isCreating = ref(false)
  const minDate = computed(() => convertToCalendarDate(new Date()))

  // Computed property for calendar date model
  const selectedDate = computed<CalendarDate | null>({
    get: () => {
      return consultationDetails.value.date ? convertToCalendarDate(consultationDetails.value.date) : null
    },
    set: (val) => {
      if (val) {
        consultationDetails.value.date = val.toDate(getLocalTimeZone())
      }
    }
  })

  const consultationDetails = ref<ConsultationCreate>({
    patientId: props.treatmentPlan.patientId,
    organizationId: props.treatmentPlan.organizationId,
    treatmentPlanId: props.treatmentPlan?.id,
    therapistId: props.treatmentPlan.therapistId,
    date: new Date(),
    startTime: '',
    duration: 45,
    type: 'follow_up' as ConsultationSessionType,
    location: 'clinic' as ConsultationLocation,
    status: 'scheduled',
    chiefComplaint: '',
    notes: '',
    billed: false,
    insuranceClaimed: false
  })

  // Computed properties
  const isFormValid = computed(
    () =>
      !!(
        consultationDetails.value.therapistId &&
        selectedDate.value &&
        consultationDetails.value.startTime &&
        consultationDetails.value.type &&
        consultationDetails.value.location
      )
  )

  const endTime = computed(() => {
    const startTime = consultationDetails.value.startTime
    const duration = consultationDetails.value.duration
    if (!startTime || !duration) return ''

    const timeParts = startTime.split(':')
    if (timeParts.length !== 2) return ''

    const hours = parseInt(timeParts[0] ?? '', 10)
    const minutes = parseInt(timeParts[1] ?? '', 10)

    if (isNaN(hours) || isNaN(minutes)) return ''

    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  })

  // Add consultation handler
  const addConsultation = async () => {
    // TODO
    console.log('🚀 >>> ', 'Add consultation')
  }

  // Time slot handlers
  const selectTime = (time: string) => {
    if (!unavailableSlots.has(time)) {
      consultationDetails.value.startTime = time
    }
  }

  const getTimeButtonVariant = (time: string) => {
    if (unavailableSlots.has(time)) return 'soft'
    return consultationDetails.value.startTime === time ? 'solid' : 'subtle'
  }

  const getTimeButtonColor = (time: string) => {
    return unavailableSlots.has(time) ? 'neutral' : 'primary'
  }
</script>

<template>
  <AppCard title="Planification manuelle des séances">
    <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
      <!-- Therapist Selection -->
      <UFormField label="Kinésithérapeute responsable" name="therapistId">
        <USelectMenu
          v-model="consultationDetails.therapistId"
          value-key="id"
          label-key="name"
          :items="therapists"
          placeholder="Sélectionner un thérapeute"
          class="w-full"
        />
      </UFormField>

      <!-- Location Selection -->
      <UFormField label="Lieu">
        <UFieldGroup class="flex">
          <UButton
            v-for="loc in CONSULTATION_LOCATION_OPTIONS"
            :key="loc.value"
            :variant="consultationDetails.location === loc.value ? 'solid' : 'subtle'"
            :color="consultationDetails.location === loc.value ? 'primary' : 'neutral'"
            :icon="loc.icon"
            block
            @click="consultationDetails.location = loc.value"
          >
            {{ loc.label }}
          </UButton>
        </UFieldGroup>
      </UFormField>

      <!-- Session Type -->
      <UFormField label="Type de séance">
        <USelect
          v-model="consultationDetails.type"
          :items="CONSULTATION_TYPES_OPTIONS"
          option-attribute="label"
          value-attribute="value"
          placeholder="Sélectionner un type"
          class="w-full"
        />
      </UFormField>

      <!-- Duration Slider -->
      <UFormField :label="`Durée: ${consultationDetails.duration} minutes`">
        <template #hint>
          <span v-if="endTime && consultationDetails.startTime" class="text-elevated text-xs">Fin: {{ endTime }}</span>
        </template>
        <div class="space-y-2">
          <USlider v-model="consultationDetails.duration" :min="15" :max="90" :step="15" size="lg" />
          <div class="flex justify-between text-xs">
            <span v-for="val in [15, 30, 45, 60, 75, 90]" :key="val">{{ val }}</span>
          </div>
        </div>
      </UFormField>
    </div>

    <!-- Date & Time Selection -->
    <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- Calendar -->
      <AppCard variant="subtle">
        <UCalendar
          v-model="selectedDate"
          :year-controls="false"
          :min-value="minDate"
          :is-date-unavailable="isDateDisabled"
        />
      </AppCard>

      <!-- Time Selection -->
      <AppCard variant="subtle" :ui="{ body: 'h-full flex flex-col justify-between' }">
        <UFormField label="Heure de la séance">
          <div class="grid grid-cols-3 gap-2 pb-6 sm:grid-cols-4">
            <UButton
              v-for="time in TIME_SLOTS"
              block
              size="md"
              :key="time"
              :variant="getTimeButtonVariant(time)"
              :color="getTimeButtonColor(time)"
              :disabled="unavailableSlots.has(time) || !selectedDate"
              @click="selectTime(time)"
            >
              {{ time }}
            </UButton>
          </div>
        </UFormField>

        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="lg"
          block
          :loading="isCreating"
          :disabled="!isFormValid || isCreating"
          @click="addConsultation"
        >
          Ajouter cette séance au plan
        </UButton>
      </AppCard>
    </div>
  </AppCard>
</template>
