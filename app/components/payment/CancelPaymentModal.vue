<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const emit = defineEmits<{ close: [] }>()

  // ─── State ──────────────────────────────────────────────────
  const confirmationInput = ref('')
  const isConfirmed = computed(() => confirmationInput.value === 'ANNULER')

  // ─── Mock data ──────────────────────────────────────────────
  const mockPayment = {
    id: 'pay-001',
    receiptNumber: 'REC-2026-0042',
    amountCents: 9500,
    method: 'cash' as PaymentMethod,
    date: '15 Mars 2026',
    sessions: [
      { id: 's1', date: '15 Mars 2026', planName: 'Kiné du dos' },
      { id: 's2', date: '12 Mars 2026', planName: 'Kiné du dos' }
    ]
  }

  // ─── Actions ─────────────────────────────────────────────────
  function handleCancel() {
    emit('close')
  }
</script>

<template>
  <UModal title="Annuler un paiement" @close="emit('close')">
    <template #body>
      <div class="space-y-5">
        <div class="text-center">
          <p class="text-muted text-sm">Référence</p>
          <p class="text-default font-bold">{{ mockPayment.receiptNumber }}</p>
        </div>

        <AppCard variant="outline">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Montant</span>
              <span class="text-default font-bold tabular-nums">{{ formatCurrency(mockPayment.amountCents) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Mode</span>
              <span class="text-default font-medium">
                {{ mockPayment.method ? getPaymentMethodLabel(mockPayment.method) : '-' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Date</span>
              <span class="text-default font-medium">{{ mockPayment.date }}</span>
            </div>
            <div v-if="mockPayment.sessions.length" class="border-default border-t pt-2">
              <p class="text-muted mb-1 text-xs font-semibold uppercase">Séances liées</p>
              <div v-for="s in mockPayment.sessions" :key="s.id" class="text-xs">
                <span class="text-default">{{ s.planName }}</span>
                <span class="text-muted">— {{ s.date }}</span>
              </div>
            </div>
          </div>
        </AppCard>

        <UAlert
          size="sm"
          color="warning"
          variant="subtle"
          icon="i-hugeicons-alert-01"
          title="Attention"
          description="L'annulation rétablira les séances liées comme non payées."
        />

        <UFormField label="Tapez ANNULER pour confirmer">
          <UInput v-model="confirmationInput" placeholder="ANNULER" size="md" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton label="Fermer" variant="outline" @click="emit('close')" />
        <UButton
          label="Annuler définitivement le paiement"
          color="error"
          :disabled="!isConfirmed"
          :class="{ 'opacity-50': !isConfirmed }"
          @click="handleCancel"
        />
      </div>
    </template>
  </UModal>
</template>
