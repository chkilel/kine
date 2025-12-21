import type { Patient } from '../types/patient.types'
import type { TreatmentPlanWithProgress } from '../types/treatment-plan'

// Slugify a string
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Get full name
export function formatFullName(patient: Pick<Patient, 'firstName' | 'lastName'>) {
  return `${patient.firstName} ${patient.lastName}`
}

// Get therapist name
export const getTherapistName = (therapist?: TreatmentPlanWithProgress['therapist'] | null) => {
  if (!therapist) return 'Non assigné'
  return `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || therapist.email || 'Non assigné'
}
