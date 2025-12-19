import type { SelectMenuItem } from '@nuxt/ui'

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
export const getLocationLabel = (location: ConsultationLocation): string =>
  getLabel(location, CONSULTATION_LOCATIONS_CONFIG)
export const getLocationIcon = (location: ConsultationLocation): string => {
  const config = CONSULTATION_LOCATIONS_WITH_ICONS.find((item) => item.value === location)
  return config?.icon || 'i-lucide-map-pin'
}

// Frequency Options
export const FREQUENCY_OPTIONS: SelectOption<number>[] = [
  { label: '1 fois', value: 1 },
  { label: '2 fois', value: 2 },
  { label: '3 fois', value: 3 },
  { label: '4 fois', value: 4 },
  { label: '5 fois', value: 5 },
  { label: '6 fois', value: 6 }
]

// Preferred Days Configuration
export const PREFERRED_DAYS_CONFIG = {
  Mon: 'Lundi',
  Tue: 'Mardi',
  Wed: 'Mercredi',
  Thu: 'Jeudi',
  Fri: 'Vendredi',
  Sat: 'Samedi'
} as const

// Preferred Days Options
export const PREFERRED_DAYS_OPTIONS: SelectOption<string>[] = createSelectOptions(PREFERRED_DAYS_CONFIG)

// Location Color Mapping for UI Badges
export const LOCATION_COLOR_MAPPING: Record<
  ConsultationLocation,
  { color: ColorVariant; variant: 'solid' | 'outline' | 'soft' | 'subtle' }
> = {
  clinic: { color: 'success', variant: 'subtle' },
  home: { color: 'warning', variant: 'subtle' },
  telehealth: { color: 'info', variant: 'subtle' }
}

// Exception Type Configuration with Icons (Single Source of Truth)
export const EXCEPTION_TYPE_CONFIG_WITH_ICONS = [
  { value: 'vacation', label: 'Congé', icon: 'i-lucide-luggage' },
  { value: 'holiday', label: 'Jour férié', icon: 'i-lucide-home' },
  { value: 'sick', label: 'Maladie', icon: 'i-lucide-heart-pulse' },
  { value: 'training', label: 'Formation', icon: 'i-lucide-graduation-cap' },
  { value: 'meeting', label: 'Réunion', icon: 'i-lucide-users' },
  { value: 'personal', label: 'Personnel', icon: 'i-lucide-user' },
  { value: 'reduced_hours', label: 'Réduction horaire', icon: 'i-lucide-clock' },
  { value: 'other', label: 'Autre', icon: 'i-lucide-more-horizontal' }
] as const satisfies SelectOption[]

// Exception Type Configuration (Derived from with-icons version)
export const EXCEPTION_TYPE_CONFIG = {
  vacation: { value: 'vacation', label: 'Congé', color: 'warning', variant: 'subtle' },
  holiday: { value: 'holiday', label: 'Jour férié', color: 'warning', variant: 'subtle' },
  sick: { value: 'sick', label: 'Maladie', color: 'error', variant: 'subtle' },
  training: { value: 'training', label: 'Formation', color: 'info', variant: 'subtle' },
  meeting: { value: 'meeting', label: 'Réunion', color: 'info', variant: 'subtle' },
  personal: { value: 'personal', label: 'Personnel', color: 'error', variant: 'subtle' },
  reduced_hours: { value: 'reduced_hours', label: 'Réduction horaire', color: 'info', variant: 'subtle' },
  other: { value: 'other', label: 'Autre', color: 'neutral', variant: 'subtle' }
} as const

// Exception Type Options (With Icons)
export const EXCEPTION_TYPE_OPTIONS = EXCEPTION_TYPE_CONFIG_WITH_ICONS as SelectOption[]

// Exception Type
export type ExceptionTypeValue = (typeof EXCEPTION_TYPE_CONFIG)[keyof typeof EXCEPTION_TYPE_CONFIG]['value']

// Exception Type Color Helpers
export const getExceptionTypeColor = (
  type: string
): { color: ColorVariant; variant: 'solid' | 'outline' | 'soft' | 'subtle' } => {
  const config = EXCEPTION_TYPE_CONFIG[type as keyof typeof EXCEPTION_TYPE_CONFIG]
  return config ? { color: config.color, variant: config.variant } : { color: 'neutral', variant: 'subtle' }
}

export const getExceptionTypeColorOnly = (type: string): ColorVariant => getExceptionTypeColor(type).color

export const getExceptionTypeVariant = (type: string): 'solid' | 'outline' | 'soft' | 'subtle' =>
  getExceptionTypeColor(type).variant

