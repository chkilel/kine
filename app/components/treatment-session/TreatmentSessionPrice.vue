<script setup lang="ts">
  import type { PriceItem } from '~~/shared/types/org.types'
  const props = defineProps<{ appointment: Appointment }>()

  // ─── Composables ─────────────────────────────────────────────────────────────

  const activeOrganization = authClient.useActiveOrganization()
  const { mutate: updatePrice, isLoading: isUpdating } = useUpdateAppointmentPrice()

  // ─── Reactive state ──────────────────────────────────────────────────────────

  const isEditingPrice = ref(false)
  const priceInputRaw = ref(100)
  const inputRef = ref<HTMLInputElement | null>(null)

  // ─── Derived state ──────────────────────────────────────────────────────────

  const inheritedPrice = computed(() => {
    const location = props.appointment.location
    const defaultItem = activeOrganization.value.data?.pricing?.priceItems?.find((item: PriceItem) => item.isDefault)
    if (!defaultItem?.rateCent) return null
    return defaultItem.rateCent[location] ?? null
  })

  const hasCustomCost = computed(() => {
    const priceCents = props.appointment.priceCents
    return priceCents !== null && priceCents !== undefined
  })

  const displayPrice = computed(() => (hasCustomCost.value ? props.appointment.priceCents : inheritedPrice.value))

  const displayPriceFormatted = computed(() =>
    displayPrice.value !== null && displayPrice.value !== undefined ? formatCurrency(displayPrice.value) : '-'
  )

  const priceLabel = computed(() => (hasCustomCost.value ? 'Tarif appliqué' : 'Tarif estimé'))

  const isValidInput = computed(() => {
    const parsed = priceInputRaw.value
    return !isNaN(parsed) && parsed > 0
  })

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleStartPriceEdit() {
    const currentPrice = props.appointment.priceCents ?? inheritedPrice.value
    priceInputRaw.value = currentPrice !== null && currentPrice !== undefined ? centsToCurrency(currentPrice) : 1
    isEditingPrice.value = true
    await nextTick()
    inputRef.value?.focus()
  }

  function handleSavePrice() {
    if (props.appointment.status !== 'in_progress' || !isValidInput.value) return

    const priceInCents = currencyToCents(priceInputRaw.value)

    updatePrice({
      appointmentId: props.appointment.id,
      priceCents: priceInCents
    })
    isEditingPrice.value = false
  }

  function handleResetPrice() {
    if (props.appointment.status !== 'in_progress') return

    updatePrice({
      appointmentId: props.appointment.id,
      priceCents: inheritedPrice.value
    })
    isEditingPrice.value = false
  }

  function handleCancelPriceEdit() {
    isEditingPrice.value = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSavePrice()
    if (e.key === 'Escape') handleCancelPriceEdit()
  }
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-hugeicons-wallet-02" class="text-muted size-5" />
        <div>
          <p class="text-muted text-xs font-bold uppercase">{{ priceLabel }}</p>
          <p class="text-xl font-bold tabular-nums">{{ displayPriceFormatted }}</p>
        </div>
      </div>
      <UButton
        v-if="appointment.status === 'in_progress' && !isEditingPrice"
        size="xs"
        color="primary"
        variant="ghost"
        icon="i-hugeicons-pencil-edit-01"
        @click="handleStartPriceEdit"
      >
        Modifier
      </UButton>
    </div>

    <div v-if="appointment.status === 'in_progress' && isEditingPrice" class="mt-4 space-y-2">
      <div class="flex gap-2">
        <UFieldGroup>
          <UInputNumber
            ref="inputRef"
            v-model="priceInputRaw"
            inputmode="decimal"
            :step="10"
            :min="10"
            placeholder="Prix personnalisé (en Dh)"
            :color="priceInputRaw && !isValidInput ? 'error' : undefined"
            class="iiw-full"
            @keydown="handleKeydown"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-hugeicons-cancel-01"
            class="w-12"
            block
            @click="handleCancelPriceEdit"
          />
          <UButton
            color="primary"
            icon="i-hugeicons-tick-02"
            :loading="isUpdating"
            :disabled="!isValidInput"
            class="w-12"
            block
            @click="handleSavePrice"
          />
        </UFieldGroup>
      </div>

      <!-- Hint: inherited fallback price -->
      <p v-if="inheritedPrice !== null" class="text-muted text-xs">
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
