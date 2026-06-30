import { v7 as uuidv7 } from 'uuid'
import { APPOINTMENT_TYPES } from '../types/base.types'

// =============================================================================
// Appointment Duration Constants
// =============================================================================

export const APPOINTMENT_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120] as const
export const APPOINTMENT_GAP = [0, 5, 10, 15, 20, 30] as const

//FIXME this is not necessary: Minimum Gap Between Appointments in Minutes
export const MINIMUM_APPOINTMENT_GAP_MINUTES = 15

export const APPOINTMENT_SLOT_INCREMENT = [5, 10, 15, 20, 30, 60] as const

// =============================================================================
// Appointment Status Configuration
// =============================================================================

export const APPOINTMENT_STATUS_CONFIG = {
  scheduled: { color: 'info', label: 'À venir', icon: 'i-hugeicons-clock-02', description: 'Rendez-vous planifié' },
  confirmed: {
    color: 'success',
    label: 'Confirmée',
    icon: 'i-hugeicons-calendar-check-in-01',
    description: 'Rendez-vous confirmé par le patient'
  },
  in_progress: {
    color: 'warning',
    label: 'En cours',
    icon: 'i-hugeicons-hourglass',
    description: 'Séance en cours de traitement'
  },
  finished: {
    color: 'success',
    label: 'Terminée',
    icon: 'i-hugeicons-checkmark-circle-02',
    description: 'Séance terminée cliniquement (le paiement peut être en cours)'
  },
  cancelled: { color: 'error', label: 'Annulée', icon: 'i-hugeicons-cancel-01', description: 'Rendez-vous annulé' },
  no_show: { color: 'error', label: 'Absence', icon: 'i-hugeicons-user-remove-01', description: 'Patient absent' }
} as const

export const APPOINTMENT_STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color,
  icon: item.icon
}))

export const getAppointmentStatusLabel = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status].label
export const getAppointmentStatusColor = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status].color
export const getAppointmentStatusIcon = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status].icon
export const getAppointmentStatusConfig = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status]

// =============================================================================
// Appointment Types — Seed, Options, Resolution
// =============================================================================

export function DEFAULT_APPOINTMENT_TYPES_SEED(): OrgAppointmentTypeItem[] {
  return APPOINTMENT_TYPES.map((item) => ({
    id: uuidv7(),
    code: item.code,
    title: item.title,
    isDefault: true
  }))
}

export const APPOINTMENT_TYPES_OPTIONS = APPOINTMENT_TYPES.map((item) => ({
  label: item.title,
  value: item.code
}))

export function getAppointmentTypeTitle(code: string | null, orgTypes?: OrgAppointmentTypeItem[]): string {
  if (!code) return 'Suivi'

  if (orgTypes) {
    const found = orgTypes.find((t) => t.code === code)
    if (found) return found.title
  }

  const defaultType = APPOINTMENT_TYPES.find((t) => t.code.toUpperCase() === code.toUpperCase())
  if (defaultType) return defaultType.title

  return code
}
