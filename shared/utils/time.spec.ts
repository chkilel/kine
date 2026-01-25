import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentTimeHHMMSS,
  getCurrentTime,
  removeSecondsFromTime,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  calculateTimeDifference,
  formatSecondsAsTime,
  formatSecondsAsMMSS,
  formatSecondsAsHHMMSS,
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

  describe('removeSecondsFromTime', () => {
    it('1.3.1 should remove seconds from HH:MM:SS format', () => {
      const result = removeSecondsFromTime('14:30:45')
      expect(result).toBe('14:30')
    })

    it('1.3.2 should handle time with 00 seconds', () => {
      const result = removeSecondsFromTime('09:00:00')
      expect(result).toBe('09:00')
    })

    it('1.3.3 should handle single digit hour', () => {
      const result = removeSecondsFromTime('9:05:30')
      expect(result).toBe('9:05')
    })

    it('1.3.4 should throw error for invalid format', () => {
      expect(() => removeSecondsFromTime('14:30')).toThrow('Invalid time format')
    })

    it('1.3.5 should throw error for invalid time string', () => {
      expect(() => removeSecondsFromTime('invalid-time')).toThrow('Invalid time format')
    })

    it('1.3.6 should throw error for invalid seconds', () => {
      expect(() => removeSecondsFromTime('14:30:70')).toThrow('Invalid time format')
    })

    it('1.3.7 should throw error for invalid minutes', () => {
      expect(() => removeSecondsFromTime('14:70:45')).toThrow('Invalid time format')
    })

    it('1.3.8 should throw error for invalid hours', () => {
      expect(() => removeSecondsFromTime('25:30:45')).toThrow('Invalid time format')
    })
  })

  describe('timeToMinutes', () => {
    it('1.4.1 should convert time string to minutes', () => {
      expect(timeToMinutes('09:30')).toBe(570)
      expect(timeToMinutes('14:45')).toBe(885)
    })

    it('1.4.2 should convert midnight to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0)
    })

    it('1.4.3 should convert late night to minutes', () => {
      expect(timeToMinutes('23:59')).toBe(1439)
    })

    it('1.4.4 should return 0 for invalid time', () => {
      expect(timeToMinutes('invalid')).toBe(0)
    })

    it('1.4.5 should handle time with seconds', () => {
      expect(timeToMinutes('09:30:45')).toBe(570)
    })
  })

  describe('minutesToTime', () => {
    it('1.5.1 should convert minutes to time string', () => {
      expect(minutesToTime(570)).toBe('09:30:00')
      expect(minutesToTime(885)).toBe('14:45:00')
    })

    it('1.5.2 should convert 0 minutes to midnight', () => {
      expect(minutesToTime(0)).toBe('00:00:00')
    })

    it('1.5.3 should handle wrap around 24 hours', () => {
      expect(minutesToTime(1500)).toBe('01:00:00')
    })

    it('1.5.4 should handle exact hour boundaries', () => {
      expect(minutesToTime(720)).toBe('12:00:00')
      expect(minutesToTime(1080)).toBe('18:00:00')
    })

    it('1.5.5 should handle negative minutes', () => {
      expect(minutesToTime(-60)).toBe('23:00:00')
    })

    it('1.5.6 should handle large values', () => {
      expect(minutesToTime(3000)).toBe('02:00:00')
    })

    it('1.5.7 should throw error for NaN', () => {
      expect(() => minutesToTime(NaN)).toThrow('Invalid minutes value')
    })

    it('1.5.8 should throw error for non-number', () => {
      expect(() => minutesToTime('60' as unknown as number)).toThrow('Invalid minutes value')
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

  describe('formatSecondsAsTime', () => {
    it('1.8.1 should format seconds as Time object', () => {
      const result = formatSecondsAsTime(3661)
      expect(result).toBeInstanceOf(Time)
      expect(result.hour).toBe(1)
      expect(result.minute).toBe(1)
      expect(result.second).toBe(1)
    })

    it('1.8.2 should handle 0 seconds', () => {
      const result = formatSecondsAsTime(0)
      expect(result.hour).toBe(0)
      expect(result.minute).toBe(0)
      expect(result.second).toBe(0)
    })

    it('1.8.3 should handle seconds less than minute', () => {
      const result = formatSecondsAsTime(45)
      expect(result.hour).toBe(0)
      expect(result.minute).toBe(0)
      expect(result.second).toBe(45)
    })

    it('1.8.4 should wrap around 24 hours', () => {
      const result = formatSecondsAsTime(90000)
      expect(result.hour).toBe(1)
      expect(result.minute).toBe(0)
      expect(result.second).toBe(0)
    })

    it('1.8.5 should handle exact hour boundary', () => {
      const result = formatSecondsAsTime(3600)
      expect(result.hour).toBe(1)
      expect(result.minute).toBe(0)
      expect(result.second).toBe(0)
    })

    it('1.8.6 should handle negative seconds', () => {
      const result = formatSecondsAsTime(-60)
      expect(result.hour).toBe(0)
      expect(result.minute).toBe(0)
      expect(result.second).toBe(0)
    })
  })

  describe('formatSecondsAsMMSS', () => {
    it('1.9.1 should format seconds as MM:SS', () => {
      expect(formatSecondsAsMMSS(65)).toBe('01:05')
      expect(formatSecondsAsMMSS(125)).toBe('02:05')
    })

    it('1.9.2 should handle seconds less than minute', () => {
      expect(formatSecondsAsMMSS(45)).toBe('00:45')
      expect(formatSecondsAsMMSS(5)).toBe('00:05')
    })

    it('1.9.3 should handle 0 seconds', () => {
      expect(formatSecondsAsMMSS(0)).toBe('00:00')
    })

    it('1.9.4 should handle large values', () => {
      expect(formatSecondsAsMMSS(3665)).toBe('01:05')
    })

    it('1.9.5 should handle exactly 60 seconds', () => {
      expect(formatSecondsAsMMSS(60)).toBe('01:00')
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
})
