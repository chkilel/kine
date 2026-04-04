<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const { treatmentSession } = defineProps<{ treatmentSession: TreatmentSession }>()

  const emit = defineEmits<{
    paymentCreated: []
    receiptRequested: [paymentId: string]
  }>()

  // ─── Composable ─────────────────────────────────────────────────────────────
  const { data: patientCreditBalance } = usePatientBalance(() => treatmentSession.patientId)
  const { mutate: createPayment, isLoading: isCreating } = useCreatePayment()

  // ─── Derived state ─────────────────────────────────────────────────────────
  const sessionCostCents = computed(() => treatmentSession.priceCent || 0)
  const sessionId = computed(() => treatmentSession.id)
  const patientId = computed(() => treatmentSession.patientId)

  // ─── Form state ─────────────────────────────────────────────────────────────
  const state = reactive<PaymentForm>({
    type: 'session_payment',
    method: 'cash',
    amount: (treatmentSession.priceCent ?? 0) / 100,
    notes: ''
  })

  // ─── Form computed ─────────────────────────────────────────────────────────
  const hasCredit = computed(() => (patientCreditBalance.value || 0) > 0)
  const canUseCredit = computed(() => state.method === 'deposit' && hasCredit.value)
  const submitButtonLabel = computed(() =>
    isCreating.value ? 'Enregistrement...' : getPaymentTypeSubmitLabel(state.type)
  )
  const showErrorBanner = computed(() => getPaymentTypeBannerMessage(state.type))

  // ─── Watchers ───────────────────────────────────────────────────────────────
  watch(
    () => state.type,
    (newType) => {
      if (newType === 'session_payment' && sessionCostCents.value) {
        state.amount = sessionCostCents.value / 100
      }
    }
  )

  watch(
    () => state.method,
    (newMethod) => {
      if (newMethod === 'deposit' && hasCredit.value) {
        handleUseFullCredit()
      }
    }
  )

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleUseFullCredit = () => {
    if (hasCredit.value) {
      const creditBalance = patientCreditBalance.value || 0
      const minAmount = Math.min(creditBalance, sessionCostCents.value || creditBalance)
      state.amount = minAmount / 100
    }
  }

  const onSubmit = async (event: FormSubmitEvent<PaymentForm>) => {
    if (!patientId.value) return

    const amountCents = currencyToCents(event.data.amount)

    const paymentData: PaymentRequestBody = {
      patientId: patientId.value,
      amountCents,
      type: event.data.type,
      method: event.data.method,
      ...(event.data.notes ? { notes: event.data.notes } : {}),
      paidOn: getTodayAsString()
    }

    if (event.data.type === 'payment' || event.data.type === 'credit_usage') {
      paymentData.sessionItems = [
        {
          treatmentSessionId: sessionId.value,
          amountCents
        }
      ]
    }

    createPayment({
      paymentData,
      onSuccess: () => {
        emit('paymentCreated')
        state.amount = (treatmentSession.priceCent ?? 0) / 100
        state.notes = ''
      }
    })
  }
</script>

<template>
  <AppCard variant="outline" title="Enregistrer un paiement">
    <UForm :state="state" :schema="paymentFormSchema" @submit="onSubmit" class="space-y-6">
      <!-- Transaction type selector -->
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Type de transaction" name="type">
          <URadioGroup
            v-model="state.type"
            :items="PAYMENT_TYPE_OPTIONS"
            value-key="value"
            label-key="label"
            description-key="description"
            variant="card"
            size="sm"
          />
        </UFormField>
        <!-- Payment form -->
        <div class="space-y-4">
          <UAlert v-if="showErrorBanner" size="sm" color="neutral" variant="subtle" :description="showErrorBanner" />

          <!-- Amount input -->
          <UFormField label="Montant" name="amount" hint="En dirhams">
            <UInputNumber v-model="state.amount" :min="0" :step="1" size="md" placeholder="0.00" class="w-full" />
          </UFormField>
          <!-- Use full credit button -->
          <UButton v-if="canUseCredit" color="success" variant="soft" block size="md" @click="handleUseFullCredit">
            Utiliser le solde disponible ({{ centsToCurrency(patientCreditBalance || 0) }} Dh)
          </UButton>
          <!-- Payment method selector -->
          <UFormField label="Mode de paiement" name="method">
            <USelect
              v-model="state.method"
              :items="[...PAYMENT_METHOD_OPTIONS]"
              value-key="value"
              label-key="label"
              placeholder="Sélectionner..."
              size="md"
              class="w-full"
            />
          </UFormField>
          <!-- Notes input -->
          <UFormField label="Notes" name="notes" hint="Optionnel">
            <UTextarea v-model="state.notes" placeholder="Ajouter des notes..." :rows="3" size="md" class="w-full" />
          </UFormField>
        </div>
      </div>

      <!-- Submit button -->
      <UButton type="submit" color="primary" variant="solid" block size="lg" :loading="isCreating">
        {{ isCreating ? 'Enregistrement...' : submitButtonLabel }}
      </UButton>
    </UForm>
  </AppCard>
</template>
