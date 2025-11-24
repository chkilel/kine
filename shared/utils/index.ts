import { differenceInYears, isBefore } from 'date-fns'
import type { Patient } from '../types/patient.types'

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

export function getSessionBadgeColor(status: string) {
  switch (status) {
    case 'upcoming':
      return 'warning'
    case 'completed':
      return 'success'
    case 'missed':
      return 'error'
    default:
      return 'neutral'
  }
}

export function getSessionBadgeLabel(status: string) {
  switch (status) {
    case 'upcoming':
      return 'À venir'
    case 'completed':
      return 'Terminée'
    case 'missed':
      return 'Manquée'
    default:
      return status
  }
}

export const formatTreatmentPlanStatus = (status: string) => {
  switch (status) {
    case 'active':
      return { color: 'success', label: 'Actif' }
    case 'completed':
      return { color: 'info', label: 'Terminé' }
    case 'paused':
      return { color: 'warning', label: 'En pause' }
    case 'cancelled':
      return { color: 'error', label: 'Annulé' }
    default:
      return { color: 'neutral', label: status }
  }
}

// Calculate age from date of birth

export function calculateAge(dob: string | Date): number {
  const date = new Date(dob)
  const now = new Date()

  const years = differenceInYears(now, date)

  return isBefore(now, new Date(now.getFullYear(), date.getMonth(), date.getDate())) ? years - 1 : years
}
