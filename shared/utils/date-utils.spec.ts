import { describe, it, expect } from 'vitest'
import {
  safeParseISODate,
  isDateDisabled,
  getAbbreviatedMonthName,
  extractDayAndMonth,
  formatRelativeDate,
  formatFrenchDate,
  formatFrenchDateRange,
  getDayOfWeek,
  calculateAge,
  convertToCalendarDate
} from './date-utils'
import { CalendarDate } from '@internationalized/date'

describe('date-utils', () => {
  describe('safeParseISODate', () => {
    it('1.4.1 should parse valid ISO date string', () => {
      const result = safeParseISODate('2026-01-15T10:30:00Z')
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toContain('2026-01-15')
    })

    it('1.4.2 should return null for null input', () => {
      expect(safeParseISODate(null)).toBeNull()
    })

    it('1.4.3 should return null for invalid date string', () => {
      expect(safeParseISODate('invalid-date')).toBeNull()
    })

    it('1.4.4 should return null for malformed date', () => {
      expect(safeParseISODate('not-a-date')).toBeNull()
    })

    it('1.4.5 should parse date-only string', () => {
      const result = safeParseISODate('2026-01-15')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(15)
    })
  })

  describe('isDateDisabled', () => {
    it('1.5.1 should disable Sundays', () => {
      const sunday = new Date()
      const day = sunday.getDay()
      const daysUntilSunday = (7 - day) % 7
      sunday.setDate(sunday.getDate() + daysUntilSunday)
      expect(isDateDisabled(sunday)).toBe(true)
    })

    it('1.5.2 should not disable weekdays', () => {
      const weekday = new Date()
      while (weekday.getDay() === 0) {
        weekday.setDate(weekday.getDate() + 1)
      }
      expect(isDateDisabled(weekday)).toBe(false)
    })

    it('1.5.3 should disable past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isDateDisabled(yesterday)).toBe(true)
    })

    it('1.5.4 should not disable today', () => {
      const today = new Date()
      if (today.getDay() === 0) {
        today.setDate(today.getDate() + 1)
      }
      expect(isDateDisabled(today)).toBe(false)
    })

    it('1.5.5 should not disable future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isDateDisabled(tomorrow)).toBe(false)
    })

    it('1.5.6 should handle string date input', () => {
      const weekday = new Date()
      while (weekday.getDay() === 0) {
        weekday.setDate(weekday.getDate() + 1)
      }
      const dateStr = weekday.toString()
      expect(isDateDisabled(dateStr)).toBe(false)
    })
  })

  describe('getAbbreviatedMonthName', () => {
    it('1.6.1 should return abbreviated French month name', () => {
      const date = new Date('2026-01-15')
      expect(getAbbreviatedMonthName(date)).toBe('janv.')
    })

    it('1.6.2 should return different month names', () => {
      expect(getAbbreviatedMonthName(new Date('2026-02-15'))).toBe('févr.')
      expect(getAbbreviatedMonthName(new Date('2026-03-15'))).toBe('mars')
      expect(getAbbreviatedMonthName(new Date('2026-04-15'))).toBe('avr.')
    })

    it('1.6.3 should handle all months', () => {
      expect(getAbbreviatedMonthName(new Date('2026-05-15'))).toBe('mai')
      expect(getAbbreviatedMonthName(new Date('2026-06-15'))).toBe('juin')
      expect(getAbbreviatedMonthName(new Date('2026-07-15'))).toBe('juil.')
      expect(getAbbreviatedMonthName(new Date('2026-08-15'))).toBe('août')
      expect(getAbbreviatedMonthName(new Date('2026-09-15'))).toBe('sept.')
      expect(getAbbreviatedMonthName(new Date('2026-10-15'))).toBe('oct.')
      expect(getAbbreviatedMonthName(new Date('2026-11-15'))).toBe('nov.')
      expect(getAbbreviatedMonthName(new Date('2026-12-15'))).toBe('déc.')
    })
  })

  describe('extractDayAndMonth', () => {
    it('1.7.1 should extract day name, day, and month', () => {
      const result = extractDayAndMonth('2026-01-15')
      expect(result).toEqual({
        dayName: 'jeudi',
        dayNameShort: 'jeu',
        day: '15',
        month: 'jan'
      })
    })

    it('1.7.2 should handle different dates', () => {
      const result = extractDayAndMonth('2026-12-25')
      expect(result).toEqual({
        dayName: 'vendredi',
        dayNameShort: 'ven',
        day: '25',
        month: 'déc'
      })
    })
  })

  describe('formatRelativeDate', () => {
    it('1.8.1 should return "Aujourd\'hui" for today', () => {
      const today = new Date()
      expect(formatRelativeDate(today)).toBe('aujourd’hui')
    })

    it('1.8.2 should return "hier" for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatRelativeDate(yesterday)).toBe('hier')
    })

    it('1.8.3 should return relative time for older dates', () => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      expect(formatRelativeDate(lastWeek)).toContain('il y a')
    })

    it('1.8.4 should handle string date input', () => {
      const todayStr = new Date().toISOString()
      expect(formatRelativeDate(todayStr)).toBe('aujourd’hui')
    })
  })

  describe('formatFrenchDate', () => {
    it('1.9.1 should format date to DD/MM/YYYY', () => {
      const date = new Date('2026-01-15')
      expect(formatFrenchDate(date)).toBe('15/01/2026')
    })

    it('1.9.2 should handle string date input', () => {
      expect(formatFrenchDate('2026-01-15')).toBe('15/01/2026')
    })

    it('1.9.3 should return "-" for null input', () => {
      expect(formatFrenchDate(null)).toBe('-')
    })

    it('1.9.4 should return "-" for empty string', () => {
      expect(formatFrenchDate('')).toBe('-')
    })

    it('1.9.5 should handle invalid date', () => {
      expect(formatFrenchDate('invalid')).toBe('-')
    })
  })

  describe('formatFrenchDateRange', () => {
    it('1.10.1 should format date range with start and end dates', () => {
      const start = new Date('2026-01-15')
      const end = new Date('2026-01-20')
      expect(formatFrenchDateRange(start, end)).toBe('15/01/2026 - 20/01/2026')
    })

    it('1.10.2 should format date range with null end date', () => {
      const start = new Date('2026-01-15')
      expect(formatFrenchDateRange(start, null)).toBe('15/01/2026 - En cours')
    })

    it('1.10.3 should handle string date inputs', () => {
      expect(formatFrenchDateRange('2026-01-15', '2026-01-20')).toBe('15/01/2026 - 20/01/2026')
    })
  })

  describe('getDayOfWeek', () => {
    it('1.11.1 should return "mon" for Monday', () => {
      expect(getDayOfWeek('2026-01-05')).toBe('mon')
    })

    it('1.11.2 should return "tue" for Tuesday', () => {
      expect(getDayOfWeek('2026-01-06')).toBe('tue')
    })

    it('1.11.3 should return "sun" for Sunday', () => {
      expect(getDayOfWeek('2026-01-04')).toBe('sun')
    })

    it('1.11.4 should return lowercase three-letter abbreviation', () => {
      expect(getDayOfWeek('2026-01-08')).toBe('thu')
      expect(getDayOfWeek('2026-01-09')).toBe('fri')
      expect(getDayOfWeek('2026-01-10')).toBe('sat')
      expect(getDayOfWeek('2026-01-11')).toBe('sun')
    })
  })

  describe('calculateAge', () => {
    it('1.12.1 should calculate age from date of birth', () => {
      const thirtyYearsAgo = new Date()
      thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30)
      expect(calculateAge(thirtyYearsAgo)).toBe('30')
    })

    it('1.12.2 should calculate age from string date of birth', () => {
      const twentyYearsAgo = new Date()
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20)
      expect(calculateAge(twentyYearsAgo.toISOString())).toBe('20')
    })

    it('1.12.3 should return empty string for null input', () => {
      expect(calculateAge(null)).toBe('')
    })

    it('1.12.4 should return empty string for invalid date', () => {
      expect(calculateAge('invalid-date')).toBe('')
    })

    it('1.12.5 should handle edge case - birthday today', () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 25)
      expect(calculateAge(birthDate)).toBe('25')
    })
  })

  describe('convertToCalendarDate', () => {
    it('1.13.1 should convert Date to CalendarDate', () => {
      const date = new Date('2026-01-15T10:30:00Z')
      const result = convertToCalendarDate(date)
      expect(result).toBeInstanceOf(CalendarDate)
      expect(result.year).toBe(2026)
      expect(result.month).toBe(1)
      expect(result.day).toBe(15)
    })

    it('1.13.2 should handle leap year dates', () => {
      const date = new Date('2024-02-29T00:00:00Z')
      const result = convertToCalendarDate(date)
      expect(result.year).toBe(2024)
      expect(result.month).toBe(2)
      expect(result.day).toBe(29)
    })

    it('1.13.3 should handle end of year', () => {
      const date = new Date('2026-12-31T00:00:00Z')
      const result = convertToCalendarDate(date)
      expect(result.year).toBe(2026)
      expect(result.month).toBe(12)
      expect(result.day).toBe(31)
    })
  })
})
