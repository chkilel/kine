<script setup lang="ts">
  import { LazyAppModalEVA, LazyAppointmentPaymentTrackingForm } from '#components'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{
    patientId: string
    appointmentId: string
  }>()

  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)
  const paymentTrackingOverlay = overlay.create(LazyAppointmentPaymentTrackingForm)

  const { mutateAsync: startAppointmentAsync, isLoading: isSessionStarting } = useStartAppointment()

  const { data: patient } = usePatientById(() => props.patientId)
  const { data: allAppointments } = useAppointmentsList(() => ({
    patientId: props.patientId,
    limit: 6,
    includePaymentStatus: false
  }))
  const {
    data: appointment,
    isPending: appointmentLoading,
    refetch: refetchAppointment
  } = useAppointment(() => props.appointmentId)

  const insuranceCompanyId = computed(() => appointment.value?.insuranceCompanyId || null)
  const { data: insuranceCompany } = useInsuranceCompanyById(() => insuranceCompanyId.value!)

  const hasInsurance = computed(() => !!insuranceCompanyId.value)

  // ─── Base state ──────────────────────────────────────────────
  const isTimerPaused = ref(false)

  // ─── Watchers ────────────────────────────────────────────────
  watch(
    () => appointment.value?.pauseStartTime,
    (pauseStartTime) => {
      isTimerPaused.value = !!pauseStartTime
    },
    { immediate: true }
  )

  // ─── Computed state ──────────────────────────────────────────
  const showPaymentCard = computed(() => {
    if (appointment.value?.status !== 'in_progress' && appointment.value?.status !== 'finished') return false
    return appointment.value?.status === 'finished'
  })

  const showPaymentSummaryCard = computed(() => {
    if (appointment.value?.status !== 'in_progress' && appointment.value?.status !== 'completed') return false
    return appointment.value?.status === 'completed'
  })

  const sessionNotStarted = computed(
    () => appointment.value?.status === 'confirmed' || appointment.value?.status === 'scheduled'
  )

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
    const totalDuration = appointment.value.duration + (appointment.value?.extendedDurationMinutes || 0)
    const durationLabel = totalDuration ? `${totalDuration} min` : ''
    return [typeLabel, durationLabel].filter(Boolean).join(' • ')
  })

  // ─── Event handlers ──────────────────────────────────────────
  function openPaymentTracking() {
    if (!appointment.value) return
    paymentTrackingOverlay.open({ appointment: appointment.value })
  }

  async function handleStartSession() {
    if (isSessionStarting.value) return

    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur initiale',
      description: 'Veuillez indiquer le niveau de douleur du patient avant la séance',
      confirmText: 'Enregistrer et démarrer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue === null) return

    try {
      if (appointment.value?.status === 'in_progress') {
        await refetchAppointment()
      }

      await startAppointmentAsync({
        appointmentId: props.appointmentId,
        actualStartTime: getCurrentTimeHHMMSS(),
        painLevelBefore: evaValue
      })
    } catch (error) {
      const parsedError = parseError(error, 'Impossible de démarrer la séance')
      useToast().add({
        title: 'Erreur',
        description: parsedError.message,
        color: 'error'
      })
    }
  }
</script>

<template>
  <USlideover :dismissible="true" :close="false" :ui="{ content: 'w-full max-w-375' }" @close="emit('close')">
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
            :loading="isSessionStarting"
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

          <!-- FIXME just for testing deposit/credit_usage - Payment transaction Card (centered at bottom) -->
          <PaymentTransactionCard
            v-if="appointment?.status === 'in_progress' && showPaymentCard"
            :appointment="appointment"
          />
        </div>

        <!-- Right Sidebar - Timer, payment & History -->
        <div class="flex h-full flex-col gap-4 lg:col-span-3">
          <!-- Session Timing Information Card -->
          <TreatmentSessionTimingCard v-if="appointment" :appointment="appointment" />

          <!-- Insurance Coverage Card -->
          <InsuranceInfoCard v-if="appointment && hasInsurance" :appointment="appointment" :insurance-company />

          <!-- Payment tracking button for insured appointments -->
          <UButton
            v-if="
              appointment &&
              hasInsurance &&
              (appointment.status === 'in_progress' ||
                appointment.status === 'finished' ||
                appointment.status === 'completed')
            "
            icon="i-hugeicons-payment-01"
            color="primary"
            variant="outline"
            block
            @click="openPaymentTracking"
          >
            Enregistrer les paiements
          </UButton>

          <!-- Payment and summary cards -->
          <template
            v-if="
              appointment?.status === 'in_progress' ||
              appointment?.status === 'finished' ||
              appointment?.status === 'completed'
            "
          >
            <PaymentSummaryCard v-if="showPaymentSummaryCard" :appointment />
            <PaymentCard v-else-if="showPaymentCard" :appointment />
          </template>

          <!-- Start Session Button - Only show when no session exists or when unpaid / Old UI -->
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
                      <span class="text-sm font-bold">{{ formatDate(previous.date) }}</span>
                      <span
                        v-if="previous.status === 'in_progress' && previous.painLevelBefore !== null"
                        class="text-muted bg-muted-100 dark:bg-muted-800 rounded px-2 py-0.5 text-xs"
                      >
                        EVA {{ previous.painLevelBefore }}/10
                      </span>
                    </div>
                    <p class="text-muted line-clamp-3 text-sm leading-relaxed">
                      {{ previous.treatmentSummary || 'Aucune note enregistrée pour cette séance.' }}
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
