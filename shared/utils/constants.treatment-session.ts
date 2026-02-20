// =================================================================================================
// Treatment Session Constants
// =================================================================================================

import type { TreatmentSessionStatus } from '../types/base.types'

// Valid treatment session statuses (session lifecycle)
export const TREATMENT_SESSION_STATUSES = ['pre_session', 'in_progress', 'finished', 'completed', 'canceled'] as const

// Treatment Session Status Configuration
export const TREATMENT_SESSION_STATUS_CONFIG = {
  pre_session: {
    color: 'info',
    label: 'Pré-session',
    icon: 'i-hugeicons-user-check-01',
    description: 'Préparation avant la séance'
  },
  in_progress: {
    color: 'warning',
    label: 'En cours',
    icon: 'i-hugeicons-hourglass',
    description: 'Session en cours de traitement'
  },
  finished: {
    color: 'primary',
    label: 'Terminée',
    icon: 'i-hugeicons-checkmark-circle-02',
    description: 'Session terminée (en attente de paiement)'
  },
  completed: {
    color: 'success',
    label: 'Complétée',
    icon: 'i-hugeicons-checkmark-circle-02',
    description: 'Session terminée et payée'
  },
  canceled: {
    color: 'error',
    label: 'Annulée',
    icon: 'i-hugeicons-cancel-01',
    description: 'Session annulée'
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

// Available tags for treatment sessions
export const TREATMENT_SESSION_TAGS = [
  'Douleur Diminuée',
  'Gain Amplitude',
  'Proprioception',
  'Cryothérapie',
  'Renforcement'
] as const
