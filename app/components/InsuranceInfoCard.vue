<script setup lang="ts">
  import { LazyInsuranceCompanySelect } from '#components'

  interface Props {
    appointment: Appointment
    insuranceCompany?: {
      id: string
      name: string
      code: string
      status: ConventionStatus
      coveragePercentage: number
      sessionPriceCents: number
      coPayRule: 'fixed' | 'percentage'
      coPayAmountCents: number | null
      coPayPercentage: number | null
    } | null
  }

  const props = defineProps<Props>()

  const hasInsurance = computed(() => !!props.insuranceCompany && !!props.appointment.insuranceCompanyId)

  const expectedCoPay = computed(() =>
    props.appointment.expectedCoPayCents ? props.appointment.expectedCoPayCents / 100 : null
  )
  const expectedInsurance = computed(() =>
    props.appointment.expectedInsuranceCents ? props.appointment.expectedInsuranceCents / 100 : null
  )
  const coPayPaid = computed(() => (props.appointment.coPayPaidCents ? props.appointment.coPayPaidCents / 100 : 0))
  const insurancePaid = computed(() =>
    props.appointment.insurancePaidCents ? props.appointment.insurancePaidCents / 100 : 0
  )

  const coPayRemaining = computed(() => {
    if (!expectedCoPay.value) return null
    return Math.max(0, expectedCoPay.value - coPayPaid.value)
  })

  const insuranceRemaining = computed(() => {
    if (!expectedInsurance.value) return null
    return Math.max(0, expectedInsurance.value - insurancePaid.value)
  })

  const coPayStatus = computed(() => {
    if (!expectedCoPay.value) return 'none'
    if (coPayPaid.value >= expectedCoPay.value) return 'paid'
    if (coPayPaid.value > 0) return 'partial'
    return 'unpaid'
  })

  const insuranceStatus = computed(() => {
    if (!expectedInsurance.value) return 'none'
    if (insurancePaid.value >= expectedInsurance.value) return 'paid'
    if (insurancePaid.value > 0) return 'partial'
    return 'unpaid'
  })

  const statusColors = {
    paid: 'text-green-600 bg-green-50',
    partial: 'text-amber-600 bg-amber-50',
    unpaid: 'text-gray-500 bg-gray-50',
    none: 'text-gray-400'
  } as const
</script>

<template>
  <UCard
    v-if="hasInsurance"
    :ui="{
      root: 'divide-default',
      header: 'bg-primary/5',
      footer: 'bg-muted'
    }"
  >
    <template #header>
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <AppIconBox
            name="i-hugeicons-shield-01"
            size="xl"
            color="success"
            variant="subtle"
            :ui="{ base: 'rounded-xl p-2' }"
          />
          <div>
            <h2 class="text-sm font-black tracking-tight uppercase">Assurance</h2>
            <p v-if="insuranceCompany" class="text-muted text-[11px] font-semibold">
              {{ insuranceCompany.name }} — Couverture {{ insuranceCompany.coveragePercentage }}%
            </p>
          </div>
        </div>

        <div v-if="insuranceCompany" class="flex flex-col items-end">
          <UBadge
            size="md"
            :color="
              insuranceCompany.status === 'active'
                ? 'success'
                : insuranceCompany.status === 'suspended'
                  ? 'warning'
                  : 'error'
            "
            variant="subtle"
            class="rounded-full uppercase"
          >
            <UChip standalone inset />
            {{ insuranceCompany.status }}
          </UBadge>
        </div>
      </header>
    </template>

    <div class="grid grid-cols-1 gap-3">
      <div class="border-default rounded-lg border p-3">
        <p class="text-toned mb-1 text-xs font-medium">Co-paiement patient</p>
        <div class="flex items-baseline gap-1">
          <span class="text-lg font-bold" :class="statusColors[coPayStatus]">
            {{ coPayPaid.toFixed(2) }}
          </span>
          <span class="text-xs">/ {{ expectedCoPay ? `${expectedCoPay.toFixed(2)} DH` : '—' }}</span>
        </div>
        <div v-if="coPayStatus !== 'none'">
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="{
                'bg-green-500': coPayStatus === 'paid',
                'bg-amber-400': coPayStatus === 'partial',
                'bg-gray-200': coPayStatus === 'unpaid'
              }"
              :style="{ width: expectedCoPay ? `${Math.min(100, (coPayPaid / expectedCoPay) * 100)}%` : '0%' }"
            />
          </div>
          <p v-if="coPayRemaining && coPayRemaining > 0" class="text-highlighted mt-1 text-xs">
            Reste: {{ coPayRemaining.toFixed(2) }} DH
          </p>
        </div>
      </div>

      <div class="border-default rounded-lg border p-3">
        <p class="text-toned mb-1 text-xs font-medium">Paiement assurance</p>
        <div class="flex items-baseline gap-1">
          <span class="text-lg font-bold" :class="statusColors[insuranceStatus]">
            {{ insurancePaid.toFixed(2) }}
          </span>
          <span class="text-xs">/ {{ expectedInsurance ? `${expectedInsurance.toFixed(2)} DH` : '—' }}</span>
        </div>
        <div v-if="insuranceStatus !== 'none'">
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="{
                'bg-green-500': insuranceStatus === 'paid',
                'bg-amber-400': insuranceStatus === 'partial',
                'bg-gray-200': insuranceStatus === 'unpaid'
              }"
              :style="{
                width: expectedInsurance ? `${Math.min(100, (insurancePaid / expectedInsurance) * 100)}%` : '0%'
              }"
            />
          </div>
          <p v-if="insuranceRemaining && insuranceRemaining > 0" class="text-highlighted mt-1 text-xs">
            Reste: {{ insuranceRemaining.toFixed(2) }} DH
          </p>
        </div>
      </div>
      <div class="bg-accented flex items-center justify-between rounded-lg px-3 py-2 text-sm">
        <span class="">Total séance</span>
        <span class="font-bold">{{ (insuranceCompany?.sessionPriceCents ?? 0) / 100 }} DH</span>
      </div>
    </div>
  </UCard>
</template>
