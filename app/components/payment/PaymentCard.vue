<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{
    treatmentSession: TreatmentSession
    appointment: AppointmentWithSession
  }>()

  // ─── Composables ─────────────────────────────────────────────
  const { data: patientCreditBalance } = usePatientBalance(() => props.treatmentSession.patientId)
  const { mutate: createPayment, isLoading: isCreating } = useCreatePayment()
  const { mutate: updatePriceMutation, isLoading: isUpdating } = useUpdateSessionPrice()
  const activeOrganization = authClient.useActiveOrganization()

  // ─── Base state ──────────────────────────────────────────────
  const sessionCostCents = computed(() => props.treatmentSession.priceCent ?? 0)
  const patientId = computed(() => props.treatmentSession.patientId)
  const defaultAmount = computed(() => sessionCostCents.value / 100)

  // ─── Pricing ─────────────────────────────────────────────────
  const treatmentPlan = computed(() =>
    props.appointment?.treatmentPlanId && props.appointment?.treatmentPlan ? props.appointment.treatmentPlan : null
  )

  const inheritedPrice = computed<number | null>(() => {
    if (!props.appointment) return null
    const { location } = props.appointment

    return treatmentPlan.value?.pricing[location] ?? activeOrganization.value.data?.pricing.rateCent[location] ?? null
  })

  const hasCustomCost = computed(() => inheritedPrice.value !== null && sessionCostCents.value !== inheritedPrice.value)

  // ─── Form ────────────────────────────────────────────────────
  const formState = reactive<PaymentForm>({
    type: 'payment',
    method: 'cash',
    amount: defaultAmount.value,
    notes: ''
  })

  const paymentForm = useTemplateRef('paymentForm')

  // ─── Credit ──────────────────────────────────────────────────
  const creditBalance = computed(() => patientCreditBalance.value ?? 0)
  const hasCredit = computed(() => creditBalance.value > 0)
  const isUsingCredit = computed(() => formState.type === 'credit_usage')

  const insufficientCredit = computed(() => isUsingCredit.value && creditBalance.value < sessionCostCents.value)

  const hasSufficientCredit = computed(() => hasCredit.value && creditBalance.value >= sessionCostCents.value)

  const showCreditBalanceHint = computed(() => hasSufficientCredit.value && !isUsingCredit.value)

  // ─── UI helpers ──────────────────────────────────────────────
  const submitButtonLabel = computed(() =>
    isCreating.value ? 'Enregistrement...' : getPaymentTypeSubmitLabel(formState.type)
  )

  const showErrorBanner = computed(() => getPaymentTypeBannerMessage(formState.type))

  // `credit_usage` is a payment *type*, not a method.
  // The method buttons array only contains actual PaymentMethod values.
  // ─── Methods ─────────────────────────────────────────────────
  const methodButtons = computed(() => {
    const methods: { value: string; label: string; icon: string }[] = Object.entries(PAYMENT_METHODS_CONFIG).map(
      ([key, config]) => ({
        value: key,
        label: config.label === 'Carte bancaire' ? 'Carte' : config.label === 'Virement' ? 'Vir.' : config.label,
        icon: config.icon
      })
    )

    if (hasCredit.value) {
      methods.push({ value: 'credit_usage', label: 'Solde', icon: 'i-hugeicons-wallet-02' })
    }

    return methods
  })

  function isMethodActive(value: string) {
    if (value === 'credit_usage') return isUsingCredit.value
    return !isUsingCredit.value && formState.method === value
  }

  function handleMethodSelect(value: string) {
    if (value === 'credit_usage') {
      formState.type = 'credit_usage'
      return
    }

    if (isUsingCredit.value) {
      formState.type = 'payment'
    }

    formState.method = value as PaymentMethod
  }

  // ─── Price editing ───────────────────────────────────────────
  const isEditingPrice = ref(false)
  const priceInputRaw = ref<number | null>(null)
  const priceInputRef = useTemplateRef('priceInputRef')

  const isValidPriceInput = computed(
    () => priceInputRaw.value !== null && !isNaN(priceInputRaw.value) && priceInputRaw.value > 0
  )

  function updateSessionPrice(priceCent: number) {
    updatePriceMutation({
      sessionId: props.treatmentSession.id,
      priceCent,
      onSuccess: () => {
        formState.amount = priceCent / 100
        isEditingPrice.value = false
      },
      onError: () => {
        isEditingPrice.value = false
      }
    })
  }

  function handleStartPriceEdit() {
    priceInputRaw.value = centsToCurrency(sessionCostCents.value)
    isEditingPrice.value = true
  }

  function handleSavePrice() {
    if (!isValidPriceInput.value || priceInputRaw.value === null) return
    updateSessionPrice(currencyToCents(priceInputRaw.value))
  }

  function handleCancelPriceEdit() {
    isEditingPrice.value = false
  }

  function handleResetPrice() {
    if (inheritedPrice.value == null) return
    updateSessionPrice(inheritedPrice.value)
  }

  function handlePriceKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSavePrice()
    if (e.key === 'Escape') handleCancelPriceEdit()
  }

  // ─── Watchers ────────────────────────────────────────────────
  watch(
    () => formState.type,
    (type) => {
      if (type === 'credit_usage') {
        const cost = sessionCostCents.value
        formState.amount = cost === 0 ? 0 : cost / 100
      } else {
        formState.amount = defaultAmount.value
      }
    }
  )

  watch(sessionCostCents, (newCost) => {
    if (!isEditingPrice.value && !isUsingCredit.value) {
      formState.amount = newCost / 100
    }
  })

  watch(isEditingPrice, async (open) => {
    if (open) {
      await nextTick()
      priceInputRef.value?.inputRef?.focus()
    }
  })

  // ─── Submit ──────────────────────────────────────────────────
  function onSubmit(event: FormSubmitEvent<PaymentForm>) {
    if (!patientId.value || insufficientCredit.value) return

    const amountCents = currencyToCents(event.data.amount)

    const paymentData: PaymentRequestBody = {
      patientId: patientId.value,
      amountCents,
      type: event.data.type,
      ...(event.data.type !== 'credit_usage' ? { method: event.data.method } : {}),
      ...(event.data.notes ? { notes: event.data.notes } : {}),
      paidOn: getTodayAsString(),
      sessionItems: [{ treatmentSessionId: props.treatmentSession.id, amountCents }]
    }

    createPayment({
      paymentData,
      onSuccess: () => {
        formState.amount = defaultAmount.value
        formState.notes = ''
      }
    })
  }
