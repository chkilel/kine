<script setup lang="ts">
  // ─── Mock data ──────────────────────────────────────────────
  const mockData = {
    totalBilledCents: 45000,
    totalCollectedCents: 32000,
    remainingCents: 13000,
    depositCents: 15000
  }

  // ─── Computed ───────────────────────────────────────────────
  const recoveryRate = computed(() => {
    if (mockData.totalBilledCents === 0) return 0
    return Math.round((mockData.totalCollectedCents / mockData.totalBilledCents) * 100)
  })
</script>

<template>
  <AppCard variant="outline">
    <template #header>
      <div class="flex items-center gap-2">
        <AppIconBox name="i-hugeicons-chart-pie-01" size="md" color="primary" variant="soft" />
        <h3 class="font-bold">Résumé financier</h3>
      </div>
    </template>

    <div class="space-y-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Total facturé</span>
        <span class="text-default font-bold tabular-nums">{{ formatCurrency(mockData.totalBilledCents) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Total encaissé</span>
        <span class="text-success font-bold tabular-nums">{{ formatCurrency(mockData.totalCollectedCents) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Reste à encaisser</span>
        <span class="text-error font-bold tabular-nums">{{ formatCurrency(mockData.remainingCents) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Avance disponible</span>
        <span class="text-primary font-bold tabular-nums">{{ formatCurrency(mockData.depositCents) }}</span>
      </div>

      <div class="border-default border-t pt-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted font-medium">Taux de recouvrement</span>
          <span class="text-default font-bold">{{ recoveryRate }}%</span>
        </div>
        <UProgress :model-value="recoveryRate" :max="100" color="primary" size="sm" class="mt-2" />
      </div>
    </div>
  </AppCard>
</template>
