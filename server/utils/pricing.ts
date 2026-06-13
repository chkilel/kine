import type { Appointment } from '~~/shared/types/appointment.type'
import type { Organization } from '~~/shared/types/org.types'
import type { TreatmentPlan } from '~~/shared/types/treatment-plan'

export interface CalculateInheritedPriceParams {
  appointment: Appointment
  treatmentPlan: TreatmentPlan | null
  organization: Organization
}

export function getDefaultPriceItem(organization: Organization) {
  return (
    organization.pricing?.priceItems?.find((item) => item.isDefault) ||
    organization.pricing?.priceItems?.[0] ||
    null
  )
}

export function calculateInheritedPrice(params: CalculateInheritedPriceParams): number | null {
  const { appointment, treatmentPlan, organization } = params

  const location = appointment.location

  if (treatmentPlan?.pricing && treatmentPlan.pricing[location]) {
    return treatmentPlan.pricing[location]
  }

  const defaultItem = getDefaultPriceItem(organization)
  if (!defaultItem?.rateCent) return null

  return defaultItem.rateCent[location] || null
}
