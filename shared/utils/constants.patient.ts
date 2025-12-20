import { createSelectOptions, getLabel, type SelectOption, type StatusConfig } from "."
import type { InsuranceCoverage, PatientStatus, Relationship } from "../types/patient.types"

// Patient Status Configuration
export const STATUS_CONFIG = {
  active: { color: 'success', label: 'Actif' },
  inactive: { color: 'warning', label: 'Inactif' },
  discharged: { color: 'error', label: 'Sorti' },
  archived: { color: 'neutral', label: 'Archivé' }
} as const satisfies Record<PatientStatus, StatusConfig>

// Insurance Coverage Configuration
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
} as const satisfies Record<InsuranceCoverage, string>


// Relationships Configuration
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
} as const satisfies Record<Relationship, string>


// Patient Status Options
export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: 'Statut: Tous', value: 'all' },
  ...createSelectOptions(STATUS_CONFIG)
]

// Patient Status Options
export const PATIENT_STATUS_OPTIONS = createSelectOptions(STATUS_CONFIG)

// Insurance Coverage Options
export const INSURANCE_COVERAGE_OPTIONS = createSelectOptions(INSURANCE_COVERAGE_CONFIG)

// Relationship Options
export const RELATIONSHIP_OPTIONS = createSelectOptions(RELATIONSHIPS_CONFIG)
export const getRelationshipLabel = (value: Relationship): string => getLabel(value, RELATIONSHIPS_CONFIG)
