<script setup lang="ts">
  import { LazyAppModalEVA, LazyAppReceiptModal } from '#components'

  const props = defineProps<{
    patientId: string
    appointmentId: string
  }>()

  const emit = defineEmits<{ close: [] }>()

  // ─── Composable ─────────────────────────────────────────────────────────────
  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)
  const receiptModal = overlay.create(LazyAppReceiptModal)

  const { mutateAsync: createTreatmentSessionAsync, isLoading: isCreating } = useCreateTreatmentSession()
  const { mutateAsync: startSessionAsync, isLoading: isSessionStarting } = useStartTreatmentSession()

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const { data: patient } = usePatientById(() => props.patientId)
  const { data: allAppointments } = useAppointmentsListWithSessions(() => ({ patientId: props.patientId, limit: 6 }))
  const {
    data: appointment,
    isPending: appointmentLoading,
    refetch: refetchAppointment
  } = useAppointment(() => props.appointmentId)

  const { data: sessionPayments } = useTreatmentSessionPayments(() => appointment.value?.treatmentSession?.id ?? '')

  // ─── State ─────────────────────────────────────────────────────────────────
  const showPaymentCard = ref(false)
  const isTimerPaused = ref(false)

  watch(
    () => appointment.value?.treatmentSession?.pauseStartTime,
    (pauseStartTime) => {
      isTimerPaused.value = !!pauseStartTime
    },
    { immediate: true }
  )

  // ─── Derived state ─────────────────────────────────────────────────────────
  const showPaymentButton = computed(() => {
    if (!appointment.value?.treatmentSession) return false
    return appointment.value.treatmentSession?.status === 'finished'
  })

  const isSessionPaid = computed(() => {
    if (!appointment.value?.treatmentSession) return false
    return appointment.value.treatmentSession?.status === 'completed'
  })

  const latestPayment = computed(() => {
    const payments = sessionPayments.value as Payment[] | undefined
    if (!payments?.length) return null
    return payments[payments.length - 1]
  })

  const paymentMethodLabel = (method: string) => PAYMENT_METHOD_OPTIONS.find((m) => m.value === method)?.label ?? method

  const sessionNotStarted = computed(
    () => !appointment.value?.treatmentSession || appointment.value?.treatmentSession?.status === 'pre_session'
  )

  // ─── Computed ───────────────────────────────────────────────────────────────
  const sessionStatusConfig = computed(() => {
    const status = appointment.value?.treatmentSession?.status
    if (!status) return null
    return {
      label: getTreatmentSessionStatusLabel(status),
      color: getTreatmentSessionStatusColor(status),
      icon: getTreatmentSessionStatusIcon(status)
    }
  })

  const previousAppointments = computed(() => {
    const list = allAppointments.value
    const currentAppointment = appointment.value
    if (!list || !currentAppointment) return []

    return list
      .filter((c) => c.id !== currentAppointment.id && c.date <= currentAppointment.date)
      .slice(-5)
      .reverse()
  })

  const patientfullname = computed(() => (patient.value ? formatFullName(patient.value) : ''))

  const headerTitle = computed(() => patientfullname.value || 'Séance active')

  const headerDescription = computed(() => {
    if (!appointment.value) return ''
    const typeLabel = getAppointmentTypeLabel(appointment.value.type || 'follow_up')
    const totalDuration =
      appointment.value.duration + (appointment.value?.treatmentSession?.extendedDurationMinutes || 0)
    const durationLabel = totalDuration ? `${totalDuration} min` : ''
    return [typeLabel, durationLabel].filter(Boolean).join(' • ')
  })

  // ─── Actions ───────────────────────────────────────────────────────────────
  async function handleStartSession() {
    if (isCreating.value || isSessionStarting.value) return

    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur initiale',
      description: 'Veuillez indiquer le niveau de douleur du patient avant la séance',
      confirmText: 'Enregistrer et démarrer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue === null) return

    try {
      let sessionId = appointment.value?.treatmentSession?.id

      if (!sessionId) {
        try {
          const result = await createTreatmentSessionAsync({ appointmentId: props.appointmentId })
          sessionId = result?.data?.id
        } catch (error) {
          const parsedError = parseError(error, 'Impossible de créer la séance de traitement')
          if (parsedError.statusCode === 409) {
            await refetchAppointment()
            sessionId = appointment.value?.treatmentSession?.id
          } else {
            throw error
          }
        }
      }

      if (!sessionId) {
        await refetchAppointment()
        sessionId = appointment.value?.treatmentSession?.id
      }

      if (!sessionId) throw new Error('Failed to create session')

      await startSessionAsync({
        sessionId,
        actualStartTime: getCurrentTimeHHMMSS(),
        painLevelBefore: evaValue
      })

      await refetchAppointment()
    } catch (error) {
      const parsedError = parseError(error, 'Impossible de démarrer la séance')
      useToast().add({
        title: 'Erreur',
        description: parsedError.message,
        color: 'error'
      })
    }
  }

  function handleViewReceipt() {
    if (!appointment.value?.treatmentSession) return

    const session = appointment.value.treatmentSession
    if (!session || session.status !== 'completed') return

    receiptModal.open({ sessionId: session.id })
  }

  async function handlePaymentCreated() {
    showPaymentCard.value = false
    await refetchAppointment()
  }
