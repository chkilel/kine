export interface CalculateInheritedPriceParams {
  appointment: Appointment
  treatmentPlan: TreatmentPlan | null
  organization: Organization
}

export interface ResolveAppointmentPriceResult {
  priceCents: number
  priceItem: PriceItemSnapshot | null
}

export function getDefaultPriceItem(organization: Organization) {
  return (
    organization.pricing?.priceItems?.find((item) => item.isDefault) || organization.pricing?.priceItems?.[0] || null
  )
}

export function resolveAppointmentPrice(params: CalculateInheritedPriceParams): ResolveAppointmentPriceResult {
  const { appointment, treatmentPlan, organization } = params
  const location = appointment.location

  if (treatmentPlan?.priceItem) {
    return {
      priceCents: treatmentPlan.priceItem.rateCent[location] ?? 0,
      priceItem: treatmentPlan.priceItem
    }
  }

  const defaultItem = getDefaultPriceItem(organization)
  if (!defaultItem) {
    return { priceCents: 0, priceItem: null }
  }

  const snapshot: PriceItemSnapshot = {
    code: defaultItem.code,
    description: defaultItem.description,
    rateCent: defaultItem.rateCent
  }

  return {
    priceCents: defaultItem.rateCent[location] ?? 0,
    priceItem: snapshot
  }
}

export function toPriceItemSnapshot(item: PriceItem): PriceItemSnapshot {
  return {
    code: item.code,
    description: item.description,
    rateCent: item.rateCent
  }
}
