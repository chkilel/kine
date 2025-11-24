// ------ app/pages/patients/index.vue
export const STATUS_CONFIG = {
  active: { color: 'success' as const, label: 'Actif' },
  inactive: { color: 'warning' as const, label: 'Inactif' },
  discharged: { color: 'error' as const, label: 'Sorti' },
  archived: { color: 'neutral' as const, label: 'Archivé' }
}

// Derived filter options from STATUS_CONFIG
export const STATUS_FILTER_OPTIONS = [
  { label: 'Statut: Tous', value: 'all' },
  ...Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ label, value }))
]

export const PLAN_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planifié' },
  { value: 'ongoing', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' }
]

export const INSURANCE_COVERAGE_PTIONS = [
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
