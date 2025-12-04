import type {
  ConsultationLocation,
  ConsultationSessionType,
  ConsultationStatus,
  DocumentCategory,
  InsuranceCoverage,
  PatientStatus,
  Relationship,
  TreatmentPlanStatus
} from '../types/patient.types'

export type ColorVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'primary' | 'secondary'

export interface StatusConfig {
  label: string
  color: ColorVariant
}

export interface SelectOption<T = string> {
  label: string
  value: T
  icon?: string
}

// Patient Status Configuration
export const STATUS_CONFIG = {
  active: { color: 'success', label: 'Actif' },
  inactive: { color: 'warning', label: 'Inactif' },
  discharged: { color: 'error', label: 'Sorti' },
  archived: { color: 'neutral', label: 'Archivé' }
} as const satisfies Record<PatientStatus, StatusConfig>

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

// Treatment Plan Status Configuration
export const TREATMENT_PLAN_STATUS_CONFIG = {
  planned: { label: 'Planifié', color: 'warning' },
  ongoing: { label: 'Actif', color: 'success' },
  completed: { label: 'Terminé', color: 'neutral' },
  paused: { label: 'En pause', color: 'warning' },
  cancelled: { label: 'Annulé', color: 'error' }
} as const satisfies Record<TreatmentPlanStatus, StatusConfig>

// Document Categories Configuration
export const DOCUMENT_CATEGORIES_CONFIG = {
  referral: 'Lettre de recommandation',
  imaging: 'Radiologie',
  lab_results: 'Résultats de laboratoire',
  treatment_notes: 'Notes de traitement',
  prescriptions: 'Ordonnance',
  other: 'Autre'
} as const satisfies Record<DocumentCategory, string>

// Session Status Configuration
export const SESSION_STATUS_CONFIG = {
  confirmed: { color: 'success', label: 'Confirmée' },
  scheduled: { color: 'info', label: 'À venir' },
  completed: { color: 'success', label: 'Terminée' },
  cancelled: { color: 'error', label: 'Annulée' },
  in_progress: { color: 'warning', label: 'En cours' },
  no_show: { color: 'error', label: 'Absence' }
} as const satisfies Record<ConsultationStatus, StatusConfig>

// Consultation Types with Icons Configuration
export const CONSULTATION_TYPES_WITH_ICONS = [
  { value: 'initial', label: 'Évaluation initiale' },
  { value: 'follow_up', label: 'Suivi' },
  { value: 'evaluation', label: 'Évaluation' },
  { value: 'discharge', label: 'Sortie' },
  { value: 'mobilization', label: 'Mobilisation' },
  { value: 'reinforcement', label: 'Renforcement' },
  { value: 'reeducation', label: 'Rééducation' }
] as const satisfies SelectOption<ConsultationSessionType>[]

// Generate CONSULTATION_TYPES_CONFIG from CONSULTATION_TYPES_WITH_ICONS
export const CONSULTATION_TYPES_CONFIG: Record<ConsultationSessionType, string> = CONSULTATION_TYPES_WITH_ICONS.reduce(
  (acc, type) => ({ ...acc, [type.value]: type.label }),
  {} as Record<ConsultationSessionType, string>
)

// Consultation Locations with Icons Configuration
export const CONSULTATION_LOCATIONS_WITH_ICONS = [
  { value: 'clinic', label: 'Cabinet', icon: 'i-lucide-building' },
  { value: 'home', label: 'Domicile', icon: 'i-lucide-home' },
  { value: 'telehealth', label: 'Téléconsultation', icon: 'i-lucide-video' }
] as const satisfies SelectOption<ConsultationLocation>[]

// Generate CONSULTATION_LOCATIONS_CONFIG from CONSULTATION_LOCATIONS_WITH_ICONS
export const CONSULTATION_LOCATIONS_CONFIG: Record<ConsultationLocation, string> =
  CONSULTATION_LOCATIONS_WITH_ICONS.reduce(
    (acc, loc) => ({ ...acc, [loc.value]: loc.label }),
    {} as Record<ConsultationLocation, string>
  )

// Document Icons Configuration
export const DOCUMENT_ICONS_CONFIG = {
  imaging: 'i-lucide-image',
  treatment_notes: 'i-lucide-file-text',
  prescriptions: 'i-lucide-pill',
  referral: 'i-lucide-file-text',
  lab_results: 'i-lucide-file-text',
  other: 'i-lucide-file-text'
} as const satisfies Record<DocumentCategory, string>

// Document Colors Configuration
export const DOCUMENT_COLORS_CONFIG = {
  imaging: 'primary',
  treatment_notes: 'info',
  prescriptions: 'secondary',
  referral: 'neutral',
  lab_results: 'neutral',
  other: 'neutral'
} as const satisfies Record<DocumentCategory, string>

