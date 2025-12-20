import { createSelectOptions, getStatusConfig, type SelectOption, type StatusConfig } from ".";
import type { TreatmentPlanStatus } from "../types/patient.types";



// Treatment Plan Status Configuration
export const TREATMENT_PLAN_STATUS_CONFIG = {
  planned: { label: 'Planifié', color: 'warning' },
  ongoing: { label: 'Actif', color: 'success' },
  completed: { label: 'Terminé', color: 'neutral' },
  paused: { label: 'En pause', color: 'warning' },
  cancelled: { label: 'Annulé', color: 'error' }
} as const satisfies Record<TreatmentPlanStatus, StatusConfig>

// Treatment Plan Options
export const TREATMENT_PLAN_STATUS_OPTIONS = createSelectOptions(TREATMENT_PLAN_STATUS_CONFIG)
export const formatTreatmentPlanStatus = (status: TreatmentPlanStatus): StatusConfig =>
  getStatusConfig(status, TREATMENT_PLAN_STATUS_CONFIG)

// Frequency Options
export const FREQUENCY_OPTIONS: SelectOption<number>[] = [
  { label: '1 fois', value: 1 },
  { label: '2 fois', value: 2 },
  { label: '3 fois', value: 3 },
  { label: '4 fois', value: 4 },
  { label: '5 fois', value: 5 },
  { label: '6 fois', value: 6 }
]