<script setup lang="ts">
  import { LazyAppModalConfirm, LazyConsultationSlideover } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan?: TreatmentPlanWithProgress | null
    appointment?: Appointment
  }>()

  const emit = defineEmits<{ close: [data?: any] }>()
  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)
  const activeConsultationOverlay = overlay.create(LazyConsultationSlideover)
  const { mutate: updateStatus } = useUpdateAppointmentStatus()
  const appointmentAction = useAppointmentAction()

  // Tab configuration
  //  const planningTabs = [
  //    {
  //      label: 'Planification manuelle',
  //      icon: 'i-lucide-calendar-plus',
  //      slot: 'manual',
  //      value: 'manual'
  //    },
  //    {
  //      label: 'Planification automatique',
  //      icon: 'i-lucide-zap',
  //      slot: 'auto',
  //      value: 'auto'
  //    }
  //  ] satisfies TabsItem[]

  // Tab state
  const activePlanningTab = ref('manual')

  const slideoverTitle = computed(() => (props.appointment ? 'Modifier la séance' : 'Planification des séances'))

  const slideoverDescription = computed(() => {
    if (!props.appointment) {
      const planInfo = props.treatmentPlan ? ` - Plan: ${props.treatmentPlan.title}` : ''
      return `Patient: ${formatFullName(props.patient)}${planInfo}`
    }
    return `Modifier la séance du ${formatFrenchDate(props.appointment.date)} pour ${formatFullName(props.patient)}`
  })

  const treatmentPlanStats = ref<{
    total: number
    completed: number
    scheduled: number
    cancelled: number
    progressPercentage: number
  } | null>(null)

  const communicationSettings = ref({
    sendConfirmations: false,
    enableReminders: true
  })

  const canStartSession = computed(() => {
    return props.appointment && ['scheduled', 'confirmed'].includes(props.appointment.status)
  })

  const canCompleteSession = computed(() => {
    return props.appointment && props.appointment.status === 'in_progress'
  })

  const handleStartSession = async () => {
    if (!props.appointment) return

    const confirmed = await confirmModal.open({
      title: 'Démarrer la consultation',
      message: `Démarrer la consultation avec ${formatFullName(props.patient)} le ${formatFrenchDate(props.appointment.date)} à ${props.appointment.startTime} ?`,
      confirmText: 'Démarrer',
      cancelText: 'Annuler',
      confirmColor: 'primary',
      icon: 'i-hugeicons-play-circle'
    })

    if (!confirmed) return

    const actualStartTime = (() => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      return `${hours}:${minutes}:${seconds}`
    })()

    try {
      await appointmentAction.startAsync({
        id: props.appointment.id,
        actualStartTime
      })
    } catch (error) {
      console.error('Failed to start session:', error)
      return
    }

    activeConsultationOverlay.open({
      patientId: props.patient.id,
      appointmentId: props.appointment.id
    })

    emit('close')
  }

  const handleCompleteSession = async () => {
    if (!props.appointment) return

    const confirmed = await confirmModal.open({
      title: 'Terminer la consultation',
      message: `Terminer la consultation avec ${formatFullName(props.patient)} ?`,
      confirmText: 'Terminer',
      cancelText: 'Annuler',
      confirmColor: 'success',
      icon: 'i-hugeicons-checkmark-circle-01'
    })

    if (confirmed) {
      updateStatus({
        patientId: props.patient.id,
        appointmentId: props.appointment.id,
        status: 'completed'
      })
    }
  }
</script>

<template>
  <USlideover
    :title="slideoverTitle"
    :description="slideoverDescription"
    :ui="{
      content: 'w-full md:w-3/4 max-w-5xl bg-elevated',
      header: 'hidden'
    }"
    @close="emit('close', $event)"
  >
    <template #body>
      <!-- Main Content -->
      <div class="flex flex-col gap-4">
        <!-- Treatment Plan Overview -->
        <UCard v-if="treatmentPlan">
          <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Total de séances</p>
              <p class="font-title text-xl font-bold">{{ treatmentPlan.numberOfSessions || 0 }}</p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Séances restantes</p>
              <p class="font-title text-xl font-bold">
                {{ Math.max(0, (treatmentPlan.numberOfSessions || 0) - (treatmentPlanStats?.completed || 0)) }}
              </p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4 sm:col-span-2">
              <p class="text-sm font-medium">Plan de traitement</p>
              <p class="font-title text-lg font-bold">{{ treatmentPlan.title }}</p>
            </div>

            <div class="col-span-full space-y-2">
              <div class="flex justify-between text-sm font-medium">
                <span>Progression du plan</span>
                <span>
                  {{ treatmentPlanStats?.completed || 0 }} / {{ treatmentPlan.numberOfSessions || 0 }} séances
                </span>
              </div>
              <UProgress :model-value="treatmentPlanStats?.progressPercentage || 0" :max="100" size="lg" />
            </div>
          </div>
        </UCard>

        <!-- Independent Session Banner -->
        <UAlert
          v-else
          color="info"
          variant="subtle"
          icon="i-lucide-stethoscope"
          title="Consultation Indépendante"
          description="Cette séance n'est pas liée à un plan de traitement."
        />

        <!-- Planning Tabs -->
        <AppointmentManualPlanningCard
          :treatment-plan="treatmentPlan"
          :patient="patient"
          :appointment="appointment"
        />

        <!-- -----------------------------Hiding the tabs witht automatique planning---------------------------------------- -->
        <!-- <UCard class="mt-6"> -->
        <!-- <UTabs -->
        <!-- v-model="activePlanningTab" -->
        <!-- :items="planningTabs" -->
        <!-- variant="pill" -->
        <!-- size="xl" -->
        <!-- color="primary" -->
        <!-- class="w-full" -->
        <!-- > -->
        <!-- Manual Planning Tab -->
        <!-- <template #manual> -->
        <!-- <AppointmentManualPlanningCard :treatment-plan="treatmentPlan" :therapists="therapists" /> -->
        <!-- </template> -->

        <!-- Auto Planning Tab -->
        <!-- <template #auto> -->
        <!-- <ConsultationAutomaticPlanningCard :therapists="therapists" :treatment-plan="treatmentPlan" /> -->
        <!-- </template> -->
        <!-- </UTabs> -->
        <!-- </UCard> -->

        <!-- Session Management FIXME -->
        <AppointmentManagement :active-planning-tab="activePlanningTab" :patientId="patient.id" />

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
    <template #footer="{ close }">
      <div class="flex w-full justify-between gap-3">
        <div class="flex gap-3">
          <UButton
            v-if="canStartSession"
            icon="i-hugeicons-play-circle"
            color="primary"
            size="lg"
            @click="handleStartSession"
          >
            Démarrer
          </UButton>

          <UButton
            v-if="canCompleteSession"
            icon="i-hugeicons-checkmark-circle-01"
            color="success"
            size="lg"
            @click="handleCompleteSession"
          >
            Terminer
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
