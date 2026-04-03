<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const { openCancelPayment } = useBillingSlideover()

  // ─── Types ──────────────────────────────────────────────────
  type FilterTab = 'all' | 'payment' | 'deposit' | 'refund' | 'voided'

  type MockPaymentItem = {
    id: string
    type: PaymentType
    method: PaymentMethod | null
    amountCents: number
    date: string
    receiptNumber: string
    sessionRefs: string[]
    isVoided: boolean
  }

  // ─── State ──────────────────────────────────────────────────
  const activeFilter = ref<FilterTab>('all')
  const visibleCount = ref(5)

  // ─── UI helpers ──────────────────────────────────────────────
  const filterTabs = [
    { value: 'all' as FilterTab, label: 'Tous' },
    { value: 'payment' as FilterTab, label: 'Paiements' },
    { value: 'deposit' as FilterTab, label: 'Avances' },
    { value: 'refund' as FilterTab, label: 'Remboursements' },
    { value: 'voided' as FilterTab, label: 'Annulés' }
  ]

  // ─── Mock data ──────────────────────────────────────────────
  const mockPayments: MockPaymentItem[] = [
    {
      id: 'p1',
      type: 'payment',
      method: 'cash',
      amountCents: 9500,
      date: '15 Mars 2026',
      receiptNumber: 'REC-2026-0042',
      sessionRefs: ['Kiné du dos #12', 'Kiné du dos #11'],
      isVoided: false
    },
    {
      id: 'p2',
      type: 'payment',
      method: 'bank-card',
      amountCents: 9500,
      date: '12 Mars 2026',
      receiptNumber: 'REC-2026-0041',
      sessionRefs: ['Kiné du dos #10'],
      isVoided: false
    },
    {
      id: 'p3',
      type: 'deposit',
      method: 'bank-transfer',
      amountCents: 15000,
      date: '01 Mars 2026',
      receiptNumber: 'REC-2026-0040',
      sessionRefs: [],
      isVoided: false
    },
    {
      id: 'p4',
      type: 'payment',
      method: 'check',
      amountCents: 12000,
      date: '25 Fév. 2026',
      receiptNumber: 'REC-2026-0039',
      sessionRefs: ['Rééducation épaule #8'],
      isVoided: true
    },
    {
      id: 'p5',
      type: 'refund',
      method: 'cash',
      amountCents: 5000,
      date: '20 Fév. 2026',
      receiptNumber: 'REC-2026-0038',
      sessionRefs: [],
      isVoided: false
    },
    {
      id: 'p6',
      type: 'payment',
      method: 'cash',
      amountCents: 9500,
      date: '18 Fév. 2026',
      receiptNumber: 'REC-2026-0037',
      sessionRefs: ['Kiné du dos #7'],
      isVoided: false
    },
    {
      id: 'p7',
      type: 'payment',
      method: 'bank-card',
      amountCents: 12000,
      date: '10 Fév. 2026',
      receiptNumber: 'REC-2026-0036',
      sessionRefs: ['Rééducation épaule #6'],
      isVoided: false
    },
    {
      id: 'p8',
      type: 'deposit',
      method: 'cash',
      amountCents: 20000,
      date: '01 Fév. 2026',
      receiptNumber: 'REC-2026-0035',
      sessionRefs: [],
      isVoided: false
    },
    {
      id: 'p9',
      type: 'payment',
      method: 'cash',
      amountCents: 9500,
      date: '28 Jan. 2026',
      receiptNumber: 'REC-2026-0034',
      sessionRefs: ['Kiné du dos #5'],
      isVoided: false
    },
    {
      id: 'p10',
      type: 'payment',
      method: 'bank-transfer',
      amountCents: 9500,
      date: '22 Jan. 2026',
      receiptNumber: 'REC-2026-0033',
      sessionRefs: ['Kiné du dos #4'],
      isVoided: false
    },
    {
      id: 'p11',
      type: 'refund',
      method: 'bank-card',
      amountCents: 3000,
      date: '15 Jan. 2026',
      receiptNumber: 'REC-2026-0032',
      sessionRefs: [],
      isVoided: false
    },
    {
      id: 'p12',
      type: 'payment',
      method: 'cash',
      amountCents: 12000,
      date: '10 Jan. 2026',
      receiptNumber: 'REC-2026-0031',
      sessionRefs: ['Rééducation épaule #3'],
      isVoided: false
    }
  ]

  // ─── Computed ───────────────────────────────────────────────
  const filteredPayments = computed(() => {
    if (activeFilter.value === 'all') return mockPayments.filter((p) => !p.isVoided)
    if (activeFilter.value === 'voided') return mockPayments.filter((p) => p.isVoided)
    return mockPayments.filter((p) => p.type === activeFilter.value && !p.isVoided)
  })

  const visiblePayments = computed(() => filteredPayments.value.slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < filteredPayments.value.length)

  // ─── Watchers ────────────────────────────────────────────────
  watch(activeFilter, () => {
    visibleCount.value = 5
  })

  // ─── UI helpers ──────────────────────────────────────────────
  function getPaymentColor(item: MockPaymentItem): string {
    if (item.isVoided) return 'text-muted'
    if (item.type === 'refund') return 'text-error'
    return 'text-success'
  }

  function getAmountPrefix(item: MockPaymentItem): string {
    if (item.isVoided) return ''
    if (item.type === 'refund') return '-'
    return '+'
  }

  // ─── Actions ─────────────────────────────────────────────────
  function loadMore() {
    visibleCount.value += 5
  }
