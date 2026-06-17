<script setup lang="ts">
  import { differenceInCalendarDays } from 'date-fns'

  const props = defineProps<{ appointment: AppointmentWithPaymentStatus }>()

  const { openRecordPayment, viewPaymentReceipt } = useBillingSlideover()
  const { getTherapistName } = useOrganizationMembers()
  const { resolveTitle } = useAppointmentTypes()

  const isPaid = computed(
    () => props.appointment.paymentStatus === 'paid' || props.appointment.paymentStatus === 'copay_paid'
  )
  const isPartial = computed(() => props.appointment.paymentStatus === 'partially_paid')
  const isUnpaid = computed(() => props.appointment.paymentStatus === 'unpaid')

  const dateBadgeColor = computed(() => (isPaid.value ? 'success' : isPartial.value ? 'warning' : 'error'))

  const remainingCents = computed(() => Math.max(0, props.appointment.priceCents - props.appointment.paidCents))

  const overdueDays = computed(() => {
    if (!isUnpaid.value) return 0
    const diff = differenceInCalendarDays(new Date(), props.appointment.date)
    return diff > 0 ? diff : 0
  })

  const therapistName = computed(() =>
    props.appointment.therapistId ? getTherapistName(props.appointment.therapistId) : null
  )

  const lastPayment = computed(() => props.appointment.paymentDetails?.[0] ?? null)
  const hasMultiplePayments = computed(() => (props.appointment.paymentDetails?.length ?? 0) > 1)

  const receiptItems = computed(() =>
    (props.appointment.paymentDetails ?? []).map((p) => ({
      label: `${formatCurrency(p.amountCents)} — ${p.receiptNumber}`,
      icon: 'i-hugeicons-file-02',
      onSelect: () => viewPaymentReceipt(p.id)
    }))
  )

  function handleRecordPayment() {
    openRecordPayment(props.appointment.patientId, [props.appointment.id])
  }
</script>

<template>
  <div class="bg-muted border-default flex items-stretch gap-3 rounded-lg border p-3 transition-colors hover:shadow-sm">
    <AppDateBadge :date="appointment.date" variant="subtle" :color="dateBadgeColor" class="h-auto shrink-0" />

    <div class="flex flex-1 items-center justify-between gap-3">
      <div class="min-w-0">
        <h4 class="text-on-background truncate text-sm font-semibold">
          {{ resolveTitle(appointment.type) }}
        </h4>
        <div v-if="therapistName" class="flex items-center gap-1 text-xs">
          <UIcon name="i-hugeicons-user" />
          <p>{{ therapistName }}</p>
        </div>

        <p class="text-on-surface-variant mt-0.5 text-xs">
          <span v-if="isPaid && lastPayment" class="inline-flex items-center gap-1">
            <UIcon :name="getPaymentMethodIcon(lastPayment.method)" class="size-3.5" />
            {{ getPaymentMethodLabel(lastPayment.method) }} ·
            {{ formatShortDate(lastPayment.paidOn) }}
          </span>
          <span v-else-if="isPartial" class="text-warning font-medium">Reste {{ formatCurrency(remainingCents) }}</span>
          <span v-else-if="isUnpaid && overdueDays > 0" class="text-error font-medium">
            En retard de {{ overdueDays }} jour{{ overdueDays > 1 ? 's' : '' }}
          </span>
          <span v-else-if="isUnpaid">À régler</span>
        </p>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1.5">
        <span class="text-on-background font-headline text-lg font-bold tabular-nums">
          {{ formatCurrency(appointment.priceCents) }}
        </span>

        <UDropdownMenu v-if="isPaid && hasMultiplePayments" :items="receiptItems">
          <UButton
            label="Reçus"
            icon="i-hugeicons-receipt-text"
            trailing-icon="i-hugeicons-arrow-down-01"
            size="xs"
            color="neutral"
            variant="subtle"
          />
        </UDropdownMenu>
        <UButton
          v-else-if="isPaid && lastPayment"
          label="Reçu"
          icon="i-hugeicons-receipt-text"
          size="xs"
          color="neutral"
          variant="subtle"
          @click="viewPaymentReceipt(lastPayment.id)"
        />
        <UButton
          v-else
          :label="isPartial ? 'Compléter' : 'Payer'"
          size="xs"
          color="primary"
          variant="solid"
          @click="handleRecordPayment"
        />
      </div>
    </div>
  </div>
</template>
