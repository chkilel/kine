<script setup lang="ts">
  const props = defineProps<{ appointment: Appointment }>()

  const { mutate: updatePrice, isLoading: isUpdating } = useUpdateAppointmentPrice()
  const { data: fullOrg } = useFullOrganization(() => props.appointment.organizationId)

  const orgPriceItems = computed(() => fullOrg.value?.pricing?.priceItems ?? [])

  const currentPriceItemCode = computed(() => {
    const priceItem = props.appointment.priceItem as PriceItemSnapshot | null
    return priceItem?.code ?? null
  })

  const selectedPriceItem = computed(() => {
    if (!currentPriceItemCode.value) return undefined
    return orgPriceItems.value.find((item: PriceItem) => item.code === currentPriceItemCode.value)
  })

  const currentPriceCents = computed(() => {
    const location = props.appointment.location
    if (selectedPriceItem.value?.rateCent) {
      return selectedPriceItem.value.rateCent[location] ?? 0
    }
    const snapshot = props.appointment.priceItem as PriceItemSnapshot | null
    return snapshot?.rateCent?.[location] ?? props.appointment.priceCents ?? 0
  })

  const displayPriceFormatted = computed(() => formatCurrency(currentPriceCents.value))

  const priceLabel = computed(() => {
    if (!selectedPriceItem.value && !currentPriceItemCode.value) return 'Tarif estimé'
    return 'Tarif appliqué'
  })

  const priceDescription = computed(() => {
    if (selectedPriceItem.value) return selectedPriceItem.value.description
    const snapshot = props.appointment.priceItem as PriceItemSnapshot | null
    return snapshot?.description ?? null
  })

  function handleSelectPriceItem(option: string) {
    if (props.appointment.status !== 'in_progress') return
    updatePrice({
      appointmentId: props.appointment.id,
      priceItemCode: option
    })
  }

  const selectMenuOptions = computed(() =>
    orgPriceItems.value.map((item: PriceItem) => ({
      label: item.description,
      value: item.code
    }))
  )
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-hugeicons-wallet-02" class="text-muted size-5" />
        <div>
          <p class="text-muted text-xs font-bold uppercase">{{ priceLabel }}</p>
          <p class="text-xl font-bold tabular-nums">{{ displayPriceFormatted }}</p>
          <p v-if="priceDescription" class="text-muted text-xs">{{ priceDescription }}</p>
        </div>
      </div>
      <USelectMenu
        v-if="appointment.status === 'in_progress' && selectMenuOptions.length > 0"
        :model-value="currentPriceItemCode"
        :options="selectMenuOptions"
        value-key="value"
        placeholder="Sélectionner un tarif"
        :loading="isUpdating"
        color="primary"
        size="xs"
        variant="ghost"
        icon="i-hugeicons-price-tag-01"
        @update:model-value="handleSelectPriceItem"
      />
    </div>
  </UCard>
</template>