</script>

<template>
  <USlideover title="Historique des paiements" @close="emit('close')">
    <template #header="{ close }">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-bold">Historique des paiements</h2>
          <p class="text-muted text-xs">Patient — Mock</p>
        </div>
        <UButton variant="ghost" icon="i-hugeicons-cancel-01" @click="close" />
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="tab in filterTabs"
            :key="tab.value"
            :variant="activeFilter === tab.value ? 'solid' : 'ghost'"
            :color="activeFilter === tab.value ? 'primary' : 'neutral'"
            size="xs"
            :label="tab.label"
            @click="activeFilter = tab.value"
          />
        </div>

        <div class="space-y-2">
          <div
            v-for="item in visiblePayments"
            :key="item.id"
            class="border-default flex items-start gap-3 rounded-lg border p-3 transition-colors"
            :class="{ 'opacity-60': item.isVoided }"
          >
            <AppIconBox
              :name="item.method ? getPaymentMethodIcon(item.method) : 'i-hugeicons-wallet-02'"
              size="sm"
              :color="item.method ? (getPaymentMethodColor(item.method) as UIColor) : 'primary'"
              variant="subtle"
            />

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-default text-sm font-medium">
                    {{ item.method ? getPaymentMethodLabel(item.method) : 'Solde patient' }}
                    <UBadge v-if="item.type !== 'payment'" size="xs" variant="subtle" color="neutral" class="ml-1">
                      {{ getPaymentTypeLabel(item.type) }}
                    </UBadge>
                  </p>
                  <p class="text-muted text-xs">{{ item.date }}</p>
                </div>
                <span
                  class="text-sm font-bold whitespace-nowrap tabular-nums"
                  :class="[getPaymentColor(item), { 'line-through': item.isVoided }]"
                >
                  {{ getAmountPrefix(item) }}{{ formatCurrency(item.amountCents) }}
                </span>
              </div>

              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span class="text-muted font-mono text-[10px]">{{ item.receiptNumber }}</span>
                <span
                  v-for="ref in item.sessionRefs"
                  :key="ref"
                  class="text-muted bg-muted rounded px-1.5 py-0.5 text-[10px]"
                >
                  {{ ref }}
                </span>
                <UBadge v-if="item.isVoided" size="xs" color="error" variant="subtle">Annulé</UBadge>
              </div>
            </div>

            <div class="flex shrink-0 gap-1">
              <UButton variant="ghost" size="xs" icon="i-hugeicons-download-01" color="neutral" />
              <UButton
                v-if="!item.isVoided"
                variant="ghost"
                size="xs"
                icon="i-hugeicons-cancel-01"
                color="error"
                @click="openCancelPayment()"
              />
            </div>
          </div>

          <p v-if="filteredPayments.length === 0" class="text-muted py-6 text-center text-sm">Aucun paiement trouvé</p>

          <div v-if="hasMore" class="pt-2 text-center">
            <UButton label="Voir plus" variant="outline" color="neutral" block @click="loadMore" />
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
