<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{
    session: {
      id: string
      date: string
      planName: string
      location: string
      amountCents: number
      paidCents: number
      status: 'unpaid' | 'partial' | 'paid'
    }
  }>()

  const emit = defineEmits<{
    recordPayment: [sessionId: string]
    viewReceipt: [sessionId: string]
  }>()

  // ─── Computed ───────────────────────────────────────────────
  const remainingCents = computed(() => props.session.amountCents - props.session.paidCents)

  const statusConfig = computed(() => {
    switch (props.session.status) {
      case 'unpaid':
        return { label: 'Non facturé', color: 'error' as const, variant: 'subtle' as const }
      case 'partial':
        return { label: 'Partiellement payé', color: 'warning' as const, variant: 'subtle' as const }
      case 'paid':
        return { label: 'Payé', color: 'success' as const, variant: 'subtle' as const }
    }
  })

  const actionLabel = computed(() => {
    switch (props.session.status) {
      case 'unpaid':
        return 'Enregistrer le paiement'
      case 'partial':
        return 'Compléter paiement'
      default:
        return ''
    }
  })
</script>

<template>
  <AppCard variant="outline" :class="{ 'opacity-75': session.status === 'paid' }">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="statusConfig.color" :variant="statusConfig.variant" size="xs">
            {{ statusConfig.label }}
          </UBadge>
          <span class="text-muted text-xs">{{ session.date }}</span>
        </div>
        <h4 class="text-default mt-1 truncate text-sm font-semibold">
          {{ session.planName }}
        </h4>
        <div class="text-muted mt-0.5 flex items-center gap-2 text-xs">
          <span>{{ session.location }}</span>
        </div>
        <div v-if="session.status === 'partial'" class="mt-2">
          <span class="text-warning text-xs font-semibold">Reste : {{ formatCurrency(remainingCents) }}</span>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2">
        <span class="text-default text-sm font-bold tabular-nums">
          {{ formatCurrency(session.amountCents) }}
        </span>
        <UButton
          v-if="session.status === 'unpaid' || session.status === 'partial'"
          :label="actionLabel"
          size="xs"
          color="primary"
          variant="soft"
          @click="emit('recordPayment', session.id)"
        />
        <UButton
          v-else
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-hugeicons-invoice-03"
          @click="emit('viewReceipt', session.id)"
        />
      </div>
    </div>
  </AppCard>
</template>
