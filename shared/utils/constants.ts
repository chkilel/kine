// ------ app/pages/patients/index.vue
export const STATUS_CONFIG = {
  active: { color: 'success' as const, label: 'Actif' },
  inactive: { color: 'warning' as const, label: 'Inactif' },
  discharged: { color: 'error' as const, label: 'Sorti' },
  archived: { color: 'neutral' as const, label: 'Archivé' }
}

export const STATUS_FILTER_OPTIONS = [
  { label: 'Statut: Tous', value: 'all' },
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Sorti', value: 'discharged' },
  { label: 'Archivé', value: 'archived' }
]
