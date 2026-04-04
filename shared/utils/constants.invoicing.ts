import type { PaymentDelay, PaymentMethod, PaymentType } from '../types/base.types'

// =============================================================================
// Payment Methods Configuration
// =============================================================================

export const PAYMENT_METHODS_CONFIG = {
  cash: {
    label: 'Espèces',
    icon: 'i-hugeicons-money-01',
    color: 'success',
    variant: 'subtle'
  },
  'bank-card': {
    label: 'Carte bancaire',
    icon: 'i-hugeicons-credit-card',
    color: 'primary',
    variant: 'subtle'
  },
  check: {
    label: 'Chèque',
    icon: 'i-hugeicons-pay-by-check',
    color: 'info',
    variant: 'subtle'
  },
  'bank-transfer': {
    label: 'Virement',
    icon: 'i-hugeicons-bank',
    color: 'warning',
    variant: 'subtle'
  },
  deposit: {
    label: 'Solde patient',
    icon: 'i-hugeicons-wallet-02',
    color: 'neutral',
    variant: 'subtle'
  }
} as const

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHODS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key,
  icon: item.icon
}))

export const PAYMENT_FUNDING_METHOD_OPTIONS = Object.entries(PAYMENT_METHODS_CONFIG)
  .filter(([key]) => key !== 'deposit')
  .map(([key, item]) => ({
    label: item.label,
    value: key,
    icon: item.icon
  }))

export const getPaymentMethodLabel = (method: PaymentMethod) => PAYMENT_METHODS_CONFIG[method].label || method
export const getPaymentMethodColor = (method: PaymentMethod) => PAYMENT_METHODS_CONFIG[method].color || 'neutral'
export const getPaymentMethodVariant = (method: PaymentMethod) => PAYMENT_METHODS_CONFIG[method].variant || 'soft'
export const getPaymentMethodIcon = (method: PaymentMethod) =>
  PAYMENT_METHODS_CONFIG[method].icon || 'i-hugeicons-money-01'

// =============================================================================
// Payment Delays Configuration
// =============================================================================

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

export const getPaymentDelayLabel = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].label || delay
export const getPaymentDelayIcon = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].icon || 'i-hugeicons-time-01'
export const getPaymentDelayColor = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].color || 'neutral'
export const getPaymentDelayVariant = (delay: PaymentDelay) => PAYMENT_DELAYS_CONFIG[delay].variant || 'soft'

// =============================================================================
// Payment Types Configuration
// =============================================================================

export const PAYMENT_TYPE_CONFIG = {
  session_payment: {
    label: 'Paiement',
    description: 'Enregistrer un paiement pour cette séance',
    submitLabel: 'Enregistrer le paiement',
    bannerMessage: ''
  },
  session_refund: {
    label: 'Remboursement de séance',
    description: 'Rembourser un paiement de séance',
    submitLabel: 'Enregistrer le remboursement',
    bannerMessage: ''
  },
  deposit_add: {
    label: 'Avance',
    description: 'Ajouter une avance pour soins futurs',
    submitLabel: "Enregistrer l'avance",
    bannerMessage: 'Cette avance sera disponible pour les futures séances.'
  },
  deposit_refund: {
    label: 'Remboursement',
    description: 'Rembourser une avance non utilisée',
    submitLabel: 'Enregistrer le remboursement',
    bannerMessage: "Le remboursement réduit le solde d'avance du patient."
  }
} as const

export const PAYMENT_TYPE_OPTIONS = (Object.keys(PAYMENT_TYPE_CONFIG) as PaymentType[]).map((key) => ({
  value: key,
  label: PAYMENT_TYPE_CONFIG[key].label,
  description: PAYMENT_TYPE_CONFIG[key].description
}))

export const getPaymentTypeLabel = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].label
export const getPaymentTypeDescription = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].description
export const getPaymentTypeSubmitLabel = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].submitLabel
export const getPaymentTypeBannerMessage = (type: PaymentType): string => PAYMENT_TYPE_CONFIG[type].bannerMessage
