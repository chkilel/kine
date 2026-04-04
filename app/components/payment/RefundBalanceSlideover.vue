<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const emit = defineEmits<{ close: [] }>()

  // ─── Mock data ──────────────────────────────────────────────
  const mockBalanceCents = 15000

  // ─── Form state ──────────────────────────────────────────────
  const formState = reactive({
    amount: centsToCurrency(mockBalanceCents),
    method: 'cash' as PaymentMethod
  })

  // ─── UI helpers ──────────────────────────────────────────────
  const methodButtons = computed(() =>
    Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label === 'Carte bancaire' ? 'Carte' : config.label === 'Virement' ? 'Vir.' : config.label,
      icon: config.icon
    }))
  )

  // ─── Actions ─────────────────────────────────────────────────
  function onSubmit() {
    emit('close')
  }
</script>

<template>
  <USlideover title="Rembourser le solde" @close="emit('close')">
    <template #body>
      <div class="space-y-5">
        <div class="bg-primary/5 rounded-lg p-4 text-center">
          <p class="text-muted text-xs font-semibold uppercase">Solde avance actuel</p>
          <p class="text-primary mt-1 text-2xl font-black tabular-nums">{{ formatCurrency(mockBalanceCents) }}</p>
        </div>

        <UFormField label="Montant à rembourser" hint="En dirhams">
          <UInputNumber
            v-model="formState.amount"
            :min="0"
            :max="centsToCurrency(mockBalanceCents)"
            :step="10"
            size="md"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Mode de remboursement">
          <USelect
            v-model="formState.method"
            :items="[...PAYMENT_FUNDING_METHOD_OPTIONS]"
            value-key="value"
            label-key="label"
            size="md"
            class="w-full"
          />
        </UFormField>

        <UAlert
          size="sm"
          color="warning"
          variant="subtle"
          icon="i-hugeicons-information-diamond"
          description="Le remboursement réduit le solde d'avance du patient."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton label="Fermer" variant="outline" @click="emit('close')" />
        <UButton
          label="Confirmer le remboursement"
          color="primary"
          :disabled="formState.amount <= 0"
          @click="onSubmit"
        />
      </div>
    </template>
  </USlideover>
</template>
