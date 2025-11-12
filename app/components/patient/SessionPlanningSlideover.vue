<script setup lang="ts">
  import { UCard } from '#components'

  interface Patient {
    id: string
    firstName: string
    lastName: string
  }

  interface TreatmentPlan {
    id: string
    title: string
    totalSessions: number
    completedSessions: number
    remainingSessions: number
    treatmentType: string
    progress: number
  }

  interface Session {
    id: string
    date: string
    time: string
    type: string
    details: string
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
    duration: number
    location: 'cabinet' | 'domicile' | 'visio'
    practitioner: string
  }

  const props = defineProps<{
    patient?: Patient
    treatmentPlan?: TreatmentPlan
    open?: boolean
  }>()

  const emit = defineEmits<{
    'update:open': [value: boolean]
    close: [data?: any]
    'session-created': [session: Session]
    'sessions-updated': [sessions: Session[]]
    'sessions-generated': [sessions: Session[]]
  }>()

  const toast = useToast()

  // Form state
  const planningSettings = ref({
    autoGeneration: true,
    sessionsToPlan: 8,
    frequency: 7,
    duration: 45,
    startDate: new Date().toISOString().split('T')[0],
    preferredDays: [] as string[]
  })

  const sessionDetails = ref({
    date: new Date(),
    time: '',
    duration: 45,
    type: '',
    practitioner: 'Dr. Martin',
    location: 'cabinet',
    notes: ''
  })

  const communicationSettings = ref({
    sendConfirmations: false,
    enableReminders: true
  })

  // Calendar state
  const selectedDate = ref<Date | null>(null)
  const selectedTime = ref<string | null>(null)

  // Sessions data
  const sessions = ref<Session[]>([
    {
      id: '1',
      date: '2024-08-05',
      time: '10:00',
      type: 'Mobilisation',
      details: 'Objectif: Amplitude articulaire',
      status: 'scheduled',
      duration: 45,
      location: 'cabinet',
      practitioner: 'Dr. Jean Lefevre'
    },
    {
      id: '2',
      date: '2024-08-07',
      time: '14:30',
      type: 'Renforcement',
      details: 'Équipement: Élastiques, poids légers',
      status: 'scheduled',
      duration: 45,
      location: 'cabinet',
      practitioner: 'Dr. Jean Lefevre'
    },
    {
      id: '3',
      date: '2024-08-09',
      time: '09:00',
      type: 'Mobilisation',
      details: 'Note: Focus sur rotation externe',
      status: 'confirmed',
      duration: 45,
      location: 'cabinet',
      practitioner: 'Dr. Jean Lefevre'
    }
  ])

  const selectedSessions = ref<string[]>([])

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

  const selectDate = (date: Date) => {
    selectedDate.value = date
    sessionDetails.value.date = date
  }

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
  const addSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      date: selectedDate.value?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      time: selectedTime.value || '',
      type: sessionDetails.value.type || 'Rééducation',
      details: `Objectif: ${sessionDetails.value.type?.toLowerCase() || 'rééducation'}`,
      status: 'scheduled',
      duration: sessionDetails.value.duration,
      location: sessionDetails.value.location as 'cabinet' | 'domicile' | 'visio',
      practitioner: sessionDetails.value.practitioner
    }

    sessions.value.push(newSession)
    emit('session-created', newSession)
    emit('close', { type: 'session-created', data: newSession })

    toast.add({
      title: 'Séance ajoutée',
      description: `La séance du ${selectedDate.value?.toLocaleDateString('fr-FR')} à ${newSession.time} a été ajoutée.`,
      color: 'success'
    })
  }

  const generateSessions = () => {
    const startDate = planningSettings.value.startDate ? new Date(planningSettings.value.startDate) : new Date()
    const sessionDates: Date[] = []

    for (let i = 0; i < planningSettings.value.sessionsToPlan; i++) {
      const sessionDate = new Date(startDate)
      sessionDate.setDate(startDate.getDate() + i * planningSettings.value.frequency)
      sessionDates.push(sessionDate)
    }

    const newSessions = sessionDates.map((date, index) => ({
      id: Date.now().toString() + index,
      date: date.toISOString().split('T')[0] || '',
      time: '09:00',
      type: 'Rééducation lombaire',
      details: `Séance ${index + 1}/${planningSettings.value.sessionsToPlan}`,
      status: 'scheduled' as const,
      duration: planningSettings.value.duration,
      location: 'cabinet' as const,
      practitioner: 'Dr. Jean Lefevre'
    }))

    sessions.value.push(...newSessions)
    emit('sessions-generated', newSessions)
    emit('close', { type: 'sessions-generated', data: newSessions })
  }

  const deleteSession = (sessionId: string) => {
    const index = sessions.value.findIndex((s) => s.id === sessionId)
    if (index > -1) {
      sessions.value.splice(index, 1)
      emit('sessions-updated', sessions.value)
      emit('close', { type: 'sessions-updated', data: sessions.value })

      toast.add({
        title: 'Séance supprimée',
        description: 'La séance a été supprimée avec succès.',
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
      title: 'Séance mise à jour',
      description: 'Les modifications ont été enregistrées avec succès.',
      color: 'success'
    })
    emit('close', { type: 'sessions-updated', data: sessions.value })
  }

  // Helper functions
  const isDateUnavailable = (date: any) => {
    // Handle different date types from UCalendar
    const dateObj = date instanceof Date ? date : new Date(date.toString())
    // Example: Make weekends unavailable
    const day = dateObj.getDay()
    return day === 0 || day === 6 // Sunday (0) or Saturday (6)
  }

  const isToday = (date: any) => {
    const dateObj = date instanceof Date ? date : new Date(date.toString())
    const today = new Date()
    return dateObj.toDateString() === today.toDateString()
  }

  const isSelected = (date: any) => {
    const dateObj = date instanceof Date ? date : new Date(date.toString())
    return selectedDate.value ? dateObj.toDateString() === selectedDate.value.toDateString() : false
  }
</script>

<template>
  <USlideover
    v-model:open="props.open"
    title="Planification des séances"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl',
      body: 'bg-elevated',
      header: 'bg-accented'
    }"
    @close="emit('close', $event)"
  >
    <template #description>
      <h2 class="text-lg">{{ `Plan de traitement pour ${formatFullName(props.patient!)}` }}</h2>
    </template>
    <template #body>
      <!-- Main Content -->
      <div class="flex flex-col gap-6">
        <!-- Treatment Plan Overview -->
        <UCard>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4 sm:col-span-2">
              <p class="text-muted-foreground text-sm font-medium">Titre</p>
              <p class="text-foreground text-lg font-semibold">
                {{ props.treatmentPlan?.title }}
              </p>
            </div>

            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4 text-center">
              <p class="text-muted-foreground text-sm font-medium">Total de séances</p>
              <p class="text-foreground text-xl font-bold">{{ props.treatmentPlan?.totalSessions }}</p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4 text-center">
              <p class="text-muted-foreground text-sm font-medium">Séances restantes</p>
              <p class="text-foreground text-xl font-bold">{{ props.treatmentPlan?.remainingSessions }}</p>
            </div>
          </div>
          <USeparator class="mt-6">
            <h3 class="text-lg font-bold">Paramètres de Planification</h3>
          </USeparator>
          <div class="flex flex-wrap items-center justify-end gap-4">
            <div class="flex items-center gap-3">
              <span class="text-muted-foreground text-sm font-medium">Activer la génération automatique</span>
              <USwitch v-model="planningSettings.autoGeneration" />
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <UFormField label="Séances à planifier">
              <UInputNumber v-model="planningSettings.sessionsToPlan" :min="1" :max="20" class="w-full" />
            </UFormField>

            <UFormField label="Fréquence / semaine">
              <USelect
                v-model="planningSettings.preferredDays"
                :options="[
                  { value: 'morning', label: 'Matin (8h-12h)' },
                  { value: 'afternoon', label: 'Après-midi (14h-18h)' },
                  { value: 'evening', label: 'Soir (18h-20h)' }
                ]"
                multiple
                class="w-full"
              />
            </UFormField>

            <UFormField label="Durée (min)">
              <USelect
                v-model="planningSettings.duration"
                :options="[
                  { label: '30', value: 30 },
                  { label: '45', value: 45 },
                  { label: '60', value: 60 }
                ]"
              />
            </UFormField>

            <UFormField label="Date de début">
              <UInput v-model="planningSettings.startDate" type="date" class="w-full" />
            </UFormField>
          </div>

          <UAlert
            color="warning"
            icon="i-lucide-alert-triangle"
            class="mt-4"
            v-if="
              props.treatmentPlan?.remainingSessions &&
              props.treatmentPlan.remainingSessions < planningSettings.sessionsToPlan
            "
          >
            <template #title>Attention</template>
            <template #description>
              Il ne reste que {{ props.treatmentPlan.remainingSessions }} séances disponibles dans le plan de traitement
              actuel.
            </template>
          </UAlert>
        </UCard>

        <!-- Session Details -->
        <UCard>
          <h3 class="mb-6 text-lg font-bold">Détails du rendez-vous</h3>

          <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <UFormField label="Praticien">
              <UInput v-model="sessionDetails.practitioner" readonly class="w-full" />
            </UFormField>

            <UFormField label="Lieu">
              <UFieldGroup class="flex">
                <UButton
                  v-for="loc in [
                    { value: 'cabinet', label: 'Cabinet', icon: 'i-lucide-building' },
                    { value: 'domicile', label: 'Domicile', icon: 'i-lucide-home' }
                  ]"
                  :key="loc.value"
                  :variant="sessionDetails.location === loc.value ? 'solid' : 'subtle'"
                  :color="sessionDetails.location === loc.value ? 'primary' : 'neutral'"
                  :icon="loc.icon"
                  class="flex-1 justify-center"
                  @click="sessionDetails.location = loc.value as any"
                >
                  {{ loc.label }}
                </UButton>
              </UFieldGroup>
            </UFormField>

            <UFormField label="Durée">
              <UFieldGroup class="w-full">
                <UButton
                  v-for="duration in [30, 45, 60]"
                  :key="duration"
                  :variant="sessionDetails.duration === duration ? 'solid' : 'subtle'"
                  :color="sessionDetails.duration === duration ? 'primary' : 'neutral'"
                  class="flex-1 justify-center"
                  @click="sessionDetails.duration = duration"
                >
                  {{ duration }} min
                </UButton>
              </UFieldGroup>
            </UFormField>

            <div class="md:col-span-2 lg:col-span-3">
              <UFormField label="Type de séance">
                <USelect
                  v-model="sessionDetails.type"
                  :options="['Rééducation lombaire', 'Mobilisation', 'Évaluation initiale']"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
          <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Calendar -->
            <UCard variant="subtle">
              <UCalendar
                :year-controls="false"
                :model-value="selectedDate"
                @update:model-value="selectedDate = $event"
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
                    :key="time"
                    :variant="isTimeUnavailable(time) ? 'soft' : isTimeSelected(time) ? 'solid' : 'subtle'"
                    :color="isTimeUnavailable(time) ? 'neutral' : 'primary'"
                    :disabled="isTimeUnavailable(time)"
                    size="md"
                    class="justify-center"
                    @click="!isTimeUnavailable(time) && selectTime(time)"
                  >
                    {{ time }}
                  </UButton>
                </div>
              </UFormField>

              <UButton icon="i-lucide-plus" color="primary" size="lg" block class="mt-auto" @click="addSession">
                Ajouter cette séance au plan
              </UButton>
            </UCard>
          </div>
        </UCard>

        <!-- Session Management -->
        <UCard>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-foreground text-lg font-bold">Gestion des Séances</h3>
              <p class="text-muted-foreground text-base">Prévisualisez, générez et ajustez les séances ci-dessous.</p>
            </div>
            <div class="flex items-center gap-3">
              <UButton icon="i-lucide-refresh-cw" variant="outline" color="primary" @click="generateSessions">
                Regénérer
              </UButton>
              <UButton icon="i-lucide-sparkles" color="primary" @click="generateSessions">Générer les séances</UButton>
            </div>
          </div>

          <div class="mt-4 overflow-x-auto">
            <UTable
              :data="sessions"
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
                      new Date(row.original.date || '').toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })
                    }}
                  </div>
                  <div class="text-muted-foreground">{{ row.original.time || '' }}</div>
                </div>
              </template>

              <template #details-cell="{ row }">
                <div>
                  <div class="font-medium">{{ row.original.type || '' }}</div>
                  <div class="text-muted-foreground">{{ row.original.details || '' }}</div>
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
        <UCard>
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
