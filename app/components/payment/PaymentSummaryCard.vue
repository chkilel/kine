<script setup lang="ts">
  const props = defineProps<{ appointment: Appointment }>()

  // ─── Composables ─────────────────────────────────────────────
  const { viewPaymentReceipt } = useBillingSlideover()
  const { data: sessionPayments } = useAppointmentPayments(() => props.appointment.id)

  // ─── Computed state ──────────────────────────────────────────
  const latestPayment = computed(() => {
    const payments = sessionPayments.value?.data
    return payments?.length ? payments[payments.length - 1] : null
  })

  // ─── Event handlers ──────────────────────────────────────────
  function handleViewReceipt() {
    if (props.appointment.status !== 'completed' || !latestPayment.value) return
    viewPaymentReceipt(latestPayment.value.id)
  }
</script>

<template>
  <AppCard compact>
    <div v-if="latestPayment" class="space-y-2">
      <div class="flex flex-col items-center justify-center">
        <AppIconBox
          name="i-hugeicons-checkmark-circle-01"
          size="xl"
          color="success"
          variant="soft"
          :ui="{ base: 'rounded-full p-3 mb-2', leadingIcon: 'size-9' }"
        />
        <h3 class="text-sm font-bold tracking-wide uppercase">Paiement effectué</h3>
      </div>

      <div class="border-default grid grid-cols-2 gap-x-6 gap-y-2 border-t py-1">
        <div>
          <span class="text-muted text-[9px] font-bold tracking-widest uppercase">Montant</span>
          <p class="text-sm font-black tabular-nums">
            {{ formatCurrency(latestPayment.amountCents) }}
          </p>
        </div>
        <div class="text-right">
          <span class="text-muted text-[9px] font-bold tracking-widest uppercase">Mode</span>
          <p class="text-xs font-bold uppercase">
            {{ getPaymentMethodLabel(latestPayment.method) }}
          </p>
        </div>
        <div>
          <span class="text-muted text-[9px] font-bold tracking-widest uppercase">N° Reçu</span>
          <p class="text-xs font-bold">{{ latestPayment.receiptNumber }}</p>
        </div>
        <div class="text-right">
          <span class="text-muted text-[9px] font-bold tracking-widest uppercase">Date</span>
          <p class="text-xs font-bold">{{ formatDate(latestPayment.paidOn) }}</p>
        </div>
      </div>
      <UButton color="success" variant="solid" block icon="i-hugeicons-invoice-03" @click="handleViewReceipt">
        Voir le reçu
      </UButton>
    </div>
  </AppCard>
</template>
