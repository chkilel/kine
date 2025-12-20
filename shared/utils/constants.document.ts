import type { DocumentCategory } from '../types/patient.types'
import { createSelectOptions, getLabel, type ColorVariant } from '.'

// Document Categories Configuration
export const DOCUMENT_CATEGORIES_CONFIG = {
  referral: 'Lettre de recommandation',
  imaging: 'Radiologie',
  lab_results: 'Résultats de laboratoire',
  treatment_notes: 'Notes de traitement',
  prescriptions: 'Ordonnance',
  other: 'Autre'
} as const satisfies Record<DocumentCategory, string>


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


// Document Options
export const DOCUMENT_CATEGORY_OPTIONS = createSelectOptions(DOCUMENT_CATEGORIES_CONFIG)

// Document Category Helpers
export const getDocumentCategoryLabel = (category: DocumentCategory): string =>
  getLabel(category, DOCUMENT_CATEGORIES_CONFIG)

// Document Icon Helper
export const getDocumentIcon = (category: DocumentCategory): string =>
  DOCUMENT_ICONS_CONFIG[category] || 'i-lucide-file-text'

// Document Color Helper
export const getDocumentColor = (category: DocumentCategory): ColorVariant =>
  DOCUMENT_COLORS_CONFIG[category] || 'neutral'