export const getExceptionTypeLabel = (type: string): string => getLabel(type as any, EXCEPTION_TYPE_CONFIG)

// Exception Type Icon Helper (from with-icons config)
export const getExceptionTypeIcon = (type: string): string => {
  const config = EXCEPTION_TYPE_CONFIG_WITH_ICONS.find((item) => item.value === type)
  return config?.icon || 'i-lucide-circle'
}

// Phone Categories
export const PHONE_CATEGORIES = [
  { value: 'personal', label: 'Personnel' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'emergency', label: 'Urgence' }
] as const

export type PhoneCategory = (typeof PHONE_CATEGORIES)[number]['value']

// Phone Categories Configuration
export const PHONE_CATEGORIES_CONFIG = PHONE_CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category.value]: category.label }),
  {} as Record<PhoneCategory, string>
)

// Phone Category Helpers
export const getPhoneCategoryLabel = (category: PhoneCategory): string => getLabel(category, PHONE_CATEGORIES_CONFIG)

// Session Duration Options
export const SESSION_DURATIONS = [30, 45, 60, 75, 90, 105, 120]

// Specialization Options
export const SPECIALIZATIONS: SelectMenuItem[] = [
  // Group 1
  { type: 'label', label: 'Domaines principaux' },

  { label: 'Généraliste', value: 'general' },
  { label: 'Musculosquelettique / Orthopédique', value: 'musculoskeletal_orthopedic' },
  { label: 'Sport', value: 'sport' },
  { label: 'Neurologique', value: 'neurological' },
  { label: 'Cardio-respiratoire', value: 'cardiorespiratory' },
  { label: 'Pédiatrique', value: 'pediatric' },
  { label: 'Gériatrie', value: 'geriatric' },
  { label: 'Pelvien / Périnatalité', value: 'pelvic_perinatal' },
  { label: 'Rhumatologie', value: 'rheumatology' },
  { label: "Vestibulaire / Troubles de l'équilibre", value: 'vestibular_balance' },
  { label: 'Douleur chronique', value: 'chronic_pain' },

  // Separator
  { type: 'separator' },

  // Group 2
  { type: 'label', label: 'Techniques avancées' },

  { label: 'Thérapie manuelle orthopédique (TMO)', value: 'orthopedic_manual_therapy' },
  { label: 'Rééducation fonctionnelle', value: 'functional_rehabilitation' },
  { label: 'Dry Needling', value: 'dry_needling' },
  { label: 'Massage thérapeutique', value: 'therapeutic_massage' },
  { label: 'Cupping / Ventouses', value: 'cupping' },
  { label: 'Kinesio Taping', value: 'kinesio_taping' },
  { label: 'Électrothérapie', value: 'electrotherapy' },
  { label: 'Ultrasons', value: 'ultrasound' },
  { label: 'Ondes de choc', value: 'shockwave' },
  { label: 'Rééducation post-chirurgicale', value: 'post_surgical_rehab' },
  { label: 'Rééducation oncologique', value: 'oncology_rehab' }
]
// Specialization Configuration
export const SPECIALIZATIONS_CONFIG = SPECIALIZATIONS.reduce(
  (acc, spec) => {
    if (
      typeof spec === 'object' &&
      spec !== null &&
      'type' in spec &&
      (spec.type === 'label' || spec.type === 'separator')
    ) {
      return acc
    }
    if (typeof spec === 'object' && spec !== null && 'value' in spec && 'label' in spec) {
      return { ...acc, [spec.value]: spec.label }
    }
    return acc
  },
  {} as Record<string, string>
)

// Specialization Helpers
export const getSpecializationLabel = (value: string): string => getLabel(value as any, SPECIALIZATIONS_CONFIG, value)

// Day Abbreviation Helper
export const getDayAbbreviation = (dayOfWeek: string): string => {
  const label = PREFERRED_DAYS_CONFIG[dayOfWeek as keyof typeof PREFERRED_DAYS_CONFIG]
  return label ? label.slice(0, 3) : dayOfWeek
}

// Preferred Day Label Helper
export const getPreferredDayLabel = (day: string): string => getLabel(day as any, PREFERRED_DAYS_CONFIG)

// Location Color Helper
export const getLocationColor = (location: ConsultationLocation): ColorVariant =>
  LOCATION_COLOR_MAPPING[location]?.color || 'neutral'

// Location Variant Helper
export const getLocationVariant = (location: ConsultationLocation): 'solid' | 'outline' | 'soft' | 'subtle' =>
  LOCATION_COLOR_MAPPING[location]?.variant || 'soft'
