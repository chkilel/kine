<script setup lang="ts">
  // ─── Props ───────────────────────────────────────────────────
  const props = defineProps<{
    sessions: AppointmentWithPaymentStatus[]
    patientId: string
  }>()

  // ─── Composables ─────────────────────────────────────────────
  const { data: balanceData } = usePatientBalance(() => props.patientId)

  // ─── Computed state ──────────────────────────────────────────
  const totalBilledCents = computed(() => props.sessions.reduce((sum, s) => sum + (s.priceCents || 0), 0))

  const totalCollectedCents = computed(() => props.sessions.reduce((sum, s) => sum + (s.paidCents || 0), 0))

  const remainingCents = computed(() => totalBilledCents.value - totalCollectedCents.value)

  const depositCents = computed(() => balanceData.value ?? 0)

  const recoveryRate = computed(() => {
    if (totalBilledCents.value === 0) return 0
    return Math.round((totalCollectedCents.value / totalBilledCents.value) * 100)
  })
</script>

<template>
  <AppCard variant="outline" iconColor="info" title="Résumé financier" icon="i-hugeicons-pie-chart-01">
    <div class="space-y-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Total facturé</span>
        <span class="text-default font-bold tabular-nums">{{ formatCurrency(totalBilledCents) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Total encaissé</span>
        <span class="text-success font-bold tabular-nums">{{ formatCurrency(totalCollectedCents) }}</span>
      </div>
      <USeparator />
      <div class="flex items-center justify-between text-sm">
        <span class="font-bold">Reste à encaisser</span>
        <span class="text-error font-bold tabular-nums">{{ formatCurrency(remainingCents) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted italic">Dont avance disp.</span>
        <span class="text-primary font-bold tabular-nums">{{ formatCurrency(depositCents) }}</span>
      </div>
    </div>
    <div>
      <div class="mt-5 flex items-center justify-between text-xs">
        <span class="text-muted font-semibold uppercase">Taux de recouvrement</span>
        <span class="text-info font-bold">{{ recoveryRate }}%</span>
      </div>
      <UProgress :model-value="recoveryRate" :max="100" color="primary" size="md" class="mt-2" />
    </div>
  </AppCard>
</template>
