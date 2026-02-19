// =================================================================================================
// Treatment Session Constants
// =================================================================================================

import type { TreatmentSessionStatus, TreatmentSessionStep } from '../types/base.types'

// Valid treatment session statuses (session lifecycle - only in-progress and completed)
export const TREATMENT_SESSION_STATUSES = ['in_progress', 'completed'] as const

// Valid session steps (UI workflow)
export const TREATMENT_SESSION_STEPS = ['pre-session', 'active-session', 'post-session', 'summary'] as const

// Treatment Session Status Configuration
export const TREATMENT_SESSION_STATUS_CONFIG = {
  in_progress: {
    color: 'warning',
    label: 'En cours',
    icon: 'i-hugeicons-hourglass',
    description: 'Session en cours de traitement'
  },
  completed: {
    color: 'success',
    label: 'Terminée',
    icon: 'i-hugeicons-checkmark-circle-02',
    description: 'Session terminée et documentée'
  }
} as const

// Treatment Session Step Configuration
export const TREATMENT_SESSION_STEP_CONFIG = {
  'pre-session': {
    label: 'Pré-session',
    icon: 'i-hugeicons-user-check-01',
    description: 'Préparation avant la séance'
  },
  'active-session': {
    label: 'Séance active',
    icon: 'i-hugeicons-patient',
    description: 'Séance de traitement en cours'
  },
  'post-session': {
    label: 'Post-session',
    icon: 'i-hugeicons-medical-file',
    description: 'Documentation et bilan'
  },
  summary: {
    label: 'Résumé',
    icon: 'i-hugeicons-note',
    description: 'Récapitulatif de la séance'
  }
} as const

// Treatment Session Status Helpers
export const getTreatmentSessionStatusLabel = (status: TreatmentSessionStatus) =>
  TREATMENT_SESSION_STATUS_CONFIG[status].label
export const getTreatmentSessionStatusColor = (status: TreatmentSessionStatus) =>
  TREATMENT_SESSION_STATUS_CONFIG[status].color
export const getTreatmentSessionStatusIcon = (status: TreatmentSessionStatus) =>
  TREATMENT_SESSION_STATUS_CONFIG[status].icon
export const getTreatmentSessionStatusConfig = (status: TreatmentSessionStatus) =>
  TREATMENT_SESSION_STATUS_CONFIG[status]

// Treatment Session Step Helpers
export const getTreatmentSessionStepLabel = (step: TreatmentSessionStep) => TREATMENT_SESSION_STEP_CONFIG[step].label
export const getTreatmentSessionStepIcon = (step: TreatmentSessionStep) => TREATMENT_SESSION_STEP_CONFIG[step].icon
export const getTreatmentSessionStepConfig = (step: TreatmentSessionStep) => TREATMENT_SESSION_STEP_CONFIG[step]

// Available tags for treatment sessions
export const TREATMENT_SESSION_TAGS = [
  'Douleur Diminuée',
  'Gain Amplitude',
  'Proprioception',
  'Cryothérapie',
  'Renforcement'
] as const
