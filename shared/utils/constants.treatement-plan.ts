// =================================================================================================
// Treatment Plan Status Constants
// =================================================================================================

import type { TreatmentPlanStatus } from '../types/base.types'

// Valid status values for treatment plan coverage
export const VALID_COVERAGE_STATUSES = [
  'not_required',
  'not_provided',
  'to_verify',
  'awaiting_agreement',
  'covered',
  'partially_covered',
  'refused',
  'expired',
  'cancelled'
] as const

// Valid status values for treatment plans
export const VALID_TREATMENT_PLAN_STATUSES = ['planned', 'ongoing', 'completed', 'paused', 'cancelled'] as const

export const TREATMENT_PLAN_STATUS_CONFIG = {
  planned: { label: 'Planifié', color: 'warning' },
  ongoing: { label: 'Actif', color: 'success' },
  completed: { label: 'Terminé', color: 'neutral' },
  paused: { label: 'En pause', color: 'warning' },
  cancelled: { label: 'Annulé', color: 'error' }
} as const

// Treatment Plan Options
export const TREATMENT_PLAN_STATUS_OPTIONS = Object.entries(TREATMENT_PLAN_STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color
}))

export const getTreatmentPlanStatusLabel = (status: TreatmentPlanStatus) => TREATMENT_PLAN_STATUS_CONFIG[status].label
export const getTreatmentPlanStatusColor = (status: TreatmentPlanStatus) => TREATMENT_PLAN_STATUS_CONFIG[status].color

// Frequency Options
export const FREQUENCY_OPTIONS = [
  { label: '1 fois', value: 1 },
  { label: '2 fois', value: 2 },
  { label: '3 fois', value: 3 },
  { label: '4 fois', value: 4 },
  { label: '5 fois', value: 5 },
  { label: '6 fois', value: 6 }
]
