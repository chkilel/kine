import { describe, it, expect } from 'vitest'
import {
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  paymentMethodSchema,
  paymentTypeSchema,
  paymentFundingMethodSchema
} from './base.types'

describe('payment-types', () => {
  describe('PAYMENT_METHODS', () => {
    it('includes all 5 values', () => {
      expect(PAYMENT_METHODS).toContain('deposit')
      expect(PAYMENT_METHODS).toContain('cash')
      expect(PAYMENT_METHODS).toContain('bank-card')
      expect(PAYMENT_METHODS).toContain('check')
      expect(PAYMENT_METHODS).toContain('bank-transfer')
      expect(PAYMENT_METHODS).toHaveLength(5)
    })
  })

  describe('PAYMENT_TYPES', () => {
    it('includes all 4 values', () => {
      expect(PAYMENT_TYPES).toContain('session_payment')
      expect(PAYMENT_TYPES).toContain('session_refund')
      expect(PAYMENT_TYPES).toContain('deposit_add')
      expect(PAYMENT_TYPES).toContain('deposit_refund')
      expect(PAYMENT_TYPES).toHaveLength(4)
    })
  })

  describe('paymentMethodSchema', () => {
    it('accepts valid method values', () => {
      expect(paymentMethodSchema.parse('cash')).toBe('cash')
      expect(paymentMethodSchema.parse('bank-card')).toBe('bank-card')
      expect(paymentMethodSchema.parse('check')).toBe('check')
      expect(paymentMethodSchema.parse('bank-transfer')).toBe('bank-transfer')
      expect(paymentMethodSchema.parse('deposit')).toBe('deposit')
    })

    it('rejects invalid method values', () => {
      expect(() => paymentMethodSchema.parse('credit_usage')).toThrow()
      expect(() => paymentMethodSchema.parse('payment')).toThrow()
      expect(() => paymentMethodSchema.parse('invalid')).toThrow()
    })

    it('rejects null/undefined', () => {
      expect(() => paymentMethodSchema.parse(null)).toThrow()
      expect(() => paymentMethodSchema.parse(undefined)).toThrow()
    })
  })

  describe('paymentTypeSchema', () => {
    it('accepts valid type values', () => {
      expect(paymentTypeSchema.parse('session_payment')).toBe('session_payment')
      expect(paymentTypeSchema.parse('session_refund')).toBe('session_refund')
      expect(paymentTypeSchema.parse('deposit_add')).toBe('deposit_add')
      expect(paymentTypeSchema.parse('deposit_refund')).toBe('deposit_refund')
    })

    it('rejects invalid type values', () => {
      expect(() => paymentTypeSchema.parse('payment')).toThrow()
      expect(() => paymentTypeSchema.parse('deposit')).toThrow()
      expect(() => paymentTypeSchema.parse('credit_usage')).toThrow()
      expect(() => paymentTypeSchema.parse('refund')).toThrow()
    })

    it('rejects null/undefined', () => {
      expect(() => paymentTypeSchema.parse(null)).toThrow()
      expect(() => paymentTypeSchema.parse(undefined)).toThrow()
    })
  })

  describe('paymentFundingMethodSchema', () => {
    it('excludes deposit method', () => {
      expect(paymentFundingMethodSchema.parse('cash')).toBe('cash')
      expect(paymentFundingMethodSchema.parse('bank-card')).toBe('bank-card')
      expect(paymentFundingMethodSchema.parse('check')).toBe('check')
      expect(paymentFundingMethodSchema.parse('bank-transfer')).toBe('bank-transfer')
    })

    it('rejects deposit', () => {
      expect(() => paymentFundingMethodSchema.parse('deposit')).toThrow()
    })
  })
})
