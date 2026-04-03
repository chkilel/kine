<script setup lang="ts">
  // ─── Props / Emits ───────────────────────────────────────────
  const emit = defineEmits<{
    addDeposit: []
    refundBalance: []
  }>()

  // ─── Mock data ──────────────────────────────────────────────
  const mockData = {
    depositCents: 15000,
    unpaidSessions: 3,
    totalDueCents: 28500
  }
</script>

<template>
  <AppCard variant="outline">
    <template #header>
      <div class="flex items-center gap-2">
        <AppIconBox name="i-hugeicons-wallet-02" size="md" color="primary" variant="soft" />
        <h3 class="font-bold">Solde du patient</h3>
      </div>
    </template>

    <div class="space-y-4">
      <div class="bg-primary/5 rounded-lg p-4 text-center">
        <p class="text-muted text-xs font-semibold uppercase">Avance disponible</p>
        <p class="text-primary mt-1 text-2xl font-black tabular-nums">
          {{ formatCurrency(mockData.depositCents) }}
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Séances impayées</span>
          <UBadge color="error" variant="subtle" size="sm">{{ mockData.unpaidSessions }}</UBadge>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Total à encaisser</span>
          <span class="text-default font-bold tabular-nums">{{ formatCurrency(mockData.totalDueCents) }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          label="Ajouter une avance"
          icon="i-hugeicons-add-circle"
          color="primary"
          variant="soft"
          block
          size="sm"
          @click="emit('addDeposit')"
        />
        <UButton
          label="Rembourser"
          icon="i-hugeicons-return-request"
          color="neutral"
          variant="outline"
          block
          size="sm"
          :disabled="mockData.depositCents === 0"
          @click="emit('refundBalance')"
        />
      </div>
    </template>
  </AppCard>
</template>
