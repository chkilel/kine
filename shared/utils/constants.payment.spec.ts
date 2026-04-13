import { describe, it, expect } from 'vitest'
import {
  getPaymentMethodLabel,
  getPaymentMethodColor,
  getPaymentMethodIcon,
  getPaymentTypeLabel,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_FUNDING_METHOD_OPTIONS
} from './constants.payment'

describe('constants-invoicing', () => {
  describe('getPaymentMethodLabel', () => {
    it('returns "Solde patient" for deposit', () => {
      expect(getPaymentMethodLabel('deposit')).toBe('Solde patient')
    })

    it('returns "Espèces" for cash', () => {
      expect(getPaymentMethodLabel('cash')).toBe('Espèces')
    })

    it('returns "Carte bancaire" for bank-card', () => {
      expect(getPaymentMethodLabel('bank-card')).toBe('Carte bancaire')
    })

    it('returns "Chèque" for check', () => {
      expect(getPaymentMethodLabel('check')).toBe('Chèque')
    })

    it('returns "Virement" for bank-transfer', () => {
      expect(getPaymentMethodLabel('bank-transfer')).toBe('Virement')
    })
  })

  describe('getPaymentMethodColor', () => {
    it('returns valid color for deposit', () => {
      expect(getPaymentMethodColor('deposit')).toBe('neutral')
    })

    it('returns valid color for cash', () => {
      expect(getPaymentMethodColor('cash')).toBe('success')
    })
  })

  describe('getPaymentMethodIcon', () => {
    it('returns valid icon for deposit', () => {
      expect(getPaymentMethodIcon('deposit')).toBe('i-hugeicons-wallet-02')
    })

    it('returns valid icon for cash', () => {
      expect(getPaymentMethodIcon('cash')).toBe('i-hugeicons-money-01')
    })
  })

  describe('getPaymentTypeLabel', () => {
    it('returns "Paiement" for session_payment', () => {
      expect(getPaymentTypeLabel('session_payment')).toBe('Paiement')
    })

    it('returns "Avance" for deposit_add', () => {
      expect(getPaymentTypeLabel('deposit_add')).toBe('Avance')
    })

    it('returns "Remboursement de séance" for session_refund', () => {
      expect(getPaymentTypeLabel('session_refund')).toBe('Remboursement de séance')
    })

    it('returns "Remboursement" for deposit_refund', () => {
      expect(getPaymentTypeLabel('deposit_refund')).toBe('Remboursement')
    })
  })

  describe('PAYMENT_METHOD_OPTIONS', () => {
    it('contains all 5 method entries', () => {
      expect(PAYMENT_METHOD_OPTIONS).toHaveLength(5)
      expect(PAYMENT_METHOD_OPTIONS.map((o) => o.value)).toContain('deposit')
    })
  })

  describe('PAYMENT_FUNDING_METHOD_OPTIONS', () => {
    it('contains 4 entries (excludes deposit)', () => {
      expect(PAYMENT_FUNDING_METHOD_OPTIONS).toHaveLength(4)
      expect(PAYMENT_FUNDING_METHOD_OPTIONS.map((o) => o.value)).not.toContain('deposit')
    })
  })

  describe('PAYMENT_TYPE_OPTIONS', () => {
    it('contains all 4 type entries', () => {
      expect(PAYMENT_TYPE_OPTIONS).toHaveLength(4)
      const values = PAYMENT_TYPE_OPTIONS.map((o) => o.value)
      expect(values).toContain('session_payment')
      expect(values).toContain('session_refund')
      expect(values).toContain('deposit_add')
      expect(values).toContain('deposit_refund')
    })
  })
})
