import type { Sex, InsuranceCoverageStatus, Relationship } from '../types/base.types'

// =============================================================================
// Sex Configuration
// =============================================================================

export const SEX_CONFIG = {
  male: { label: 'Home' },
  female: { label: 'Femme' }
} as const

export const SEX_OPTIONS = Object.entries(SEX_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

export const getSexLabel = (sex: Sex) => SEX_CONFIG[sex].label

// =============================================================================
// Insurance Coverage Configuration
// =============================================================================

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

export const INSURANCE_COVERAGE_OPTIONS = Object.entries(INSURANCE_COVERAGE_CONFIG).map(([key, label]) => ({
  label,
  value: key
}))

export const getInsuranceCoverageLabel = (value: InsuranceCoverageStatus) => INSURANCE_COVERAGE_CONFIG[value]

// =============================================================================
// Relationships Configuration
// =============================================================================

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

export const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIPS_CONFIG).map(([key, label]) => ({
  label,
  value: key
}))

export const getRelationshipLabel = (value: Relationship) => RELATIONSHIPS_CONFIG[value]
