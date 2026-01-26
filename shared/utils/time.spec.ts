import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentTimeHHMMSS,
  getCurrentTime,
  addMinutesToTime,
  subtractMinutesFromTime,
  addHoursToTime,
  calculateTimeDifference,
  calculateEndTime,
  compareTimes,
  isTimeBetween,
  formatSecondsAsDuration,
  formatSecondsAsHHMMSS,
  formatTimeString,
  getTimeSincePause
} from './time'
import { Time } from '@internationalized/date'

describe('time-utils', () => {
  describe('getCurrentTimeHHMMSS', () => {
    it('1.1.1 should return current time in HH:mm:ss format', () => {
      const result = getCurrentTimeHHMMSS()
      expect(result).toMatch(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    })

    it('1.1.2 should return string', () => {
      const result = getCurrentTimeHHMMSS()
      expect(typeof result).toBe('string')
    })
  })

  describe('getCurrentTime', () => {
    it('1.2.1 should return Time object', () => {
      const result = getCurrentTime()
      expect(result).toBeInstanceOf(Time)
    })

    it('1.2.2 should have valid hours', () => {
      const result = getCurrentTime()
      expect(result.hour).toBeGreaterThanOrEqual(0)
      expect(result.hour).toBeLessThan(24)
    })

    it('1.2.3 should have valid minutes', () => {
      const result = getCurrentTime()
      expect(result.minute).toBeGreaterThanOrEqual(0)
      expect(result.minute).toBeLessThan(60)
    })

    it('1.2.4 should have valid seconds', () => {
      const result = getCurrentTime()
      expect(result.second).toBeGreaterThanOrEqual(0)
      expect(result.second).toBeLessThan(60)
    })
  })

  describe('addMinutesToTime', () => {
    it('1.6.1 should add minutes to time', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30:00')
      expect(addMinutesToTime('14:45', 15)).toBe('15:00:00')
    })

    it('1.6.2 should handle crossing hour boundary', () => {
      expect(addMinutesToTime('09:45', 30)).toBe('10:15:00')
    })

    it('1.6.3 should handle crossing midnight', () => {
      expect(addMinutesToTime('23:30', 60)).toBe('00:30:00')
    })

    it('1.6.4 should handle negative minutes', () => {
      expect(addMinutesToTime('10:00', -30)).toBe('09:30:00')
    })

    it('1.6.5 should handle time with seconds', () => {
      expect(addMinutesToTime('09:00:00', 30)).toBe('09:30:00')
    })

    it('1.6.6 should throw error for invalid time', () => {
      expect(() => addMinutesToTime('invalid', 30)).toThrow('Failed to parse time')
    })

    it('1.6.7 should handle 00:00 time correctly', () => {
      expect(addMinutesToTime('00:00', 60)).toBe('01:00:00')
    })
  })

  describe('calculateTimeDifference', () => {
    it('1.7.1 should calculate difference in seconds', () => {
      expect(calculateTimeDifference('09:00:00', '10:00:00')).toBe(3600)
      expect(calculateTimeDifference('09:30:00', '09:45:00')).toBe(900)
    })

    it('1.7.2 should handle time without seconds', () => {
      expect(calculateTimeDifference('09:00', '10:00')).toBe(3600)
    })

    it('1.7.3 should handle crossing midnight', () => {
      expect(calculateTimeDifference('23:30:00', '00:30:00')).toBe(3600)
      expect(calculateTimeDifference('23:00:00', '01:00:00')).toBe(7200)
    })

    it('1.7.4 should return 0 for same time', () => {
      expect(calculateTimeDifference('10:00:00', '10:00:00')).toBe(0)
    })

    it('1.7.5 should return 0 for invalid start time', () => {
      expect(calculateTimeDifference('invalid', '10:00:00')).toBe(0)
    })

    it('1.7.6 should return 0 for invalid end time', () => {
      expect(calculateTimeDifference('09:00:00', 'invalid')).toBe(0)
    })

    it('1.7.7 should handle times with seconds', () => {
      expect(calculateTimeDifference('09:00:30', '09:01:30')).toBe(60)
    })

    it('1.7.8 should handle edge case - exactly 24 hours', () => {
      expect(calculateTimeDifference('00:00:00', '00:00:00')).toBe(0)
    })
  })

  describe('formatSecondsAsHHMMSS', () => {
    it('1.10.1 should format as HH:MM:SS for durations with hours', () => {
      expect(formatSecondsAsHHMMSS(3661)).toBe('01:01:01')
      expect(formatSecondsAsHHMMSS(7325)).toBe('02:02:05')
    })

    it('1.10.2 should format as MM:SS for durations without hours', () => {
      expect(formatSecondsAsHHMMSS(65)).toBe('01:05')
      expect(formatSecondsAsHHMMSS(125)).toBe('02:05')
    })

    it('1.10.3 should handle 0 seconds', () => {
      expect(formatSecondsAsHHMMSS(0)).toBe('00:00')
    })

    it('1.10.4 should handle seconds less than minute', () => {
      expect(formatSecondsAsHHMMSS(45)).toBe('00:45')
    })

    it('1.10.5 should handle exactly one hour', () => {
      expect(formatSecondsAsHHMMSS(3600)).toBe('01:00:00')
    })

    it('1.10.6 should handle multiple hours', () => {
      expect(formatSecondsAsHHMMSS(10800)).toBe('03:00:00')
      expect(formatSecondsAsHHMMSS(12295)).toBe('03:24:55')
    })
  })

  describe('getTimeSincePause', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('1.11.1 should return empty string for null pause time', () => {
      expect(getTimeSincePause(null)).toBe('')
    })

    it('1.11.2 should return seconds for duration less than minute', () => {
      vi.setSystemTime(new Date('2026-01-25T10:00:00'))
      expect(getTimeSincePause('09:59:45')).toBe('15s')
    })

    it('1.11.3 should return minutes for duration less than hour', () => {
      vi.setSystemTime(new Date('2026-01-25T10:30:00'))
      expect(getTimeSincePause('10:00:00')).toBe('30min')
    })

    it('1.11.4 should return hours for duration less than hour without minutes', () => {
      vi.setSystemTime(new Date('2026-01-25T12:00:00'))
      expect(getTimeSincePause('10:00:00')).toBe('2h')
    })

    it('1.11.5 should return hours and minutes for duration with hours and minutes', () => {
      vi.setSystemTime(new Date('2026-01-25T12:30:00'))
      expect(getTimeSincePause('10:00:00')).toBe('2h 30min')
    })

    it('1.11.6 should handle crossing midnight', () => {
      vi.setSystemTime(new Date('2026-01-25T00:30:00'))
      expect(getTimeSincePause('23:30:00')).toBe('1h')
    })

    it('1.11.7 should handle pause of 1 second', () => {
      vi.setSystemTime(new Date('2026-01-25T10:00:01'))
      expect(getTimeSincePause('10:00:00')).toBe('1s')
    })

    it('1.11.8 should handle pause of 1 minute', () => {
      vi.setSystemTime(new Date('2026-01-25T10:01:00'))
      expect(getTimeSincePause('10:00:00')).toBe('1min')
    })

    it('1.11.9 should handle pause of 1 hour', () => {
      vi.setSystemTime(new Date('2026-01-25T11:00:00'))
      expect(getTimeSincePause('10:00:00')).toBe('1h')
    })
  })

  describe('subtractMinutesFromTime', () => {
    it('1.12.1 should subtract minutes from time', () => {
      expect(subtractMinutesFromTime('09:30:00', 30)).toBe('09:00:00')
      expect(subtractMinutesFromTime('15:00:00', 15)).toBe('14:45:00')
    })

    it('1.12.2 should handle crossing hour boundary', () => {
      expect(subtractMinutesFromTime('09:15:00', 30)).toBe('08:45:00')
    })

    it('1.12.3 should handle crossing midnight', () => {
      expect(subtractMinutesFromTime('00:15:00', 30)).toBe('23:45:00')
    })

    it('1.12.4 should handle negative subtraction (add)', () => {
      expect(subtractMinutesFromTime('09:00:00', -30)).toBe('09:30:00')
    })

    it('1.12.5 should throw error for invalid time', () => {
      expect(() => subtractMinutesFromTime('invalid', 30)).toThrow('Failed to parse time')
    })
  })

  describe('addHoursToTime', () => {
    it('1.13.1 should add hours to time', () => {
      expect(addHoursToTime('09:00:00', 2)).toBe('11:00:00')
      expect(addHoursToTime('14:30:00', 4)).toBe('18:30:00')
    })

    it('1.13.2 should handle crossing midnight', () => {
      expect(addHoursToTime('23:00:00', 2)).toBe('01:00:00')
    })

    it('1.13.3 should handle negative hours (subtract)', () => {
      expect(addHoursToTime('11:00:00', -2)).toBe('09:00:00')
    })

    it('1.13.4 should throw error for invalid time', () => {
      expect(() => addHoursToTime('invalid', 2)).toThrow('Failed to parse time')
    })
  })

  describe('calculateEndTime', () => {
    it('1.14.1 should calculate end time correctly', () => {
      expect(calculateEndTime('09:00:00', 30)).toBe('09:30:00')
      expect(calculateEndTime('14:30:00', 45)).toBe('15:15:00')
      expect(calculateEndTime('09:00', 30)).toBe('09:30:00')
    })

    it('1.14.2 should handle crossing hour boundary', () => {
      expect(calculateEndTime('09:45:00', 30)).toBe('10:15:00')
      expect(calculateEndTime('09:45', 30)).toBe('10:15:00')
    })

    it('1.14.3 should handle crossing midnight', () => {
      expect(calculateEndTime('23:45:00', 30)).toBe('00:15:00')
      expect(calculateEndTime('23:00', 120)).toBe('01:00:00')
    })

    it('1.14.4 should handle long durations', () => {
      expect(calculateEndTime('09:00:00', 180)).toBe('12:00:00')
      expect(calculateEndTime('08:00:00', 300)).toBe('13:00:00')
    })

    it('1.14.5 should throw error for invalid time', () => {
      expect(() => calculateEndTime('invalid', 30)).toThrow('Failed to calculate end time')
    })
  })

  describe('compareTimes', () => {
    it('1.15.1 should return negative when time1 < time2', () => {
      expect(compareTimes('09:00:00', '10:00:00')).toBe(-1)
      expect(compareTimes('08:30:00', '09:15:00')).toBe(-1)
    })

    it('1.15.2 should return positive when time1 > time2', () => {
      expect(compareTimes('10:00:00', '09:00:00')).toBe(1)
      expect(compareTimes('14:30:00', '11:45:00')).toBe(1)
    })

    it('1.15.3 should return 0 for equal times', () => {
      expect(compareTimes('09:00:00', '09:00:00')).toBe(0)
      expect(compareTimes('14:30:45', '14:30:45')).toBe(0)
    })

    it('1.15.4 should handle times without seconds', () => {
      expect(compareTimes('09:00', '10:00')).toBe(-1)
      expect(compareTimes('09:00:00', '09:00')).toBe(0)
    })
  })

  describe('isTimeBetween', () => {
    it('1.16.1 should return true when time is within range', () => {
      expect(isTimeBetween('09:30:00', '09:00:00', '10:00:00')).toBe(true)
      expect(isTimeBetween('12:00:00', '09:00:00', '18:00:00')).toBe(true)
    })

    it('1.16.2 should return true when time equals start', () => {
      expect(isTimeBetween('09:00:00', '09:00:00', '10:00:00')).toBe(true)
    })

    it('1.16.3 should return true when time equals end', () => {
      expect(isTimeBetween('10:00:00', '09:00:00', '10:00:00')).toBe(true)
    })

    it('1.16.4 should return false when time is before range', () => {
      expect(isTimeBetween('08:30:00', '09:00:00', '10:00:00')).toBe(false)
      expect(isTimeBetween('08:59:59', '09:00:00', '10:00:00')).toBe(false)
    })

    it('1.16.5 should return false when time is after range', () => {
      expect(isTimeBetween('10:30:00', '09:00:00', '10:00:00')).toBe(false)
      expect(isTimeBetween('10:00:01', '09:00:00', '10:00:00')).toBe(false)
    })

    it('1.16.6 should handle times crossing midnight', () => {
      expect(isTimeBetween('00:30:00', '23:00:00', '02:00:00')).toBe(true)
      expect(isTimeBetween('22:00:00', '23:00:00', '02:00:00')).toBe(false)
    })

    it('1.16.7 should handle times without seconds', () => {
      expect(isTimeBetween('09:30', '09:00', '10:00')).toBe(true)
    })

    it('1.16.8 should return true when range is same time', () => {
      expect(isTimeBetween('12:00:00', '12:00:00', '12:00:00')).toBe(true)
    })
  })

  describe('formatTimeString', () => {
    it('1.16.1 should format without seconds by default', () => {
      expect(formatTimeString('09:30:45')).toBe('09:30')
      expect(formatTimeString('14:15:30')).toBe('14:15')
    })

    it('1.16.2 should include seconds when requested', () => {
      expect(formatTimeString('09:30:45', true)).toBe('09:30:45')
      expect(formatTimeString('14:15:30', true)).toBe('14:15:30')
    })

    it('1.16.3 should handle HH:MM format', () => {
      expect(formatTimeString('09:30')).toBe('09:30')
      expect(formatTimeString('14:15')).toBe('14:15')
    })

    it('1.16.4 should handle HH:MM format with seconds requested', () => {
      expect(formatTimeString('09:30', true)).toBe('09:30:00')
    })

    it('1.16.5 should handle single digit hour', () => {
      expect(formatTimeString('9:05:30')).toBe('09:05')
      expect(formatTimeString('9:30')).toBe('09:30')
    })

    it('1.16.6 should throw error for invalid time', () => {
      expect(() => formatTimeString('invalid')).toThrow('Invalid time format')
    })
  })

  describe('formatSecondsAsDuration', () => {
    it('1.17.1 should return empty string for 0 seconds', () => {
      expect(formatSecondsAsDuration(0)).toBe('')
    })

    it('1.17.2 should format as Xmin for durations less than 1 hour', () => {
      expect(formatSecondsAsDuration(60)).toBe('1min')
      expect(formatSecondsAsDuration(90)).toBe('1min')
      expect(formatSecondsAsDuration(125)).toBe('2min')
      expect(formatSecondsAsDuration(1800)).toBe('30min')
    })

    it('1.17.3 should format as Xh for exact hours', () => {
      expect(formatSecondsAsDuration(3600)).toBe('1h')
      expect(formatSecondsAsDuration(7200)).toBe('2h')
      expect(formatSecondsAsDuration(10800)).toBe('3h')
    })

    it('1.17.4 should format as Xh Xmin for durations with hours and minutes', () => {
      expect(formatSecondsAsDuration(3661)).toBe('1h 1min')
      expect(formatSecondsAsDuration(7320)).toBe('2h 2min')
      expect(formatSecondsAsDuration(12295)).toBe('3h 24min')
    })

    it('1.17.5 should handle negative seconds as 0', () => {
      expect(formatSecondsAsDuration(-60)).toBe('')
      expect(formatSecondsAsDuration(-3600)).toBe('')
    })
  })
})
