import type { TreatmentPlanStatus } from '../types/base.types'

// =============================================================================
// Treatment Plan Status Configuration
// =============================================================================

export const TREATMENT_PLAN_STATUS_CONFIG = {
  planned: {
    label: 'Planifié',
    color: 'warning',
    icon: 'i-hugeicons-calendar-02',
    description: "Ce plan est planifié et n'a pas encore commencé"
  },
  ongoing: {
    label: 'Actif',
    color: 'success',
    icon: 'i-hugeicons-checkmark-circle-02',
    description: 'Ce plan est en cours de traitement'
  },
  completed: {
    label: 'Terminé',
    color: 'neutral',
    icon: 'i-hugeicons-archive-02',
    description: 'Ce plan est terminé'
  },
  paused: {
    label: 'En pause',
    color: 'warning',
    icon: 'i-hugeicons-pause',
    description: 'Ce plan est temporairement en pause'
  },
  cancelled: { label: 'Annulé', color: 'error', icon: 'hugeicons-cancel-circle', description: 'Ce plan a été annulé' }
} as const

export const TREATMENT_PLAN_STATUS_OPTIONS = Object.entries(TREATMENT_PLAN_STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color,
  icon: item.icon
}))

export const getTreatmentPlanStatusLabel = (status: TreatmentPlanStatus) => TREATMENT_PLAN_STATUS_CONFIG[status].label
export const getTreatmentPlanStatusColor = (status: TreatmentPlanStatus) => TREATMENT_PLAN_STATUS_CONFIG[status].color
export const getTreatmentPlanStatusIcon = (status: TreatmentPlanStatus) => TREATMENT_PLAN_STATUS_CONFIG[status].icon
export const getTreatmentPlanStatusDescription = (status: TreatmentPlanStatus): string =>
  TREATMENT_PLAN_STATUS_CONFIG[status].description

// =============================================================================
// Frequency Options
// =============================================================================

export const FREQUENCY_OPTIONS = [
  { label: '1 fois', value: 1 },
  { label: '2 fois', value: 2 },
  { label: '3 fois', value: 3 },
  { label: '4 fois', value: 4 },
  { label: '5 fois', value: 5 },
  { label: '6 fois', value: 6 }
]
