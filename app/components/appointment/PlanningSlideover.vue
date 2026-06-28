<script setup lang="ts">
  import { LazyOrganizationRoomSlideover, LazyTreatmentSessionSlideover } from '#components'
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
  const treatmentSesionOverlay = overlay.create(LazyTreatmentSessionSlideover)
  const roomAddOverlay = overlay.create(LazyOrganizationRoomSlideover)

  // ─── Composables ─────────────────────────────────────────────
  const { therapists } = useOrganizationMembers()
  const createAppointmentMutation = useCreateAppointment()
  const updateAppointmentMutation = useUpdateAppointment()

  const { data: activeOrg } = useFullOrganization(() => props.patient.organizationId)

  const typeOptions = computed(() => {
    const orgTypes = activeOrg.value?.appointmentTypes
    if (orgTypes && orgTypes.length > 0) {
      return orgTypes.map((t) => ({ label: t.title, value: t.code }))
    }
    return APPOINTMENT_TYPES_OPTIONS
  })

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
    type: 'FOLLOW_UP',
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
        type: appointment.type || 'FOLLOW_UP',
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

  // ─── Default duration from organization ───────────────────────
  // The active organization's scheduling config provides the default
  // appointment duration for new appointments.
  watch(
    [activeOrg, () => props.treatmentPlan?.therapistId],
    ([org], [prevOrg]) => {
      if (isEditMode.value) return
      const orgDuration = org?.scheduling?.defaultAppointmentDuration
      const prevOrgDuration = prevOrg?.scheduling?.defaultAppointmentDuration
      if (orgDuration && orgDuration !== prevOrgDuration) {
        appointmentDetails.value.duration = orgDuration
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
        icon: 'i-hugeicons-alert-circle',
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
        icon: 'i-hugeicons-alert-circle',
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
    roomAddOverlay.open()
  }

  // ─── Start session flow ──────────────────────────────────────
  const handleStartSession = async () => {
    if (!props.appointment) return
    treatmentSesionOverlay.open({
      patientId: props.patient.id,
      appointmentId: props.appointment.id
    })
    emit('close')
  }

  // ─── Header / summary computeds ──────────────────────────────
  const patientFullName = computed(() => formatFullName(props.patient))

  const appointmentSummary = computed(() => {
    const d = appointmentDetails.value
    const parts: string[] = []
    if (d.date) parts.push(formatShortDate(d.date))
    if (d.startTime) parts.push(formatTimeString(d.startTime))
    if (d.duration) parts.push(`${d.duration} min`)
    return parts.join(' • ')
  })
</script>

<template>
  <USlideover :ui="{ content: 'w-full max-w-7xl bg-elevated' }" @close="emit('close', $event)">
    <!-- ─── Header: Patient context (two identifiers for safety) ─── -->
    <template #header>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div class="shrink-0 rounded-full bg-neutral-300 p-1">
            <UAvatar :alt="patientFullName" size="xl" />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="truncate text-base leading-tight font-semibold">{{ patientFullName }}</h3>
              <UBadge
                v-if="isEditMode && appointment"
                size="sm"
                variant="subtle"
                :color="getAppointmentStatusColor(appointment.status)"
                :icon="getAppointmentStatusIcon(appointment.status)"
                class="shrink-0"
              >
                {{ getAppointmentStatusLabel(appointment.status) }}
              </UBadge>
            </div>

            <div class="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-hugeicons-calendar-user" class="size-3.5" />
                {{ formatShortDate(patient.dateOfBirth) }} ({{ calculateAge(patient.dateOfBirth) }} ans)
              </span>
              <template v-if="treatmentPlan">
                <span class="text-dimmed">•</span>
                <span class="inline-flex items-center gap-1 truncate">
                  <UIcon name="i-hugeicons-note-03" class="size-3.5 shrink-0" />
                  <span class="truncate">{{ treatmentPlan.title }}</span>
                </span>
              </template>
            </div>

            <UButton
              v-if="canStartSession"
              icon="i-hugeicons-play-circle"
              color="primary"
              variant="soft"
              class="mt-2 sm:hidden"
              @click="handleStartSession"
            >
              Démarrer
            </UButton>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="canStartSession"
            icon="i-hugeicons-play-circle"
            color="primary"
            variant="soft"
            size="lg"
            class="hidden sm:inline-flex"
            @click="handleStartSession"
          >
            Démarrer la séance
          </UButton>
          <UButton
            icon="i-hugeicons-panel-left-close"
            color="neutral"
            variant="soft"
            square
            :ui="{ base: 'bg-accented', leadingIcon: 'size-5' }"
            aria-label="Fermer"
            @click="emit('close')"
          />
        </div>
      </div>
    </template>

    <template #body>
      <UForm>
        <div class="grid gap-4 lg:grid-cols-5">
          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- LEFT COLUMN — Configuration (2/5)                          -->
          <!-- Plan context • Therapist • Location • Room • Type • Duration -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div class="flex flex-col gap-4 lg:col-span-2">
            <!-- Treatment plan progress (or standalone alert) -->
            <AppCard compact>
              <div v-if="treatmentPlan" class="space-y-2">
                <div class="flex items-center justify-between text-sm font-medium">
                  <span class="text-muted">Progression du plan</span>
                  <UBadge variant="subtle" color="primary" size="sm">
                    {{ treatmentPlan.finishedCount }} / {{ treatmentPlan.numberOfSessions || 0 }}
                  </UBadge>
                </div>
                <UProgress :model-value="treatmentPlan.progress || 0" :max="100" size="md" />
              </div>
              <UAlert
                v-else
                color="info"
                variant="subtle"
                icon="i-hugeicons-stethoscope"
                title="Séance hors plan"
                description="Consultation indépendante — non liée à un plan de traitement."
              />
            </AppCard>

            <!-- Therapist • Location • Room • Type • Duration -->
            <AppCard compact>
              <div class="space-y-4">
                <!-- Therapist -->
                <UFormField label="Thérapeute" required>
                  <USelectMenu
                    v-model="appointmentDetails.therapistId"
                    value-key="id"
                    label-key="name"
                    :items="therapists"
                    placeholder="Sélectionner un thérapeute"
                    class="w-full"
                    icon="i-hugeicons-user-02"
                  />
                </UFormField>

                <!-- Location -->
                <UFormField label="Lieu">
                  <div class="grid grid-cols-3 gap-1.5">
                    <UButton
                      v-for="loc in LOCATION_OPTIONS"
                      :key="loc.value"
                      :variant="appointmentDetails.location === loc.value ? 'subtle' : 'outline'"
                      :color="appointmentDetails.location === loc.value ? 'primary' : 'neutral'"
                      :icon="loc.icon"
                      size="md"
                      block
                      class="justify-center"
                      @click="appointmentDetails.location = loc.value"
                    >
                      <span class="hidden text-xs sm:inline">{{ loc.label }}</span>
                    </UButton>
                  </div>
                </UFormField>

                <!-- Room (clinic only) -->
                <UFormField v-if="appointmentDetails.location === 'clinic'" label="Salle" required>
                  <div v-if="roomsData && roomsData.length > 0">
                    <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      <UButton
                        v-for="room in roomsData"
                        :key="room.id"
                        :color="appointmentDetails.roomId === room.id ? 'primary' : 'neutral'"
                        :variant="appointmentDetails.roomId === room.id ? 'subtle' : 'outline'"
                        icon="i-hugeicons-meeting-room"
                        size="md"
                        block
                        class="flex-col!"
                        @click="appointmentDetails.roomId = room.id"
                      >
                        <span class="truncate text-[11px] leading-tight font-semibold tracking-tight uppercase">
                          {{ room.name }}
                        </span>
                      </UButton>
                    </div>

                    <!-- Room-only availability toggle -->
                    <div v-if="appointmentDetails.roomId" class="mt-2">
                      <UCheckbox
                        v-model="showOnlyRoomAvailability"
                        label="Salle uniquement (ignorer le thérapeute)"
                        size="sm"
                      />
                    </div>
                  </div>

                  <!-- No rooms configured -->
                  <UAlert
                    v-else
                    color="neutral"
                    variant="subtle"
                    icon="i-hugeicons-door-01"
                    title="Aucune salle configurée"
                  >
                    <template #description>
                      <UButton
                        icon="i-hugeicons-plus-sign"
                        color="primary"
                        variant="link"
                        size="xs"
                        :padded="false"
                        @click="handleAddRoom"
                      >
                        Ajouter une salle
                      </UButton>
                    </template>
                  </UAlert>
                </UFormField>

                <!-- Non-clinic info banner -->
                <UAlert
                  v-if="appointmentDetails.location !== 'clinic'"
                  color="neutral"
                  variant="subtle"
                  icon="i-hugeicons-info"
                  :title="appointmentDetails.location === 'home' ? 'Séance à domicile' : 'Téléconsultation'"
                  description="Les créneaux sont basés sur la disponibilité du thérapeute uniquement."
                />

                <!-- Session type -->
                <UFormField label="Type de séance">
                  <USelect
                    v-model="appointmentDetails.type"
                    :items="typeOptions"
                    option-attribute="label"
                    value-attribute="value"
                    placeholder="Sélectionner un type"
                    class="w-full"
                    icon="i-hugeicons-tag-01"
                  />
                </UFormField>

                <!-- Duration — direct button grid instead of slider -->
                <UFormField label="Durée">
                  <div class="grid grid-cols-4 gap-1.5">
                    <UButton
                      v-for="val in APPOINTMENT_DURATIONS"
                      :key="val"
                      :variant="appointmentDetails.duration === val ? 'solid' : 'subtle'"
                      :color="appointmentDetails.duration === val ? 'primary' : 'neutral'"
                      size="sm"
                      block
                      class="tabular-nums"
                      @click="appointmentDetails.duration = val"
                    >
                      {{ val }}
                    </UButton>
                  </div>
                </UFormField>
              </div>
            </AppCard>
          </div>

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- RIGHT COLUMN — Scheduling (3/5)                             -->
          <!-- Calendar • Availability • Time slots                        -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div class="flex flex-col gap-4 lg:col-span-3">
            <!-- Calendar -->
            <AppCard compact>
              <UCalendar
                v-model="selectedDate"
                :year-controls="false"
                :number-of-months="2"
                :view-control="false"
                :min-value="minDate"
                :is-date-unavailable="isDateDisabled"
                class="mx-auto"
              />
            </AppCard>

            <!-- Availability + Time slots -->
            <AppCard compact title="Créneaux disponibles" icon="i-hugeicons-clock-01" icon-color="primary">
              <div class="space-y-3">
                <!-- Guard: no therapist -->
                <UAlert
                  v-if="!appointmentDetails.therapistId"
                  color="neutral"
                  variant="subtle"
                  icon="i-hugeicons-user-02"
                  title="Sélectionnez un thérapeute pour voir les créneaux"
                  size="sm"
                />

                <!-- Guard: clinic without room -->
                <UAlert
                  v-else-if="appointmentDetails.location === 'clinic' && !appointmentDetails.roomId"
                  color="warning"
                  variant="subtle"
                  icon="i-hugeicons-door-01"
                  title="Sélectionnez une salle pour voir les créneaux"
                  size="sm"
                />

                <template v-else>
                  <!-- Availability summary (templates + exceptions) -->
                  <div v-if="fullDayExceptions.length" class="space-y-1.5">
                    <UAlert
                      v-for="exception in fullDayExceptions"
                      :key="exception.id"
                      :color="exception.isAvailable ? 'success' : 'error'"
                      :icon="exception.isAvailable ? 'i-hugeicons-calendar-check-02' : 'i-hugeicons-calendar-03'"
                      variant="soft"
                      size="sm"
                    >
                      <template #title>
                        {{ exception.isAvailable ? 'Disponible' : 'Indisponible' }} — Journée entière
                      </template>
                      <template #description>
                        {{ getExceptionTypeLabel(exception.reason || 'other') }}
                      </template>
                    </UAlert>
                  </div>

                  <div
                    v-else-if="dayTemplatesForDate.length > 0 || partialDayExceptions.length > 0"
                    class="flex flex-wrap gap-1.5"
                  >
                    <UBadge
                      v-for="template in dayTemplatesForDate"
                      :key="template.id"
                      icon="i-hugeicons-calendar-03"
                      variant="soft"
                      color="primary"
                    >
                      {{ formatTimeString(template.startTime) }} – {{ formatTimeString(template.endTime) }}
                    </UBadge>
                    <UBadge
                      v-for="exception in partialDayExceptions"
                      :key="exception.id"
                      :color="exception.isAvailable ? 'success' : 'error'"
                      :icon="exception.isAvailable ? 'i-hugeicons-checkmark-circle-02' : 'i-hugeicons-cancel-01'"
                      variant="soft"
                    >
                      {{
                        exception.startTime && exception.endTime
                          ? `${formatTimeString(exception.startTime)} – ${formatTimeString(exception.endTime)}`
                          : 'Exception'
                      }}
                    </UBadge>
                  </div>

                  <UAlert
                    v-else-if="appointmentDetails.therapistId && !isLoadingSlots && availableSlots.length === 0"
                    color="neutral"
                    variant="subtle"
                    icon="i-hugeicons-info"
                    title="Aucune disponibilité définie pour cette date"
                    size="sm"
                  />

                  <!-- Slots loading -->
                  <div v-if="isLoadingSlots" class="grid grid-cols-3 gap-3">
                    <div v-for="i in 3" :key="i" class="bg-muted rounded-lg p-2.5">
                      <USkeleton class="mb-2 h-3 w-16" />
                      <div class="flex flex-wrap gap-1.5">
                        <USkeleton v-for="j in 4" :key="j" class="h-7 w-12" />
                      </div>
                    </div>
                  </div>

                  <!-- Slots error -->
                  <UAlert
                    v-else-if="slotsError"
                    color="error"
                    variant="subtle"
                    icon="i-hugeicons-alert-02"
                    :title="slotsError?.message || 'Impossible de charger les créneaux'"
                  />

                  <!-- No slots available -->
                  <UAlert
                    v-else-if="availableSlots.length === 0 && appointmentDetails.therapistId"
                    color="neutral"
                    variant="subtle"
                    icon="i-hugeicons-calendar-03"
                    title="Aucun créneau disponible"
                    description="Essayez une autre date ou ajustez la durée."
                  />

                  <!-- Slot grid: Matin / Midi / Après-midi -->
                  <div v-else-if="availableSlots.length > 0" class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div v-for="(slots, period) in groupedSlots" :key="period" class="bg-muted rounded-lg p-2.5">
                      <p
                        class="text-muted mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                      >
                        <UIcon
                          :name="
                            period === 'Matin'
                              ? 'i-hugeicons-sunrise'
                              : period === 'Midi'
                                ? 'i-hugeicons-sun-02'
                                : 'i-hugeicons-sunset'
                          "
                          class="size-3.5"
                        />
                        {{ period }}
                      </p>
                      <div class="flex flex-wrap gap-1 tabular-nums">
                        <UButton
                          v-for="time in slots"
                          :key="time"
                          :variant="appointmentDetails.startTime === time ? 'solid' : 'subtle'"
                          :color="appointmentDetails.startTime === time ? 'primary' : 'neutral'"
                          size="xs"
                          :label="formatTimeString(time)"
                          class="rounded-sm"
                          @click="appointmentDetails.startTime = time"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </AppCard>
          </div>
        </div>
      </UForm>
    </template>

    <!-- ─── Footer: Cancel + Submit with inline summary ─── -->
    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <UButton variant="subtle" color="neutral" size="lg" @click="emit('close')">Fermer</UButton>

        <div class="flex items-center gap-3">
          <!-- Selected appointment summary -->
          <div v-if="appointmentSummary" class="hidden text-right sm:block">
            <p class="text-xs leading-none font-semibold">{{ appointmentSummary }}</p>
            <p class="text-muted mt-0.5 text-[11px] leading-none">
              {{ getLocationLabel(appointmentDetails.location) }}
            </p>
          </div>
          <USeparator v-if="appointmentSummary" orientation="vertical" class="hidden h-8 sm:block" />
          <UButton
            :icon="isEditMode ? 'i-hugeicons-checkmark-circle-02' : 'i-hugeicons-plus-sign'"
            color="primary"
            size="lg"
            :loading="isCreating"
            :disabled="
              isCreating ||
              (appointmentDetails.location === 'clinic' && !appointmentDetails.roomId) ||
              !appointmentDetails.startTime
            "
            @click="addAppointment"
          >
            {{ isEditMode ? 'Mettre à jour' : 'Ajouter la séance' }}
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>