// Generic helper to create select options from a config object
const createSelectOptions = <T extends string>(config: Record<T, string | StatusConfig>): SelectOption<T>[] => {
  return Object.entries(config).map(([value, labelOrConfig]) => ({
    label: typeof labelOrConfig === 'string' ? labelOrConfig : (labelOrConfig as StatusConfig).label,
    value: value as T
  }))
}

// Generic helper to get label from config
const getLabel = <T extends string>(value: T, config: Record<T, string | StatusConfig>, fallback?: string): string => {
  const item = config[value]
  if (!item) return fallback || value
  return typeof item === 'string' ? item : item.label
}

// Generic helper to get color from config
const getColor = <T extends string>(
  value: T,
  config: Record<T, StatusConfig>,
  fallback: ColorVariant = 'neutral'
): ColorVariant => {
  return config[value]?.color || fallback
}

// Generic helper to get status config
const getStatusConfig = <T extends string>(
  value: T,
  config: Record<T, StatusConfig>,
  fallback: StatusConfig = { label: '', color: 'neutral' }
): StatusConfig => {
  return config[value] || { ...fallback, label: fallback.label || value }
}

// Patient Status Options
export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: 'Statut: Tous', value: 'all' },
  ...createSelectOptions(STATUS_CONFIG)
]

export const PATIENT_STATUS_OPTIONS = createSelectOptions(STATUS_CONFIG)

// Insurance Coverage Options
export const INSURANCE_COVERAGE_OPTIONS = createSelectOptions(INSURANCE_COVERAGE_CONFIG)

// Relationship Options
export const RELATIONSHIP_OPTIONS = createSelectOptions(RELATIONSHIPS_CONFIG)
export const getRelationshipLabel = (value: Relationship): string => getLabel(value, RELATIONSHIPS_CONFIG)

// Treatment Plan Options
export const TREATMENT_PLAN_STATUS_OPTIONS = createSelectOptions(TREATMENT_PLAN_STATUS_CONFIG)
export const formatTreatmentPlanStatus = (status: TreatmentPlanStatus): StatusConfig =>
  getStatusConfig(status, TREATMENT_PLAN_STATUS_CONFIG)

// Document Options
export const DOCUMENT_CATEGORY_OPTIONS = createSelectOptions(DOCUMENT_CATEGORIES_CONFIG)
export const getDocumentCategoryLabel = (category: DocumentCategory): string =>
  getLabel(category, DOCUMENT_CATEGORIES_CONFIG)
export const getDocumentIcon = (category: DocumentCategory): string =>
  DOCUMENT_ICONS_CONFIG[category] || 'i-lucide-file-text'
export const getDocumentColor = (category: DocumentCategory): ColorVariant =>
  DOCUMENT_COLORS_CONFIG[category] || 'neutral'

// Session Status Helpers
export const getSessionStatusLabel = (status: ConsultationStatus): string => getLabel(status, SESSION_STATUS_CONFIG)
export const getSessionStatusColor = (status: ConsultationStatus): ColorVariant =>
  getColor(status, SESSION_STATUS_CONFIG)
export const getSessionStatusConfig = (status: ConsultationStatus): StatusConfig =>
  getStatusConfig(status, SESSION_STATUS_CONFIG)

// Consultation Type Helpers
export const CONSULTATION_TYPE_OPTIONS = createSelectOptions(CONSULTATION_TYPES_CONFIG)
export const getConsultationTypeLabel = (type: ConsultationSessionType): string =>
  getLabel(type, CONSULTATION_TYPES_CONFIG)

// Consultation Location Helpers
export const CONSULTATION_LOCATION_OPTIONS = createSelectOptions(CONSULTATION_LOCATIONS_CONFIG)
export const getConsultationLocationLabel = (location: ConsultationLocation): string =>
  getLabel(location, CONSULTATION_LOCATIONS_CONFIG)

// Frequency Options
export const FREQUENCY_OPTIONS: SelectOption<number>[] = [
  { label: '1 fois', value: 1 },
  { label: '2 fois', value: 2 },
  { label: '3 fois', value: 3 },
  { label: '4 fois', value: 4 },
  { label: '5 fois', value: 5 }
]

// Preferred Days Options
export const PREFERRED_DAYS_OPTIONS: SelectOption<string>[] = [
  { value: 'Mon', label: 'Lundi' },
  { value: 'Tue', label: 'Mardi' },
  { value: 'Wed', label: 'Mercredi' },
  { value: 'Thu', label: 'Jeudi' },
  { value: 'Fri', label: 'Vendredi' },
  { value: 'Sat', label: 'Samedi' }
]
