<script setup lang="ts">
  import { CalendarDate, getLocalTimeZone, parseDate, parseTime, today } from '@internationalized/date'

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
  const selectedRoomId = ref<string | null>(null)
  const showRoomOnlyAvailability = ref(false)

  const { data: roomsData } = useRoomsList(ref({}))

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
    roomId: selectedRoomId.value || '',
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

  const { data: templatesData } = useAvailabilityTemplatesList(() => consultationDetails.value.therapistId)
  const { data: exceptionsData } = useAvailabilityExceptionsList(() => consultationDetails.value.therapistId)

  const formattedDate = computed(() => {
    if (!consultationDetails.value.date) return ''
    const { dayName, day, month } = extractDayAndMonth(consultationDetails.value.date)
    return `${dayName} ${day} ${month}`
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

  watch(selectedRoomId, (newRoomId) => {
    consultationDetails.value.roomId = newRoomId || ''
  })

  const fetchAvailableSlots = async () => {
    const therapistId = consultationDetails.value.therapistId
    const date = consultationDetails.value.date
    const duration = consultationDetails.value.duration
    const location = consultationDetails.value.location

    if (!date) {
      availableSlots.value = []
      return
    }

    isLoadingSlots.value = true
    slotsError.value = null

    try {
      let response: any

      if (location === 'clinic') {
        if (!selectedRoomId.value) {
          availableSlots.value = []
          isLoadingSlots.value = false
          return
        }

        const therapistIdParam = showRoomOnlyAvailability.value ? undefined : therapistId

        response = await $fetch(`/api/availability/${selectedRoomId.value}/slots`, {
          method: 'POST',
          body: {
            dates: [date],
            duration,
            therapistId: therapistIdParam
          }
        })
      } else {
        if (!therapistId) {
          availableSlots.value = []
          isLoadingSlots.value = false
          return
        }

        response = await $fetch(`/api/availability/${therapistId}/slots`, {
          method: 'POST',
          body: {
            dates: [date],
            duration,
            location
          }
        })
      }

      const dateSlots = response.slots[date]

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
      consultationDetails.value.location,
      selectedRoomId.value,
      showRoomOnlyAvailability.value
    ],
    () => {
      consultationDetails.value.startTime = ''

      if (consultationDetails.value.location === 'clinic') {
        if (selectedRoomId.value) {
          fetchAvailableSlots()
        } else {
          availableSlots.value = []
        }
      } else {
        fetchAvailableSlots()
      }
    },
    { deep: true }
  )

  const dayTemplatesForDate = computed(() => {
    if (!consultationDetails.value.date || !templatesData.value) return []

    const dayOfWeek = getDayOfWeek(consultationDetails.value.date)
    const location = consultationDetails.value.location

    return templatesData.value.filter((t) => t.dayOfWeek === dayOfWeek && t.location === location)
  })

  const exceptionsForDate = computed(() => {
    if (!consultationDetails.value.date || !exceptionsData.value) return []

    return exceptionsData.value.filter((e) => e.date === consultationDetails.value.date)
  })

  const partialDayExceptions = computed(() => {
    return exceptionsForDate.value.filter((e) => e.startTime && e.endTime)
  })

  const addConsultation = async () => {
    if (consultationDetails.value.location === 'clinic' && !selectedRoomId.value) {
      toast.add({
        title: 'Erreur',
        description: 'Veuillez sélectionner une salle de consultation',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return
    }

    isCreating.value = true

    try {
      await createConsultationMutation.mutateAsync({
        patientId: props.treatmentPlan.patientId,
        consultationData: {
          ...consultationDetails.value,
          roomId: consultationDetails.value.location === 'clinic' ? selectedRoomId.value || undefined : undefined
        }
      })
      await fetchAvailableSlots()
      consultationDetails.value.startTime = ''
      if (consultationDetails.value.location === 'clinic') {
        selectedRoomId.value = null
      }
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

  const getPeriodLabel = (time: string) => {
    const hourPart = time.split(':')[0]
    if (!hourPart) return ''
    const hour = parseInt(hourPart)
    if (hour < 12) return 'Matin'
    if (hour >= 12 && hour < 14) return 'Midi'
    return 'Après-midi'
  }

  const groupSlotsByPeriod = () => {
    const periods: Record<string, string[]> = {
      Matin: [],
      Midi: [],
      'Après-midi': []
    }

    availableSlots.value.forEach((slot) => {
      const period = getPeriodLabel(slot)
      periods[period]?.push(slot)
    })

    return periods
  }

  const getRoomIcon = (roomName: string) => {
    const name = roomName.toLowerCase()
    if (name.includes('1') || name.includes('cabinet')) return 'i-lucide-door-open'
    if (name.includes('rééduc') || name.includes('ree') || name.includes('fitness')) return 'i-lucide-dumbbell'
    if (name.includes('balnéo') || name.includes('piscine') || name.includes('bain')) return 'i-lucide-waves'
    return 'i-lucide-door-open'
  }

  const selectRoom = (roomId: string) => {
    selectedRoomId.value = roomId
    consultationDetails.value.startTime = ''
    if (consultationDetails.value.date && consultationDetails.value.location === 'clinic') {
      fetchAvailableSlots()
    }
  }
</script>

<template>
  <AppCard>
    <UForm>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-0">
        <div class="flex flex-col gap-6">
          <AppCard variant="subtle">
            <UCalendar
              v-model="selectedDate"
              :year-controls="false"
              :min-value="minDate"
              :is-date-unavailable="isDateDisabled"
            />
          </AppCard>

          <div class="space-y-5">
            <UFormField label="Type de séance">
              <USelect
                v-model="consultationDetails.type"
                :items="CONSULTATION_TYPES_OPTIONS"
                option-attribute="label"
                value-attribute="value"
                placeholder="Sélectionner un type"
                class="w-full"
                icon="i-lucide-tag"
              />
            </UFormField>

            <div>
              <div class="flex items-center justify-between">
                <label class="text-muted text-xs font-bold uppercase">Durée</label>
                <span class="text-primary font-bold">{{ consultationDetails.duration }} min</span>
              </div>
              <div class="relative py-2">
                <USlider
                  v-model="consultationDetails.duration"
                  :min="CONSULTATION_DURATIONS[0]"
                  :max="CONSULTATION_DURATIONS.at(-1)"
                  :step="15"
                  size="lg"
                />
                <div class="text-muted mt-2 flex justify-between text-xs font-medium">
                  <span
                    v-for="val in CONSULTATION_DURATIONS"
                    :key="val"
                    class="inline-flex w-[3ch] justify-center tabular-nums"
                  >
                    {{ val.toFixed(0).padStart(3, ' ') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          <UFormField>
            <USelectMenu
              v-model="consultationDetails.therapistId"
              value-key="id"
              label-key="name"
              :items="therapists"
              placeholder="Sélectionner un thérapeute"
              class="w-full"
              icon="i-lucide-user"
            />
          </UFormField>

          <UFormField label="Lieu">
            <UFieldGroup class="w-full">
              <UButton
                v-for="loc in CONSULTATION_LOCATION_OPTIONS"
                :key="loc.value"
                :variant="consultationDetails.location === loc.value ? 'subtle' : 'outline'"
                :color="consultationDetails.location === loc.value ? 'primary' : 'neutral'"
                :icon="loc.icon"
                square
                block
                class="flex-col"
                @click="consultationDetails.location = loc.value"
              >
                {{ loc.label }}
              </UButton>
            </UFieldGroup>
          </UFormField>

          <div>
            <div v-if="roomsData && roomsData.length > 0 && consultationDetails.location === 'clinic'">
              <UFormField label="Salle de consultation">
                <div class="grid grid-cols-4 gap-2">
                  <UButton
                    v-for="room in roomsData"
                    :key="room.id"
                    :color="selectedRoomId === room.id ? 'primary' : 'neutral'"
                    :variant="selectedRoomId === room.id ? 'subtle' : 'outline'"
                    class="flex flex-col items-center justify-center"
                    @click="selectRoom(room.id)"
                    :icon="getRoomIcon(room.name)"
                  >
                    <span class="text-center text-[10px] leading-tight font-bold tracking-tight uppercase">
                      {{ room.name }}
                    </span>
                  </UButton>
                </div>
              </UFormField>

              <div v-if="selectedRoomId" class="mt-4">
                <UCheckbox
                  v-model="showRoomOnlyAvailability"
                  label="Afficher seulement la dispo salle"
                  size="sm"
                  class="text-xs"
                />
                <p class="text-muted mt-1 text-[10px]">
                  Cochez cette case pour voir tous les créneaux disponibles dans cette salle, même si le thérapeute
                  n'est pas disponible.
                </p>
              </div>
            </div>

            <div v-else-if="consultationDetails.location !== 'clinic'">
              <UAlert color="neutral" variant="subtle" icon="i-lucide-info">
                <template #title>
                  {{ consultationDetails.location === 'home' ? 'Séance à domicile' : 'Téléconsultation' }}
                </template>
                <p class="text-muted-foreground text-sm">
                  Les créneaux affichés sont basés sur la disponibilité du thérapeute uniquement.
                </p>
              </UAlert>
            </div>

            <UAlert v-else color="neutral" variant="subtle" icon="i-lucide-door-open">Aucune salle disponible</UAlert>
          </div>

          <div class="bg-muted space-y-4 rounded-lg p-3">
            <h4 class="flex items-center gap-2 text-sm font-semibold">
              <span class="bg-success size-1.5 rounded-full" />
              Disponibilité du thérapeute pour le
              <span class="text-info">{{ formattedDate }}</span>
            </h4>
            <div v-if="dayTemplatesForDate.length > 0 || exceptionsForDate.length > 0" class="space-y-2">
              <UBadge
                v-for="template in dayTemplatesForDate"
                :key="template.id"
                icon="i-lucide-calendar"
                variant="soft"
                size="lg"
                color="primary"
                class="flex"
              >
                {{ removeSecondsFromTime(template.startTime) }} - {{ removeSecondsFromTime(template.endTime) }} ({{
                  getLocationLabel(template.location)
                }})
              </UBadge>
              <UAlert
                v-for="exception in partialDayExceptions"
                :key="exception.id"
                :color="exception.isAvailable ? 'success' : 'error'"
                :icon="exception.isAvailable ? 'i-lucide-calendar-check' : 'i-lucide-calendar-x'"
                variant="soft"
                class="px-2 py-1"
              >
                <template #title>
                  <div class="flex justify-between">
                    <span v-if="exception.startTime && exception.endTime">
                      {{ removeSecondsFromTime(exception.startTime) }} - {{ removeSecondsFromTime(exception.endTime) }}
                    </span>
                    <span>
                      {{ exception.isAvailable ? 'Disponible' : 'Indisponible' }}
                    </span>
                  </div>
                </template>
                <template #description>
                  <p>{{ getExceptionTypeLabel(exception.reason ? exception.reason : 'other') }}</p>
                </template>
              </UAlert>
            </div>
            <UAlert
              v-else
              color="warning"
              variant="subtle"
              icon="i-lucide-info"
              title="Aucune disponibilité définie pour cette date"
            />
          </div>
        </div>

        <div class="col-span-1 lg:col-span-2"></div>
      </div>
    </UForm>
  </AppCard>
  <AppCard>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="flex items-center gap-2 font-bold">
        <UIcon name="i-lucide-clock" class="text-primary" />
        Créneaux disponibles pour le
        <span class="text-info">{{ formattedDate }}</span>
      </h3>
      <div class="flex flex-wrap gap-3">
        <UChip position="top-left" color="success">
          <UBadge color="success" variant="subtle" label="Disponible" />
        </UChip>

        <UChip position="top-left" color="error">
          <UBadge color="error" variant="subtle" label="Occupé" />
        </UChip>

        <UChip position="top-left" color="neutral">
          <UBadge color="neutral" variant="subtle" label="Indisponible" />
        </UChip>
      </div>
    </div>

    <div class="flex-1 space-y-4 overflow-y-auto pb-2">
      <UAlert
        v-if="consultationDetails.location === 'clinic' && !selectedRoomId"
        color="neutral"
        variant="subtle"
        icon="i-lucide-door-closed"
        title="Veuillez d'abord sélectionner une salle de consultation"
      />

      <UAlert v-if="isLoadingSlots" color="neutral" variant="subtle">
        <template #title>
          <USkeleton class="h-4 w-full" />
        </template>
      </UAlert>

      <UAlert v-else-if="slotsError" color="error" variant="subtle" :title="slotsError" />

      <UAlert
        v-else-if="availableSlots.length === 0"
        color="neutral"
        variant="subtle"
        icon="i-lucide-calendar-x"
        title="Aucun créneau disponible pour cette date"
      />

      <template v-else>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div
            v-for="(slots, period) in groupSlotsByPeriod()"
            :key="period"
            class="bg-muted border-default rounded-lg border p-4"
          >
            <p class="mb-3 flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
              {{ period }}
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="time in slots"
                :key="time"
                :variant="consultationDetails.startTime === time ? 'solid' : 'subtle'"
                :color="consultationDetails.startTime === time ? 'primary' : 'success'"
                size="md"
                :label="time"
                @click="selectTime(time)"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="border-default mt-4 border-t pt-4">
      <UButton
        icon="i-lucide-plus-circle"
        color="primary"
        size="lg"
        block
        :loading="isCreating"
        :disabled="
          isCreating || (consultationDetails.location === 'clinic' && !selectedRoomId) || !consultationDetails.startTime
        "
        @click="addConsultation"
      >
        Ajouter cette séance au plan
      </UButton>
    </div>
  </AppCard>
</template>
