<script setup lang="ts">
  import { CalendarDate, getLocalTimeZone, parseDate, parseTime, today } from '@internationalized/date'
  import { computed } from 'vue'

  const props = defineProps<{
    therapists: User[]
    treatmentPlan: TreatmentPlan
  }>()

  const createConsultationMutation = useCreateConsultation()
  const toast = useToast()

  const isCreating = ref(false)
  const minDate = computed(() => convertToCalendarDate(new Date()))
  const availableSlots = ref<string[]>([])
  const isLoadingSlots = ref(false)
  const slotsError = ref<string | null>(null)

  const selectedDate = computed<CalendarDate | null>({
    get: () => (consultationDetails.value.date ? parseDate(consultationDetails.value.date) : null),
    set: (val) => {
      if (val) {
        consultationDetails.value.date = val.toString()
      }
    }
  })

  const consultationDetails = ref<ConsultationCreate>({
    patientId: props.treatmentPlan.patientId,
    organizationId: props.treatmentPlan.organizationId,
    treatmentPlanId: props.treatmentPlan?.id,
    therapistId: props.treatmentPlan.therapistId,
    date: today(getLocalTimeZone()).toString(),
    startTime: '',
    endTime: '',
    duration: 45,
    type: 'follow_up',
    location: 'clinic',
    status: 'scheduled',
    chiefComplaint: '',
    notes: '',
    billed: null,
    insuranceClaimed: false
  })

  watch(
    () => consultationDetails.value.startTime,
    (newStartTime) => {
      const { duration } = consultationDetails.value
      if (newStartTime && duration) {
        try {
          const time = parseTime(newStartTime)
          consultationDetails.value.endTime = time.add({ minutes: duration }).toString().slice(0, 5)
        } catch {
          console.log('Error parsing time')
        }
      }
    }
  )

  watch(
    () => props.treatmentPlan?.therapistId,
    (newTherapistId) => {
      const therapist = props.therapists.find((t) => t.id === newTherapistId)
      if (therapist?.defaultConsultationDuration) {
        consultationDetails.value.duration = therapist.defaultConsultationDuration
      }
    },
    { immediate: true }
  )

  const fetchAvailableSlots = async () => {
    const therapistId = consultationDetails.value.therapistId
    const date = consultationDetails.value.date
    const duration = consultationDetails.value.duration
    const location = consultationDetails.value.location

    if (!therapistId || !date) {
      availableSlots.value = []
      return
    }

    isLoadingSlots.value = true
    slotsError.value = null

    try {
      const response = await $fetch(`/api/availability/${therapistId}/slots`, {
        method: 'POST',
        body: {
          dates: [date],
          duration,
          location
        }
      })

      const dateSlots = response.slots[date]

      console.log('🚀 >>> ', 'dateSlots', ': ', dateSlots)

      if (dateSlots) {
        availableSlots.value = dateSlots.availableSlots
      } else {
        availableSlots.value = []
      }
    } catch (error: any) {
      console.error('Failed to fetch slots:', error)
      slotsError.value = error?.message || 'Impossible de charger les créneaux'
      availableSlots.value = []
    } finally {
      isLoadingSlots.value = false
    }
  }

  watch(
    () => [
      consultationDetails.value.therapistId,
      consultationDetails.value.date,
      consultationDetails.value.duration,
      consultationDetails.value.location
    ],
    () => {
      consultationDetails.value.startTime = ''
      fetchAvailableSlots()
    },
    { deep: true }
  )

  const addConsultation = async () => {
    isCreating.value = true

    try {
      await createConsultationMutation.mutateAsync({
        patientId: props.treatmentPlan.patientId,
        consultationData: consultationDetails.value
      })
      await fetchAvailableSlots()
      consultationDetails.value.startTime = ''
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de créer la consultation').message,
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
    isCreating.value = false
  }

  const selectTime = (time: string) => {
    consultationDetails.value.startTime = time
  }

  const getTimeButtonVariant = (time: string) => {
    return consultationDetails.value.startTime === time ? 'solid' : 'subtle'
  }

  const getTimeButtonColor = (time: string) => {
    return consultationDetails.value.startTime === time ? 'primary' : 'neutral'
  }
</script>

<template>
  <AppCard title="Planification manuelle des séances">
    <UForm>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div class="grid gap-6">
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

          <UFormField label="Lieu">
            <UFieldGroup>
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

          <UFormField :label="`Durée: ${consultationDetails.duration} minutes`">
            <template #hint>
              <span v-if="consultationDetails.endTime && consultationDetails.startTime" class="text-elevated text-xs">
                Fin: {{ consultationDetails.endTime }}
              </span>
            </template>
            <div class="space-y-2">
              <USlider
                v-model="consultationDetails.duration"
                :min="CONSULTATION_DURATIONS[0]"
                :max="CONSULTATION_DURATIONS.at(-1)"
                :step="15"
                size="lg"
              />
              <div class="flex justify-between text-xs tabular-nums">
                <span v-for="val in CONSULTATION_DURATIONS" :key="val" class="inline-block w-[3ch] text-center">
                  {{ val }}
                </span>
              </div>
            </div>
          </UFormField>
          <AppCard variant="subtle">
            <UCalendar
              v-model="selectedDate"
              :year-controls="false"
              :min-value="minDate"
              :is-date-unavailable="isDateDisabled"
            />
            {{ selectedDate }}
          </AppCard>
        </div>

        <div class="mt-6">
          <AppCard variant="subtle" :ui="{ body: 'h-full flex flex-col justify-between' }">
            <UFormField label="Heure de la séance">
              <template v-if="isLoadingSlots">
                <div class="grid grid-cols-3 gap-2 pb-6 sm:grid-cols-4">
                  <USkeleton v-for="i in 12" :key="i" class="border-default h-10 w-full rounded-lg border" />
                </div>
              </template>

              <template v-else-if="slotsError">
                <UAlert color="error" variant="subtle">
                  {{ slotsError }}
                </UAlert>
              </template>

              <template v-else-if="availableSlots.length === 0">
                <UAlert color="neutral" variant="subtle" icon="i-lucide-calendar-x">
                  Aucun créneau disponible pour cette date
                </UAlert>
              </template>

              <template v-else>
                <div class="grid grid-cols-3 gap-2 pb-6 sm:grid-cols-4">
                  <UButton
                    v-for="time in availableSlots"
                    block
                    size="md"
                    :key="time"
                    :variant="getTimeButtonVariant(time)"
                    :color="getTimeButtonColor(time)"
                    @click="selectTime(time)"
                  >
                    {{ time }}
                  </UButton>
                </div>
              </template>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              color="primary"
              size="lg"
              block
              :loading="isCreating"
              :disabled="isCreating"
              @click="addConsultation"
            >
              Ajouter cette séance au plan
            </UButton>
          </AppCard>
        </div>
      </div>
    </UForm>
  </AppCard>
</template>
