import { describe, it, expect } from 'vitest'
import { calculateInsuranceCoverage } from './insurance-calculation'

describe('calculateInsuranceCoverage', () => {
  describe('fixed co-pay rule', () => {
    it('should calculate co-pay and insurance amounts correctly with fixed rule', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'fixed' as const,
        coPayAmountCents: 1000,
        coPayPercentage: null
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(1000)
      expect(result.insuranceCents).toBe(4000)
      expect(result.totalCents).toBe(5000)
    })

    it('should handle zero co-pay with fixed rule', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'fixed' as const,
        coPayAmountCents: 0,
        coPayPercentage: null
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(0)
      expect(result.insuranceCents).toBe(5000)
      expect(result.totalCents).toBe(5000)
    })

    it('should handle full co-pay with fixed rule', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'fixed' as const,
        coPayAmountCents: 5000,
        coPayPercentage: null
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(5000)
      expect(result.insuranceCents).toBe(0)
      expect(result.totalCents).toBe(5000)
    })
  })

  describe('percentage co-pay rule', () => {
    it('should calculate co-pay and insurance amounts correctly with percentage rule', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 20
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(1000)
      expect(result.insuranceCents).toBe(4000)
      expect(result.totalCents).toBe(5000)
    })

    it('should calculate with 50% co-pay', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 50
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(2500)
      expect(result.insuranceCents).toBe(2500)
      expect(result.totalCents).toBe(5000)
    })

    it('should handle 0% co-pay (100% coverage)', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 0
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(0)
      expect(result.insuranceCents).toBe(5000)
      expect(result.totalCents).toBe(5000)
    })

    it('should handle 100% co-pay (0% coverage)', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 100
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(5000)
      expect(result.insuranceCents).toBe(0)
      expect(result.totalCents).toBe(5000)
    })

    it('should handle uneven session prices with percentage', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 6500,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 30
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(1950)
      expect(result.insuranceCents).toBe(4550)
      expect(result.totalCents).toBe(6500)
    })
  })

  describe('edge cases', () => {
    it('should handle minimum session price (100 cents = 1 DH)', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 100,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 50
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(50)
      expect(result.insuranceCents).toBe(50)
      expect(result.totalCents).toBe(100)
    })

    it('should handle very small percentage with rounding', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 9999,
        coPayRule: 'percentage' as const,
        coPayAmountCents: null,
        coPayPercentage: 1
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      expect(result.coPayCents).toBe(100)
      expect(result.insuranceCents).toBe(9899)
      expect(result.totalCents).toBe(9999)
    })
  })

  describe('coverage percentage attribute', () => {
    it('should calculate coverage percentage from total', () => {
      const insuranceCompany = {
        id: 'insurance-1',
        sessionPriceCents: 5000,
        coPayRule: 'fixed' as const,
        coPayAmountCents: 1000,
        coPayPercentage: null,
        coveragePercentage: 80
      }

      const result = calculateInsuranceCoverage(insuranceCompany)

      const actualCoveragePercentage = Math.round((result.insuranceCents / result.totalCents) * 100)
      expect(actualCoveragePercentage).toBe(80)
    })
  })
})
