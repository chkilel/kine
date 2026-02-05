// =================================================================================================
// Document Categories Constants
// =================================================================================================

import type { DocumentCategory } from '../types/base.types'

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
  referral: { label: 'Lettre de recommandation', icon: 'i-hugeicons-mail-01', color: 'success' },
  imaging: { label: 'Radiologie', icon: 'i-hugeicons-x-ray', color: 'primary' },
  lab_results: { label: 'Laboratoire', icon: 'i-hugeicons-test-tube-01', color: 'secondary' },
  treatment_notes: { label: 'Notes de traitement', icon: 'i-hugeicons-medical-file', color: 'info' },
  prescriptions: { label: 'Ordonnance', icon: 'i-hugeicons-prescription', color: 'warning' },
  other: { label: 'Autre', icon: 'i-hugeicons-file-02', color: 'neutral' }
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
