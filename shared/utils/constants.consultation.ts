// =================================================================================================
// Consultation Duration and Status Constants
// =================================================================================================

import type { ConsultationStatus, ConsultationType } from '../types/base.types'

// Consultation Duration Options
export const CONSULTATION_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120]

// Consultation Gap Options (minutes between sessions)
export const CONSULTATION_GAP_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60] as const

// Consultation Slot Increment Options (minutes between possible slot start times)
export const CONSULTATION_SLOT_INCREMENT_OPTIONS = [5, 10, 15, 20, 30] as const

//FIXME this is not necessary: Minimum Gap Between Consultations in Minutes
export const MINIMUM_CONSULTATION_GAP_MINUTES = 15

// Valid consultation types for patient sessions
export const VALID_CONSULTATION_TYPES = [
  'initial',
  'follow_up',
  'evaluation',
  'discharge',
  'mobilization',
  'reinforcement',
  'reeducation'
] as const

// Valid status values for appointments
export const VALID_CONSULTATION_STATUSES = [
  'confirmed',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
] as const

// Consultation Status Configuration
export const SESSION_STATUS_CONFIG = {
  confirmed: { color: 'success', label: 'Confirmée', icon: 'i-hugeicons-calendar-check-in-01' },
  scheduled: { color: 'info', label: 'À venir', icon: 'i-hugeicons-clock-02' },
  completed: { color: 'success', label: 'Terminée', icon: 'i-hugeicons-checkmark-circle-02' },
  cancelled: { color: 'error', label: 'Annulée', icon: 'i-hugeicons-cancel-01' },
  in_progress: { color: 'warning', label: 'En cours', icon: 'i-hugeicons-hourglass' },
  no_show: { color: 'error', label: 'Absence', icon: 'i-hugeicons-user-remove-01' }
} as const

// Consultation Status Options
export const SESSION_STATUS_OPTIONS = Object.entries(SESSION_STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color,
  icon: item.icon
}))

// Consultation Types Configuration
export const CONSULTATION_TYPES_CONFIG = {
  initial: { label: 'Évaluation initiale', icon: 'i-hugeicons-start-up-02' },
  follow_up: { label: 'Suivi', icon: 'i-hugeicons-calendar-user' },
  evaluation: { label: 'Évaluation', icon: 'i-hugeicons-test-tube-02' },
  discharge: { label: 'Sortie', icon: 'i-hugeicons-square-arrow-left-02' },
  mobilization: { label: 'Mobilisation', icon: 'i-hugeicons-account-recovery' },
  reinforcement: { label: 'Renforcement', icon: 'i-hugeicons-body-part-muscle' },
  reeducation: { label: 'Rééducation', icon: 'i-hugeicons-back-muscle-body' }
} as const

// Consultation Type Options
export const CONSULTATION_TYPES_OPTIONS = Object.entries(CONSULTATION_TYPES_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Consultation Status Helpers
export const getConsultationStatusLabel = (status: ConsultationStatus) => SESSION_STATUS_CONFIG[status].label
export const getConsultationStatusColor = (status: ConsultationStatus) => SESSION_STATUS_CONFIG[status].color
export const getConsultationStatusIcon = (status: ConsultationStatus) => SESSION_STATUS_CONFIG[status].icon
export const getConsultationStatusConfig = (status: ConsultationStatus) => SESSION_STATUS_CONFIG[status]

// Consultation Type Helpers
export const getConsultationTypeLabel = (type: ConsultationType) => CONSULTATION_TYPES_CONFIG[type].label
export const getConsultationTypeIcon = (type: ConsultationType) =>
  CONSULTATION_TYPES_CONFIG[type]?.icon || 'i-hugeicons-calendar-remove-01'
