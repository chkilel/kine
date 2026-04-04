<script setup lang="ts">
  // ─── Composables ─────────────────────────────────────────────
  const { openRecordPayment, openPaymentHistory, openAddDeposit, openRefundBalance, openCancelPayment } =
    useBillingSlideover()

  // ─── State ──────────────────────────────────────────────────
  const selectedPlan = ref('all')
  const selectedStatus = ref('all')

  // ─── UI helpers ──────────────────────────────────────────────
  const planOptions = [
    { label: 'Toutes les séances', value: 'all' },
    { label: 'Kiné du dos', value: 'plan-1' },
    { label: 'Rééducation épaule', value: 'plan-2' }
  ]

  const statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Non facturé', value: 'unpaid' },
    { label: 'Partiellement', value: 'partial' },
    { label: 'Payé', value: 'paid' }
  ]

  // ─── Types ──────────────────────────────────────────────────
  type MockSession = {
    id: string
    date: string
    planName: string
    planId: string
    location: string
    amountCents: number
    paidCents: number
    status: 'unpaid' | 'partial' | 'paid'
  }

  type MockPaymentHistoryItem = {
    id: string
    method: PaymentMethod
    amountCents: number
    date: string
    receiptNumber: string
    sessionRef: string
    type: PaymentType
    isVoided: boolean
  }

  // ─── Mock data ──────────────────────────────────────────────
  const mockSessions: MockSession[] = [
    {
      id: 's1',
      date: '12 Oct 2023',
      planName: 'Session de Kinésithérapie #12',
      planId: 'plan-1',
      location: 'Rééducation lombaire intensif',
      amountCents: 20000,
      paidCents: 0,
      status: 'unpaid'
    },
    {
      id: 's2',
      date: '08 Oct 2023',
      planName: 'Évaluation de la mobilité',
      planId: 'plan-1',
      location: 'Rééducation lombaire intensif',
      amountCents: 20000,
      paidCents: 10000,
      status: 'partial'
    },
    {
      id: 's3',
      date: '05 Oct 2023',
      planName: 'Massage thérapeutique',
      planId: 'plan-1',
      location: 'Rééducation lombaire intensif',
      amountCents: 20000,
      paidCents: 20000,
      status: 'paid'
    },
    {
      id: 's4',
      date: '03 Oct 2023',
      planName: 'Renforcement musculaire',
      planId: 'plan-1',
      location: 'Rééducation lombaire intensif',
      amountCents: 20000,
      paidCents: 0,
      status: 'unpaid'
    },
    {
      id: 's5',
      date: '28 Sept 2023',
      planName: 'Post-opératoire Épaule #5',
      planId: 'plan-2',
      location: 'Post-opératoire Épaule',
      amountCents: 25000,
      paidCents: 25000,
      status: 'paid'
    }
  ]

  const mockPaymentHistory: MockPaymentHistoryItem[] = [
    {
      id: 'p1',
      method: 'cash',
      amountCents: 50000,
      date: "Aujourd'hui, 09:45",
      receiptNumber: 'REC-0042',
      sessionRef: 'Sess. #10, #11',
      type: 'session_payment',
      isVoided: false
    },
    {
      id: 'p2',
      method: 'bank-card',
      amountCents: 30000,
      date: '05 Oct 2023',
      receiptNumber: 'REC-0038',
      sessionRef: 'Avance patient',
      type: 'deposit_add',
      isVoided: false
    },
    {
      id: 'p3',
      method: 'bank-transfer',
      amountCents: 15000,
      date: '01 Oct 2023',
      receiptNumber: 'REC-0037',
      sessionRef: 'Sess. #7',
      type: 'session_payment',
      isVoided: false
    }
  ]

  // ─── Computed ───────────────────────────────────────────────
  const filteredSessions = computed(() =>
    mockSessions.filter((s) => {
      if (selectedPlan.value !== 'all' && s.planId !== selectedPlan.value) return false
      if (selectedStatus.value !== 'all' && s.status !== selectedStatus.value) return false
      return true
    })
  )

  const recentPayments = computed(() => mockPaymentHistory.filter((p) => !p.isVoided))

  const sessionCounts = computed(() => ({
    total: mockSessions.length,
    unpaid: mockSessions.filter((s) => s.status === 'unpaid').length,
    partial: mockSessions.filter((s) => s.status === 'partial').length,
    paid: mockSessions.filter((s) => s.status === 'paid').length
  }))

  // ─── Actions ─────────────────────────────────────────────────
  function handleRecordPayment(sessionId: string) {
    openRecordPayment([sessionId])
  }

  function handleOpenRecordPayment() {
    const unpaidIds = mockSessions.filter((s) => s.status === 'unpaid' || s.status === 'partial').map((s) => s.id)
    openRecordPayment(unpaidIds)
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-4">
        <USelect
          v-model="selectedPlan"
          :items="planOptions"
          value-key="value"
          label-key="label"
          size="md"
          placeholder="Plan de traitement"
          class="w-52"
        />
        <div class="bg-muted flex gap-0.5 rounded-xl p-1">
          <UButton
            v-for="opt in statusOptions"
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
      <UButton
        label="Enregistrer un paiement"
        icon="i-hugeicons-invoice-01"
        color="primary"
        size="md"
        @click="handleOpenRecordPayment"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
      <div class="space-y-10 lg:col-span-2">
        <section>
          <div class="mb-6 flex items-center justify-between">
            <h3 class="flex items-center gap-3 text-xl font-bold">
              <span class="bg-primary h-8 w-2 rounded-full" />
              Séances à facturer
            </h3>
            <span class="text-muted text-sm font-medium">
              {{ sessionCounts.unpaid + sessionCounts.partial }} en attente
            </span>
          </div>
          <div class="space-y-4">
            <PaymentBillingSessionCard
              v-for="session in filteredSessions"
              :key="session.id"
              :session="session"
              @record-payment="handleRecordPayment"
            />
            <p v-if="filteredSessions.length === 0" class="text-muted py-4 text-center text-sm">
              Aucune séance trouvée
            </p>
          </div>
        </section>

        <section>
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-xl font-bold">Historique des paiements</h3>
            <UButton variant="link" size="sm" label="Voir tout l'historique" @click="openPaymentHistory()" />
          </div>
          <AppCard variant="outline">
            <div class="divide-default divide-y">
              <div
                v-for="item in recentPayments"
                :key="item.id"
                class="hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
              >
                <div class="flex flex-1 items-center gap-4">
                  <AppIconBox
                    :name="getPaymentMethodIcon(item.method)"
                    size="sm"
                    :color="getPaymentMethodColor(item.method) as UIColor"
                    variant="subtle"
                  />
                  <div class="grid flex-1 grid-cols-2 items-center gap-4 lg:grid-cols-4">
                    <div>
                      <p class="text-xs font-bold uppercase">
                        {{ getPaymentMethodLabel(item.method) }}
                      </p>
                      <p class="text-muted text-xs font-medium">{{ item.receiptNumber }}</p>
                    </div>
                    <div>
                      <p class="text-muted text-xs">Montant</p>
                      <p class="text-success text-sm font-bold">+{{ formatCurrency(item.amountCents) }}</p>
                    </div>
                    <div class="hidden lg:block">
                      <p class="text-muted text-xs">Référence</p>
                      <p class="text-default truncate text-sm font-medium">{{ item.sessionRef || '-' }}</p>
                    </div>
                    <div class="hidden lg:block">
                      <p class="text-muted text-xs">Date</p>
                      <p class="text-default text-sm font-medium">{{ item.date }}</p>
                    </div>
                  </div>
                </div>
                <div class="ml-4 flex items-center gap-2">
                  <UButton variant="ghost" size="xs" icon="i-hugeicons-download-01" color="neutral" />
                  <UButton
                    variant="ghost"
                    size="xs"
                    icon="i-hugeicons-cancel-01"
                    color="error"
                    @click="openCancelPayment()"
                  />
                </div>
              </div>
            </div>
          </AppCard>
        </section>
      </div>

      <aside class="space-y-6">
        <PaymentBillingBalanceCard @add-deposit="openAddDeposit()" @refund-balance="openRefundBalance()" />
        <PaymentBillingFinancialSummaryCard />
      </aside>
    </div>
  </div>
</template>
