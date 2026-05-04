import { describe, it, expect } from 'vitest'
import { paymentCreateSchema, paymentRequestBodySchema, paymentFormSchema } from './payment'

describe('invoicing-schemas', () => {
  describe('paymentCreateSchema', () => {
    it('requires type and method (method no longer optional)', () => {
      const result = paymentCreateSchema.safeParse({
        organizationId: 'org-1',
        patientId: 'patient-1',
        recordedById: 'user-1',
        amountCents: 5000,
        paidOn: '2026-03-24'
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid payment with required method', () => {
      const result = paymentCreateSchema.safeParse({
        organizationId: 'org-1',
        patientId: 'patient-1',
        recordedById: 'user-1',
        amountCents: 5000,
        type: 'session_payment',
        method: 'cash',
        paidOn: '2026-03-24'
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type values', () => {
      const result = paymentCreateSchema.safeParse({
        organizationId: 'org-1',
        patientId: 'patient-1',
        recordedById: 'user-1',
        amountCents: 5000,
        type: 'payment',
        method: 'cash',
        paidOn: '2026-03-24'
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid method values', () => {
      const result = paymentCreateSchema.safeParse({
        organizationId: 'org-1',
        patientId: 'patient-1',
        recordedById: 'user-1',
        amountCents: 5000,
        type: 'session_payment',
        method: 'credit_usage',
        paidOn: '2026-03-24'
      })
      expect(result.success).toBe(false)
    })

    it('rejects null method', () => {
      const result = paymentCreateSchema.safeParse({
        organizationId: 'org-1',
        patientId: 'patient-1',
        recordedById: 'user-1',
        amountCents: 5000,
        type: 'session_payment',
        method: null,
        paidOn: '2026-03-24'
      })
      expect(result.success).toBe(false)
    })

    it('defaults type to session_payment', () => {
      const result = paymentCreateSchema.parse({
        organizationId: 'org-1',
        patientId: 'patient-1',
        recordedById: 'user-1',
        amountCents: 5000,
        method: 'cash',
        paidOn: '2026-03-24'
      })
      expect(result.type).toBe('session_payment')
    })
  })

  describe('paymentRequestBodySchema', () => {
    it('requires method', () => {
      const result = paymentRequestBodySchema.safeParse({
        patientId: 'patient-1',
        amountCents: 5000,
        type: 'session_payment'
      })
      expect(result.success).toBe(false)
    })

    it('validates session_items for session_payment', () => {
      const result = paymentRequestBodySchema.safeParse({
        patientId: 'patient-1',
        amountCents: 5000,
        type: 'session_payment',
        method: 'cash',
        appointmentItems: [{ treatmentSessionId: 'session-1', amountCents: 5000 }]
      })
      expect(result.success).toBe(true)
    })

    it('accepts empty appointmentItems as optional', () => {
      const result = paymentRequestBodySchema.safeParse({
        patientId: 'patient-1',
        amountCents: 5000,
        type: 'session_payment',
        method: 'cash'
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type values', () => {
      const result = paymentRequestBodySchema.safeParse({
        patientId: 'patient-1',
        amountCents: 5000,
        type: 'credit_usage',
        method: 'cash'
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid method values', () => {
      const result = paymentRequestBodySchema.safeParse({
        patientId: 'patient-1',
        amountCents: 5000,
        type: 'session_payment',
        method: 'credit_usage'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('paymentFormSchema', () => {
    it('requires both type and method', () => {
      const result = paymentFormSchema.safeParse({
        type: 'session_payment',
        method: 'cash',
        amount: 50
      })
      expect(result.success).toBe(true)
    })

    it('rejects without method', () => {
      const result = paymentFormSchema.safeParse({
        type: 'session_payment',
        amount: 50
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid type', () => {
      const result = paymentFormSchema.safeParse({
        type: 'payment',
        method: 'cash',
        amount: 50
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid method', () => {
      const result = paymentFormSchema.safeParse({
        type: 'session_payment',
        method: 'credit_usage',
        amount: 50
      })
      expect(result.success).toBe(false)
    })
  })
})
