<script setup lang="ts">
  import { LazyAppModalEVA, LazyTreatmentSessionSlideover } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan?: TreatmentPlanWithProgress | null
    appointment?: AppointmentWithSession
  }>()

  const emit = defineEmits<{ close: [data?: any] }>()

  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)
  const treatmentSesionOverlay = overlay.create(LazyTreatmentSessionSlideover)
  const createTreatmentSession = useCreateTreatmentSession()

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

  const handleStartSession = async () => {
    if (!props.appointment || createTreatmentSession.isLoading.value) return

    if (props.appointment.treatmentSession?.id) {
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
      const result = await createTreatmentSession.mutateAsync({
        appointmentId: props.appointment.id
      })

      if (result?.data?.id) {
        treatmentSesionOverlay.open({
          patientId: props.patient.id,
          appointmentId: props.appointment.id
        })
        emit('close')
      }
    } catch (error) {
      const parsedError = parseError(error, 'Impossible de créer la séance de traitement')
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
        <AppointmentManualPlanningCard :treatment-plan="treatmentPlan" :patient="patient" :appointment="appointment" />

        <!-- Session Management FIXME -->
        <AppointmentManagement active-planning-tab="manual" :patientId="patient.id" />

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
            :loading="createTreatmentSession.isLoading.value"
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
