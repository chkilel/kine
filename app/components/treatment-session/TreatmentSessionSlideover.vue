<script setup lang="ts">
  import { LazyAppModalEVA } from '#components'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{ patientId: string; appointmentId: string }>()
  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const overlay = useOverlay()
  const evaModal = overlay.create(LazyAppModalEVA)

  const { mutateAsync: startAppointmentAsync, isLoading: isSessionStarting } = useStartAppointment()
  const { data: patient } = usePatientById(() => props.patientId)
  const { resolveTitle } = useAppointmentTypes()

  const {
    data: appointment,
    isPending: appointmentLoading,
    refetch: refetchAppointment
  } = useAppointment(() => props.appointmentId)

  const { data: planAppointments } = usePlanAppointments(
    () => appointment.value?.treatmentPlanId ?? undefined,
    () => props.patientId,
    10
  )

  // ─── Base state ──────────────────────────────────────────────
  const isTimerPaused = ref(false)

  // ─── Watchers ────────────────────────────────────────────────
  watch(
    () => appointment.value?.pauseStartTime,
    (pauseStartTime) => (isTimerPaused.value = !!pauseStartTime),
    { immediate: true }
  )

  // ─── Computed state ──────────────────────────────────────────
  const showPaymentCard = computed(() => appointment.value?.status === 'finished')

  const showPaymentSummaryCard = computed(() => appointment.value?.status === 'completed')

  const sessionNotStarted = computed(
    () => appointment.value?.status === 'confirmed' || appointment.value?.status === 'scheduled'
  )

  const previousAppointments = computed(() => {
    const list = planAppointments.value
    const currentAppointment = appointment.value
    if (!list || !currentAppointment || !currentAppointment.treatmentPlanId) return []

    return list
      .filter((c) => c.id !== currentAppointment.id && c.date < currentAppointment.date)
      .slice(-3)
      .reverse()
  })

  const patientfullname = computed(() => (patient.value ? formatFullName(patient.value) : ''))

  const headerTitle = computed(() => patientfullname.value || 'Séance active')

  const headerDescription = computed(() => {
    if (!appointment.value) return ''
    const typeLabel = resolveTitle(appointment.value.type)
    const totalDuration = appointment.value.duration + (appointment.value?.extendedDurationMinutes || 0)
    const durationLabel = totalDuration ? `${totalDuration} min` : ''
    return [typeLabel, durationLabel].filter(Boolean).join(' • ')
  })

  // ─── Event handlers ──────────────────────────────────────────
  async function handleStartSession() {
    if (isSessionStarting.value) return

    const evaValue = await evaModal.open({
      title: 'Évaluation de la douleur initiale',
      description: 'Veuillez indiquer le niveau de douleur du patient avant la séance',
      confirmText: 'Enregistrer et démarrer',
      cancelText: 'Annuler',
      initialValue: 0
    })

    if (evaValue == null) return

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
  <USlideover :ui="{ content: 'w-full max-w-7xl bg-elevated' }" @close="emit('close')">
    <template #header>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="flex items-center gap-4">
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
          <UButton
            icon="i-hugeicons-panel-left-close"
            size="xl"
            color="neutral"
            variant="subtle"
            square
            :ui="{ base: 'bg-accented rounded-full', leadingIcon: 'size-5' }"
            @click="emit('close')"
          />
        </div>
      </div>
    </template>
    <template #body>
      <!-- Loading State -->
      <div v-if="appointmentLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>

      <!-- Main Content -->
      <div v-else class="grid h-full gap-4 lg:grid-cols-12">
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
          <AppCard
            title="Séances précédentes"
            icon="hugeicons-note-03"
            compact
            :ui="{ body: 'pt-0 sm:pt-0 space-y-1' }"
          >
            <UEmpty
              v-if="!previousAppointments || !previousAppointments.length"
              size="xs"
              icon="i-hugeicons-transaction-history"
              title="Aucune séance trouvée"
              description="Il s'agit de la première séance pour ce patient."
            />
            <template v-if="previousAppointments" v-for="appointment in previousAppointments" :key="appointment.id">
              <UPopover :open-delay="200">
                <div
                  class="group bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border border-transparent p-1 pr-2 transition-colors hover:shadow-sm"
                >
                  <AppDateBadge :date="appointment.date" color="info" variant="soft" size="lg" class="rounded-r-none" />

                  <div class="flex-1">
                    <p class="line-clamp-2 text-xs text-wrap">
                      {{ appointment.sessionNotes || 'Aucun compte rendu disponible' }}
                    </p>

                    <div
                      v-if="appointment.painLevelAfter != null || appointment.painLevelBefore != null"
                      class="text-muted mt-1 flex items-center gap-2 text-xs font-medium"
                    >
                      <div v-if="appointment.painLevelBefore !== null" class="flex items-center gap-1">
                        <span>{{ appointment.painLevelBefore }}/10</span>
                        <UIcon name="i-hugeicons-airplane-take-off-01" />
                      </div>
                      <USeparator orientation="vertical" class="h-3" />
                      <div v-if="appointment.painLevelAfter !== null" class="flex items-center gap-1">
                        <UIcon name="i-hugeicons-airplane-landing-01" />
                        <span>{{ appointment.painLevelAfter }}/10</span>
                      </div>
                    </div>
                  </div>

                  <UIcon
                    name="i-lucide-chevron-right"
                    class="group-hover:text-primary text-muted size-5 transition-all group-hover:-mr-1"
                  />
                </div>
                <template #content>
                  <AppCard compact :ui="{ root: 'min-w-sm max-w-md', header: 'bg-elevated' }">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <AppIconBox size="md" color="primary" name="i-hugeicons-calendar-04" />
                        <span class="text-xs font-semibold">{{ formatShortDate(appointment.date) }}</span>
                      </div>
                      <div class="flex items-start gap-2">
                        <AppIconBox size="md" color="primary" name="i-hugeicons-monocle-01" />
                        <div>
                          <h4 class="text-muted text-[10px] tracking-wider uppercase">Observations</h4>
                          <span class="text-sm">
                            {{ appointment.observations || 'Aucune observation enregistrée' }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <AppIconBox size="md" color="primary" name="i-hugeicons-note-01" />
                        <div>
                          <h4 class="text-muted text-[10px] tracking-wide uppercase">Compte rendu de séance</h4>
                          <span class="text-sm">
                            {{ appointment.sessionNotes || 'Aucun compte rendu pour cette séance' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AppCard>
                </template>
              </UPopover>
            </template>
          </AppCard>

          <!-- collapsible card in the previous design -->
          <UCard
            v-if="false"
            :ui="{
              root: 'divide-transparent rounded-md',
              body: 'p-0 sm:p-0'
            }"
          >
            <UCollapsible :default-open="false">
              <UButton
                color="primary"
                variant="ghost"
                trailing-icon="i-lucide-chevron-down"
                block
                :ui="{
                  base: 'group p-2 sm:p-3 rounded-b-none',
                  trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
                }"
              >
                <span class="text-toned text-[13px] font-semibold tracking-wide uppercase">Séances précédentes</span>
              </UButton>

              <template #content>
                <div class="border-default space-y-1 border-t p-2 sm:p-2">
                  <template
                    v-if="previousAppointments"
                    v-for="appointment in previousAppointments"
                    :key="appointment.id"
                  >
                    <UPopover :open-delay="200">
                      <div
                        class="group bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border border-transparent p-1 pr-2 transition-colors hover:shadow-sm"
                      >
                        <AppDateBadge
                          :date="appointment.date"
                          color="info"
                          variant="soft"
                          size="lg"
                          class="rounded-r-none"
                        />

                        <div class="min-w-0 flex-1">
                          <p class="truncate text-xs text-wrap">
                            {{ appointment.sessionNotes || 'Aucun compte rendu disponible' }}
                          </p>

                          <div
                            v-if="appointment.painLevelAfter != null || appointment.painLevelBefore != null"
                            class="text-muted mt-1 flex items-center gap-2 text-xs font-medium"
                          >
                            <div v-if="appointment.painLevelBefore !== null" class="flex items-center gap-1">
                              <span>{{ appointment.painLevelBefore }}/10</span>
                              <UIcon name="i-hugeicons-airplane-take-off-01" />
                            </div>
                            <USeparator orientation="vertical" class="h-3" />
                            <div v-if="appointment.painLevelAfter !== null" class="flex items-center gap-1">
                              <UIcon name="i-hugeicons-airplane-landing-01" />
                              <span>{{ appointment.painLevelAfter }}/10</span>
                            </div>
                          </div>
                        </div>

                        <UIcon
                          name="i-lucide-chevron-right"
                          class="group-hover:text-primary text-muted size-5 transition-all group-hover:-mr-1"
                        />
                      </div>
                      <template #content>
                        <AppCard compact :ui="{ root: 'min-w-sm max-w-md', header: 'bg-elevated' }">
                          <div class="space-y-2">
                            <div class="flex items-center gap-2">
                              <AppIconBox size="md" color="primary" name="i-hugeicons-calendar-04" />
                              <span class="text-xs font-semibold">{{ formatShortDate(appointment.date) }}</span>
                            </div>
                            <div class="flex items-start gap-2">
                              <AppIconBox size="md" color="primary" name="i-hugeicons-monocle-01" />
                              <div>
                                <h4 class="text-muted text-[10px] tracking-wider uppercase">Observations</h4>
                                <span class="text-sm">
                                  {{ appointment.observations || 'Aucune observation enregistrée' }}
                                </span>
                              </div>
                            </div>
                            <div class="flex items-start gap-2">
                              <AppIconBox size="md" color="primary" name="i-hugeicons-note-01" />
                              <div>
                                <h4 class="text-muted text-[10px] tracking-wide uppercase">Compte rendu de séance</h4>
                                <span class="text-sm">
                                  {{ appointment.sessionNotes || 'Aucun compte rendu pour cette séance' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AppCard>
                      </template>
                    </UPopover>
                  </template>
                </div>
              </template>
            </UCollapsible>
          </UCard>
        </div>
      </div>
    </template>
  </USlideover>
</template>
