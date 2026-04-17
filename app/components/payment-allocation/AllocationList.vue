<script setup lang="ts">
  defineProps<{
    allocations: PaymentAllocation[]
  }>()

  const getPortionLabel = (portion: string) => {
    switch (portion) {
      case 'full':
        return 'Complet'
      case 'copay':
        return 'Co-paiement'
      case 'insurance':
        return 'Assurance'
      default:
        return portion
    }
  }
</script>

<template>
  <div class="space-y-2">
    <div class="text-muted text-sm font-medium">Allocations</div>
    <div v-if="!allocations?.length" class="text-dimmed text-sm">Aucune allocation</div>
    <div
      v-for="allocation in allocations"
      :key="allocation.id"
      class="bg-elevated flex items-center justify-between rounded-md p-2 text-sm"
    >
      <div class="flex items-center gap-2">
        <UBadge :label="getPortionLabel(allocation.portion)" variant="subtle" size="xs" />
        <span v-if="allocation.invoiceId" class="text-dimmed">Facture: {{ allocation.invoiceId.slice(0, 8) }}...</span>
        <span v-if="allocation.appointmentId" class="text-dimmed">
          Séance: {{ allocation.appointmentId.slice(0, 8) }}...
        </span>
      </div>
      <span class="font-medium">{{ formatCurrency(allocation.amountCents) }}</span>
    </div>
  </div>
</template>
