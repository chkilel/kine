import type { InsuranceCoverage, PatientStatus, Relationship } from '../types/patient.types'

// =================================================================================================
// Patient Status Constants
// =================================================================================================

// Valid relationship types for emergency contacts
export const VALID_RELATIONSHIP_TYPES = [
  'husband',
  'wife',
  'mother',
  'father',
  'daughter',
  'son',
  'sister',
  'brother',
  'grandmother',
  'grandfather',
  'granddaughter',
  'grandson',
  'aunt',
  'uncle',
  'female_cousin',
  'male_cousin',
  'female_friend',
  'male_friend',
  'female_neighbor',
  'male_neighbor',
  'colleague',
  'acquaintance',
  'other'
] as const

// Valid biological sex values for patient records
export const VALID_SEX_VALUES = ['male', 'female'] as const

// Valid status values for patient records
export const VALID_PATIENT_STATUSES = ['active', 'inactive', 'discharged', 'archived'] as const

export const STATUS_CONFIG = {
  active: { color: 'success', label: 'Actif' },
  inactive: { color: 'warning', label: 'Inactif' },
  discharged: { color: 'error', label: 'Sorti' },
  archived: { color: 'neutral', label: 'Archivé' }
} as const

// Status Filter Options
export const STATUS_FILTER_OPTIONS = [
  { label: 'Statut: Tous', value: 'all' },
  ...Object.entries(STATUS_CONFIG).map(([key, item]) => ({
    label: item.label,
    value: key,
    color: item.color
  }))
]

// Patient Status Options
export const PATIENT_STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  color: item.color
}))

// Patient Status Helpers
export const getPatientStatusLabel = (status: PatientStatus) => STATUS_CONFIG[status]?.label || status
export const getPatientStatusColor = (status: PatientStatus) => STATUS_CONFIG[status].color
export const getPatientStatusConfig = (status: PatientStatus) => STATUS_CONFIG[status]

// =================================================================================================
// Insurance Coverage and Relationships Constants
// =================================================================================================

export const INSURANCE_COVERAGE_CONFIG = {
  not_required: 'Non nécessaire',
  not_provided: 'Informations manquantes',
  to_verify: 'À vérifier',
  awaiting_agreement: "En attente d'accord",
  covered: 'Prise en charge acceptée',
  partially_covered: 'Prise en charge partielle',
  refused: 'Prise en charge refusée',
  expired: 'Prise en charge expirée',
  cancelled: 'Prise en charge annulée'
} as const

// Insurance Coverage Options
export const INSURANCE_COVERAGE_OPTIONS = Object.entries(INSURANCE_COVERAGE_CONFIG).map(([key, label]) => ({
  label,
  value: key
}))

// Insurance Coverage Helpers
export const getInsuranceCoverageLabel = (value: InsuranceCoverage) => INSURANCE_COVERAGE_CONFIG[value]

// =================================================================================================
// Relationships Constants
// =================================================================================================
export const RELATIONSHIPS_CONFIG = {
  husband: 'Époux',
  wife: 'Épouse',
  mother: 'Mère',
  father: 'Père',
  daughter: 'Fille',
  son: 'Fils',
  sister: 'Sœur',
  brother: 'Frère',
  grandmother: 'Grand-mère',
  grandfather: 'Grand-père',
  granddaughter: 'Petite-fille',
  grandson: 'Petit-fils',
  aunt: 'Tante',
  uncle: 'Oncle',
  female_cousin: 'Cousine',
  male_cousin: 'Cousin',
  female_friend: 'Amie',
  male_friend: 'Ami',
  female_neighbor: 'Voisine',
  male_neighbor: 'Voisin',
  colleague: 'Collègue',
  acquaintance: 'Connaissance',
  other: 'Autre'
} as const

// Relationship Options
export const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIPS_CONFIG).map(([key, label]) => ({
  label,
  value: key
}))

// Relationship Helpers
export const getRelationshipLabel = (value: Relationship) => RELATIONSHIPS_CONFIG[value]
