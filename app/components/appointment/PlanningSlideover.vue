<script setup lang="ts">
  import { LazyAppModalEVA, LazyOrganizationRoomSlideover, LazyTreatmentSessionSlideover } from '#components'
  import { CalendarDate, parseDate, parseTime } from '@internationalized/date'

  // ─── Props / Emits ───────────────────────────────────────────
  // Receives a patient (required), and optionally a treatment plan
  // and an existing appointment (when editing).
  // Emits `close` when the user dismisses the slideover.
  const props = defineProps<{
    patient: Patient
    treatmentPlan?: TreatmentPlanWithProgress | null
    appointment?: Appointment
  }>()

  const emit = defineEmits<{ close: [data?: any] }>()

  // ─── Overlays ────────────────────────────────────────────────
  // Lazy-loaded modal/overlay instances used to start a session
  // (EVA pain evaluation → treatment session) and to add a room.
  const toast = useToast()
  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)
  const treatmentSesionOverlay = overlay.create(LazyTreatmentSessionSlideover)
  const roomAddOverlay = overlay.create(LazyOrganizationRoomSlideover)

  // ─── Composables ─────────────────────────────────────────────
  // Mutations for starting, creating, and updating appointments.
  // `useOrganizationMembers` provides the list of therapists.
  const { mutateAsync: startAppointment, isLoading: isStartingSession } = useStartAppointment()
  const { therapists } = useOrganizationMembers()
  const createAppointmentMutation = useCreateAppointment()
  const updateAppointmentMutation = useUpdateAppointment()

  // ─── Edit mode detection ─────────────────────────────────────
  // When an `appointment` prop is provided the slideover operates
  // in edit mode. The session can only be started from an
  // appointment that is `scheduled` or `confirmed`.
  const canStartSession = computed(() => {
    return props.appointment && ['scheduled', 'confirmed'].includes(props.appointment.status)
  })

  // ─── Local form state ────────────────────────────────────────
  // `isCreating` guards the submit button against double-clicks.
  // `isEditMode` is `true` when editing an existing appointment.
  // `isInitialLoad` prevents resetting the start time on mount
  //   (we want to keep the original time while populating the form).
  // `originalAppointmentDetails` stores a snapshot of the initial
  //   values so we can detect whether key fields have changed and
  //   decide whether to clear the selected start time.
  // `minDate` prevents selecting dates in the past.
  // `showOnlyRoomAvailability` toggles slot filtering: when true,
  //   only the room's free slots are shown (ignoring therapist
  //   availability), useful when booking a room independently.
  const isCreating = ref(false)
  const isEditMode = computed(() => !!props.appointment)
  const isInitialLoad = ref(!!props.appointment)
  const originalAppointmentDetails = ref<AppointmentCreate | null>(null)
  const minDate = computed(() => convertToCalendarDate(new Date()))
  const showOnlyRoomAvailability = ref(false)

  // ─── Rooms ───────────────────────────────────────────────────
  // Fetches all rooms in the organization so the user can pick one
  // when the appointment location is set to `clinic`.
  const { data: roomsData } = useRoomsList(ref({}))

  // ─── Appointment form model ──────────────────────────────────
  // Reactive object that backs every field in the form (therapist,
  // date, time, duration, location, room, type, status…).
  // Defaults are set from the treatment plan when available.
  const appointmentDetails = ref<AppointmentCreate>({
    patientId: props.patient.id,
    organizationId: props.patient.organizationId,
    treatmentPlanId: props.treatmentPlan?.id || null,
    therapistId: props.treatmentPlan?.therapistId || '',
    roomId: '',
    date: getTodayAsString(),
    startTime: '',
    endTime: '',
    duration: 45,
    type: 'follow_up',
    location: 'clinic',
    status: 'scheduled'
  })

  // ─── Date adapter for UCalendar ──────────────────────────────
  // UCalendar works with `CalendarDate` objects from
  // @internationalized/date. This computed bridges between the
  // string-based `appointmentDetails.date` and the component's
  // `CalendarDate` v-model.
  const selectedDate = computed<CalendarDate | null>({
    get: () => (appointmentDetails.value.date ? parseDate(appointmentDetails.value.date) : null),
    set: (val) => {
      if (val) appointmentDetails.value.date = val.toString()
    }
  })

  // ─── Room ID helper ──────────────────────────────────────────
  // Returns the selected `roomId` only when location is `clinic`.
  // For home / teleconsultation appointments there is no room.
  const effectiveRoomId = computed(() =>
    appointmentDetails.value.location === 'clinic' ? appointmentDetails.value.roomId || undefined : undefined
  )

  // ─── Available time slots ────────────────────────────────────
  // Fetches available slots from the API based on the current
  // therapist, date, duration, location, room, and the
  // `showOnlyRoomAvailability` toggle. Every dependency is
  // passed as a getter so the composable auto-refreshes.
  const {
    data: rawAvailableSlots,
    isLoading: isLoadingSlots,
    error: slotsError,
    refresh: refreshSlots
  } = useAvailableSlots({
    location: () => appointmentDetails.value.location,
    roomId: () => appointmentDetails.value.roomId || undefined,
    therapistId: () => appointmentDetails.value.therapistId || undefined,
    date: () => appointmentDetails.value.date || undefined,
    duration: () => appointmentDetails.value.duration,
    showOnlyRoomAvailability: () => showOnlyRoomAvailability.value
  })

  // ─── Slot enrichment (edit mode) ─────────────────────────────
  // In edit mode the current appointment's start time might not
  // appear in the available slots (e.g. the slot was taken by
  // someone else since). We inject it so the user can keep the
  // existing time without surprises.
  const availableSlots = computed(() => {
    const slots = rawAvailableSlots.value ?? []
    if (isEditMode.value && props.appointment?.startTime) {
      if (!slots.includes(props.appointment.startTime)) {
        return [...slots, props.appointment.startTime].sort()
      }
    }
    return slots
  })

  // ─── Populate form from existing appointment ─────────────────
  // When the `appointment` prop changes (or on mount in edit mode),
  // we copy every field into `appointmentDetails` and store a
  // snapshot in `originalAppointmentDetails` so we can later
  // compare whether the user changed critical fields.
  watch(
    () => props.appointment,
    (appointment) => {
      if (!appointment) return
      const details: AppointmentCreate = {
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
    },
    { immediate: true }
  )

  // ─── Availability templates & exceptions ─────────────────────
  // Templates define recurring weekly availability (e.g. every
  // Monday 08:00–12:00). Exceptions override availability for
  // specific dates (full-day or partial). Both are loaded per
  // therapist so we can display them alongside the time slots.
  const { data: templatesData } = useAvailabilityTemplatesList(() => appointmentDetails.value.therapistId)
  const { data: exceptionsData } = useAvailabilityExceptionsList(() => appointmentDetails.value.therapistId)

  // ─── End time auto-calculation ───────────────────────────────
  // Whenever the user picks a start time or changes the duration,
  // the end time is derived by adding the duration (in minutes)
  // to the start time using @internationalized/date's `add()`.
  watch(
    () => appointmentDetails.value.startTime,
    () => {
      const { startTime, duration } = appointmentDetails.value
      if (!startTime || !duration) return
      try {
        appointmentDetails.value.endTime = parseTime(startTime).add({ minutes: duration }).toString()
      } catch {}
    }
  )

  // ─── Default duration from therapist ─────────────────────────
  // Each therapist can have a `defaultAppointmentDuration`. When
  // the treatment plan's therapist changes (or on mount), we
  // apply that default to the form.
  watch(
    () => props.treatmentPlan?.therapistId,
    (therapistId) => {
      const therapist = therapists.value.find((t) => t.id === therapistId)
      if (therapist?.defaultAppointmentDuration) {
        appointmentDetails.value.duration = therapist.defaultAppointmentDuration
      }
    },
    { immediate: true }
  )

  // ─── Clear start time on field changes ───────────────────────
  // When any of the key scheduling fields (therapist, date,
  // duration, location, room) change, the previously selected
  // start time is likely no longer valid. We clear it so the
  // user must pick a new one from the refreshed slot list.
  //
  // Exception: during the initial population (isInitialLoad) or
  // when every field still matches the original snapshot we
  // restore the original start time instead of clearing it.
  watch(
    [
      () => appointmentDetails.value.therapistId,
      () => appointmentDetails.value.date,
      () => appointmentDetails.value.duration,
      () => appointmentDetails.value.location,
      () => appointmentDetails.value.roomId,
      () => showOnlyRoomAvailability.value
    ],
    () => {
      if (!isInitialLoad.value) {
        if (originalAppointmentDetails.value) {
          const d = appointmentDetails.value
          const o = originalAppointmentDetails.value
          const isOriginal =
            d.therapistId === o.therapistId &&
            d.date === o.date &&
            d.duration === o.duration &&
            d.location === o.location &&
            d.roomId === o.roomId
          appointmentDetails.value.startTime = isOriginal ? o.startTime : ''
        } else {
          appointmentDetails.value.startTime = ''
        }
      }
    }
  )

  // ─── Filtered templates / exceptions for selected date ───────
  // `dayTemplatesForDate`: recurring templates whose `dayOfWeek`
  //   matches the selected date and whose `location` matches.
  // `exceptionsForDate`: one-off overrides for the selected date.
  // `partialDayExceptions`: exceptions with start/end times.
  // `fullDayExceptions`: exceptions that cover the entire day.
  const dayTemplatesForDate = computed(() => {
    if (!appointmentDetails.value.date || !templatesData.value) return []
    const dayOfWeek = getDayOfWeek(appointmentDetails.value.date)
    return templatesData.value.filter(
      (t) => t.dayOfWeek === dayOfWeek && t.location === appointmentDetails.value.location
    )
  })

  const exceptionsForDate = computed(() => {
    if (!appointmentDetails.value.date || !exceptionsData.value) return []
    return exceptionsData.value.filter((e) => e.date === appointmentDetails.value.date)
  })

  const partialDayExceptions = computed(() => exceptionsForDate.value.filter((e) => e.startTime && e.endTime))
  const fullDayExceptions = computed(() => exceptionsForDate.value.filter((e) => !e.startTime && !e.endTime))

  // ─── Slot grouping ───────────────────────────────────────────
  // Splits the available time slots into three time-of-day
  // buckets: Matin (before 12:00), Midi (12:00–13:59),
  // Après-midi (14:00+). Each bucket is rendered as a column
  // in the template.
  const groupedSlots = computed(() => {
    const periods: Record<string, string[]> = { Matin: [], Midi: [], 'Après-midi': [] }
    for (const slot of availableSlots.value) {
      const time = parseTime(slot)
      const hour = time.hour
      const period = hour < 12 ? 'Matin' : hour < 14 ? 'Midi' : 'Après-midi'
      periods[period]?.push(slot)
    }
    return periods
  })

  // ─── Room icon heuristic ─────────────────────────────────────
  // Picks an icon based on keywords in the room name so each
  // room button gets a contextual icon (door, dumbbell, waves…).
  const getRoomIcon = (roomName: string) => {
    const name = roomName.toLowerCase()
    if (name.includes('1') || name.includes('cabinet')) return 'i-lucide-door-open'
    if (name.includes('rééduc') || name.includes('ree') || name.includes('fitness')) return 'i-lucide-dumbbell'
    if (name.includes('balnéo') || name.includes('piscine') || name.includes('bain')) return 'i-lucide-waves'
    return 'i-lucide-door-open'
  }

  // ─── Create / Update appointment ─────────────────────────────
  // Validates that a room is selected when location is `clinic`,
  // then delegates to the create or update mutation. In create
  // mode the slots are refreshed and the form is partially reset
  // (room + start time) so the user can book another session
  // without closing the slideover.
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
    const payload = { ...appointmentDetails.value, roomId: effectiveRoomId.value }

    try {
      if (isEditMode.value && props.appointment) {
        await updateAppointmentMutation.mutateAsync({
          appointmentId: props.appointment.id,
          appointmentData: payload
        })
      } else {
        await createAppointmentMutation.mutateAsync({ appointmentData: payload })
        await refreshSlots()
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
    } finally {
      isCreating.value = false
    }
  }

  // ─── Room quick-add ──────────────────────────────────────────
  // Opens the room creation slideover so the user can add a
  // room without leaving this planning view.
  async function handleAddRoom() {
    await roomAddOverlay.open()
  }

  // ─── Start session flow ──────────────────────────────────────
  // Three-step flow:
  //  1. If the appointment is already `in_progress`, skip the EVA
  //     and open the treatment session overlay directly.
  //  2. Otherwise, open the EVA (pain evaluation) modal to get a
  //     pain level before the session. If the user cancels, bail.
  //  3. Call `startAppointment` to transition the appointment to
  //     `in_progress`, then open the treatment session overlay.
  //     On 409 (conflict — already in progress) we still open the
  //     session overlay as a fallback.
  const handleStartSession = async () => {
    if (!props.appointment || isStartingSession.value) return

    if (props.appointment.status === 'in_progress') {
      treatmentSesionOverlay.open({
        patientId: props.patient.id,
        appointmentId: props.appointment.id
      })
      emit('close')
      return
    }

    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur initiale',
      description: 'Veuillez indiquer le niveau de douleur du patient avant la séance',
      confirmText: 'Enregistrer et démarrer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue === null) return

    try {
      await startAppointment({
        appointmentId: props.appointment.id,
        actualStartTime: getCurrentTimeHHMMSS(),
        painLevelBefore: evaValue
      })

      treatmentSesionOverlay.open({
        patientId: props.patient.id,
        appointmentId: props.appointment.id
      })
      emit('close')
    } catch (error) {
      const parsedError = parseError(error, 'Impossible de démarrer la séance')
      if (parsedError.statusCode === 409) {
        treatmentSesionOverlay.open({
          patientId: props.patient.id,
          appointmentId: props.appointment.id
        })
        emit('close')
      }
    }
  }
</script>

<template>
  <USlideover
    :ui="{
      content: 'w-full max-w-7xl bg-elevated',
      header: 'hidden'
    }"
    @close="emit('close', $event)"
  >
    <template #body>
      <div class="grid grid-cols-1 gap-4">
        <!-- ─── Appointment configuration form ─── -->
        <!-- Two-column layout: LEFT = calendar + session settings,
             RIGHT = therapist + location + room + availability -->
        <UForm>
          <div class="3xl:grid-cols-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- LEFT COLUMN -->
            <!-- ─── Treatment plan card (or standalone alert) ─── -->
            <AppCard :title="treatmentPlan ? 'Plan de traitement' : 'Séance hors plan de traitement'">
              <div class="space-y-4">
                <template v-if="treatmentPlan">
                  <p class="font-semibold">{{ treatmentPlan.title }}</p>
                  <!-- <div class="my-2 grid grid-cols-2 gap-4">
                    <div class="bg-muted flex flex-col gap-1 rounded-md p-2">
                      <p class="text-sm font-medium">Total de séances</p>
                      <p class="font-title text-xl font-bold">{{ treatmentPlan.numberOfSessions || 0 }}</p>
                    </div>
                    <div class="bg-muted flex flex-col gap-1 rounded-md p-2">
                      <p class="text-sm font-medium">Séances restantes</p>
                      <p class="font-title text-xl font-bold">
                        {{ Math.max(0, (treatmentPlan.numberOfSessions || 0) - treatmentPlan.completedAppointments) }}
                      </p>
                    </div>
                  </div> -->

                  <div class="col-span-full space-y-2">
                    <div class="flex justify-between text-sm font-medium">
                      <span>Progression du plan</span>
                      <span>
                        {{ treatmentPlan.completedAppointments }} / {{ treatmentPlan.numberOfSessions || 0 }} séances
                      </span>
                    </div>
                    <UProgress :model-value="treatmentPlan.progress || 0" :max="100" size="lg" />
                  </div>
                </template>

                <!-- Shown when no treatment plan is linked (standalone session) -->
                <UAlert
                  v-else
                  color="info"
                  variant="subtle"
                  icon="i-lucide-stethoscope"
                  title="Consultation Indépendante"
                  description="Cette séance n'est pas liée à un plan de traitement."
                />

                <!-- Date picker -->
                <AppCard variant="soft">
                  <UCalendar
                    v-model="selectedDate"
                    :year-controls="false"
                    :min-value="minDate"
                    :is-date-unavailable="isDateDisabled"
                  />
                </AppCard>

                <!-- Session type + Duration slider -->
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
                    <span class="text-primary text-sm font-semibold">{{ appointmentDetails.duration }} min</span>
                  </div>
                  <div class="relative py-1">
                    <USlider
                      v-model="appointmentDetails.duration"
                      :min="APPOINTMENT_DURATIONS[0]"
                      :max="APPOINTMENT_DURATIONS.at(-1)"
                      :step="5"
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
            </AppCard>

            <!-- RIGHT COLUMN -->
            <AppCard>
              <div class="flex flex-col gap-6">
                <!-- Therapist selector -->
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

                <!-- Location picker (clinic / home / teleconsultation) -->
                <UFormField label="Lieu">
                  <UFieldGroup class="w-full">
                    <UButton
                      v-for="loc in LOCATION_OPTIONS"
                      :key="loc.value"
                      :variant="appointmentDetails.location === loc.value ? 'subtle' : 'outline'"
                      :color="appointmentDetails.location === loc.value ? 'primary' : 'neutral'"
                      :icon="loc.icon"
                      block
                      @click="appointmentDetails.location = loc.value"
                    >
                      <span class="hidden lg:block">
                        {{ loc.label }}
                      </span>
                    </UButton>
                  </UFieldGroup>
                </UFormField>

                <!-- Room selection (only when location = clinic) -->
                <div>
                  <!-- Has rooms → show room grid -->
                  <div v-if="roomsData && roomsData.length > 0 && appointmentDetails.location === 'clinic'">
                    <UFormField label="Salle de consultation">
                      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        <UButton
                          v-for="room in roomsData"
                          :key="room.id"
                          :color="appointmentDetails.roomId === room.id ? 'primary' : 'neutral'"
                          :variant="appointmentDetails.roomId === room.id ? 'subtle' : 'outline'"
                          class="flex flex-col items-center justify-center"
                          :icon="getRoomIcon(room.name)"
                          @click="appointmentDetails.roomId = room.id"
                        >
                          <span class="text-center text-[10px] leading-tight font-semibold tracking-tight uppercase">
                            {{ room.name }}
                          </span>
                        </UButton>
                      </div>
                    </UFormField>

                    <!-- Toggle to show room-only availability (ignore therapist) -->
                    <div v-if="appointmentDetails.roomId" class="mt-4">
                      <UCheckbox
                        v-model="showOnlyRoomAvailability"
                        label="Disponibilités de la salle uniquement"
                        size="sm"
                        class="text-xs"
                      />
                      <p class="text-muted mt-1 text-[10px]">
                        Affiche tous les créneaux disponibles pour cette salle, sans tenir compte de la disponibilité du
                        thérapeute.
                      </p>
                    </div>
                  </div>

                  <!-- Non-clinic location → info banner (no rooms needed) -->
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

                  <!-- No rooms configured → prompt to add one -->
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

                <!-- Therapist availability summary for the selected date -->
                <div class="bg-muted space-y-2 rounded-md p-2">
                  <h4 class="flex items-center gap-2 text-sm font-semibold">
                    <span class="bg-success size-1.5 rounded-full" />
                    Disponibilité du thérapeute
                  </h4>

                  <!-- Guard: no therapist selected -->
                  <UAlert
                    v-if="!appointmentDetails.therapistId"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-user"
                    title="Veuillez sélectionner un thérapeute"
                  />

                  <UAlert
                    v-if="appointmentDetails.location === 'clinic' && !appointmentDetails.roomId"
                    color="error"
                    variant="subtle"
                    size="sm"
                    icon="i-lucide-door-open"
                    title="Veuillez d'abord sélectionner une salle de consultation"
                  />

                  <!-- Full-day exceptions (e.g. holiday, sick leave) -->
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

                  <!-- Recurring templates + partial-day exceptions -->
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

                  <!-- No availability defined at all for this date -->
                  <UAlert
                    v-else
                    color="info"
                    variant="subtle"
                    icon="i-lucide-info"
                    title="Aucune disponibilité pour cette date"
                    class="px-2 py-1"
                  />
                </div>
              </div>
            </AppCard>

            <!-- ─── Time slots grid ─── -->
            <!-- Shows available slots grouped by Matin / Midi / Après-midi.
             Multiple guard clauses handle loading, errors, missing
             therapist, and no-room-selected states. -->

            <AppCard
              title="Créneaux disponibles"
              icon="i-lucide-clock"
              iconColor="primary"
              class="3xl:col-span-2 col-span-2 lg:col-span-1"
            >
              <div class="mb-6 flex flex-col gap-4">
                <!-- Legend chips -->
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
                <!-- Guard: no room selected for clinic location -->

                <!-- Guard: slots are loading -->
                <UAlert v-if="isLoadingSlots" color="neutral" variant="subtle">
                  <template #title>
                    <USkeleton class="h-4 w-full" />
                  </template>
                </UAlert>

                <!-- Guard: error fetching slots -->
                <UAlert
                  v-else-if="slotsError"
                  color="error"
                  variant="subtle"
                  :title="slotsError?.message || 'Impossible de charger les créneaux'"
                />

                <!-- Guard: no slots available -->
                <UAlert
                  v-else-if="availableSlots.length === 0"
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-calendar-x"
                  title="Aucun créneau disponible pour cette date"
                />

                <!-- Slot grid: 3 columns (Matin / Midi / Après-midi) -->
                <template v-else>
                  <div class="3xl:grid-cols-3 grid grid-cols-1 gap-6">
                    <div
                      v-for="(slots, period) in groupedSlots"
                      :key="period"
                      class="bg-muted border-default rounded-lg border p-3"
                    >
                      <p class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                        <UIcon
                          :name="
                            period === 'Matin'
                              ? 'i-lucide-sunrise'
                              : period === 'Midi'
                                ? 'i-lucide-sun'
                                : 'i-lucide-sunset'
                          "
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
                          @click="appointmentDetails.startTime = time"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Submit button -->
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
          </div>
        </UForm>
      </div>
    </template>

    <!-- ─── Footer actions ─── -->
    <!-- Left: "Démarrer" button to start a session (edit mode only,
         when status is scheduled or confirmed).
         Right: Cancel + confirm buttons. -->
    <template #footer="{ close }">
      <div class="flex w-full justify-between gap-3">
        <div class="flex gap-3">
          <UButton
            v-if="canStartSession"
            icon="i-hugeicons-play-circle"
            color="primary"
            size="lg"
            :loading="isStartingSession"
            @click="handleStartSession"
          >
            Démarrer
          </UButton>
        </div>

        <div class="flex gap-3">
          <UButton variant="outline" color="neutral" size="lg" @click="close">Annuler</UButton>
          <UButton color="primary" size="lg">{{ appointment ? 'Terminer' : 'Mettre à jour la séance' }}</UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>
