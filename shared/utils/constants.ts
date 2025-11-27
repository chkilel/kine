// ------ app/pages/patients/index.vue
export const STATUS_CONFIG = {
  active: { color: 'success' as const, label: 'Actif' },
  inactive: { color: 'warning' as const, label: 'Inactif' },
  discharged: { color: 'error' as const, label: 'Sorti' },
  archived: { color: 'neutral' as const, label: 'Archivé' }
} as const

// Derived filter options from STATUS_CONFIG
export const STATUS_FILTER_OPTIONS = [
  { label: 'Statut: Tous', value: 'all' },
  ...Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ label, value }))
]

// Derived Select options for patient status from STATUS_CONFIG
export const PATIENT_STATUS_OPTIONS = [...Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ label, value }))]

export const INSURANCE_COVERAGE_OPTIONS = [
  { value: 'not_required', label: 'Non nécessaire' }, // Patient sans mutuelle ou paie directement
  { value: 'not_provided', label: 'Informations manquantes' }, // Attente des infos de mutuelle / Sécurité Sociale
  { value: 'to_verify', label: 'À vérifier' }, // Infos reçues mais pas encore validées
  { value: 'awaiting_agreement', label: "En attente d'accord" }, // Attente d'accord préalable de l'organisme
  { value: 'covered', label: 'Prise en charge acceptée' }, // Accord total obtenu
  { value: 'partially_covered', label: 'Prise en charge partielle' }, // Une partie reste à la charge du patient
  { value: 'refused', label: 'Prise en charge refusée' }, // Accord refusé par l'organisme
  { value: 'expired', label: 'Prise en charge expirée' }, // Accord dépassé ou non renouvelé
  { value: 'cancelled', label: 'Prise en charge annulée' } // Annulée à la demande du patient ou de l'assureur
]

// Relationships
export const RELATIONSHIPS = [
  { label: 'Époux', value: 'husband' },
  { label: 'Épouse', value: 'wife' },

  { label: 'Mère', value: 'mother' },
  { label: 'Père', value: 'father' },

  { label: 'Fille', value: 'daughter' },
  { label: 'Fils', value: 'son' },

  { label: 'Sœur', value: 'sister' },
  { label: 'Frère', value: 'brother' },

  { label: 'Grand-mère', value: 'grandmother' },
  { label: 'Grand-père', value: 'grandfather' },

  { label: 'Petite-fille', value: 'granddaughter' },
  { label: 'Petit-fils', value: 'grandson' },

  { label: 'Tante', value: 'aunt' },
  { label: 'Oncle', value: 'uncle' },

  { label: 'Cousine', value: 'female_cousin' },
  { label: 'Cousin', value: 'male_cousin' },

  { label: 'Amie', value: 'female_friend' },
  { label: 'Ami', value: 'male_friend' },

  { label: 'Voisine', value: 'female_neighbor' },
  { label: 'Voisin', value: 'male_neighbor' },

  { label: 'Collègue', value: 'colleague' },
  { label: 'Connaissance', value: 'acquaintance' },
  { label: 'Autre', value: 'other' }
]

export const getRelationshipLabel = (value: string): string => {
  const relationship = RELATIONSHIPS.find((r) => r.value === value)
  return relationship?.label || value
}

// Treatment plan status configuration
export const TREATMENT_PLAN_STATUS_CONFIG = {
  planned: { label: 'Planifié', color: 'warning' as const },
  ongoing: { label: 'Actif', color: 'success' as const },
  completed: { label: 'Terminé', color: 'neutral' as const },
  paused: { label: 'En pause', color: 'warning' as const },
  cancelled: { label: 'Annulé', color: 'error' as const }
} as const

export const PLAN_STATUS_OPTIONS = [
  ...Object.entries(TREATMENT_PLAN_STATUS_CONFIG).map(([value, { label }]) => ({ label, value }))
] as const

// Helper function to format treatment plan status
export const formatTreatmentPlanStatus = (status: keyof typeof TREATMENT_PLAN_STATUS_CONFIG) => {
  return (
    TREATMENT_PLAN_STATUS_CONFIG[status] || {
      label: status,
      color: 'neutral' as const
    }
  )
}

// Docuements
export const DOCUMENT_TYPE_OPTIONS = [
  { label: 'Radiologie', value: 'Radiologie' },
  { label: 'Analyse', value: 'Analyse' },
  { label: 'Prescription', value: 'Prescription' },
  { label: 'Rapport médical', value: 'Rapport médical' },
  { label: 'Autre', value: 'Autre' }
]
