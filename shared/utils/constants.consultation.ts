import { createSelectOptions, getColor, getLabel, getStatusConfig, type ColorVariant, type SelectOption, type StatusConfig } from "."
import type { ConsultationSessionType, ConsultationStatus } from "../types/patient.types"

// Business validation constants
export const MINIMUM_SESSION_GAP_MINUTES = 15

// Session Status Configuration
export const SESSION_STATUS_CONFIG = {
  confirmed: { color: 'success', label: 'Confirmée' },
  scheduled: { color: 'info', label: 'À venir' },
  completed: { color: 'success', label: 'Terminée' },
  cancelled: { color: 'error', label: 'Annulée' },
  in_progress: { color: 'warning', label: 'En cours' },
  no_show: { color: 'error', label: 'Absence' }
} as const satisfies Record<ConsultationStatus, StatusConfig>

// Consultation Types with Icons Configuration
export const CONSULTATION_TYPES_WITH_ICONS = [
  { value: 'initial', label: 'Évaluation initiale' },
  { value: 'follow_up', label: 'Suivi' },
  { value: 'evaluation', label: 'Évaluation' },
  { value: 'discharge', label: 'Sortie' },
  { value: 'mobilization', label: 'Mobilisation' },
  { value: 'reinforcement', label: 'Renforcement' },
  { value: 'reeducation', label: 'Rééducation' }
] as const satisfies SelectOption<ConsultationSessionType>[]

// Session Duration Options
export const SESSION_DURATIONS = [30, 45, 60, 75, 90, 105, 120]

// Generate CONSULTATION_TYPES_CONFIG from CONSULTATION_TYPES_WITH_ICONS
export const CONSULTATION_TYPES_CONFIG: Record<ConsultationSessionType, string> = CONSULTATION_TYPES_WITH_ICONS.reduce(
  (acc, type) => ({ ...acc, [type.value]: type.label }),
  {} as Record<ConsultationSessionType, string>
)


// Session Status Helpers
export const getSessionStatusLabel = (status: ConsultationStatus): string => getLabel(status, SESSION_STATUS_CONFIG)
export const getSessionStatusColor = (status: ConsultationStatus): ColorVariant =>
  getColor(status, SESSION_STATUS_CONFIG)
export const getSessionStatusConfig = (status: ConsultationStatus): StatusConfig =>
  getStatusConfig(status, SESSION_STATUS_CONFIG)

// Consultation Type Helpers
export const CONSULTATION_TYPE_OPTIONS = createSelectOptions(CONSULTATION_TYPES_CONFIG)
export const getConsultationTypeLabel = (type: ConsultationSessionType): string =>
  getLabel(type, CONSULTATION_TYPES_CONFIG)
