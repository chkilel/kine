<script setup lang="ts">
  import { differenceInCalendarDays } from 'date-fns'

  // ─── Props ───────────────────────────────────────────────────
  const props = defineProps<{ appointment: AppointmentWithPaymentStatus }>()

  // ─── Composables ─────────────────────────────────────────────
  const { openRecordPayment, viewPaymentReceipt } = useBillingSlideover()
  const { getTherapistName } = useOrganizationMembers()

  const patientId = computed(() => props.appointment.patientId)

  // ─── Expand/Collapse state ───────────────────────────────────
  const isExpanded = ref(false)

  watchEffect(() => {
    isExpanded.value =
      props.appointment.paymentStatus === 'unpaid' || props.appointment.paymentStatus === 'partially_paid'
  })

  // ─── Computed state ──────────────────────────────────────────
  const remainingCents = computed(() => props.appointment.priceCents - props.appointment.paidCents)

  const statusConfig = computed(() => ({
    label: getPaymentStatusLabel(props.appointment.paymentStatus),
    color: getPaymentStatusColor(props.appointment.paymentStatus),
    icon: getPaymentStatusIcon(props.appointment.paymentStatus)
  }))

  const isPaid = computed(() => props.appointment.paymentStatus === 'paid')
  const isUnpaid = computed(() => props.appointment.paymentStatus === 'unpaid')
  const isPartial = computed(() => props.appointment.paymentStatus === 'partially_paid')
  const needsPayment = computed(() => props.appointment.paymentStatus === 'unpaid' || isPartial.value)

  const overdueDays = computed(() => {
    if (props.appointment.paymentStatus !== 'unpaid') return 0
    const diff = differenceInCalendarDays(new Date(), props.appointment.date)
    return diff > 0 ? diff : 0
  })

  // ─── Event handlers ──────────────────────────────────────────
  function handleRecordPayment() {
    openRecordPayment(patientId.value, [props.appointment.id])
  }

  function handleViewPaymentReceipt(paymentId: string) {
    viewPaymentReceipt(paymentId)
  }
</script>

