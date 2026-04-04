<script setup lang="ts">
  import { LazyAppReceiptModal } from '#components'

  const props = defineProps<{
    treatmentSession: TreatmentSession
    appointment: AppointmentWithSession
  }>()

  const overlay = useOverlay()
  const receiptModal = overlay.create(LazyAppReceiptModal)

  const { data: sessionPayments } = useTreatmentSessionPayments(() => props.treatmentSession.id ?? '')

  const latestPayment = computed(() => {
    const payments = sessionPayments.value as Payment[] | undefined
    if (!payments?.length) return null
    return payments[payments.length - 1]
  })

  function handleViewReceipt() {
    if (props.treatmentSession.status !== 'completed') return
    receiptModal.open({ sessionId: props.treatmentSession.id })
  }
</script>

<template>
  <UCard
    :ui="{
      root: 'divide-default',
      header: 'bg-primary/5',
      footer: 'bg-muted'
    }"
  >
    <template #header>
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <AppIconBox
            name="i-hugeicons-wallet-02"
            size="xl"
            color="primary"
            variant="solid"
            :ui="{ base: 'rounded-xl p-2' }"
          />
          <div>
            <h2 class="text-sm font-black tracking-tight uppercase">Facturation</h2>
            <p class="text-muted text-[11px] font-semibold">Séance du {{ formatFrenchDate(props.appointment.date) }}</p>
          </div>
        </div>

        <div v-if="latestPayment" class="flex flex-col items-end">
          <UBadge size="md" color="success" variant="solid" class="rounded-full uppercase">Payé</UBadge>
        </div>
      </header>
    </template>

    <div v-if="latestPayment" class="space-y-2">
      <div class="flex flex-col items-center justify-center">
        <AppIconBox
          name="i-hugeicons-checkmark-circle-01"
          size="xl"
          color="success"
          variant="soft"
          :ui="{ base: 'rounded-full p-3 mb-2', leadingIcon: 'size-9' }"
        />
        <h3 class="text-sm font-black tracking-tight uppercase">Paiement effectué</h3>
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
          <p class="text-xs font-bold">{{ formatFrenchDate(latestPayment.paidOn) }}</p>
        </div>
      </div>
      <UButton
        color="success"
        variant="subtle"
        block
        size="lg"
        icon="i-hugeicons-invoice-03"
        @click="handleViewReceipt"
      >
        Voir le reçu
      </UButton>
    </div>

    <template #footer>
      <footer class="flex flex-col gap-4">
        <div class="text-dimmed mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold">
          <UIcon name="i-hugeicons-shield-01" class="size-3.5" />
          <span>Paiement sécurisé • KineDesk</span>
        </div>
      </footer>
    </template>
  </UCard>
</template>
