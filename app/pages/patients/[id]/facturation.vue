<script setup lang="ts">
  // ─── Base state ──────────────────────────────────────────────
  const route = useRoute()
  const patientId = computed(() => route.params.id as string)
  const selectedStatus = ref('all')

  // ─── Composables ─────────────────────────────────────────────
  const { openRecordPayment, openPaymentHistory, openAddDeposit, openRefundBalance, openPlanPicker } =
    useBillingSlideover()

  const { latestActiveTreatmentPlan, treatmentPlansGroupedByStatus } = usePatientTreatmentPlans(patientId)

  // ─── Plan selection (URL-synced, defaults to active plan) ────
  // Accepted values: 'all' | 'no-plan' | '<planId>'
  const selectedPlanId = computed<string>({
    get: () => {
      const q = route.query.planId as string | undefined
      if (q) return q
      return latestActiveTreatmentPlan.value?.id ?? 'all'
    },
    set: (v) =>
      navigateTo({
        path: route.path,
        query: { ...route.query, planId: v || 'all' }
      })
  })

  // Derive the current mode
  const currentMode = computed<'all' | 'no-plan' | 'plan'>(() => {
    const v = selectedPlanId.value
    if (v === 'all' || v === 'no-plan') return v
    return 'plan'
  })

  // Detect invalid (deleted) plan ID in URL and reset silently
  const selectedPlan = computed(() => {
    if (currentMode.value !== 'plan') return null
    return treatmentPlansGroupedByStatus.value?.find((p) => p.id === selectedPlanId.value) ?? null
  })

  // Auto-reset if the URL points to a plan that no longer exists AND plans are loaded
  watch(
    [selectedPlan, treatmentPlansGroupedByStatus],
    ([plan, plans]) => {
      if (currentMode.value === 'plan' && !plan && plans && plans.length > 0) {
        selectedPlanId.value = 'all'
      }
    },
    { flush: 'post' }
  )

  // ─── Data sources ────────────────────────────────────────────
  // Paginated query for "all" and "no-plan" modes
  const paginatedMode = computed<'all' | 'no-plan'>(() =>
    currentMode.value === 'no-plan' ? 'no-plan' : 'all'
  )
  const {
    data: appointmentsData,
    isLoading: isAppointmentsLoading,
    loadNextPage,
    hasNextPage
  } = useAppointmentsPaymentStatus(paginatedMode)

  // Non-paginated "load-all" query for plan-scoped mode
  const planIdForQuery = computed(() => (currentMode.value === 'plan' ? selectedPlanId.value : null))
  const { data: planAppointmentsData, isLoading: isPlanAppointmentsLoading } = usePlanBillingSessions(
    patientId,
    planIdForQuery
  )

  // Unified current sessions
  const currentSessions = computed<AppointmentWithPaymentStatus[]>(() => {
    if (currentMode.value === 'plan') return planAppointmentsData.value ?? []
    return appointmentsData.value?.pages.flatMap((page) => page.data) ?? []
  })

  const isLoading = computed(() =>
    currentMode.value === 'plan' ? isPlanAppointmentsLoading.value : isAppointmentsLoading.value
  )

  const canLoadMore = computed(() => currentMode.value !== 'plan' && hasNextPage.value)

  // ─── Status filter ───────────────────────────────────────────
  const filteredAppointments = computed(() =>
    currentSessions.value.filter((s) => {
      if (selectedStatus.value !== 'all' && s.paymentStatus !== selectedStatus.value) return false
      return true
    })
  )

  // ─── Counts (reflect current filter only) ────────────────────
  const appointmentCounts = computed(() => ({
    total: currentSessions.value.length,
    unpaid: currentSessions.value.filter((s) => s.paymentStatus === 'unpaid').length,
    partial: currentSessions.value.filter((s) => s.paymentStatus === 'partially_paid').length,
    paid: currentSessions.value.filter((s) => s.paymentStatus === 'paid').length
  }))

  // ─── Trigger button label ────────────────────────────────────
  const selectedPlanName = computed(() => selectedPlan.value?.title ?? '')

  const triggerLabel = computed(() => {
    if (currentMode.value === 'all') return 'Toutes les séances'
    if (currentMode.value === 'no-plan') return 'Sans plan'
    return selectedPlanName.value || 'Plan inconnu'
  })

  const triggerStatusIcon = computed(() => {
    if (!selectedPlan.value) return null
    return getTreatmentPlanStatusIcon(selectedPlan.value.status)
  })

  const triggerStatusColor = computed(() => {
    if (!selectedPlan.value) return null
    return getTreatmentPlanStatusColor(selectedPlan.value.status)
  })

  // ─── Selected plan financials (for slideover row) ────────────
  const selectedPlanFinancials = computed(() => {
    if (currentMode.value !== 'plan') return null
    const sessions = planAppointmentsData.value ?? []
    const billedCents = sessions.reduce((sum, s) => sum + (s.priceCents || 0), 0)
    const collectedCents = sessions.reduce((sum, s) => sum + (s.paidCents || 0), 0)
    return {
      billedCents,
      collectedCents,
      remainingCents: billedCents - collectedCents
    }
  })

  // ─── Event handlers ──────────────────────────────────────────
  function handleOpenPlanPicker() {
    openPlanPicker(
      patientId.value,
      currentMode.value === 'plan' ? selectedPlanId.value : null,
      (planId: string) => {
        selectedPlanId.value = planId
      },
      selectedPlanFinancials.value ?? undefined
    )
  }

  function handleSelectAll() {
    selectedPlanId.value = 'all'
  }

  function handleSelectNoPlan() {
    selectedPlanId.value = 'no-plan'
  }

  function handleOpenRecordPayment() {
    const unpaidIds = currentSessions.value
      .filter((s) => s.paymentStatus === 'unpaid' || s.paymentStatus === 'partially_paid')
      .map((s) => s.id)
    openRecordPayment(patientId.value, unpaidIds)
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h3 class="flex items-center gap-3 font-bold">
          Séances
        </h3>

        <UBadge color="primary" variant="soft" size="lg" class="rounded-full">
          {{ appointmentCounts.unpaid + appointmentCounts.partial }} en attente
        </UBadge>
      </div>

      <!-- Plan selector: trigger + chips -->
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          :color="currentMode === 'plan' ? 'primary' : 'neutral'"
          :variant="currentMode === 'plan' ? 'soft' : 'outline'"
          size="sm"
          trailing-icon="i-hugeicons-arrow-down-01"
          @click="handleOpenPlanPicker"
        >
          <span class="flex items-center gap-2">
            <UIcon
              v-if="triggerStatusIcon"
              :name="triggerStatusIcon"
              :class="`text-${triggerStatusColor}`"
            />
            <span class="max-w-45 truncate">{{ triggerLabel }}</span>
          </span>
        </UButton>

        <USeparator orientation="vertical" class="mx-1 h-5" />

        <UButton
          :variant="selectedPlanId === 'all' ? 'soft' : 'ghost'"
          :color="selectedPlanId === 'all' ? 'primary' : 'neutral'"
          size="xs"
          class="rounded-lg"
          @click="handleSelectAll"
        >
          Toutes
        </UButton>
        <UButton
          :variant="selectedPlanId === 'no-plan' ? 'soft' : 'ghost'"
          :color="selectedPlanId === 'no-plan' ? 'primary' : 'neutral'"
          size="xs"
          class="rounded-lg"
          @click="handleSelectNoPlan"
        >
          Sans plan
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
      <div class="space-y-10 lg:col-span-2">
        <section>
          <div class="mb-6 flex items-center justify-between gap-2">
            <UTabs
              v-model="selectedStatus"
              :content="false"
              :items="PAYMENT_STATUS_FILTER_OPTIONS"
              size="xs"
              variant="link"
              :ui="{ list: 'border-b-0 pb-0' }"
            />

            <UButton
              label="Historique"
              icon="i-hugeicons-clock-03"
              variant="ghost"
              color="primary"
              size="md"
              @click="openPaymentHistory(patientId)"
            />
          </div>
          <div v-if="isLoading" class="py-8 text-center">
            <AppSpinner />
          </div>
          <div v-else class="space-y-2">
            <PaymentBillingSessionCard
              v-for="appointment in filteredAppointments"
              :key="appointment.id"
              :appointment="appointment"
            />
            <p v-if="filteredAppointments.length === 0" class="text-muted py-4 text-center text-sm">
              Aucune séance trouvée
            </p>
            <div v-if="canLoadMore" class="pt-2 text-center">
              <UButton
                label="Charger plus"
                icon="i-hugeicons-arrow-down-01"
                variant="ghost"
                color="neutral"
                :loading="isAppointmentsLoading"
                @click="loadNextPage()"
              />
            </div>
          </div>
        </section>
      </div>

      <aside class="space-y-4">
        <div class="space-y-2">
          <UButton
            label="Enregistrer un paiement"
            icon="i-hugeicons-invoice-03"
            color="primary"
            block
            @click="handleOpenRecordPayment"
          />
        </div>
        <PaymentBillingBalanceCard
          :patient-id="patientId"
          :sessions="currentSessions"
          @add-deposit="openAddDeposit(patientId)"
          @refund-balance="openRefundBalance(patientId)"
        />
        <PaymentBillingFinancialSummaryCard :sessions="currentSessions" :patient-id="patientId" />
      </aside>
    </div>
  </div>
</template>
