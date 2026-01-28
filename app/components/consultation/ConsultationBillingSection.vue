<script setup lang="ts">
  const props = defineProps<{
    consultation: Consultation
  }>()

  const billingStatus = ref<'pending' | 'paid' | 'deposit'>('pending')
  const paymentAmount = ref<number>(0)

  const consultationDurationMinutes = computed(() => {
    if (!props.consultation?.duration) return 0
    return props.consultation.duration + (props.consultation.extendedDurationMinutes || 0)
  })

  const calculatedAmount = computed(() => {
    const rate = 50
    return consultationDurationMinutes.value * (rate / 60)
  })

  const isPaid = computed(() => billingStatus.value === 'paid')

  function markAsPaid() {
    paymentAmount.value = calculatedAmount.value
    billingStatus.value = 'paid'
  }
</script>

<template>
  <UCard :ui="{ body: 'p-6' }">
    <template #header>
      <h3 class="text-lg font-bold">Facturation</h3>
    </template>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-muted text-sm">Durée de la séance</span>
        <span class="font-bold">{{ consultationDurationMinutes }} min</span>
      </div>

      <div class="border-border border-t pt-4">
        <div class="flex items-center justify-between">
          <span class="text-sm">Montant à payer</span>
          <span class="text-xl font-bold">€{{ calculatedAmount.toFixed(2) }}</span>
        </div>
      </div>

      <div v-if="!isPaid">
        <div class="flex flex-col gap-2">
          <p class="text-muted text-xs">Statut de paiement</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-hugeicons-clock-01" class="text-warning size-5" />
            <span class="font-semibold">En attente</span>
          </div>
        </div>

        <UButton
          variant="solid"
          color="success"
          size="lg"
          block
          icon="i-hugeicons-checkmark-circle-02"
          @click="markAsPaid"
        >
          Marquer comme payé
        </UButton>
      </div>

      <div v-else>
        <div class="flex flex-col gap-2">
          <p class="text-muted text-xs">Statut de paiement</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-hugeicons-checkmark-circle-01" class="text-success size-5" />
            <span class="font-semibold">Payé</span>
          </div>
        </div>

        <div class="bg-success/10 mt-2 rounded-lg p-3 text-center">
          <p class="text-success text-sm font-semibold">€{{ paymentAmount.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  </UCard>
</template>
