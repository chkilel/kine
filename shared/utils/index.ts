import type { Patient, TreatmentPlanWithProgress } from '../types/patient.types'

// Slugify a string
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Get full name
export function formatFullName(patient: Pick<Patient, 'firstName' | 'lastName'>) {
  return `${patient.firstName} ${patient.lastName}`
}

// Get therapist name
export const getTherapistName = (therapist?: TreatmentPlanWithProgress['therapist'] | null) => {
  if (!therapist) return 'Non assigné'
  return `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || therapist.email || 'Non assigné'
}

// =========================================== TODO ===========================================
// Types and generic helpers for status and select options
// =============================================================================================
export type ColorVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'primary' | 'secondary'

export interface StatusConfig {
  label: string
  color: ColorVariant
}

export interface SelectOption<T = string> {
  label: string
  value: T
  icon?: string
}


// Generic helper to create select options from a config object
export const createSelectOptions = <T extends string>(config: Record<T, string | StatusConfig>): SelectOption<T>[] => {
  return Object.entries(config).map(([value, labelOrConfig]) => ({
    label: typeof labelOrConfig === 'string' ? labelOrConfig : (labelOrConfig as StatusConfig).label,
    value: value as T
  }))
}

// Generic helper to get label from config
export const getLabel = <T extends string>(value: T, config: Record<T, string | StatusConfig>, fallback?: string): string => {
  const item = config[value]
  if (!item) return fallback || value
  return typeof item === 'string' ? item : item.label
}

// Generic helper to get color from config
export const getColor = <T extends string>(
  value: T,
  config: Record<T, StatusConfig>,
  fallback: ColorVariant = 'neutral'
): ColorVariant => {
  return config[value]?.color || fallback
}

// Generic helper to get status config
export const getStatusConfig = <T extends string>(
  value: T,
  config: Record<T, StatusConfig>,
  fallback: StatusConfig = { label: '', color: 'neutral' }
): StatusConfig => {
  return config[value] || { ...fallback, label: fallback.label || value }
}
