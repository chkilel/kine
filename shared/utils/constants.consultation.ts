import type { ConsultationSessionType, ConsultationStatus } from "../types/patient.types"

// =================================================================================================
// Consultation Duration and Status Constants
// =================================================================================================

// Consultation Duration Options
export const SESSION_DURATIONS = [30, 45, 60, 75, 90, 105, 120]

// Minimum Gap Between Consultations in Minutes
export const MINIMUM_CONSULTATION_GAP_MINUTES = 15

// Consultation Status Configuration
export const SESSION_STATUS_CONFIG = {
  confirmed: { color: 'success', label: 'Confirmée' },
  scheduled: { color: 'info', label: 'À venir' },
  completed: { color: 'success', label: 'Terminée' },
  cancelled: { color: 'error', label: 'Annulée' },
  in_progress: { color: 'warning', label: 'En cours' },
  no_show: { color: 'error', label: 'Absence' }
} as const

// Consultation Status Options
export const SESSION_STATUS_OPTIONS = Object.entries(SESSION_STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color
}))

// Consultation Types Configuration
export const CONSULTATION_TYPES_CONFIG = {
  initial: { label: 'Évaluation initiale' },
  follow_up: { label: 'Suivi' },
  evaluation: { label: 'Évaluation' },
  discharge: { label: 'Sortie' },
  mobilization: { label: 'Mobilisation' },
  reinforcement: { label: 'Renforcement' },
  reeducation: { label: 'Rééducation' }
} as const

// Consultation Type Options
export const CONSULTATION_TYPES_OPTIONS = Object.entries(CONSULTATION_TYPES_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Consultation Status Helpers
export const getConsultationStatusLabel = (status: ConsultationStatus)=> SESSION_STATUS_CONFIG[status].label
export const getConsultationStatusColor = (status: ConsultationStatus)=> SESSION_STATUS_CONFIG[status].color
export const getConsultationStatusConfig = (status: ConsultationStatus)=> SESSION_STATUS_CONFIG[status]

// Consultation Type Helpers
export const getConsultationTypeLabel = (type: ConsultationSessionType)=> CONSULTATION_TYPES_CONFIG[type].label