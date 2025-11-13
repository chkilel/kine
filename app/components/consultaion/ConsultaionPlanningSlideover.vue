<script setup lang="ts">
  import { UCard } from '#components'

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
    frequency: 2,
    duration: 45,
    startDate: new Date().toISOString().split('T')[0],
    preferredDays: ['Lundi', 'Mercredi', 'Vendredi'] as string[],
    location: 'cabinet' as 'cabinet' | 'domicile' | 'visio'
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

  const togglePreferredDay = (day: string) => {
    const index = planningSettings.value.preferredDays.indexOf(day)
    if (index > -1) {
      planningSettings.value.preferredDays.splice(index, 1)
    } else {
      planningSettings.value.preferredDays.push(day)
    }
  }
</script>

<template>
  <USlideover
    v-model:open="props.open"
    title="Planification des séances"
    :description="`Patient: ${formatFullName(props.patient!)}`"
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
              <p class="font-title text-xl font-bold">{{ props.treatmentPlan?.numberOfSessions }}</p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Séances restantes</p>
              <p class="font-title text-xl font-bold">555</p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Plan de traitement</p>
              <p class="font-title text-lg font-bold">{{ props.treatmentPlan?.title }}</p>
            </div>

            <div class="col-span-full space-y-2">
              <div class="flex justify-between text-sm font-medium">
                <span>Progression du plan</span>
                <span>{{ 666 }} / {{ 444 }} séances</span>
              </div>
              <UProgress
                :model-value="props.treatmentPlan?.completedSessions || 0"
                :max="props.treatmentPlan?.totalSessions || 1"
              />
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
                <UFormField label="Praticien">
                  <UInput v-model="sessionDetails.practitioner" readonly class="w-full" />
                </UFormField>
                <UFormField label="Séances à planifier">
                  <UInputNumber
                    v-model="planningSettings.sessionsToPlan"
                    :min="1"
                    :max="treatmentPlan?.totalSessions || 20"
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
                        planningSettings.startDate
                          ? new Date(planningSettings.startDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : 'Sélectionner une date'
                      }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="planningSettings.startDate" class="p-2" :year-controls="false" />
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
                        { value: 'cabinet', label: 'Cabinet', icon: 'i-lucide-building' },
                        { value: 'domicile', label: 'Domicile', icon: 'i-lucide-home' }
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
                    :items="['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']"
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
                  props.treatmentPlan?.remainingSessions &&
                  props.treatmentPlan.remainingSessions < planningSettings.sessionsToPlan
                "
              >
                <template #title>Limite du plan de traitement</template>
                <template #description>
                  Vous prévoyez {{ planningSettings.sessionsToPlan }} séances, mais il n'en reste que
                  {{ props.treatmentPlan.remainingSessions }} sur les {{ props.treatmentPlan?.totalSessions }} du plan.
                  Assurez-vous que cela correspond aux besoins du patient.
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
                <UFormField label="Praticien">
                  <UInput v-model="sessionDetails.practitioner" readonly class="w-full" />
                </UFormField>

                <div class="">
                  <UFormField label="Type de séance">
                    <USelect
                      v-model="sessionDetails.type"
                      :options="['Rééducation lombaire', 'Mobilisation', 'Évaluation initiale']"
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
                        { value: 'cabinet', label: 'Cabinet', icon: 'i-lucide-building' },
                        { value: 'domicile', label: 'Domicile', icon: 'i-lucide-car-front' }
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

                  <UButton icon="i-lucide-plus" color="primary" size="lg" block @click="addSession">
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
