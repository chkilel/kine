// =================================================================================================
// Appointment Duration and Status Constants
// =================================================================================================

import type { AppointmentStatus, AppointmentType } from '../types/base.types'

// Appointment Duration Options
export const APPOINTMENT_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120]

// Appointment Gap Options (minutes between sessions)
export const APPOINTMENT_GAP_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60] as const

//FIXME this is not necessary: Minimum Gap Between Appointments in Minutes
export const MINIMUM_APPOINTMENT_GAP_MINUTES = 15

// Appointment Slot Increment Options (minutes between possible slot start times)
export const APPOINTMENT_SLOT_INCREMENT_OPTIONS = [5, 10, 15, 20, 30] as const

// Valid appointment types for patient sessions
export const APPOINTMENT_TYPES = [
  'initial',
  'follow_up',
  'treatment',
  'mobilization',
  'reinforcement',
  'reeducation',
  'exercise_supervision',
  'post_op_follow_up',
  'urgent_visit',
  'consultation',
  'discharge'
] as const

// Valid status values for appointments (scheduling lifecycle only)
export const APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as const

// Appointment Status Configuration
export const APPOINTMENT_STATUS_CONFIG = {
  scheduled: { color: 'info', label: 'À venir', icon: 'i-hugeicons-clock-02' },
  confirmed: { color: 'success', label: 'Confirmée', icon: 'i-hugeicons-calendar-check-in-01' },
  completed: { color: 'success', label: 'Terminée', icon: 'i-hugeicons-checkmark-circle-02' },
  cancelled: { color: 'error', label: 'Annulée', icon: 'i-hugeicons-cancel-01' },
  no_show: { color: 'error', label: 'Absence', icon: 'i-hugeicons-user-remove-01' }
} as const

// Appointment Status Options
export const APPOINTMENT_STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color,
  icon: item.icon
}))

// Appointment Types Configuration
export const APPOINTMENT_TYPES_CONFIG = {
  initial: { label: 'Évaluation initiale', icon: 'i-hugeicons-start-up-02' },
  follow_up: { label: 'Suivi', icon: 'i-hugeicons-calendar-user' },
  treatment: { label: 'Séance de traitement', icon: 'i-hugeicons-therapy' },
  mobilization: { label: 'Mobilisation', icon: 'i-hugeicons-account-recovery' },
  reinforcement: { label: 'Renforcement', icon: 'i-hugeicons-body-part-muscle' },
  reeducation: { label: 'Rééducation', icon: 'i-hugeicons-back-muscle-body' },
  exercise_supervision: { label: "Supervision d'exercices", icon: 'i-hugeicons-dumbbell-01' },
  post_op_follow_up: { label: 'Suivi post-opératoire', icon: 'i-hugeicons-hospital-bed-02' },
  urgent_visit: { label: 'Consultation urgente', icon: 'i-hugeicons-ambulance' },
  consultation: { label: 'Consultation individuelle', icon: 'i-hugeicons-stethoscope' },
  discharge: { label: 'Sortie', icon: 'i-hugeicons-square-arrow-left-02' }
} as const

// Appointment Type Options
export const APPOINTMENT_TYPES_OPTIONS = Object.entries(APPOINTMENT_TYPES_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Appointment Status Helpers
export const getAppointmentStatusLabel = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status].label
export const getAppointmentStatusColor = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status].color
export const getAppointmentStatusIcon = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status].icon
export const getAppointmentStatusConfig = (status: AppointmentStatus) => APPOINTMENT_STATUS_CONFIG[status]

// Appointment Type Helpers
export const getAppointmentTypeLabel = (type: AppointmentType) => APPOINTMENT_TYPES_CONFIG[type].label
export const getAppointmentTypeIcon = (type: AppointmentType | null) => {
  return type ? APPOINTMENT_TYPES_CONFIG[type]?.icon : 'i-hugeicons-calendar-remove-01'
}
