import { getLabel, type ColorVariant, type SelectOption } from "."

// Exception Type Configuration with Icons (Single Source of Truth)
export const EXCEPTION_TYPE_CONFIG_WITH_ICONS = [
  { value: 'vacation', label: 'Congé', icon: 'i-lucide-luggage' },
  { value: 'holiday', label: 'Jour férié', icon: 'i-lucide-home' },
  { value: 'sick', label: 'Maladie', icon: 'i-lucide-heart-pulse' },
  { value: 'training', label: 'Formation', icon: 'i-lucide-graduation-cap' },
  { value: 'meeting', label: 'Réunion', icon: 'i-lucide-users' },
  { value: 'personal', label: 'Personnel', icon: 'i-lucide-user' },
  { value: 'reduced_hours', label: 'Réduction horaire', icon: 'i-lucide-clock' },
  { value: 'other', label: 'Autre', icon: 'i-lucide-more-horizontal' }
] as const satisfies SelectOption[]

// Exception Type Configuration (Derived from with-icons version)
export const EXCEPTION_TYPE_CONFIG = {
  vacation: { value: 'vacation', label: 'Congé', color: 'warning', variant: 'subtle' },
  holiday: { value: 'holiday', label: 'Jour férié', color: 'warning', variant: 'subtle' },
  sick: { value: 'sick', label: 'Maladie', color: 'error', variant: 'subtle' },
  training: { value: 'training', label: 'Formation', color: 'info', variant: 'subtle' },
  meeting: { value: 'meeting', label: 'Réunion', color: 'info', variant: 'subtle' },
  personal: { value: 'personal', label: 'Personnel', color: 'error', variant: 'subtle' },
  reduced_hours: { value: 'reduced_hours', label: 'Réduction horaire', color: 'info', variant: 'subtle' },
  other: { value: 'other', label: 'Autre', color: 'neutral', variant: 'subtle' }
} as const

// Exception Type Options (With Icons)
export const EXCEPTION_TYPE_OPTIONS = EXCEPTION_TYPE_CONFIG_WITH_ICONS as SelectOption[]

// Exception Type
export type ExceptionTypeValue = (typeof EXCEPTION_TYPE_CONFIG)[keyof typeof EXCEPTION_TYPE_CONFIG]['value']

// Exception Type Color Helpers
export const getExceptionTypeColor = (
  type: string
): { color: ColorVariant; variant: 'solid' | 'outline' | 'soft' | 'subtle' } => {
  const config = EXCEPTION_TYPE_CONFIG[type as keyof typeof EXCEPTION_TYPE_CONFIG]
  return config ? { color: config.color, variant: config.variant } : { color: 'neutral', variant: 'subtle' }
}

// Color Only Helper
export const getExceptionTypeColorOnly = (type: string): ColorVariant => getExceptionTypeColor(type).color

// Variant Helper
export const getExceptionTypeVariant = (type: string): 'solid' | 'outline' | 'soft' | 'subtle' =>
  getExceptionTypeColor(type).variant

// Exception Type Label Helper
export const getExceptionTypeLabel = (type: string): string => getLabel(type as any, EXCEPTION_TYPE_CONFIG)

// Exception Type Icon Helper (from with-icons config)
export const getExceptionTypeIcon = (type: string): string => {
  const config = EXCEPTION_TYPE_CONFIG_WITH_ICONS.find((item) => item.value === type)
  return config?.icon || 'i-lucide-circle'
}