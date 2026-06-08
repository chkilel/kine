<script setup lang="ts">
  import type { AppointmentPaymentStatus } from '~~/shared/types/base.types'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{ patientId: string }>()

  // ─── Composables ─────────────────────────────────────────────
  const { data: balanceData, isLoading: balancePending } = usePatientBalance(computed(() => props.patientId))
  const { data: sessionsData } = useAppointmentsPaymentStatus()
  const { openAddDeposit, openRefundBalance } = useBillingSlideover()

  // ─── Computed state ──────────────────────────────────────────
  const depositCents = computed(() => (balanceData.value as number) ?? 0)

  const unpaidSessions = computed(() => {
    const items = sessionsData.value?.data

    if (!items) return { count: 0, totalDueCents: 0 }
    const unpaid = items.filter((a) => {
      const status = a.paymentStatus
      return status === 'unpaid' || status === 'partially_paid'
    })

    const totalDueCents = unpaid.reduce((sum: number, s: AppointmentWithPaymentStatus) => {
      return sum + s.priceCents - (s.paidCents || 0)
    }, 0)
    return { count: unpaid.length, totalDueCents }
  })

  // ─── Event handlers ──────────────────────────────────────────
  function handleAddDeposit() {
    openAddDeposit(props.patientId)
  }

  function handleRefundBalance() {
    openRefundBalance(props.patientId)
  }
</script>

<template>
  <AppCard variant="outline" title="Solde du patient">
    <template #header>
      <div class="flex items-center gap-2">
        <AppIconBox name="i-hugeicons-wallet-02" size="md" color="primary" variant="soft" />
        <h3 class="font-bold">Solde du patient</h3>
      </div>
    </template>

    <div class="space-y-4">
      <div class="bg-primary/5 rounded-lg p-4 text-center">
        <p class="text-muted text-xs font-semibold uppercase">Avance disponible</p>
        <p v-if="balancePending" class="text-primary mt-1 text-2xl font-black tabular-nums">...</p>
        <p v-else class="text-primary mt-1 text-2xl font-black">
          {{ formatCurrency(depositCents) }}
        </p>
      </div>
      <USeparator />
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Séances impayées</span>
          <span class="font-bold">
            {{ unpaidSessions.count }} {{ unpaidSessions.count > 1 ? 'Séances' : 'Séance' }}
          </span>

          <!-- <UBadge color="info" variant="subtle" size="sm">
            {{ unpaidSessions.count }} {{ unpaidSessions.count > 1 ? 'Séances' : 'Séance' }}
          </UBadge> -->
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Total à encaisser</span>
          <span class="font-bold">{{ formatCurrency(unpaidSessions.totalDueCents) }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <UButton
          label="Ajouter une avance"
          icon="i-hugeicons-add-circle"
          color="primary"
          variant="soft"
          block
          size="sm"
          @click="handleAddDeposit"
        />
        <UButton
          label="Rembourser"
          icon="i-hugeicons-return-request"
          color="neutral"
          variant="outline"
          block
          size="sm"
          :disabled="depositCents <= 0"
          @click="handleRefundBalance"
        />
      </div>
    </template>
  </AppCard>
</template>
