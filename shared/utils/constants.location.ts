// =================================================================================================
// Consultation Locations Constants
// =================================================================================================

import type { ConsultationLocation } from "../types/base.types";

// Valid location types for consultations
export const VALID_CONSULTATION_LOCATIONS = ['clinic', 'home', 'telehealth'] as const

export const CONSULTATION_LOCATIONS_CONFIG = {
  clinic: { label: 'Cabinet', icon: 'i-lucide-building', color: 'success', variant: 'subtle' },
  home: { label: 'Domicile', icon: 'i-lucide-home', color: 'warning', variant: 'subtle' },
  telehealth: { label: 'Téléconsultation', icon: 'i-lucide-video', color: 'info', variant: 'subtle' }
} as const

// Consultation Location Options
export const CONSULTATION_LOCATION_OPTIONS = Object.entries(CONSULTATION_LOCATIONS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  icon: item.icon
})) as { label: string; value: ConsultationLocation; icon: string }[]

// Location Helpers
export const getLocationLabel = (location: ConsultationLocation) =>
  CONSULTATION_LOCATIONS_CONFIG[location]?.label || location
export const getLocationIcon = (location: ConsultationLocation) =>
  CONSULTATION_LOCATIONS_CONFIG[location]?.icon || 'i-lucide-map-pin'
export const getLocationColor = (location: ConsultationLocation) =>
  CONSULTATION_LOCATIONS_CONFIG[location]?.color || 'neutral'
export const getLocationVariant = (location: ConsultationLocation) =>
  CONSULTATION_LOCATIONS_CONFIG[location]?.variant || 'soft'
