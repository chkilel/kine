import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasTimeConflict } from './availability-utils'

describe('availability-utils', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('hasTimeConflict', () => {
    it('2.1.1 should return false when new period ends before existing with gap', () => {
      const result = hasTimeConflict('10:00', '11:00', '08:00', '09:00', 15)
      expect(result).toBe(false)
    })

    it('2.1.2 should return false when new period starts after existing with gap', () => {
      const result = hasTimeConflict('10:00', '11:00', '12:00', '13:00', 15)
      expect(result).toBe(false)
    })

    it('2.1.3 should return true when new period overlaps existing start', () => {
      const result = hasTimeConflict('10:00', '11:00', '09:30', '10:30', 0)
      expect(result).toBe(true)
    })

    it('2.1.4 should return true when new period overlaps existing end', () => {
      const result = hasTimeConflict('10:00', '11:00', '10:30', '11:30', 0)
      expect(result).toBe(true)
    })

    it('2.1.5 should return true when new period completely contains existing', () => {
      const result = hasTimeConflict('10:00', '11:00', '09:00', '12:00', 0)
      expect(result).toBe(true)
    })

    it('2.1.6 should return true when existing period completely contains new', () => {
      const result = hasTimeConflict('10:00', '12:00', '10:30', '11:30', 0)
      expect(result).toBe(true)
    })

    it('2.1.7 should return true for exact same times', () => {
      const result = hasTimeConflict('10:00', '11:00', '10:00', '11:00', 0)
      expect(result).toBe(true)
    })

    it('2.1.8 should return false with exact boundary times and zero gap', () => {
      const result = hasTimeConflict('10:00', '11:00', '09:00', '10:00', 0)
      expect(result).toBe(false)
    })

    it('2.1.9 should return true when gap is violated at end boundary', () => {
      const result = hasTimeConflict('10:00', '11:00', '09:00', '09:50', 15)
      expect(result).toBe(true)
    })

    it('2.1.10 should return true when gap is violated at start boundary', () => {
      const result = hasTimeConflict('10:00', '11:00', '10:50', '11:50', 15)
      expect(result).toBe(true)
    })

    it('2.1.11 should use custom gap when specified', () => {
      const result = hasTimeConflict('10:00', '11:00', '08:00', '09:29', 15)
      expect(result).toBe(false)
    })

    it('2.1.12 should respect custom gap value', () => {
      const result = hasTimeConflict('10:00', '11:00', '08:00', '09:30', 30)
      expect(result).toBe(false)
    })

    it('2.1.13 should handle times across midnight in same day', () => {
      const result = hasTimeConflict('23:00', '23:30', '23:00', '23:20', 0)
      expect(result).toBe(true)
    })

    it('2.1.14 should handle boundary case with minimum gap', () => {
      const result = hasTimeConflict('10:00', '11:00', '08:30', '09:45', 15)
      expect(result).toBe(false)
    })

    it('2.1.15 should return true when gap is insufficient at exact boundary', () => {
      const result = hasTimeConflict('10:00', '11:00', '08:30', '09:46', 15)
      expect(result).toBe(true)
    })
  })
})
