<script setup lang="ts">
  // ─── Props ───────────────────────────────────────────────────
  const props = defineProps<{ session: TreatmentSessionWithPaymentStatus }>()

  // ─── Composables ─────────────────────────────────────────────
  const { openRecordPayment, viewPaymentReceipt } = useBillingSlideover()

  const { data: sessionPayments, isLoading: paymentsLoading } = useTreatmentSessionPayments(
    computed(() => props.session.id)
  )

  const patientId = computed(() => props.session.patientId)

  // ─── Expand/Collapse state ───────────────────────────────────
  const isExpanded = ref(false)

  watchEffect(() => {
    isExpanded.value = props.session.paymentStatus === 'unpaid' || props.session.paymentStatus === 'partial'
  })

  // ─── Computed state ──────────────────────────────────────────
  const remainingCents = computed(() => props.session.priceCent - props.session.paidCents)

  const statusConfig = computed(() => ({
    label: getPaymentStatusLabel(props.session.paymentStatus),
    color: getPaymentStatusColor(props.session.paymentStatus),
    icon: getPaymentStatusIcon(props.session.paymentStatus)
  }))

  const actionLabel = computed(() => {
    switch (props.session.paymentStatus) {
      case 'unpaid':
        return 'Enregistrer le paiement'
      case 'partial':
        return 'Compléter paiement'
      default:
        return ''
    }
  })

  const sessionLabel = computed(() => {
    const name = props.session.planTitle || 'Séance de kinésithérapie'
    return name
  })

  const sessionLocation = computed(() => {
    const loc = props.session.appointmentLocation
    return loc ? getLocationLabel(loc) : ''
  })

  const sessionDate = computed(() => {
    return props.session.appointmentDate || ''
  })

  const isPaid = computed(() => props.session.paymentStatus === 'paid')
  const isPartial = computed(() => props.session.paymentStatus === 'partial')
  const needsPayment = computed(() => props.session.paymentStatus === 'unpaid' || isPartial.value)

  const paymentDetails = computed(() => {
    const payments = sessionPayments.value as Payment[] | undefined
    if (!payments?.length) return []
    return payments.map((p) => ({
      id: p.id,
      amount: formatCurrency(p.amountCents),
      method: getPaymentMethodLabel(p.method),
      methodIcon: getPaymentMethodIcon(p.method),
      date: formatDate(p.paidOn),
      receiptNumber: p.receiptNumber
    }))
  })

  const hasPayments = computed(() => paymentDetails.value.length > 0)

  // ─── Event handlers ──────────────────────────────────────────
  function handleRecordPayment() {
    openRecordPayment(patientId.value, [props.session.id])
  }

  function handleViewPaymentReceipt(paymentId: string) {
    viewPaymentReceipt(paymentId)
  }
</script>

<template>
  <AppCard
    variant="outline"
    :class="{ 'opacity-75': isPaid }"
    :ui="{
      body: 'p-0 sm:p-0'
    }"
  >
    <div class="flex items-start justify-between gap-4 p-3 sm:p-4">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :icon="statusConfig.icon" :color="statusConfig.color" variant="solid" size="md">
            {{ statusConfig.label }}
          </UBadge>
          <span v-if="sessionDate" class="text-toned text-sm font-semibold">{{ sessionDate }}</span>
        </div>
        <h4 class="text-default mt-1 truncate text-sm font-medium">
          {{ sessionLabel }}
        </h4>
        <div v-if="sessionLocation" class="text-muted mt-0.5 flex items-center gap-2 text-xs">
          <span>{{ sessionLocation }}</span>
        </div>
        <div v-if="isPartial" class="mt-2">
          <span class="text-warning text-xs font-semibold">Reste : {{ formatCurrency(remainingCents) }}</span>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2">
        <span class="text-default text-sm font-bold tabular-nums">
          {{ formatCurrency(session.priceCent) }}
        </span>
        <UButton
          v-if="needsPayment"
          :label="actionLabel"
          size="xs"
          color="primary"
          variant="soft"
          @click="handleRecordPayment"
        />
      </div>
    </div>

    <div v-if="hasPayments" class="">
      <UCollapsible v-model:open="isExpanded" :unmount-on-hide="false">
        <UButton
          type="button"
          size="sm"
          color="neutral"
          variant="soft"
          class="w-full rounded-none"
          trailingIcon="i-lucide-chevron-right"
          :ui="{
            trailingIcon: `${isExpanded ? 'rotate-90' : ''} ml-auto transition-transform duration-200`
          }"
        >
          <UBadge color="neutral" variant="subtle" class="font-semibold">
            {{ paymentDetails.length }} paiement{{ paymentDetails.length > 1 ? 's' : '' }}
          </UBadge>
        </UButton>

        <template #content>
          <div class="ispace-y-1.5 divide-y p-0">
            <div v-if="paymentsLoading" class="py-2">
              <AppSpinner size="sm" />
            </div>
            <div
              v-for="payment in paymentDetails"
              :key="payment.id"
              class="border-muted bg-muted/50 hover:bg-muted flex items-center justify-between border-l-4 px-2 py-1.5 transition-colors"
            >
              <div class="flex items-center gap-2.5">
                <AppIconBox :name="payment.methodIcon" size="xs" color="neutral" variant="subtle" />
                <div>
                  <p class="text-default text-xs font-semibold">{{ payment.method }}</p>
                  <p class="text-muted text-[10px]">
                    {{ payment.date }}
                    <span v-if="payment.receiptNumber">&middot; {{ payment.receiptNumber }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-success text-xs font-bold tabular-nums">+{{ payment.amount }}</span>
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-hugeicons-download-01"
                  color="neutral"
                  @click="handleViewPaymentReceipt(payment.id)"
                />
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>
    </div>
  </AppCard>
</template>