</script>

<template>
  <USlideover :dismissible="true" :close="false" :ui="{ content: 'w-full max-w-[1500px]' }" @close="emit('close')">
    <template #header>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-hugeicons-panel-left-close"
            size="xl"
            color="neutral"
            variant="ghost"
            square
            :ui="{ leadingIcon: 'size-8' }"
            @click="emit('close')"
          />
          <div v-if="patient" class="flex items-center gap-3">
            <div class="rounded-full p-1" :class="isTimerPaused ? 'bg-warning-300 animate-pulse' : 'bg-primary-100'">
              <UAvatar :alt="patientfullname" size="xl" />
            </div>

            <div>
              <h3 class="text-base leading-tight font-semibold">
                {{ headerTitle }} •
                <span class="text-muted text-sm font-medium">{{ calculateAge(patient.dateOfBirth) }} ans</span>
              </h3>

              <div class="flex h-5 items-end gap-2">
                <p class="text-muted text-xs">{{ headerDescription }}</p>
                <UBadge
                  v-if="isTimerPaused"
                  icon="i-lucide-pause-circle"
                  size="sm"
                  color="warning"
                  variant="solid"
                  class="ml-2 animate-pulse rounded-full"
                >
                  En pause
                </UBadge>
              </div>
            </div>
          </div>
          <h3 v-else class="text-base font-semibold">Séance active</h3>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <TreatmentSessionTimer
            v-if="appointment"
            compact
            :appointment="appointment"
            @pause="(event) => (isTimerPaused = event)"
          />
          <UButton
            v-if="sessionNotStarted"
            size="lg"
            color="primary"
            variant="solid"
            icon="i-hugeicons-play-circle"
            :loading="isCreating"
            @click="handleStartSession"
          >
            Démarrer la séance
          </UButton>
        </div>
      </div>
    </template>
    <template #body>
      <!-- Loading State -->
      <div v-if="appointmentLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>

      <!-- Main Content -->
      <div v-else class="grid h-full gap-6 lg:grid-cols-12">
        <!-- Left Sidebar - Patient Info -->
        <TreatmentSessionSlideoverLeftSide
          v-if="patient && appointment"
          :patient="patient"
          :appointment="appointment"
        />

        <!-- Center Section -->
        <div class="flex h-full flex-col gap-4 lg:col-span-6">
          <TreatmentSessionSlideoverCenter v-if="appointment" :appointment="appointment" />

          <!-- Payment Card (centered at bottom) -->
          <PaymentCard
            v-if="appointment?.treatmentSession && showPaymentButton && showPaymentCard"
            :treatment-session="appointment.treatmentSession"
            @payment-created="handlePaymentCreated"
          />
        </div>

        <!-- Right Sidebar - Timer & History -->
        <div class="flex h-full flex-col gap-4 lg:col-span-3">
          <div v-if="appointment?.treatmentSession" class="bg-elevated border-default rounded-lg border p-4">
            <template v-if="isSessionPaid && latestPayment">
              <div
                class="bg-success-5 dark:bg-success-950/20 text-success flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold"
              >
                <UIcon name="i-hugeicons-checkmark-circle-01" />
                <span>Paiement enregistré</span>
              </div>
              <div class="mt-3 space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted">Montant</span>
                  <span class="font-bold">{{ centsToCurrency(latestPayment.amountCents) }} Dh</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted">Mode</span>
                  <span class="font-medium">{{ paymentMethodLabel(latestPayment.method) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted">Reçu</span>
                  <span class="text-xs font-medium">{{ latestPayment.receiptNumber }}</span>
                </div>
              </div>
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-hugeicons-file-01"
                class="mt-3"
                @click="handleViewReceipt"
              >
                Voir le reçu
              </UButton>
            </template>

            <template v-else-if="showPaymentButton">
              <div
                class="bg-warning-5 dark:bg-warning-950/20 border-warning-20 text-warning flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold"
              >
                <UIcon name="i-hugeicons-clock-01" />
                <span>En attente de paiement</span>
              </div>
              <UButton
                v-if="!showPaymentCard"
                size="lg"
                color="primary"
                variant="solid"
                class="mt-2"
                @click="showPaymentCard = true"
              >
                <UIcon name="i-hugeicons-payment-01" />
                Enregistrer le paiement
              </UButton>
            </template>
          </div>

          <!-- Start Session Button - Only show when no session exists or when unpaid -->
          <!-- <UButton
            v-if="sessionNotStarted"
            size="xl"
            color="primary"
            variant="solid"
            block
            class="rounded-xl text-lg font-bold shadow-lg"
            icon="i-hugeicons-play-circle"
            :loading="isCreating"
            @click="handleStartSession"
          >
            Démarrer la séance
          </UButton> -->

          <!-- Timer Card - Now uses treatment session -->
          <!-- <TreatmentSessionTimer v-if="appointment" :appointment="appointment" @close="emit('close')" /> -->

          <!-- Session Timing Information Card -->
          <TreatmentSessionTimingCard v-if="appointment" :appointment="appointment" />

          <!-- Previous Appointments Card -->
          <UCard>
            <UCollapsible :default-open="false" :ui="{ content: 'space-y-3 pt-3' }">
              <UButton
                color="neutral"
                variant="ghost"
                class="group w-full justify-between"
                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                trailing-icon="i-lucide-chevron-down"
              >
                <span class="flex items-center gap-3 text-sm font-semibold">
                  <div class="bg-error-5 dark:bg-error-950/20 rounded-lg p-2">
                    <UIcon name="i-hugeicons-pulse-01" class="text-error animate-pulse" />
                  </div>
                  Notes des séances précédentes
                </span>
              </UButton>

              <template #content>
                <div v-if="previousAppointments.length" class="space-y-5 pt-3">
                  <div v-for="previous in previousAppointments" :key="previous.id">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-sm font-bold">{{ formatFrenchDate(previous.date) }}</span>
                      <span
                        v-if="previous.treatmentSession?.painLevelBefore !== null"
                        class="text-muted bg-muted-100 dark:bg-muted-800 rounded px-2 py-0.5 text-xs"
                      >
                        EVA {{ previous.treatmentSession?.painLevelBefore }}/10
                      </span>
                    </div>
                    <p class="text-muted line-clamp-3 text-sm leading-relaxed">
                      {{ previous.treatmentSession?.treatmentSummary || 'Aucune note enregistrée pour cette séance.' }}
                    </p>
                  </div>
                </div>
                <div v-else class="text-muted pt-3 text-xs">Aucune séance précédente enregistrée.</div>
              </template>
            </UCollapsible>
          </UCard>
        </div>
      </div>
    </template>
  </USlideover>
</template>
