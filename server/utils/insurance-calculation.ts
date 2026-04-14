import type { InsuranceCompany } from '~~/shared/types/insurance-company'

export interface InsuranceCalculationResult {
  coPayCents: number
  insuranceCents: number
  totalCents: number
}

export function calculateInsuranceCoverage(
  insuranceCompany: Pick<
    InsuranceCompany,
    'id' | 'sessionPriceCents' | 'coPayRule' | 'coPayAmountCents' | 'coPayPercentage'
  >
): InsuranceCalculationResult {
  const { sessionPriceCents, coPayRule, coPayAmountCents, coPayPercentage } = insuranceCompany

  let coPayCents: number
  let insuranceCents: number

  if (coPayRule === 'fixed') {
    coPayCents = coPayAmountCents ?? 0
    insuranceCents = sessionPriceCents - coPayCents
  } else {
    coPayCents = Math.round(sessionPriceCents * ((coPayPercentage ?? 0) / 100))
    insuranceCents = sessionPriceCents - coPayCents
  }

  return {
    coPayCents,
    insuranceCents,
    totalCents: sessionPriceCents
  }
}
