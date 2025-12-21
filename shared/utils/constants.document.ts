import type { DocumentCategory } from '../types/patient.types'

// =================================================================================================
// Document Categories Constants
// =================================================================================================

// Valid document types for patient files
export const VALID_DOCUMENT_TYPES = [
  'referral',
  'imaging',
  'lab_results',
  'treatment_notes',
  'prescriptions',
  'other'
] as const

export const DOCUMENT_CATEGORIES_CONFIG = {
  referral: { label: 'Lettre de recommandation', icon: 'i-lucide-file-text', color: 'neutral' },
  imaging: { label: 'Radiologie', icon: 'i-lucide-image', color: 'primary' },
  lab_results: { label: 'Résultats de laboratoire', icon: 'i-lucide-file-text', color: 'secondary' },
  treatment_notes: { label: 'Notes de traitement', icon: 'i-lucide-file-text', color: 'info' },
  prescriptions: { label: 'Ordonnance', icon: 'i-lucide-pill', color: 'warning' },
  other: { label: 'Autre', icon: 'i-lucide-file-text', color: 'neutral' }
} as const

// Document Category Options
export const DOCUMENT_CATEGORY_OPTIONS = Object.entries(DOCUMENT_CATEGORIES_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  icon: item.icon,
  color: item.color
}))

// Document Category Helpers
export const getDocumentCategoryLabel = (category: DocumentCategory) => DOCUMENT_CATEGORIES_CONFIG[category].label
export const getDocumentIcon = (category: DocumentCategory) => DOCUMENT_CATEGORIES_CONFIG[category].icon
export const getDocumentColor = (category: DocumentCategory) => DOCUMENT_CATEGORIES_CONFIG[category]?.color || 'neutral'
