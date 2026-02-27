// =================================================================================================
// Appointment Locations Constants
// =================================================================================================

import type { Location } from '../types/base.types'

// Valid location types for appointments
export const LOCATIONS = ['clinic', 'home', 'telehealth'] as const

export const LOCATIONS_CONFIG = {
  clinic: { label: 'Cabinet', icon: 'i-hugeicons-hospital-01', color: 'success', variant: 'subtle' },
  home: { label: 'Domicile', icon: 'i-hugeicons-home-03', color: 'warning', variant: 'subtle' },
  telehealth: { label: 'Téléconsultation', icon: 'i-hugeicons-video-02', color: 'info', variant: 'subtle' }
} as const

// Appointment Location Options
export const LOCATION_OPTIONS = Object.entries(LOCATIONS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  icon: item.icon
})) as { label: string; value: Location; icon: string }[]

// Location Helpers
export const getLocationLabel = (location: Location) => LOCATIONS_CONFIG[location]?.label || location
export const getLocationIcon = (location: Location) => LOCATIONS_CONFIG[location]?.icon || 'i-hugeicons-location-01'
export const getLocationColor = (location: Location) => LOCATIONS_CONFIG[location]?.color || 'neutral'
export const getLocationVariant = (location: Location) => LOCATIONS_CONFIG[location]?.variant || 'soft'

//---------------------------------  Organization ------------------------------------

export const ORGANIZATION_STATUS = ['active', 'inactive', 'suspended'] as const

export const ORGANIZATION_TYPES = ['cabinet', 'medical-center', 'clinic', 'rehabilitation-center'] as const

export const ORGANIZATION_TYPES_CONFIG = {
  cabinet: { label: 'Cabinet', icon: 'i-hugeicons-hospital-01', color: 'success', variant: 'subtle' },
  'medical-center': { label: 'Centre médical', icon: 'i-hugeicons-hospital-02', color: 'info', variant: 'subtle' },
  clinic: { label: 'Clinique', icon: 'i-hugeicons-building-07', color: 'primary', variant: 'subtle' },
  'rehabilitation-center': {
    label: 'Centre de rééducation',
    icon: 'i-hugeicons-person-standing-01',
    color: 'warning',
    variant: 'subtle'
  }
} as const