</script>

<template>
  <UCard
    :ui="{
      header: 'bg-primary/5 border-primary/10',
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
            <h2 class="text-primary text-sm font-black tracking-tight uppercase">Facturation</h2>
            <p class="text-primary/60 text-[10px] font-bold">Enregistrer un paiement</p>
          </div>
        </div>

        <UPopover v-model:open="isEditingPrice" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
          <div class="group flex items-center gap-2">
            <div class="text-right">
              <span class="text-primary text-lg font-black">
                {{ centsToCurrency(sessionCostCents).toFixed(2) }}
              </span>
              <span class="text-primary/60 ml-1 text-[10px] font-bold">DH</span>
            </div>
            <UIcon
              name="i-hugeicons-pencil-edit-01"
              class="text-primary/40 group-hover:text-primary size-4 cursor-pointer transition-colors"
              @click.stop="handleStartPriceEdit"
            />
          </div>

          <template #content>
            <UCard :ui="{ body: 'p-3 sm:p-4' }">
              <UFieldGroup size="xl">
                <UButton
                  color="primary"
                  variant="subtle"
                  square
                  icon="i-hugeicons-cancel-01"
                  @click="handleCancelPriceEdit"
                />
                <UInputNumber
                  ref="priceInputRef"
                  v-model="priceInputRaw"
                  :step="10"
                  :min="10"
                  placeholder="Prix (DH)"
                  class="max-w-42"
                  @keydown="handlePriceKeydown"
                />
                <UButton
                  color="primary"
                  icon="i-hugeicons-tick-02"
                  :loading="isUpdating"
                  :disabled="!isValidPriceInput"
                  @click="handleSavePrice"
                />
              </UFieldGroup>

              <div v-if="inheritedPrice !== null" class="mt-2">
                <p class="text-muted text-xs">
                  Tarif par défaut : {{ formatCurrency(inheritedPrice) }}
                  <UButton
                    v-if="hasCustomCost"
                    size="xs"
                    variant="link"
                    class="text-primary ml-1 underline underline-offset-2"
                    @click="handleResetPrice"
                  >
                    Réinitialiser
                  </UButton>
                </p>
              </div>
            </UCard>
          </template>
        </UPopover>
      </header>
    </template>

    <UForm ref="paymentForm" :state="formState" :schema="paymentFormSchema" @submit="onSubmit">
      <div class="space-y-6">
        <UAlert v-if="showErrorBanner" size="sm" color="neutral" variant="subtle" :description="showErrorBanner" />

        <UAlert
          v-if="insufficientCredit"
          size="sm"
          color="error"
          variant="subtle"
          icon="i-hugeicons-information-diamond"
          title="Solde insuffisant"
          description="Le solde d'avance du patient est insuffisant pour couvrir le coût de la séance."
        />

        <div class="space-y-3">
          <label class="text-muted text-[10px] font-bold tracking-wider uppercase">Mode de règlement</label>

          <div class="grid grid-cols-5 gap-1">
            <button
              v-for="method in methodButtons"
              :key="method.value"
              type="button"
              tabindex="0"
              :aria-pressed="isMethodActive(method.value)"
              class="flex flex-col items-center justify-center gap-1.5 rounded-md border p-3 transition-colors"
              :class="
                isMethodActive(method.value)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-default text-muted hover:border-primary/50'
              "
              @click="handleMethodSelect(method.value)"
              @keydown.enter="handleMethodSelect(method.value)"
            >
              <UIcon :name="method.icon" class="size-5" />
              <span class="text-[8px] font-black uppercase">{{ method.label }}</span>
            </button>
          </div>

          <p v-if="showCreditBalanceHint" class="text-muted text-xs">
            Solde disponible : {{ centsToCurrency(creditBalance).toFixed(2) }} DH
            <UButton
              type="button"
              label="Utiliser"
              variant="link"
              size="xs"
              class="underline underline-offset-2"
              @click="handleMethodSelect('credit_usage')"
            />
          </p>
        </div>

        <UFormField name="notes" label="Note transaction">
          <UTextarea
            v-model="formState.notes"
            placeholder="Commentaire optionnel..."
            :rows="2"
            size="md"
            class="w-full"
          />
        </UFormField>
      </div>
    </UForm>

    <template #footer>
      <footer class="flex flex-col gap-4">
        <div class="text-muted flex items-center justify-between text-[11px] font-bold">
          <UIcon name="i-hugeicons-shield-01" class="size-3.5" />
          <span>Solde Patient : {{ centsToCurrency(creditBalance).toFixed(2) }} MAD</span>
        </div>
        <UButton
          color="primary"
          variant="solid"
          block
          size="xl"
          :loading="isCreating"
          :disabled="insufficientCredit"
          icon="i-hugeicons-invoice-01"
          @click="paymentForm?.submit()"
        >
          {{ submitButtonLabel }}
        </UButton>
      </footer>
    </template>
  </UCard>
</template>
