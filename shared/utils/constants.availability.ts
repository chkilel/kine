import type { SelectItem } from '@nuxt/ui'

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

// Availability Exception Type Options
export const EXCEPTION_TYPE_OPTIONS = Object.entries(AVAILABILITY_EXCEPTION_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  icon: item.icon
})) as SelectItem[]

// Exception Type Values
export type ExceptionTypeValue = keyof typeof AVAILABILITY_EXCEPTION_CONFIG

// Availability Exception Type Helpers
export const getExceptionTypeColor = (type: ExceptionTypeValue) => AVAILABILITY_EXCEPTION_CONFIG[type].color
export const getExceptionTypeLabel = (type: ExceptionTypeValue) => AVAILABILITY_EXCEPTION_CONFIG[type].label
export const getExceptionTypeIcon = (type: ExceptionTypeValue) => AVAILABILITY_EXCEPTION_CONFIG[type].icon
