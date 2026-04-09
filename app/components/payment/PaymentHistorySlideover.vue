<script setup lang="ts">
  // ─── Types ───────────────────────────────────────────────────
  type FilterTab = 'all' | 'session_payment' | 'deposit_add' | 'session_refund' | 'deposit_refund' | 'voided'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{ patientId: string }>()
  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const { openCancelPayment, viewPaymentReceipt } = useBillingSlideover()

  // ─── Event handlers ──────────────────────────────────────────
  async function handleViewReceipt(paymentId: string) {
    viewPaymentReceipt(paymentId)
  }

  function handleCancelPayment(payment: PaymentWithSessions) {
    openCancelPayment(payment)
  }

  // ─── Base state ──────────────────────────────────────────────
  const activeFilter = ref<FilterTab>('all')

  // ─── UI helpers ──────────────────────────────────────────────
  const filterTabs = [
    { value: 'all' as FilterTab, label: 'Tous' },
    { value: 'session_payment' as FilterTab, label: 'Paiements' },
    { value: 'deposit_add' as FilterTab, label: 'Avances' },
    { value: 'session_refund' as FilterTab, label: 'Remb. séances' },
    { value: 'deposit_refund' as FilterTab, label: 'Remb. avances' },
    { value: 'voided' as FilterTab, label: 'Annulés' }
  ]

  // ─── Computed state ──────────────────────────────────────────
  const queryFilters = computed(() => {
    if (activeFilter.value === 'voided') return { includeVoided: true, limit: 200 }
    if (activeFilter.value === 'all') return { includeVoided: false, limit: 200 }
    return { type: activeFilter.value, includeVoided: false, limit: 200 }
  })
  const { data: paymentsData, isLoading: paymentsLoading } = usePatientPayments(() => props.patientId, queryFilters)
  const allPayments = computed(() => paymentsData.value ?? [])

  const filteredPayments = computed(() => {
    if (activeFilter.value === 'all') return allPayments.value.filter((p: any) => !p.voidedAt)
    if (activeFilter.value === 'voided') return allPayments.value.filter((p: any) => !!p.voidedAt)
    return allPayments.value.filter((p: any) => p.type === activeFilter.value && !p.voidedAt)
  })

  // ─── UI helpers ──────────────────────────────────────────────
  function getPaymentColor(payment: PaymentWithSessions): string {
    if (payment.voidedAt) return 'text-muted'
    if (payment.type === 'session_refund' || payment.type === 'deposit_refund') return 'text-error'
    return 'text-success'
  }

  function getAmountPrefix(payment: PaymentWithSessions): string {
    if (payment.voidedAt) return ''
    if (payment.type === 'session_refund' || payment.type === 'deposit_refund') return '-'
    return '+'
  }

  function canVoid(payment: PaymentWithSessions): boolean {
    return !payment.voidedAt && payment.type === 'session_payment'
  }
</script>

<template>
  <USlideover title="Historique des paiements" @close="emit('close')">
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

        <div v-if="paymentsLoading" class="py-8 text-center">
          <AppSpinner />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="payment in filteredPayments"
            :key="payment.id"
            class="border-default flex items-start gap-3 rounded-lg border p-3 transition-colors"
            :class="{ 'opacity-60': !!payment.voidedAt }"
          >
            <AppIconBox
              :name="getPaymentMethodIcon(payment.method)"
              size="sm"
              :color="getPaymentMethodColor(payment.method)"
              variant="subtle"
            />

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-default text-sm font-medium">
                    {{ getPaymentMethodLabel(payment.method) }}
                    <UBadge
                      v-if="payment.type !== 'session_payment'"
                      size="xs"
                      variant="subtle"
                      color="neutral"
                      class="ml-1"
                    >
                      {{ getPaymentTypeLabel(payment.type) }}
                    </UBadge>
                  </p>
                  <p class="text-muted text-xs">{{ payment.paidOn }}</p>
                </div>
                <span
                  class="text-sm font-bold whitespace-nowrap tabular-nums"
                  :class="[getPaymentColor(payment), { 'line-through': !!payment.voidedAt }]"
                >
                  {{ getAmountPrefix(payment) }}{{ formatCurrency(payment.amountCents) }}
                </span>
              </div>

              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span class="text-muted font-mono text-[10px]">{{ payment.receiptNumber }}</span>
                <span
                  v-for="si in payment.sessionItems || []"
                  :key="si.id"
                  class="text-muted bg-muted rounded px-1.5 py-0.5 text-[10px]"
                >
                  Séance
                </span>
                <UBadge v-if="!!payment.voidedAt" size="xs" color="error" variant="subtle">Annulé</UBadge>
              </div>
            </div>

            <div class="flex shrink-0 gap-1">
              <UButton
                variant="ghost"
                size="xs"
                icon="i-hugeicons-download-01"
                color="neutral"
                :disabled="!!payment.voidedAt"
                @click="handleViewReceipt(payment.id)"
              />
              <UButton
                v-if="canVoid(payment)"
                variant="ghost"
                size="xs"
                icon="i-hugeicons-cancel-01"
                color="error"
                @click="handleCancelPayment(payment)"
              />
            </div>
          </div>

          <p v-if="filteredPayments.length === 0" class="text-muted py-6 text-center text-sm">Aucun paiement trouvé</p>
        </div>
      </div>
    </template>
  </USlideover>
</template>
