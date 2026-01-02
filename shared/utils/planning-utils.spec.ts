import { describe, it, expect } from 'vitest'
import type { WeeklyAvailabilityTemplate, AvailabilityException } from '../types/availability.types'
import {
  getEffectiveAvailability,
  generateTimeSlots,
  subtractBookedPeriods,
  hasConflict,
  addSecondsToTime,
  calculateEndTime,
  normalizeTimeFormat
} from './planning-utils'
import type { BookedPeriod, TimeRange } from './planning-utils'

describe('planning-utils', () => {
  describe('getEffectiveAvailability', () => {
    it('2.2.1 should return availability from weekly templates only (no exceptions)', () => {
      const templates: WeeklyAvailabilityTemplate[] = [
        {
          id: '1',
          dayOfWeek: 'mon',
          startTime: '09:00:00',
          endTime: '12:00:00',
          location: 'clinic',
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          dayOfWeek: 'mon',
          startTime: '14:00:00',
          endTime: '17:00:00',
          location: 'clinic',
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const exceptions: AvailabilityException[] = []
      const date = '2026-01-12'

      const result = getEffectiveAvailability(date, templates, exceptions)

      expect(result).toEqual([
        { start: '09:00:00', end: '12:00:00' },
        { start: '14:00:00', end: '17:00:00' }
      ])
    })

    it('2.2.2 should add availability exceptions to normal schedule', () => {
      const templates: WeeklyAvailabilityTemplate[] = [
        {
          id: '1',
          dayOfWeek: 'mon',
          startTime: '09:00:00',
          endTime: '12:00:00',
          location: 'clinic',
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const exceptions: AvailabilityException[] = [
        {
          id: '1',
          date: '2026-01-12',
          isAvailable: true,
          startTime: '13:00:00',
          endTime: '15:00:00',
          reason: null,
          notes: null,
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const date = '2026-01-12'

      const result = getEffectiveAvailability(date, templates, exceptions)

      expect(result).toEqual([
        { start: '09:00:00', end: '12:00:00' },
        { start: '13:00:00', end: '15:00:00' }
      ])
    })

    it('2.2.3 should return empty array with full-day unavailability exception', () => {
      const templates: WeeklyAvailabilityTemplate[] = [
        {
          id: '1',
          dayOfWeek: 'mon',
          startTime: '09:00:00',
          endTime: '17:00:00',
          location: 'clinic',
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const exceptions: AvailabilityException[] = [
        {
          id: '1',
          date: '2026-01-12',
          isAvailable: false,
          startTime: null,
          endTime: null,
          reason: 'vacation',
          notes: null,
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const date = '2026-01-12'

      const result = getEffectiveAvailability(date, templates, exceptions)

      expect(result).toEqual([])
    })

    it('2.2.4 should subtract partial unavailability exceptions from availability', () => {
      const templates: WeeklyAvailabilityTemplate[] = [
        {
          id: '1',
          dayOfWeek: 'mon',
          startTime: '09:00:00',
          endTime: '17:00:00',
          location: 'clinic',
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const exceptions: AvailabilityException[] = [
        {
          id: '1',
          date: '2026-01-12',
          isAvailable: false,
          startTime: '12:00:00',
          endTime: '13:00:00',
          reason: 'personal',
          notes: null,
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const date = '2026-01-12'

      const result = getEffectiveAvailability(date, templates, exceptions)

      expect(result).toEqual([
        { start: '09:00:00', end: '12:00:00' },
        { start: '13:00:00', end: '17:00:00' }
      ])
    })

    it('2.2.5 should handle combination of templates and exceptions', () => {
      const templates: WeeklyAvailabilityTemplate[] = [
        {
          id: '1',
          dayOfWeek: 'mon',
          startTime: '09:00:00',
          endTime: '12:00:00',
          location: 'clinic',
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const exceptions: AvailabilityException[] = [
        {
          id: '1',
          date: '2026-01-12',
          isAvailable: true,
          startTime: '13:00:00',
          endTime: '15:00:00',
          reason: null,
          notes: null,
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          date: '2026-01-12',
          isAvailable: false,
          startTime: '14:00:00',
          endTime: '15:00:00',
          reason: 'meeting',
          notes: null,
          userId: 'user1',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      const date = '2026-01-12'

      const result = getEffectiveAvailability(date, templates, exceptions)

      expect(result).toEqual([
        { start: '09:00:00', end: '12:00:00' },
        { start: '13:00:00', end: '14:00:00' }
      ])
    })

    it('2.2.6 should return empty when no availability exists', () => {
      const templates: WeeklyAvailabilityTemplate[] = []
      const exceptions: AvailabilityException[] = []
      const date = '2026-01-12'

      const result = getEffectiveAvailability(date, templates, exceptions)

      expect(result).toEqual([])
    })
  })

  describe('generateTimeSlots', () => {
    it('2.3.1 should generate slots with no conflicts', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '10:00' }]
      const bookedPeriods: BookedPeriod[] = []
      const duration = 30
      const gapMinutes = 0
      const slotIncrementMinutes = 30

      const result = generateTimeSlots(availableRanges, bookedPeriods, duration, gapMinutes, slotIncrementMinutes)

      expect(result).toEqual(['09:00:00', '09:30:00'])
    })

    it('2.3.2 should skip slots that conflict with booked periods', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '11:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '09:30', end: '10:00', sessionId: 'session1' }]
      const duration = 30
      const gapMinutes = 0
      const slotIncrementMinutes = 30

      const result = generateTimeSlots(availableRanges, bookedPeriods, duration, gapMinutes, slotIncrementMinutes)

      expect(result).toEqual(['09:00:00', '10:00:00', '10:30:00'])
    })

    it('2.3.3 should respect gap minutes requirement', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '10:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '09:30', end: '10:00', sessionId: 'session1' }]
      const duration = 30
      const gapMinutes = 15
      const slotIncrementMinutes = 30

      const result = generateTimeSlots(availableRanges, bookedPeriods, duration, gapMinutes, slotIncrementMinutes)

      expect(result).toEqual([])
    })

    it('2.3.4 should use custom slot increment intervals', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '10:00' }]
      const bookedPeriods: BookedPeriod[] = []
      const duration = 20
      const gapMinutes = 0
      const slotIncrementMinutes = 15

      const result = generateTimeSlots(availableRanges, bookedPeriods, duration, gapMinutes, slotIncrementMinutes)

      expect(result).toEqual(['09:00:00', '09:15:00', '09:30:00'])
    })

    it('2.3.5 should handle edge cases - zero duration range', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '09:00' }]
      const bookedPeriods: BookedPeriod[] = []
      const duration = 30
      const gapMinutes = 0
      const slotIncrementMinutes = 30

      const result = generateTimeSlots(availableRanges, bookedPeriods, duration, gapMinutes, slotIncrementMinutes)

      expect(result).toEqual([])
    })

    it('2.3.6 should generate slots across multiple available ranges', () => {
      const availableRanges: TimeRange[] = [
        { start: '09:00', end: '10:00' },
        { start: '14:00', end: '15:00' }
      ]
      const bookedPeriods: BookedPeriod[] = []
      const duration = 30
      const gapMinutes = 0
      const slotIncrementMinutes = 30

      const result = generateTimeSlots(availableRanges, bookedPeriods, duration, gapMinutes, slotIncrementMinutes)

      expect(result).toEqual(['09:00:00', '09:30:00', '14:00:00', '14:30:00'])
    })
  })

  describe('subtractBookedPeriods', () => {
    it('2.4.1 should handle no overlap - range before booked period', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '10:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '11:00', end: '12:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([{ start: '09:00', end: '10:00' }])
    })

    it('2.4.2 should handle no overlap - range after booked period', () => {
      const availableRanges: TimeRange[] = [{ start: '14:00', end: '15:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '09:00', end: '10:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([{ start: '14:00', end: '15:00' }])
    })

    it('2.4.3 should handle partial overlap - booked at start', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '12:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '09:00', end: '10:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([{ start: '10:00:00', end: '12:00' }])
    })

    it('2.4.4 should handle partial overlap - booked at end', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '12:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '11:00', end: '12:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([{ start: '09:00', end: '11:00:00' }])
    })

    it('2.4.5 should handle full containment - range completely covers booked period', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '17:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '12:00', end: '13:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([
        { start: '09:00', end: '12:00:00' },
        { start: '13:00:00', end: '17:00' }
      ])
    })

    it('2.4.6 should handle full overlap - booked period covers entire range', () => {
      const availableRanges: TimeRange[] = [{ start: '10:00', end: '11:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '09:00', end: '12:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([])
    })

    it('2.4.7 should handle multiple booked periods', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '17:00' }]
      const bookedPeriods: BookedPeriod[] = [
        { start: '10:00', end: '11:00', sessionId: 'session1' },
        { start: '14:00', end: '15:00', sessionId: 'session2' }
      ]
      const gapMinutes = 0

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([
        { start: '09:00', end: '10:00:00' },
        { start: '11:00:00', end: '14:00:00' },
        { start: '15:00:00', end: '17:00' }
      ])
    })

    it('2.4.8 should handle gap minutes buffering', () => {
      const availableRanges: TimeRange[] = [{ start: '09:00', end: '12:00' }]
      const bookedPeriods: BookedPeriod[] = [{ start: '10:00', end: '11:00', sessionId: 'session1' }]
      const gapMinutes = 15

      const result = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

      expect(result).toEqual([
        { start: '09:00', end: '09:45:00' },
        { start: '11:15:00', end: '12:00' }
      ])
    })
  })

  describe('hasConflict', () => {
    it('2.5.1 should return false when slot has no conflict with gap', () => {
      const bookedPeriods: BookedPeriod[] = [{ start: '10:00', end: '11:00', sessionId: 'session1' }]
      const gapMinutes = 15

      const result = hasConflict('09:00', '09:30', bookedPeriods, gapMinutes)

      expect(result).toBe(false)
    })

    it('2.5.2 should return true when slot overlaps booked period', () => {
      const bookedPeriods: BookedPeriod[] = [{ start: '10:00', end: '11:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = hasConflict('10:30', '11:00', bookedPeriods, gapMinutes)

      expect(result).toBe(true)
    })

    it('2.5.3 should return true for gap violations', () => {
      const bookedPeriods: BookedPeriod[] = [{ start: '10:00', end: '11:00', sessionId: 'session1' }]
      const gapMinutes = 15

      const result = hasConflict('10:50', '11:20', bookedPeriods, gapMinutes)

      expect(result).toBe(true)
    })

    it('2.5.4 should handle multiple booked periods', () => {
      const bookedPeriods: BookedPeriod[] = [
        { start: '09:00', end: '10:00', sessionId: 'session1' },
        { start: '14:00', end: '15:00', sessionId: 'session2' }
      ]
      const gapMinutes = 0

      const result = hasConflict('10:00', '11:00', bookedPeriods, gapMinutes)

      expect(result).toBe(false)
    })

    it('2.5.5 should handle edge cases - exact boundary times', () => {
      const bookedPeriods: BookedPeriod[] = [{ start: '10:00', end: '11:00', sessionId: 'session1' }]
      const gapMinutes = 0

      const result = hasConflict('09:00', '10:00', bookedPeriods, gapMinutes)

      expect(result).toBe(false)
    })
  })

  describe('addSecondsToTime', () => {
    it('3.1.1 should convert HH:MM format to HH:MM:SS', () => {
      const result = addSecondsToTime('09:30')
      expect(result).toBe('09:30:00')
    })

    it('3.1.2 should keep HH:MM:SS format unchanged', () => {
      const result = addSecondsToTime('09:30:45')
      expect(result).toBe('09:30:45')
    })
  })

  describe('calculateEndTime', () => {
    it('3.2.1 should calculate simple duration addition', () => {
      const result = calculateEndTime('09:00', 30)
      expect(result).toBe('09:30:00')
    })

    it('3.2.2 should handle crossing hour boundaries', () => {
      const result = calculateEndTime('09:45', 30)
      expect(result).toBe('10:15:00')
    })

    it('3.2.3 should handle crossing day boundaries (24+ hours)', () => {
      const result = calculateEndTime('23:00', 120)
      expect(result).toBe('01:00:00')
    })
  })

  describe('normalizeTimeFormat', () => {
    it('3.3.1 should keep HH:MM format unchanged', () => {
      const result = normalizeTimeFormat('09:30')
      expect(result).toBe('09:30')
    })

    it('3.3.2 should convert HH:MM:SS format to HH:MM', () => {
      const result = normalizeTimeFormat('09:30:45')
      expect(result).toBe('09:30')
    })

    it('3.3.3 should throw error for invalid format', () => {
      expect(() => normalizeTimeFormat('invalid')).toThrow('Invalid time format: invalid')
    })
  })
})