<template>
  <!-- Session Cards List -->
  <div class="space-y-4">
    <div
      class="group bg-muted border-default flex items-stretch gap-4 rounded-lg border p-3 pr-4 pl-0 transition-colors hover:shadow-sm"
    >
      <div
        class="w-1.5 rounded-r-full"
        :class="[isPaid && 'bg-success', isPartial && 'bg-warning', isUnpaid && 'bg-error']"
      />

      <div class="flex flex-1 items-start justify-between">
        <div class="flex items-start space-x-3">
          <AppDateBadge
            :date="appointment.date"
            variant="subtle"
            :color="isPaid ? 'success' : isPartial ? 'warning' : 'error'"
            class="aspect-square"
          />
          <div>
            <h4 class="font-headline text-on-background font-semibold">
              {{ getAppointmentTypeLabel(appointment.type || 'follow_up') }}
            </h4>
            <div class="text-highlighted flex h-8 items-center text-sm leading-none">
              <div class="flex items-center gap-1 font-medium sm:pr-2">
                <UIcon name="i-hugeicons-clock-01" />
                <p>{{ formatTimeString(appointment.startTime) }}</p>
              </div>
              •

              <div class="flex items-center gap-1 sm:px-2">
                <UIcon :name="getLocationIcon(appointment.location || 'clinic')" />
                <p>{{ getLocationLabel(appointment.location || 'clinic') }}</p>
              </div>
              •

              <template v-if="appointment.roomName">
                <div class="flex items-center gap-1 sm:px-2">
                  <UIcon name="i-hugeicons-door-01" />
                  <p>{{ appointment.roomName }}</p>
                </div>
                •
              </template>
              <div v-if="appointment.therapistId" class="flex items-center gap-1 sm:px-2">
                <UIcon name="i-hugeicons-user" />
                <p>{{ getTherapistName(appointment.therapistId) }}</p>
              </div>
            </div>

            <!-- Card: Partially Paid -->
            <div v-if="isPartial" class="mt-4 flex items-center space-x-4">
              <div class="w-48">
                <div
                  class="text-on-surface-variant mb-1 flex justify-between text-[10px] font-bold tracking-tighter uppercase"
                >
                  <span>Progression Paiement</span>
                  <span class="text-primary">60%</span>
                </div>
                <div class="bg-surface-container h-1.5 w-full overflow-hidden rounded-full">
                  <div class="bg-primary h-full rounded-full" style="width: 60%"></div>
                </div>
              </div>
              <div class="flex flex-col">
                <span class="text-on-surface-variant text-[10px] font-bold tracking-tighter uppercase">
                  Reste à payer
                </span>
                <span class="text-on-background text-sm font-bold">36,00 €</span>
              </div>
            </div>

            <!-- Card: Paid -->
            <div v-if="isPaid" class="mt-3 flex items-center space-x-3">
              <UButton
                v-for="(p, index) in appointment.paymentDetails"
                :key="index"
                :label="p.receiptNumber"
                trailingIcon="i-hugeicons-download-01"
                size="xs"
                color="neutral"
                variant="soft"
                class="rounded-full"
                @click="handleViewPaymentReceipt(p.id)"
              />
            </div>

            <!-- Card: Unpaid -->
            <p v-if="isUnpaid && overdueDays > 0" class="text-error mt-2 flex items-center text-xs font-medium">
              <AppIconBox name="i-hugeicons-calendar-04" color="error" class="mr-2" />
              Retard de {{ overdueDays }} jour{{ overdueDays > 1 ? 's' : '' }}
            </p>
          </div>
        </div>
        <div class="flex h-full flex-col items-end">
          <UBadge
            :color="statusConfig.color"
            size="sm"
            variant="soft"
            class="mb-2 self-end rounded-full px-4 font-bold tracking-widest uppercase"
          >
            {{ statusConfig.label }}
          </UBadge>

          <div class="font-headline text-on-background text-lg font-bold">
            {{ formatCurrency(appointment.priceCents) }}
          </div>

          <p
            v-if="isPaid && appointment.paymentDetails?.[0]"
            class="text-highlighted mt-2 text-[10px] font-medium tracking-tight uppercase"
          >
            Le {{ formatShortDate(appointment.paymentDetails[0].paidOn) }}
            {{ getPaymentMethodPreposition(appointment.paymentDetails[0].method) }}
            {{ getPaymentMethodLabel(appointment.paymentDetails[0].method) }}
          </p>

          <UButton
            v-else
            :label="isPartial ? 'Compléter le paiement' : 'Payer Maintenant'"
            :color="isPartial ? 'primary' : 'primary'"
            :variant="isPartial ? 'link' : 'solid'"
            :trailingIcon="isPartial && 'i-hugeicons-arrow-right-02'"
            size="sm"
            class="ring-muted mt-1 rounded-full hover:ring"
            @click="handleRecordPayment"
          />
        </div>
      </div>
    </div>
    <!-- <div
      class="bg-surface-container-lowest group rounded-xl border-l-4 border-emerald-500 p-6 shadow-[0px_4px_16px_rgba(11,28,48,0.02)] transition-all"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-4">
          <div class="bg-surface-container-low flex h-12 w-12 items-center justify-center rounded-lg text-emerald-600">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">check_circle</span>
          </div>
          <div>
            <h4 class="font-headline text-on-background text-lg font-bold">Évaluation Initiale Sportive</h4>
            <p class="text-on-surface-variant text-sm">18 Octobre 2023 • Pr. Elena Rodriguez</p>
            <div class="mt-3 flex items-center space-x-3">
              <span class="bg-surface-container text-on-surface-variant rounded-full px-3 py-1 text-xs">
                Facture #FA-2023-882
              </span>
              <span class="material-symbols-outlined text-outline text-sm">download</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span
            class="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase"
          >
            Payé
          </span>
          <div class="font-headline text-on-background text-2xl font-extrabold">125,00 €</div>
          <p class="text-on-surface-variant mt-2 text-[10px] font-medium tracking-tighter uppercase">
            Le 18 Oct. par Carte Bancaire
          </p>
        </div>
      </div>
    </div> -->
    <!-- Card: Unpaid -->
    <!-- <div
      class="bg-surface-container-lowest border-error group rounded-xl border-l-4 p-6 shadow-[0px_4px_16px_rgba(11,28,48,0.02)] transition-all hover:shadow-[0px_12px_32px_rgba(11,28,48,0.04)]"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-4">
          <div class="bg-error/10 text-error flex h-12 w-12 items-center justify-center rounded-lg">
            <span class="material-symbols-outlined">priority_high</span>
          </div>
          <div>
            <h4 class="font-headline text-on-background text-lg font-bold">Séance de Kinésithérapie #103</h4>
            <p class="text-on-surface-variant text-sm">12 Octobre 2023 • Pr. Sophie Martin</p>
            <p class="text-error mt-2 flex items-center text-xs font-medium">
              <span class="material-symbols-outlined mr-1 text-sm">schedule</span>
              Retard de 12 jours
            </p>
          </div>
        </div>
        <div class="text-right">
          <span
            class="bg-error/10 text-error mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase"
          >
            Non payé
          </span>
          <div class="font-headline text-on-background text-2xl font-extrabold">90,00 €</div>
          <button
            class="bg-on-background mt-4 rounded-lg px-6 py-2 text-xs font-bold text-white transition-transform active:scale-95"
          >
            Payer Maintenant
          </button>
        </div>
      </div>
    </div> -->
  </div>
  <!-- <div
    :class="[
      'group bg-default overflow-hidden rounded-lg transition-colors hover:shadow-sm',
      'hover:border-default border border-transparent'
    ]"
  >
    <div class="flex items-center gap-4 p-1 pr-4">
      <div class="flex flex-1 items-center gap-2">
        <div class="flex self-stretch">
          <AppDateBadge :date="appointment.date" variant="soft" color="primary" class="h-full rounded-r-none" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-row items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <UIcon :name="getLocationIcon(appointment.location || 'clinic')" />
              <p class="truncate text-sm font-semibold">
                {{ getAppointmentTypeLabel(appointment.type || 'follow_up') }}
              </p>
              <UBadge :color="statusConfig.color" size="sm" variant="solid" class="rounded-full font-semibold">
                {{ statusConfig.label }}
              </UBadge>
            </div>

            <div class="flex items-center gap-1.5">
              <template v-if="!isPartial">
                <div>
                  <span class="text-muted text-[10px]">Reste &nbsp;</span>
                  <span class="text-info text-sm font-semibold">
                    {{ formatCurrency(remainingCents) }}
                  </span>
                </div>
                <USeparator orientation="vertical" class="h-3" />
              </template> -->
  <!-- <span class="text-toned text-sm">
                {{ statusConfig.label }}
              </span>
              <USeparator orientation="vertical" class="h-3" />
              <span class="text-default text-sm font-bold">
                {{ formatCurrency(appointment.priceCents) }}
              </span>
            </div>
          </div>

          <div class="text-highlighted divide-muted flex h-8 items-center divide-x text-xs">
            <div class="flex items-center gap-1 font-medium sm:pr-2">
              <UIcon name="i-hugeicons-clock-01" />
              <p>{{ formatTimeString(appointment.startTime) }}</p>
            </div>
            <div v-if="appointment.roomName" class="flex items-center gap-1 sm:px-2">
              <UIcon name="i-hugeicons-door-01" />
              <p>{{ appointment.roomName }}</p>
            </div>
            <div v-if="appointment.therapistId" class="flex items-center gap-1 sm:px-2">
              <UIcon name="i-hugeicons-user" />
              <p>{{ getTherapistName(appointment.therapistId) }}</p>
            </div>
            <UButton
              v-if="needsPayment"
              :label="actionLabel"
              size="xs"
              color="neutral"
              variant="subtle"
              class="ml-auto"
              @click="handleRecordPayment"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
        <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" size="sm" square />
      </UDropdownMenu>
    </div>
    </div>

    <UCollapsible v-if="!hasPayments" v-model:open="isExpanded" :unmount-on-hide="false">
      <UButton
        type="button"
        size="sm"
        color="neutral"
        variant="ghost"
        class="w-full rounded-none"
        leadingIcon="i-lucide-chevron-right"
        :ui="{
          leadingIcon: `${isExpanded ? 'rotate-90' : ''} transition-transform duration-200`
        }"
      >
        Détail paiement{{ paymentDetails.length > 1 ? 's' : '' }} ({{ paymentDetails.length }})
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
  </div> -->
</template>
