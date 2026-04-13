<script setup lang="ts">
  // ─── Base state ──────────────────────────────────────────────
  const route = useRoute()
  const patientId = computed(() => route.params.id as string)

  const selectedPlan = ref<'all' | 'no-plan' | string>('all')
  const selectedStatus = ref('all')
  const planPopoverOpen = ref(false)

  // ─── Composables ─────────────────────────────────────────────
  const { openRecordPayment, openPaymentHistory, openAddDeposit, openRefundBalance } = useBillingSlideover()

  const { data: sessionsData, isLoading: isSessionsLoading } = useAppointmentsPaymentStatus(patientId)

  // ─── Computed state ──────────────────────────────────────────
  const sessions = computed(() => sessionsData.value ?? [])

  const plans = computed(() => {
    const planMap = new Map<string, { id: string; name: string; count: number }>()
    for (const s of sessions.value) {
      if (s.treatmentPlanId && s.planTitle) {
        const existing = planMap.get(s.treatmentPlanId)
        if (existing) {
          existing.count++
        } else {
          planMap.set(s.treatmentPlanId, { id: s.treatmentPlanId, name: s.planTitle, count: 1 })
        }
      }
    }
    return Array.from(planMap.values())
  })

  const planFilteredSessions = computed(() =>
    sessions.value.filter((s) => {
      if (selectedPlan.value === 'no-plan' && s.treatmentPlanId !== null) return false
      if (selectedPlan.value !== 'all' && selectedPlan.value !== 'no-plan' && s.treatmentPlanId !== selectedPlan.value)
        return false
      return true
    })
  )

  const filteredSessions = computed(() =>
    planFilteredSessions.value.filter((s) => {
      if (selectedStatus.value !== 'all' && s.paymentStatus !== selectedStatus.value) return false
      return true
    })
  )

  const sessionCounts = computed(() => ({
    total: sessions.value.length,
    noPlan: sessions.value.filter((s) => s.treatmentPlanId === null).length,
    unpaid: sessions.value.filter((s) => s.paymentStatus === 'unpaid').length,
    partial: sessions.value.filter((s) => s.paymentStatus === 'partially_paid').length,
    paid: sessions.value.filter((s) => s.paymentStatus === 'paid').length
  }))

  const activePlanSegment = computed(() => {
    if (selectedPlan.value === 'all') return 'all'
    if (selectedPlan.value === 'no-plan') return 'no-plan'
    return 'by-plan'
  })

  const selectedPlanName = computed(() => {
    const plan = plans.value.find((p) => p.id === selectedPlan.value)
    return plan?.name ?? ''
  })

  // ─── Event handlers ──────────────────────────────────────────
  function selectPlanFilter(segment: 'all' | 'no-plan') {
    selectedPlan.value = segment
    planPopoverOpen.value = false
  }

  function selectTreatmentPlan(planId: string) {
    selectedPlan.value = planId
    planPopoverOpen.value = false
  }

  function handleOpenRecordPayment() {
    const unpaidIds = sessions.value
      .filter((s) => s.paymentStatus === 'unpaid' || s.paymentStatus === 'partially_paid')
      .map((s) => s.id)
    openRecordPayment(patientId.value, unpaidIds)
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="bg-muted flex items-center gap-0.5 rounded-xl p-1">
        <UButton
          :variant="activePlanSegment === 'all' ? 'soft' : 'ghost'"
          :color="activePlanSegment === 'all' ? 'primary' : 'neutral'"
          size="xs"
          class="rounded-lg"
          @click="selectPlanFilter('all')"
        >
          Toutes ({{ sessionCounts.total }})
        </UButton>
        <UButton
          :variant="activePlanSegment === 'no-plan' ? 'soft' : 'ghost'"
          :color="activePlanSegment === 'no-plan' ? 'primary' : 'neutral'"
          size="xs"
          class="rounded-lg"
          @click="selectPlanFilter('no-plan')"
        >
          Sans plan ({{ sessionCounts.noPlan }})
        </UButton>
        <UPopover v-model:open="planPopoverOpen">
          <UButton
            :variant="activePlanSegment === 'by-plan' ? 'soft' : 'ghost'"
            :color="activePlanSegment === 'by-plan' ? 'primary' : 'neutral'"
            size="xs"
            class="rounded-lg"
            :trailing-icon="activePlanSegment === 'by-plan' ? 'i-lucide-check' : 'i-lucide-chevron-down'"
          >
            {{ activePlanSegment === 'by-plan' && selectedPlanName ? selectedPlanName : 'Par plan' }}
          </UButton>
          <template #content>
            <div class="flex min-w-56 flex-col gap-1 p-1">
              <UButton
                v-for="plan in plans"
                :key="plan.id"
                color="neutral"
                type="button"
                :variant="selectedPlan === plan.id ? 'soft' : 'ghost'"
                @click="selectTreatmentPlan(plan.id)"
              >
                <UIcon v-if="selectedPlan === plan.id" name="i-lucide-check" class="size-4 shrink-0" />
                <span v-else class="size-4 shrink-0" />
                {{ plan.name }}
                <UBadge size="xs" variant="subtle" class="ml-auto">{{ plan.count }}</UBadge>
              </UButton>
            </div>
          </template>
        </UPopover>
      </div>

      <div class="bg-muted flex gap-0.5 rounded-xl p-1">
        <UButton
          v-for="opt in PAYMENT_STATUS_FILTER_OPTIONS"
          :key="opt.value"
          :variant="selectedStatus === opt.value ? 'soft' : 'ghost'"
          :color="selectedStatus === opt.value ? 'primary' : 'neutral'"
          size="xs"
          :label="opt.label"
          class="rounded-lg"
          @click="selectedStatus = opt.value"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
      <div class="space-y-10 lg:col-span-2">
        <section>
          <div class="mb-6 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h3 class="flex items-center gap-3 font-bold">
                <!-- <span class="bg-primary h-8 w-2 rounded-full" /> -->
                Séances
              </h3>

              <UBadge color="info" variant="soft" size="lg" class="rounded-full">
                {{ sessionCounts.unpaid + sessionCounts.partial }} en attente
              </UBadge>
            </div>
            <UButton
              label="Historique des paiements"
              icon="i-hugeicons-clock-03"
              variant="ghost"
              color="info"
              size="md"
              @click="openPaymentHistory(patientId)"
            />
          </div>
          <div v-if="isSessionsLoading" class="py-8 text-center">
            <AppSpinner />
          </div>
          <div v-else class="space-y-4">
            <PaymentBillingSessionCard v-for="session in filteredSessions" :key="session.id" :session="session" />
            <p v-if="filteredSessions.length === 0" class="text-muted py-4 text-center text-sm">
              Aucune séance trouvée
            </p>
          </div>
        </section>
      </div>

      <aside class="space-y-4">
        <div class="space-y-2">
          <UButton
            label="Enregistrer un paiement"
            icon="i-hugeicons-invoice-03"
            color="primary"
            size="lg"
            block
            @click="handleOpenRecordPayment"
          />
        </div>
        <PaymentBillingBalanceCard
          :patient-id="patientId"
          @add-deposit="openAddDeposit(patientId)"
          @refund-balance="openRefundBalance(patientId)"
        />
        <PaymentBillingFinancialSummaryCard :sessions="planFilteredSessions" :patient-id="patientId" />
      </aside>
    </div>
  </div>
</template>
