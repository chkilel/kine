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