export const ORGANIZATION_TYPE_OPTIONS = Object.entries(ORGANIZATION_TYPES_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

export const LEGAL_FORMS = ['liberal-profession', 'civil-company', 'commercial-company', 'other'] as const

export const LEGAL_FORMS_CONFIG = {
  'liberal-profession': {
    label: 'Profession libérale',
    icon: 'i-hugeicons-user-01',
    color: 'success',
    variant: 'subtle'
  },
  'civil-company': { label: 'Société civile', icon: 'i-hugeicons-users-01', color: 'info', variant: 'subtle' },
  'commercial-company': {
    label: 'Société commerciale',
    icon: 'i-hugeicons-building-04',
    color: 'primary',
    variant: 'subtle'
  },
  other: { label: 'Autre', icon: 'i-hugeicons-more-horizontal', color: 'neutral', variant: 'subtle' }
} as const

export const LEGAL_FORM_OPTIONS = Object.entries(LEGAL_FORMS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

export const PAYMENT_METHODS = ['wire-transfer', 'check', 'cash', 'bank-card'] as const

export const PAYMENT_METHODS_CONFIG = {
  cash: { label: 'Espèces', icon: 'i-hugeicons-money-01', color: 'success', variant: 'subtle' },
  'bank-card': { label: 'Carte bancaire', icon: 'i-hugeicons-credit-card', color: 'primary', variant: 'subtle' },
  check: { label: 'Chèque', icon: 'i-hugeicons-check-01', color: 'info', variant: 'subtle' },
  'wire-transfer': { label: 'Virement', icon: 'i-hugeicons-bank-01', color: 'warning', variant: 'subtle' }
} as const

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHODS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

export const PAYMENT_DELAYS = ['immediate', '7', '15', '30', 'end-of-month'] as const

export const PAYMENT_DELAYS_CONFIG = {
  immediate: { label: 'Immédiat', icon: 'i-hugeicons-time-01', color: 'success', variant: 'subtle' },
  '7': { label: '7 jours', icon: 'i-hugeicons-calendar-01', color: 'info', variant: 'subtle' },
  '15': { label: '15 jours', icon: 'i-hugeicons-calendar-02', color: 'primary', variant: 'subtle' },
  '30': { label: '30 jours', icon: 'i-hugeicons-calendar-03', color: 'warning', variant: 'subtle' },
  'end-of-month': { label: 'Fin de mois', icon: 'i-hugeicons-calendar-04', color: 'error', variant: 'subtle' }
} as const

export const PAYMENT_DELAY_OPTIONS = Object.entries(PAYMENT_DELAYS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

export const getOrganizationTypeLabel = (type: string) =>
  ORGANIZATION_TYPES_CONFIG[type as keyof typeof ORGANIZATION_TYPES_CONFIG]?.label || type
export const getOrganizationTypeIcon = (type: string) =>
  ORGANIZATION_TYPES_CONFIG[type as keyof typeof ORGANIZATION_TYPES_CONFIG]?.icon || 'i-hugeicons-hospital-01'
export const getOrganizationTypeColor = (type: string) =>
  ORGANIZATION_TYPES_CONFIG[type as keyof typeof ORGANIZATION_TYPES_CONFIG]?.color || 'neutral'
export const getOrganizationTypeVariant = (type: string) =>
  ORGANIZATION_TYPES_CONFIG[type as keyof typeof ORGANIZATION_TYPES_CONFIG]?.variant || 'soft'

export const getLegalFormLabel = (form: string) =>
  LEGAL_FORMS_CONFIG[form as keyof typeof LEGAL_FORMS_CONFIG]?.label || form
export const getLegalFormIcon = (form: string) =>
  LEGAL_FORMS_CONFIG[form as keyof typeof LEGAL_FORMS_CONFIG]?.icon || 'i-hugeicons-file-01'
export const getLegalFormColor = (form: string) =>
  LEGAL_FORMS_CONFIG[form as keyof typeof LEGAL_FORMS_CONFIG]?.color || 'neutral'
export const getLegalFormVariant = (form: string) =>
  LEGAL_FORMS_CONFIG[form as keyof typeof LEGAL_FORMS_CONFIG]?.variant || 'soft'

export const getPaymentMethodLabel = (method: string) =>
  PAYMENT_METHODS_CONFIG[method as keyof typeof PAYMENT_METHODS_CONFIG]?.label || method
export const getPaymentMethodIcon = (method: string) =>
  PAYMENT_METHODS_CONFIG[method as keyof typeof PAYMENT_METHODS_CONFIG]?.icon || 'i-hugeicons-money-01'
export const getPaymentMethodColor = (method: string) =>
  PAYMENT_METHODS_CONFIG[method as keyof typeof PAYMENT_METHODS_CONFIG]?.color || 'neutral'
export const getPaymentMethodVariant = (method: string) =>
  PAYMENT_METHODS_CONFIG[method as keyof typeof PAYMENT_METHODS_CONFIG]?.variant || 'soft'

export const getPaymentDelayLabel = (delay: string) =>
  PAYMENT_DELAYS_CONFIG[delay as keyof typeof PAYMENT_DELAYS_CONFIG]?.label || delay
export const getPaymentDelayIcon = (delay: string) =>
  PAYMENT_DELAYS_CONFIG[delay as keyof typeof PAYMENT_DELAYS_CONFIG]?.icon || 'i-hugeicons-time-01'
export const getPaymentDelayColor = (delay: string) =>
  PAYMENT_DELAYS_CONFIG[delay as keyof typeof PAYMENT_DELAYS_CONFIG]?.color || 'neutral'
export const getPaymentDelayVariant = (delay: string) =>
  PAYMENT_DELAYS_CONFIG[delay as keyof typeof PAYMENT_DELAYS_CONFIG]?.variant || 'soft'
