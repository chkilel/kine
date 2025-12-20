import type { SelectItem } from '@nuxt/ui'
import type { AvailabilityExceptionReason } from '../types/availability.types'

// =================================================================================================
// Availability Exception Types Constants
// =================================================================================================
export const AVAILABILITY_EXCEPTION_CONFIG = {
  vacation: { label: 'Congé', color: 'warning', icon: 'i-lucide-luggage' },
  holiday: { label: 'Jour férié', color: 'warning', icon: 'i-lucide-home' },
  sick: { label: 'Maladie', color: 'error', icon: 'i-lucide-heart-pulse' },
  training: { label: 'Formation', color: 'info', icon: 'i-lucide-graduation-cap' },
  meeting: { label: 'Réunion', color: 'info', icon: 'i-lucide-users' },
  personal: { label: 'Personnel', color: 'error', icon: 'i-lucide-user' },
  reduced_hours: {
    value: 'reduced_hours',
    label: 'Réduction horaire',
    color: 'info',
    variant: 'subtle',
    icon: 'i-lucide-clock'
  },
  other: { value: 'other', label: 'Autre', color: 'neutral', variant: 'subtle', icon: 'i-lucide-more-horizontal' }
} as const

const typedEntries = <T extends Record<string, any>>(obj: T) =>
  Object.entries(obj) as {
    [K in keyof T]: [K, T[K]]
  }[keyof T][]

// Availability Exception Type Options
export const EXCEPTION_TYPE_OPTIONS = typedEntries(AVAILABILITY_EXCEPTION_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  icon: item.icon
}))

// Availability Exception Type Helpers
export const getExceptionTypeColor = (type: AvailabilityExceptionReason) => AVAILABILITY_EXCEPTION_CONFIG[type].color
export const getExceptionTypeLabel = (type: AvailabilityExceptionReason) => AVAILABILITY_EXCEPTION_CONFIG[type].label
export const getExceptionTypeIcon = (type: AvailabilityExceptionReason) => AVAILABILITY_EXCEPTION_CONFIG[type].icon
