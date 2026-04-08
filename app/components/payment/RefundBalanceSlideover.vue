<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{ patientId: string }>()
  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const createPayment = useCreatePayment()
  const { data: balanceData } = usePatientBalance(computed(() => props.patientId))

  // ─── States ──────────────────────────────────────────────────
  const formError = ref('')

  // ─── Computed state ──────────────────────────────────────────
  const balanceCents = computed(() => (balanceData.value as number) ?? 0)
  const isSubmitting = computed(() => createPayment.isLoading.value)

  // ─── Form ────────────────────────────────────────────────────
  const formState = reactive({
    amount: centsToCurrency(balanceCents.value),
    method: 'cash' as PaymentMethod
  })

  // ─── Submit ──────────────────────────────────────────────────
  async function onSubmit() {
    formError.value = ''
    const refundCents = currencyToCents(formState.amount)
    if (refundCents <= 0 || refundCents > balanceCents.value) return

    createPayment.mutate({
      paymentData: {
        patientId: props.patientId,
        amountCents: refundCents,
        type: 'deposit_refund',
        method: formState.method
      },
      onSuccess: () => emit('close'),
      onError: (error) => (formError.value = parseError(error, 'Erreur lors du remboursement').message)
    })
  }
</script>

<template>
  <USlideover title="Rembourser le solde" @close="emit('close')">
    <template #body>
      <div class="space-y-5">
        <div class="bg-primary/5 rounded-lg p-4 text-center">
          <p class="text-muted text-xs font-semibold uppercase">Solde avance actuel</p>
          <p class="text-primary mt-1 text-2xl font-black tabular-nums">{{ formatCurrency(balanceCents) }}</p>
        </div>

        <UFormField label="Montant à rembourser" hint="En dirhams">
          <UInputNumber
            v-model="formState.amount"
            :min="0"
            :max="centsToCurrency(balanceCents)"
            :step="10"
            size="md"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Mode de remboursement">
          <div class="grid w-full grid-cols-4 gap-2">
            <button
              v-for="method in PAYMENT_FUNDING_METHOD_OPTIONS"
              :key="method.value"
              type="button"
              class="flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 transition-colors"
              :class="
                formState.method === method.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-default text-muted hover:border-primary/50'
              "
              @click="formState.method = method.value as PaymentMethod"
            >
              <UIcon :name="method.icon" class="size-5" />
              <span class="text-[8px] font-bold uppercase">{{ method.label }}</span>
            </button>
          </div>
        </UFormField>
        <!-- <UFormField label="Mode de remboursement"> -->
        <!-- <USelect -->
        <!-- v-model="formState.method" -->
        <!-- :items="[...PAYMENT_FUNDING_METHOD_OPTIONS]" -->
        <!-- value-key="value" -->
        <!-- label-key="label" -->
        <!-- size="md" -->
        <!-- class="w-full" -->
        <!-- /> -->
        <!-- </UFormField> -->

        <UAlert
          size="sm"
          color="warning"
          variant="subtle"
          icon="i-hugeicons-information-diamond"
          description="Le remboursement réduit le solde d'avance du patient."
        />

        <div v-if="formError">
          <UAlert color="error" variant="subtle" :description="formError" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton label="Fermer" variant="outline" @click="emit('close')" />
        <UButton
          label="Confirmer le remboursement"
          color="primary"
          :disabled="formState.amount <= 0 || isSubmitting"
          :loading="isSubmitting"
          @click="onSubmit"
        />
      </div>
    </template>
  </USlideover>
</template>
