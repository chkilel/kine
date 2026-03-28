// =============================================================================
// Invoicing & Payment Constants
// =============================================================================

// Organization Payment Methods (how the organization receives payments)
export const PAYMENT_METHODS = ['cash', 'bank-card', 'check', 'bank-transfer'] as const
export type PaymentMethode = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHODS_CONFIG = {
  cash: { label: 'Espèces', icon: 'i-hugeicons-money-01', color: 'success', variant: 'subtle' },
  'bank-card': { label: 'Carte bancaire', icon: 'i-hugeicons-credit-card', color: 'primary', variant: 'subtle' },
  check: { label: 'Chèque', icon: 'i-hugeicons-check-01', color: 'info', variant: 'subtle' },
  'bank-transfer': { label: 'Virement', icon: 'i-hugeicons-bank-01', color: 'warning', variant: 'subtle' }
} as const

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHODS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Getters for Organization Payment Methods
export const getPaymentMethodLabel = (method: PaymentMethode) => PAYMENT_METHODS_CONFIG[method].label || method
export const getPaymentMethodColor = (method: PaymentMethode) => PAYMENT_METHODS_CONFIG[method].color || 'neutral'
export const getPaymentMethodVariant = (method: PaymentMethode) => PAYMENT_METHODS_CONFIG[method].variant || 'soft'
export const getPaymentMethodIcon = (method: PaymentMethode) =>
  PAYMENT_METHODS_CONFIG[method].icon || 'i-hugeicons-money-01'

// Payment Delays (for invoicing/billing)
export const PAYMENT_DELAYS = ['immediate', '7', '15', '30', 'end-of-month'] as const
export type PaymentDelay = (typeof PAYMENT_DELAYS)[number]

export const PAYMENT_DELAYS_CONFIG = {
  immediate: { label: 'Immédiat', icon: 'i-hugeicons-time-01', color: 'success', variant: 'subtle' },
  '7': { label: '7 jours', icon: 'i-hugeicons-calendar-01', color: 'info', variant: 'subtle' },
  '15': { label: '15 jours', icon: 'i-hugeicons-calendar-02', color: 'primary', variant: 'subtle' },
  '30': { label: '30 jours', icon: 'i-hugeicons-calendar-03', color: 'warning', variant: 'subtle' },
  'end-of-month': { label: 'Fin de mois', icon: 'i-hugeicons-calendar-04', color: 'error', variant: 'subtle' }
} as const

export const PAYMENT_DELAY_OPTIONS = Object.entries(PAYMENT_DELAYS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Getters for Payment Delays
export const getPaymentDelayLabel = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].label || delay
export const getPaymentDelayIcon = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].icon || 'i-hugeicons-time-01'
export const getPaymentDelayColor = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].color || 'neutral'
export const getPaymentDelayVariant = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].variant || 'soft'

// Valid payment types
export const PAYMENT_TYPES = ['payment', 'deposit', 'credit_usage', 'refund'] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

// Payment Type Configuration
export const PAYMENT_TYPE_CONFIG = {
  payment: {
    label: 'Paiement',
    description: 'Enregistrer un paiement pour cette séance',
    submitLabel: 'Enregistrer le paiement',
    bannerMessage: ''
  },
  deposit: {
    label: 'Avance',
    description: 'Ajouter une avance pour soins futurs',
    submitLabel: "Enregistrer l'avance",
    bannerMessage: 'Cette avance sera disponible pour les futures séances.'
  },
  credit_usage: {
    label: 'Utiliser solde',
    description: "Utiliser l'avance existante",
    submitLabel: "Utiliser l'avance",
    bannerMessage: ''
  },
  refund: {
    label: 'Remboursement',
    description: 'Rembourser une avance non utilisée',
    submitLabel: 'Enregistrer le remboursement',
    bannerMessage: "Le remboursement réduit le solde d'avance du patient."
  }
} as const

// Payment Type Options
export const PAYMENT_TYPE_OPTIONS = (Object.keys(PAYMENT_TYPE_CONFIG) as PaymentType[]).map((key) => ({
  value: key,
  label: PAYMENT_TYPE_CONFIG[key].label,
  description: PAYMENT_TYPE_CONFIG[key].description
}))

// Getters for payment types
export const getPaymentTypeLabel = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].label
export const getPaymentTypeDescription = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].description
export const getPaymentTypeSubmitLabel = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].submitLabel
export const getPaymentTypeBannerMessage = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].bannerMessage
