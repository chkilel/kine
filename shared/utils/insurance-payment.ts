export interface InsurancePaymentSummary {
  expectedCoPayCents: number | null
  expectedInsuranceCents: number | null
  coPayPaidCents: number
  insurancePaidCents: number
  coPayRemainingCents: number | null
  insuranceRemainingCents: number | null
  isFullyPaid: boolean
  isPartiallyPaid: boolean
  isNotPaid: boolean
}

export function calculateInsurancePaymentSummary(
  expectedCoPayCents: number | null,
  expectedInsuranceCents: number | null,
  coPayPaidCents: number,
  insurancePaidCents: number
): InsurancePaymentSummary {
  const coPayRemainingCents = expectedCoPayCents !== null ? Math.max(0, expectedCoPayCents - coPayPaidCents) : null
  const insuranceRemainingCents =
    expectedInsuranceCents !== null ? Math.max(0, expectedInsuranceCents - insurancePaidCents) : null

  const isFullyPaid =
    expectedCoPayCents !== null && expectedInsuranceCents !== null
      ? coPayPaidCents >= expectedCoPayCents && insurancePaidCents >= expectedInsuranceCents
      : false

  const isPartiallyPaid =
    expectedCoPayCents !== null && expectedInsuranceCents !== null
      ? (coPayPaidCents > 0 && coPayPaidCents < expectedCoPayCents) ||
        (insurancePaidCents > 0 && insurancePaidCents < expectedInsuranceCents)
      : false

  const isNotPaid =
    expectedCoPayCents !== null && expectedInsuranceCents !== null
      ? coPayPaidCents === 0 && insurancePaidCents === 0
      : false

  return {
    expectedCoPayCents,
    expectedInsuranceCents,
    coPayPaidCents,
    insurancePaidCents,
    coPayRemainingCents,
    insuranceRemainingCents,
    isFullyPaid,
    isPartiallyPaid,
    isNotPaid
  }
}
