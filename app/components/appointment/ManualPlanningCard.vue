<script setup lang="ts">
  import { LazyOrganizationRoomSlideover } from '#components'
  import { nextTick } from 'vue'
  import { CalendarDate, getLocalTimeZone, parseDate, parseTime, today } from '@internationalized/date'

  const props = defineProps<{
    treatmentPlan?: TreatmentPlan | null
    patient: Patient
    appointment?: Appointment
  }>()

  const toast = useToast()

  const { therapists } = useOrganizationMembers()
  const createAppointmentMutation = useCreateAppointment()
  const updateAppointmentMutation = useUpdateAppointment()

  const overlay = useOverlay()
  const roomAddOverlay = overlay.create(LazyOrganizationRoomSlideover)

  const isCreating = ref(false)
  const isEditMode = computed(() => !!props.appointment)
  const isInitialLoad = ref(true)
  const originalAppointmentDetails = ref<AppointmentCreate | null>(null)
  const minDate = computed(() => convertToCalendarDate(new Date()))
  const availableSlots = ref<string[]>([])
  const isLoadingSlots = ref(false)
  const slotsError = ref<string | null>(null)
  const showRoomOnlyAvailability = ref(false)

  const { data: roomsData } = useRoomsList(ref({}))

  const selectedDate = computed<CalendarDate | null>({
    get: () => (appointmentDetails.value.date ? parseDate(appointmentDetails.value.date) : null),
    set: (val) => {
      if (val) {
        appointmentDetails.value.date = val.toString()
      }
    }
  })

  const appointmentDetails = ref<AppointmentCreate>({
    patientId: props.patient.id,
    organizationId: props.patient.organizationId,
    treatmentPlanId: props.treatmentPlan?.id || null,
    therapistId: props.treatmentPlan?.therapistId || '',
    roomId: '',
    date: today(getLocalTimeZone()).toString(),
    startTime: '',
    endTime: '',
    duration: 45,
    type: 'follow_up',
    location: 'clinic',
    status: 'scheduled'
  })

  watch(
    () => props.appointment,
    (appointment) => {
      if (appointment) {
        const details = {
          patientId: appointment.patientId,
          organizationId: appointment.organizationId,
          treatmentPlanId: appointment.treatmentPlanId || props.treatmentPlan?.id,
          therapistId: appointment.therapistId,
          roomId: appointment.roomId || '',
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          duration: appointment.duration,
          type: appointment.type || 'follow_up',
          location: appointment.location || 'clinic',
          status: appointment.status
        }
        appointmentDetails.value = details
        originalAppointmentDetails.value = { ...details }
        isInitialLoad.value = false
        nextTick(() => {
          fetchAvailableSlots()
        })
      }
    },
    { immediate: true }
  )

  const { data: templatesData } = useAvailabilityTemplatesList(() => appointmentDetails.value.therapistId)
  const { data: exceptionsData } = useAvailabilityExceptionsList(() => appointmentDetails.value.therapistId)

  const formattedDate = computed(() => {
    if (!appointmentDetails.value.date) return ''
    const { dayName, day, month } = extractDayAndMonth(appointmentDetails.value.date)
    return `${dayName} ${day} ${month}`
  })

  watch(
    () => appointmentDetails.value.startTime,
    (newStartTime) => {
      const { duration } = appointmentDetails.value
      if (newStartTime && duration) {
        try {
          const time = parseTime(newStartTime)
          appointmentDetails.value.endTime = time.add({ minutes: duration }).toString().slice(0, 5)
        } catch {
          console.log('Error parsing time')
        }
      }
    }
  )

  watch(
    () => props.treatmentPlan?.therapistId,
    (newTherapistId) => {
      const therapist = therapists.value.find((t) => t.id === newTherapistId)
      if (therapist?.defaultAppointmentDuration) {
        appointmentDetails.value.duration = therapist.defaultAppointmentDuration
      }
    },
    { immediate: true }
  )

  const fetchAvailableSlots = async () => {
    const therapistId = appointmentDetails.value.therapistId
    const date = appointmentDetails.value.date
    const duration = appointmentDetails.value.duration
    const location = appointmentDetails.value.location

    if (!date) {
      availableSlots.value = []
      return
    }

    isLoadingSlots.value = true
    slotsError.value = null

    try {
      let response: any

      if (!therapistId) {
        slotsError.value = 'Veuillez sélectionner un thérapeute'
        availableSlots.value = []
        isLoadingSlots.value = false
        return
      }

      if (location === 'clinic') {
        if (!appointmentDetails.value.roomId) {
          availableSlots.value = []
          isLoadingSlots.value = false
          return
        }

        const therapistIdParam = !showRoomOnlyAvailability.value ? therapistId : undefined

        response = await $fetch(`/api/availability/${appointmentDetails.value.roomId}/slots`, {
          method: 'POST',
          body: {
            dates: [date],
            duration,
            therapistId: therapistIdParam
          }
        })
      } else {
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
        if (isEditMode.value && props.appointment && props.appointment.startTime) {
          const currentStartTime = props.appointment.startTime
          if (!availableSlots.value.includes(currentStartTime)) {
            availableSlots.value = [...availableSlots.value, currentStartTime].sort()
          }
        }
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
      appointmentDetails.value.therapistId,
      appointmentDetails.value.date,
      appointmentDetails.value.duration,
      appointmentDetails.value.location,
      appointmentDetails.value.roomId,
      showRoomOnlyAvailability.value
    ],
    () => {
      if (!isInitialLoad.value && originalAppointmentDetails.value) {
        const hasChanged =
          appointmentDetails.value.therapistId !== originalAppointmentDetails.value.therapistId ||
          appointmentDetails.value.date !== originalAppointmentDetails.value.date ||
          appointmentDetails.value.duration !== originalAppointmentDetails.value.duration ||
          appointmentDetails.value.location !== originalAppointmentDetails.value.location ||
          appointmentDetails.value.roomId !== originalAppointmentDetails.value.roomId

        if (hasChanged) {
          appointmentDetails.value.startTime = ''
        } else {
          appointmentDetails.value.startTime = originalAppointmentDetails.value.startTime
        }
      }

      if (appointmentDetails.value.location === 'clinic') {
        if (appointmentDetails.value.roomId) {
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
    if (!appointmentDetails.value.date || !templatesData.value) return []

    const dayOfWeek = getDayOfWeek(appointmentDetails.value.date)
    const location = appointmentDetails.value.location

    return templatesData.value.filter((t) => t.dayOfWeek === dayOfWeek && t.location === location)
  })

  const exceptionsForDate = computed(() => {
    if (!appointmentDetails.value.date || !exceptionsData.value) return []

    return exceptionsData.value.filter((e) => e.date === appointmentDetails.value.date)
  })

  const partialDayExceptions = computed(() => {
    return exceptionsForDate.value.filter((e) => e.startTime && e.endTime)
  })

  const fullDayExceptions = computed(() => {
    return exceptionsForDate.value.filter((e) => !e.startTime && !e.endTime)
  })

  const addAppointment = async () => {
    if (appointmentDetails.value.location === 'clinic' && !appointmentDetails.value.roomId) {
      toast.add({
        title: 'Erreur',
        description: 'Veuillez sélectionner une salle du Rendez-vous',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return
    }

    isCreating.value = true

    try {
      if (isEditMode.value && props.appointment) {
        await updateAppointmentMutation.mutateAsync({
          appointmentId: props.appointment.id,
          appointmentData: {
            ...appointmentDetails.value,
            roomId:
              appointmentDetails.value.location === 'clinic'
                ? appointmentDetails.value.roomId || undefined
                : undefined
          }
        })
      } else {
        await createAppointmentMutation.mutateAsync({
          appointmentData: {
            ...appointmentDetails.value,
            roomId:
              appointmentDetails.value.location === 'clinic'
                ? appointmentDetails.value.roomId || undefined
                : undefined
          }
        })
        await fetchAvailableSlots()
        appointmentDetails.value.startTime = ''
        if (appointmentDetails.value.location === 'clinic') {
          appointmentDetails.value.roomId = ''
        }
      }
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: parseError(
          error,
          isEditMode.value ? 'Impossible de mettre à jour le Rendez-vous' : 'Impossible de créer le Rendez-vous'
        ).message,
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
    isCreating.value = false
  }

  const selectTime = (time: string) => {
    appointmentDetails.value.startTime = time
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
    appointmentDetails.value.roomId = roomId
    appointmentDetails.value.startTime = ''
    if (appointmentDetails.value.date && appointmentDetails.value.location === 'clinic') {
      fetchAvailableSlots()
    }
  }

  async function handleAddRoom() {
    await roomAddOverlay.open({})
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
                v-model="appointmentDetails.type"
                :items="APPOINTMENT_TYPES_OPTIONS"
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
                <span class="text-primary font-bold">{{ appointmentDetails.duration }} min</span>
              </div>
              <div class="relative py-2">
                <USlider
                  v-model="appointmentDetails.duration"
                  :min="APPOINTMENT_DURATIONS[0]"
                  :max="APPOINTMENT_DURATIONS.at(-1)"
                  :step="15"
                  size="lg"
                />
                <div class="text-muted mt-2 flex justify-between text-xs font-medium">
                  <span
                    v-for="val in APPOINTMENT_DURATIONS"
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
              v-model="appointmentDetails.therapistId"
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
                v-for="loc in LOCATION_OPTIONS"
                :key="loc.value"
                :variant="appointmentDetails.location === loc.value ? 'subtle' : 'outline'"
                :color="appointmentDetails.location === loc.value ? 'primary' : 'neutral'"
                :icon="loc.icon"
                square
                block
                class="flex-col"
                @click="appointmentDetails.location = loc.value"
              >
                {{ loc.label }}
              </UButton>
            </UFieldGroup>
          </UFormField>

          <div>
            <div v-if="roomsData && roomsData.length > 0 && appointmentDetails.location === 'clinic'">
              <UFormField label="Salle de consultation">
                <div class="grid grid-cols-4 gap-2">
                  <UButton
                    v-for="room in roomsData"
                    :key="room.id"
                    :color="appointmentDetails.roomId === room.id ? 'primary' : 'neutral'"
                    :variant="appointmentDetails.roomId === room.id ? 'subtle' : 'outline'"
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

              <div v-if="appointmentDetails.roomId" class="mt-4">
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

            <div v-else-if="appointmentDetails.location !== 'clinic'">
              <UAlert color="neutral" variant="subtle" icon="i-lucide-info">
                <template #title>
                  {{ appointmentDetails.location === 'home' ? 'Séance à domicile' : 'Téléconsultation' }}
                </template>
                <p class="text-muted-foreground text-sm">
                  Les créneaux affichés sont basés sur la disponibilité du thérapeute uniquement.
                </p>
              </UAlert>
            </div>

            <div v-else class="space-y-3">
              <UAlert color="neutral" variant="subtle" icon="i-lucide-door-open">
                <template #title>Vous n'avez pas encore configuré de salle de consultation</template>
                <template #description>
                  <p class="text-muted-foreground text-sm">
                    Ajoutez au moins une salle pour planifier des séances au cabinet.
                  </p>
                </template>
              </UAlert>
              <UButton icon="i-lucide-plus" color="primary" variant="soft" block @click="handleAddRoom">
                Ajouter une salle
              </UButton>
            </div>
          </div>

          <div class="bg-muted space-y-4 rounded-lg p-3">
            <h4 class="flex items-center gap-2 text-sm font-semibold">
              <span class="bg-success size-1.5 rounded-full" />
              Disponibilité du thérapeute pour le
              <span class="text-info">{{ formattedDate }}</span>
            </h4>
            <template v-if="fullDayExceptions.length">
              <UAlert
                v-for="exception in fullDayExceptions"
                :key="exception.id"
                :color="exception.isAvailable ? 'success' : 'error'"
                :icon="exception.isAvailable ? 'i-lucide-calendar-check' : 'i-lucide-calendar-x'"
                variant="soft"
                class="px-2 py-1"
              >
                <template #title>
                  <div class="flex justify-between">
                    <span>Journée entière</span>
                    <span>
                      {{ exception.isAvailable ? 'Disponible' : 'Indisponible' }}
                    </span>
                  </div>
                </template>
                <template #description>
                  <p>{{ getExceptionTypeLabel(exception.reason ? exception.reason : 'other') }}</p>
                </template>
              </UAlert>
            </template>
            <div v-else-if="dayTemplatesForDate.length > 0 || exceptionsForDate.length > 0" class="space-y-2">
              <UBadge
                v-for="template in dayTemplatesForDate"
                :key="template.id"
                icon="i-lucide-calendar"
                variant="soft"
                size="lg"
                color="primary"
                class="flex"
              >
                {{ formatTimeString(template.startTime) }} - {{ formatTimeString(template.endTime) }} ({{
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
                      {{ formatTimeString(exception.startTime) }} - {{ formatTimeString(exception.endTime) }}
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

    <div class="flex-1 space-y-4 overflow-y-auto">
      <UAlert
        v-if="appointmentDetails.location === 'clinic' && !appointmentDetails.roomId"
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
            class="bg-muted border-default rounded-lg border p-3"
          >
            <p class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <UIcon
                :name="period === 'Matin' ? 'i-lucide-sunrise' : period === 'Midi' ? 'i-lucide-sun' : 'i-lucide-sunset'"
                class="size-4"
              />
              {{ period }}
            </p>
            <div class="flex flex-wrap gap-2 tabular-nums">
              <UButton
                v-for="time in slots"
                :key="time"
                :variant="appointmentDetails.startTime === time ? 'solid' : 'subtle'"
                :color="appointmentDetails.startTime === time ? 'primary' : 'success'"
                size="md"
                :label="formatTimeString(time)"
                @click="selectTime(time)"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="border-default mt-4 border-t pt-4">
      <UButton
        :icon="isEditMode ? 'i-lucide-check-circle' : 'i-lucide-plus-circle'"
        color="primary"
        size="xl"
        block
        :loading="isCreating"
        :disabled="
          isCreating ||
          (appointmentDetails.location === 'clinic' && !appointmentDetails.roomId) ||
          !appointmentDetails.startTime
        "
        @click="addAppointment"
      >
        {{ isEditMode ? 'Mettre à jour cette séance' : 'Ajouter cette séance au plan' }}
      </UButton>
    </div>
  </AppCard>
</template>
