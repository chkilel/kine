<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{ payment: PaymentWithSessions }>()
  const emit = defineEmits<{ close: [] }>()

  // ─── Base state ──────────────────────────────────────────────
  const confirmationInput = ref('')
  const isConfirmed = computed(() => confirmationInput.value === 'ANNULER')

  // ─── Composables ─────────────────────────────────────────────
  const voidPayment = useVoidPayment()

  const isSubmitting = computed(() => voidPayment.isLoading.value)
  const formError = ref('')

  // ─── Computed state ──────────────────────────────────────────
  const paymentLabel = computed(() => {
    return props.payment?.method ? getPaymentMethodLabel(props.payment.method) : '-'
  })

  const paymentDate = computed(() => {
    return props.payment?.paidOn || ''
  })

  const appointmentItems = computed(() => props.payment?.appointmentItems || [])

  // ─── Submit ──────────────────────────────────────────────────
  async function handleCancel() {
    formError.value = ''
    if (!props.payment.id) return

    voidPayment.mutate({
      paymentId: props.payment.id,
      patientId: props.payment.patientId,
      onSuccess: () => emit('close'),
      onError: (error) => (formError.value = parseError(error, "Erreur lors de l'annulation du paiement").message)
    })
  }
</script>

<template>
  <UModal title="Annuler un paiement" @close="emit('close')">
    <template #body>
      <div class="space-y-5">
        <div class="text-center">
          <p class="text-muted text-sm">Référence</p>
          <p class="text-default font-bold">{{ payment?.receiptNumber || '-' }}</p>
        </div>

        <AppCard variant="outline">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Montant</span>
              <span class="text-default font-bold tabular-nums">
                {{ formatCurrency(payment?.amountCents || 0) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Mode</span>
              <span class="text-default font-medium">{{ paymentLabel }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Date</span>
              <span class="text-default font-medium">{{ paymentDate }}</span>
            </div>
            <div v-if="appointmentItems.length" class="border-default border-t pt-2">
              <p class="text-muted mb-1 text-xs font-semibold uppercase">Séances liées</p>
              <div v-for="si in appointmentItems" :key="si.id" class="text-xs">
                <span class="text-default">Séance</span>
                <span class="text-muted">— {{ formatCurrency(si.amountCents) }}</span>
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

        <div v-if="formError">
          <UAlert color="error" variant="subtle" :description="formError" />
        </div>

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
          :disabled="!isConfirmed || isSubmitting"
          :loading="isSubmitting"
          :class="{ 'opacity-50': !isConfirmed }"
          @click="handleCancel"
        />
      </div>
    </template>
  </UModal>
</template>
