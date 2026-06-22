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
    if (!isAppointmentPaid(props.appointment) || !latestPayment.value) return
    viewPaymentReceipt(latestPayment.value.id)
  }
</script>

<template>
  <AppCard compact>
    <div v-if="latestPayment" class="space-y-2">
      <div class="flex items-center justify-center gap-2">
        <AppIconBox
          name="i-hugeicons-checkmark-circle-02"
          size="xl"
          color="success"
          variant="soft"
          :ui="{ base: 'rounded-full', leadingIcon: 'size-6' }"
        />
        <h3 class="text-toned text-[13px] leading-none font-semibold tracking-wide uppercase">Paiement effectué</h3>
      </div>

      <div class="border-default grid grid-cols-2 gap-x-6 gap-y-2 border-t py-1">
        <div>
          <span class="text-toned text-[10px] font-medium tracking-wider uppercase">Montant</span>
          <p class="text-sm font-black tabular-nums">
            {{ formatCurrency(latestPayment.amountCents) }}
          </p>
        </div>
        <div class="text-right">
          <span class="text-toned text-[10px] font-medium tracking-wider uppercase">Mode</span>
          <p class="text-xs font-bold uppercase">
            {{ getPaymentMethodLabel(latestPayment.method) }}
          </p>
        </div>
        <div>
          <span class="text-toned text-[10px] font-medium tracking-wider uppercase">N° Reçu</span>
          <p class="text-xs font-bold">{{ latestPayment.receiptNumber }}</p>
        </div>
        <div class="text-right">
          <span class="text-toned text-[10px] font-medium tracking-wider uppercase">Date</span>
          <p class="text-xs font-bold">{{ formatDate(latestPayment.paidOn) }}</p>
        </div>
      </div>
      <UButton color="success" variant="solid" block icon="i-hugeicons-invoice-03" @click="handleViewReceipt">
        Voir le reçu
      </UButton>
    </div>
  </AppCard>
</template>
