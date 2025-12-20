import type { ConsultationLocation } from '../types/patient.types'
import { createSelectOptions, getLabel, type ColorVariant, type SelectOption } from '.'

// Consultation Locations with Icons Configuration
export const CONSULTATION_LOCATIONS_WITH_ICONS = [
  { value: 'clinic', label: 'Cabinet', icon: 'i-lucide-building' },
  { value: 'home', label: 'Domicile', icon: 'i-lucide-home' },
  { value: 'telehealth', label: 'Téléconsultation', icon: 'i-lucide-video' }
] as const satisfies SelectOption<ConsultationLocation>[]

// Generate CONSULTATION_LOCATIONS_CONFIG from CONSULTATION_LOCATIONS_WITH_ICONS
export const CONSULTATION_LOCATIONS_CONFIG: Record<ConsultationLocation, string> =
  CONSULTATION_LOCATIONS_WITH_ICONS.reduce(
    (acc, loc) => ({ ...acc, [loc.value]: loc.label }),
    {} as Record<ConsultationLocation, string>
  )

// Consultation Location Helpers
export const CONSULTATION_LOCATION_OPTIONS = createSelectOptions(CONSULTATION_LOCATIONS_CONFIG)
export const getLocationLabel = (location: ConsultationLocation): string =>
  getLabel(location, CONSULTATION_LOCATIONS_CONFIG)
export const getLocationIcon = (location: ConsultationLocation): string => {
  const config = CONSULTATION_LOCATIONS_WITH_ICONS.find((item) => item.value === location)
  return config?.icon || 'i-lucide-map-pin'
}

// Location Color Mapping for UI Badges
export const LOCATION_COLOR_MAPPING: Record<
  ConsultationLocation,
  { color: ColorVariant; variant: 'solid' | 'outline' | 'soft' | 'subtle' }
> = {
  clinic: { color: 'success', variant: 'subtle' },
  home: { color: 'warning', variant: 'subtle' },
  telehealth: { color: 'info', variant: 'subtle' }
}

// Location Color Helper
export const getLocationColor = (location: ConsultationLocation): ColorVariant =>
  LOCATION_COLOR_MAPPING[location]?.color || 'neutral'

// Location Variant Helper
export const getLocationVariant = (location: ConsultationLocation): 'solid' | 'outline' | 'soft' | 'subtle' =>
  LOCATION_COLOR_MAPPING[location]?.variant || 'soft'
