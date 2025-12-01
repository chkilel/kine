<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import { format } from 'date-fns'

  const props = defineProps<{
    patient: Patient
    treatmentPlan?: TreatmentPlan
  }>()

  const emit = defineEmits<{
    close: [data?: any]
  }>()

  const toast = useToast()

  // Use consultations composable
  const { fetchConsultations, createConsultation, deleteConsultation, fetchTreatmentPlanConsultations } =
    useConsultations()

  // Get active organization and session
  const { user } = await useAuth()
  const { activeOrganization } = useOrganization()
  if (!user || !activeOrganization.value.data) {
    await navigateTo('/login')
  }

  // FIXME grab therapist from org
  const therapists = [user.value!]

  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  // Form state
  const planningSettings = ref({
    autoGeneration: true,
    sessionsToPlan: 8,
    frequency: 2,
    duration: 45,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    preferredDays: [] as string[],
    location: 'clinic' as ConsultationLocation
  })

  const sessionDetails = ref({
    date: new Date(),
    time: '',
    duration: 45,
    type: '',
    therapistId: user.value?.id || '',
    location: 'clinic',
    notes: ''
  })

  const communicationSettings = ref({
    sendConfirmations: false,
    enableReminders: true
  })

  // Calendar models for date components
  const planningStartDateModel = shallowRef<CalendarDate | null>(null)
  const selectedDateModel = shallowRef<CalendarDate | null>(null)

  // Initialize calendar models from form dates
  onMounted(() => {
    if (planningSettings.value.startDate) {
      planningStartDateModel.value = new CalendarDate(
        new Date(planningSettings.value.startDate).getFullYear(),
        new Date(planningSettings.value.startDate).getMonth() + 1,
        new Date(planningSettings.value.startDate).getDate()
      )
    }
  })

  // Watch calendar models and update form state
  watch(planningStartDateModel, (val) => {
    if (val) {
      planningSettings.value.startDate = format(val.toDate(getLocalTimeZone()), 'yyyy-MM-dd')
    }
  })

  watch(selectedDateModel, (val) => {
    if (val) {
      selectedDate.value = format(val.toDate(getLocalTimeZone()), 'yyyy-MM-dd') || null
    }
  })

  // Calendar state
  const selectedDate = ref<string | null>(null)
  const selectedTime = ref<string | null>(null)

  const sessions = ref<Consultation[]>([])
  const selectedSessions = ref<string[]>([])
  const treatmentPlanStats = ref<{
    total: number
    completed: number
    scheduled: number
    cancelled: number
    progressPercentage: number
  } | null>(null)
  const isLoading = ref(false)
  const isCreating = ref(false)

  // Time slots
  const timeSlots = [
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

  const unavailableSlots = ['10:30', '11:30', '16:30']

  const selectTime = (time: string) => {
    selectedTime.value = time
    sessionDetails.value.time = time
  }

  const isTimeUnavailable = (time: string) => {
    return unavailableSlots.includes(time)
  }

  const isTimeSelected = (time: string) => {
    return selectedTime.value === time
  }

  // Session management
  const addSession = async () => {
    if (!selectedDate.value || !selectedTime.value) {
      toast.add({
        title: 'Erreur',
        description: 'Veuillez sélectionner une date, une heure et un type de consultation',
        color: 'error'
      })
      return
    }

    if (!sessionDetails.value.type) {
      toast.add({
        title: 'Erreur',
        description: 'Veuillez sélectionner un type de séance',
        color: 'error'
      })
      return
    }

    isCreating.value = true
    try {
      const consultationData = {
        patientId: props.patient.id,
        organizationId: activeOrganization.value?.data?.id || '',
        treatmentPlanId: props.treatmentPlan?.id,
        date: selectedDate.value ? new Date(selectedDate.value) : new Date(),
        startTime: selectedTime.value,
        duration: sessionDetails.value.duration,
        type: (sessionDetails.value.type || 'follow_up') as ConsultationSessionType,
        location: sessionDetails.value.location as ConsultationLocation,
        chiefComplaint: sessionDetails.value.notes || '',
        notes: sessionDetails.value.notes || '',
        therapistId: sessionDetails.value.therapistId || undefined,
        status: 'scheduled' as const,
        billed: false,
        insuranceClaimed: false
      }

      const result = await createConsultation(props.patient.id, consultationData)

      if (result.consultation) {
        // Refresh consultations list
        await refreshConsultations()

        emit('close', { type: 'consultation-created', data: result.consultation })

        // Reset form
        selectedDate.value = null
        selectedDateModel.value = null
        selectedTime.value = null
        sessionDetails.value.type = ''
        sessionDetails.value.notes = ''
      }
    } finally {
      isCreating.value = false
    }
  }

  const refreshConsultations = async () => {
    isLoading.value = true
    try {
      if (props.patient) {
        const result = await fetchConsultations(props.patient.id)
        if (result.consultations) {
          sessions.value = result.consultations as Consultation[]
        }
      }

      // Also fetch treatment plan statistics if a treatment plan is provided
      if (props.treatmentPlan) {
        const statsResult = await fetchTreatmentPlanConsultations(props.treatmentPlan.id)
        if (statsResult.statistics) {
          treatmentPlanStats.value = statsResult.statistics
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  const generateSessions = async () => {
    if (!props.patient) return

    const startDate = planningSettings.value.startDate
      ? new Date(planningSettings.value.startDate as string)
      : new Date()
    const sessionDates: Date[] = []

    for (let i = 0; i < planningSettings.value.sessionsToPlan; i++) {
      const sessionDate = new Date(startDate)
      sessionDate.setDate(startDate.getDate() + i * planningSettings.value.frequency)
      sessionDates.push(sessionDate)
    }

    const newSessions = sessionDates.map((date, _index) => ({
      patientId: props.patient?.id || '',
      organizationId: activeOrganization.value?.data?.id || '',
      treatmentPlanId: props.treatmentPlan?.id,
      date: date,
      startTime: '09:00',
      duration: planningSettings.value.duration,
      type: 'follow_up' as
        | 'initial'
        | 'follow_up'
        | 'evaluation'
        | 'discharge'
        | 'mobilization'
        | 'reinforcement'
        | 'reeducation',
      location: planningSettings.value.location as 'clinic' | 'home' | 'telehealth',
      therapistId: sessionDetails.value.therapistId || undefined,
      status: 'scheduled' as const,
      billed: false,
      insuranceClaimed: false
    }))

    // Create each consultation
    if (props.patient) {
      for (const sessionData of newSessions) {
        await createConsultation(props.patient.id, sessionData)
      }
    }

    // Refresh consultations list
    await refreshConsultations()

    emit('close', { type: 'sessions-generated' })
  }

  const deleteSession = async (sessionId: string) => {
    if (!props.patient) return

    const result = await deleteConsultation(props.patient.id, sessionId)

    if (result) {
      // Refresh consultations list
      await refreshConsultations()

      emit('close', { type: 'consultation-deleted' })

      toast.add({
        title: 'Succès',
        description: 'La consultation a été supprimée avec succès.',
        color: 'success'
      })
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    const index = selectedSessions.value.indexOf(sessionId)
    if (index > -1) {
      selectedSessions.value.splice(index, 1)
    } else {
      selectedSessions.value.push(sessionId)
    }
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'scheduled':
        return 'info'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getSessionStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée'
      case 'scheduled':
        return 'À venir'
      case 'completed':
        return 'Terminée'
      case 'cancelled':
        return 'Annulée'
      default:
        return status
    }
  }

  const updateSession = () => {
    toast.add({
      title: 'Succès',
      description: 'Les modifications ont été enregistrées avec succès.',
      color: 'success'
    })
    emit('close', { type: 'sessions-updated' })
  }

  // Helper functions
  const isDateUnavailable = (date: any) => {
    // Handle different date types from UCalendar
    const dateObj = date instanceof Date ? date : new Date(date.toString())
    // Example: Make weekends unavailable
    const day = dateObj.getDay()
    return day === 0 || day === 6 // Sunday (0) or Saturday (6)
  }

  // Load data on component mount
  onMounted(async () => {
    await refreshConsultations()
  })
</script>

<template>
  <USlideover
    title="Planification des séances"
    :description="`Patient: ${formatFullName(props.patient)}`"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl',
      body: 'bg-elevated'
    }"
    @close="emit('close', $event)"
  >
    <template #body>
      <!-- Main Content -->
      <div class="flex flex-col">
        <!-- Treatment Plan Overview -->
        <UCard>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Total de séances</p>
              <p class="font-title text-xl font-bold">{{ props.treatmentPlan?.numberOfSessions || 0 }}</p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Séances restantes</p>
              <p class="font-title text-xl font-bold">
                {{ Math.max(0, (props.treatmentPlan?.numberOfSessions || 0) - (treatmentPlanStats?.completed || 0)) }}
              </p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Plan de traitement</p>
              <p class="font-title text-lg font-bold">{{ props.treatmentPlan?.title }}</p>
            </div>

            <div class="col-span-full space-y-2">
              <div class="flex justify-between text-sm font-medium">
                <span>Progression du plan</span>
                <span>
                  {{ treatmentPlanStats?.completed || 0 }} / {{ props.treatmentPlan?.numberOfSessions || 0 }} séances
                </span>
              </div>
              <UProgress :model-value="treatmentPlanStats?.progressPercentage || 0" :max="100" />
            </div>
            <UAlert
              variant="subtle"
              orientation="horizontal"
              :icon="planningSettings.autoGeneration ? 'i-lucide-zap' : 'i-lucide-zap-off'"
              class="col-span-full"
              :ui="{ icon: 'size-5' }"
            >
              <template #title>
                <h4 class="font-title text-base font-semibold">
                  {{ planningSettings.autoGeneration ? 'Planification automatique' : 'Planification manuelle' }}
                </h4>
              </template>

              <template #description>
                <span v-if="planningSettings.autoGeneration">
                  Ajustez les paramètres de planification, puis lancez la génération des séances.
                </span>
                <span v-else>
                  Utilisez le calendrier ci-dessous pour définir manuellement les dates et heures de chaque séance.
                </span>
              </template>

              <template #actions>
                <USwitch v-model="planningSettings.autoGeneration" />
              </template>
            </UAlert>
          </div>
        </UCard>

        <!-- Planning Toggle Section -->
        <UCollapsible
          :default-open="planningSettings.autoGeneration"
          :open="planningSettings.autoGeneration"
          :unmount-on-hide="false"
          class="mt-6"
        >
          <template #content>
            <UCard>
              <h3 class="text-lg font-bold">Paramètres de planification</h3>

              <!-- Auto Planning Section -->
              <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <UFormField label="Kinésithérapeute responsable" name="therapistId">
                  <USelectMenu
                    v-model="sessionDetails.therapistId"
                    value-key="id"
                    label-key="name"
                    :items="therapists"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Séances à planifier">
                  <UInputNumber
                    v-model="planningSettings.sessionsToPlan"
                    :min="1"
                    :max="treatmentPlan?.numberOfSessions || 20"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Fréquence par semaine">
                  <USelect
                    v-model="planningSettings.frequency"
                    :options="[
                      { label: '1 fois', value: 1 },
                      { label: '2 fois', value: 2 },
                      { label: '3 fois', value: 3 }
                    ]"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Date de début">
                  <UPopover>
                    <UButton color="neutral" variant="subtle" class="w-full justify-start">
                      {{
                        planningStartDateModel
                          ? df.format(planningStartDateModel.toDate(getLocalTimeZone()))
                          : 'Sélectionner une date'
                      }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="planningStartDateModel" class="p-2" :year-controls="false" />
                    </template>
                  </UPopover>
                </UFormField>

                <UFormField label="Durée (minutes)">
                  <div class="space-y-2">
                    <div class="flex justify-between text-xs">
                      <span>15</span>
                      <span>30</span>
                      <span>45</span>
                      <span>60</span>
                      <span>75</span>
                      <span>90</span>
                    </div>
                    <USlider size="lg" v-model="planningSettings.duration" :min="15" :max="90" :step="15" />
                  </div>
                </UFormField>
                <UFormField label="Lieu" class="">
                  <UFieldGroup class="flex">
                    <UButton
                      v-for="loc in [
                        { value: 'clinic', label: 'Cabinet', icon: 'i-lucide-building' },
                        { value: 'home', label: 'Domicile', icon: 'i-lucide-home' },
                        { value: 'telehealth', label: 'Téléconsultation', icon: 'i-lucide-video' }
                      ]"
                      :key="loc.value"
                      :variant="planningSettings.location === loc.value ? 'solid' : 'subtle'"
                      :color="planningSettings.location === loc.value ? 'primary' : 'neutral'"
                      :icon="loc.icon"
                      class="flex-1 justify-center"
                      @click="planningSettings.location = loc.value as any"
                    >
                      {{ loc.label }}
                    </UButton>
                  </UFieldGroup>
                </UFormField>

                <UFormField label="Jours préférés" class="col-span-full">
                  <UCheckboxGroup
                    :items="[
                      { value: 'Mon', label: 'Lundi' },
                      { value: 'Tue', label: 'Mardi' },
                      { value: 'Wed', label: 'Mercredi' },
                      { value: 'Thu', label: 'Jeudi' },
                      { value: 'Fri', label: 'Vendredi' },
                      { value: 'Sat', label: 'Samedi' }
                    ]"
                    v-model="planningSettings.preferredDays"
                    orientation="horizontal"
                    variant="card"
                    :ui="{ item: 'flex-1 p-2 justify-center' }"
                  />
                </UFormField>
              </div>

              <UAlert
                color="warning"
                icon="i-lucide-alert-triangle"
                class="mt-4"
                v-if="
                  props.treatmentPlan?.numberOfSessions &&
                  props.treatmentPlan.numberOfSessions < planningSettings.sessionsToPlan
                "
              >
                <template #title>Limite du plan de traitement</template>
                <template #description>
                  Vous prévoyez {{ planningSettings.sessionsToPlan }} séances, mais le plan prévoit
                  {{ props.treatmentPlan.numberOfSessions }} séances au total. Assurez-vous que cela correspond aux
                  besoins du patient.
                </template>
              </UAlert>
            </UCard>
          </template>
        </UCollapsible>

        <!-- Session Details - Only show in manual mode -->

        <UCollapsible :open="!planningSettings.autoGeneration" :unmount-on-hide="false">
          <template #content>
            <UCard>
              <h3 class="text-lg font-bold">Détails du rendez-vous</h3>

              <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <UFormField label="Kinésithérapeute responsable" name="therapistId">
                  <USelectMenu
                    v-model="sessionDetails.therapistId"
                    value-key="id"
                    label-key="name"
                    :items="therapists"
                    class="w-full"
                  />
                </UFormField>

                <div class="">
                  <UFormField label="Type de séance">
                    <USelect
                      v-model="sessionDetails.type"
                      :items="[
                        { value: 'initial', label: 'Évaluation initiale' },
                        { value: 'follow_up', label: 'Suivi' },
                        { value: 'evaluation', label: 'Évaluation' },
                        { value: 'discharge', label: 'Sortie' },
                        { value: 'mobilization', label: 'Mobilisation' },
                        { value: 'reinforcement', label: 'Renforcement' },
                        { value: 'reeducation', label: 'Rééducation' }
                      ]"
                      option-attribute="label"
                      value-attribute="value"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <UFormField label="Durée (minutes)">
                  <div class="space-y-2">
                    <div class="flex justify-between text-xs">
                      <span>15</span>
                      <span>30</span>
                      <span>45</span>
                      <span>60</span>
                      <span>75</span>
                      <span>90</span>
                    </div>
                    <USlider size="lg" v-model="sessionDetails.duration" :min="15" :max="90" :step="15" />
                  </div>
                </UFormField>
                <UFormField label="Lieu">
                  <UFieldGroup class="flex">
                    <UButton
                      v-for="loc in [
                        { value: 'clinic', label: 'Cabinet', icon: 'i-lucide-building' },
                        { value: 'home', label: 'Domicile', icon: 'i-lucide-home' },
                        { value: 'telehealth', label: 'Téléconsultation', icon: 'i-lucide-video' }
                      ]"
                      :key="loc.value"
                      :variant="sessionDetails.location === loc.value ? 'solid' : 'subtle'"
                      :color="sessionDetails.location === loc.value ? 'primary' : 'neutral'"
                      :icon="loc.icon"
                      block
                      @click="sessionDetails.location = loc.value as any"
                    >
                      {{ loc.label }}
                    </UButton>
                  </UFieldGroup>
                </UFormField>
              </div>
              <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <!-- Calendar -->
                <UCard variant="subtle">
                  <UCalendar
                    v-model="selectedDateModel"
                    :year-controls="false"
                    :is-date-unavailable="isDateUnavailable"
                  />
                </UCard>

                <!-- Time Selection -->
                <UCard
                  variant="subtle"
                  :ui="{
                    body: 'h-full flex flex-col justify-between'
                  }"
                >
                  <UFormField label="Heure de la séance">
                    <!-- Quick Time Slots -->
                    <div class="grid grid-cols-3 gap-2 pb-6 sm:grid-cols-4">
                      <UButton
                        v-for="time in timeSlots"
                        block
                        :key="time"
                        :variant="isTimeUnavailable(time) ? 'soft' : isTimeSelected(time) ? 'solid' : 'subtle'"
                        :color="isTimeUnavailable(time) ? 'neutral' : 'primary'"
                        :disabled="isTimeUnavailable(time)"
                        size="md"
                        @click="!isTimeUnavailable(time) && selectTime(time)"
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
                    :disabled="isCreating"
                    @click="addSession"
                  >
                    Ajouter cette séance au plan
                  </UButton>
                </UCard>
              </div>
            </UCard>
          </template>
        </UCollapsible>

        <!-- Session Management -->
        <UCard class="mt-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-foreground text-lg font-bold">Gestion des Séances</h3>
              <p class="text-muted-foreground text-base">Prévisualisez, générez et ajustez les séances ci-dessous.</p>
            </div>
            <div class="flex items-center gap-3">
              <UButton
                v-if="planningSettings.autoGeneration"
                icon="i-lucide-refresh-cw"
                variant="outline"
                color="primary"
                @click="generateSessions"
              >
                Regénérer
              </UButton>
              <UButton
                v-if="planningSettings.autoGeneration"
                icon="i-lucide-sparkles"
                color="primary"
                :loading="isCreating"
                :disabled="isCreating"
                @click="generateSessions"
              >
                Générer les séances
              </UButton>
              <UButton v-else icon="i-lucide-plus" variant="outline" color="primary" @click="addSession">
                Ajouter une séance manuellement
              </UButton>
            </div>
          </div>

          <div class="mt-4 overflow-x-auto">
            <UTable
              :data="sessions"
              :loading="isLoading"
              :columns="[
                { accessorKey: 'selected', header: '' },
                { accessorKey: 'date', header: 'Date & Heure' },
                { accessorKey: 'details', header: 'Détails Séance' },
                { accessorKey: 'status', header: 'Statut' },
                { id: 'actions', header: '' }
              ]"
            >
              <template #selected-cell="{ row }">
                <UCheckbox
                  :model-value="selectedSessions.includes(row.original.id)"
                  @update:model-value="toggleSessionSelection(row.original.id)"
                />
              </template>

              <template #date-cell="{ row }">
                <div>
                  <div class="font-medium">
                    {{
                      new Date(row.original.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })
                    }}
                  </div>
                  <div class="text-muted-foreground">{{ row.original.startTime || '' }}</div>
                </div>
              </template>

              <template #details-cell="{ row }">
                <div>
                  <div class="font-medium">
                    {{
                      row.original.type === 'initial'
                        ? 'Évaluation initiale'
                        : row.original.type === 'follow_up'
                          ? 'Suivi'
                          : row.original.type === 'evaluation'
                            ? 'Évaluation'
                            : row.original.type === 'discharge'
                              ? 'Sortie'
                              : row.original.type === 'mobilization'
                                ? 'Mobilisation'
                                : row.original.type === 'reinforcement'
                                  ? 'Renforcement'
                                  : row.original.type === 'reeducation'
                                    ? 'Rééducation'
                                    : row.original.type || ''
                    }}
                  </div>
                  <div class="text-muted-foreground">{{ row.original.chiefComplaint || '' }}</div>
                </div>
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="getSessionStatusColor(row.original.status)" variant="soft" size="xs">
                  {{ getSessionStatusLabel(row.original.status) }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-edit" variant="ghost" color="neutral" size="sm" square />
                  <UButton
                    icon="i-lucide-trash"
                    variant="ghost"
                    color="error"
                    size="sm"
                    square
                    @click="deleteSession(row.original.id)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <div
            class="border-border bg-muted/50 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div class="text-muted-foreground text-sm font-medium">
              <span class="text-foreground font-bold">{{ selectedSessions.length }}</span>
              séances sélectionnées
            </div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-skip-forward"
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="selectedSessions.length === 0"
              >
                Reporter
              </UButton>
              <UButton
                icon="i-lucide-check-square"
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="selectedSessions.length === 0"
              >
                Changer statut
              </UButton>
              <UButton
                icon="i-lucide-trash"
                variant="outline"
                color="error"
                size="sm"
                :disabled="selectedSessions.length === 0"
              >
                Supprimer
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Communication Settings -->
        <UCard class="mt-6">
          <h3 class="text-foreground mb-4 text-lg font-bold">Communication Patient</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-sm font-medium">Envoyer les confirmations de séance</span>
              <USwitch v-model="communicationSettings.sendConfirmations" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-sm font-medium">
                Activer les rappels automatiques (24h avant)
              </span>
              <USwitch v-model="communicationSettings.enableReminders" />
            </div>
            <UButton icon="i-lucide-share" variant="outline" color="neutral" size="lg" block>
              Partager l'historique des séances
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" color="neutral" @click="emit('close')">Annuler</UButton>
        <UButton color="primary" @click="updateSession">Mettre à jour la séance</UButton>
      </div>
    </template>
  </USlideover>
</template>
