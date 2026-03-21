import type { Appointment } from '~~/shared/types/appointment.type'
import type { Organization } from '~~/shared/types/org.types'
import type { TreatmentPlan } from '~~/shared/types/treatment-plan'

export interface CalculateInheritedPriceParams {
  appointment: Appointment
  treatmentPlan: TreatmentPlan | null
  organization: Organization
}

export function calculateInheritedPrice(params: CalculateInheritedPriceParams): number | null {
  const { appointment, treatmentPlan, organization } = params

  if (!organization.pricing?.rateCent) {
    return null
  }

  const location = appointment.location

  if (treatmentPlan?.pricing && treatmentPlan.pricing[location]) {
    return treatmentPlan.pricing[location]
  }

  return organization.pricing.rateCent[location] || null
}
