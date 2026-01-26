import { Time, parseTime } from '@internationalized/date'

// Constants
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

/**
 * Time Utility Functions
 *
 * This module provides time-related utilities using @internationalized/date's Time object
 * internally, while maintaining a simple string-based API for consumers.
 *
 * Why this approach?
 * - Clean API: Functions accept/return strings (no conversion overhead)
 * - Robust implementation: Uses Time library for calculations
 * - Type-safe: Validations and error handling built-in
 * - Zero performance impact: No intermediate object creation in components
 *
 * Common patterns:
 * - Display time: formatTimeString('09:30:45') // '09:30'
 * - Add minutes: addMinutesToTime('09:00:00', 30) // '09:30:00'
 * - Compare times: compareTimes('09:00:00', '10:00:00') // -1
 * - Check range: isTimeBetween('09:30:00', '09:00:00', '10:00:00') // true
 */

/**
 * Gets the current time as a Time object
 */
export function getCurrentTime(): Time {
  const now = new Date()
  return new Time(now.getHours(), now.getMinutes(), now.getSeconds())
}

/**
 * Gets the current time in HH:mm:ss format
 */
export function getCurrentTimeHHMMSS(): string {
  return getCurrentTime().toString()
}

/**
 * Adds minutes to a time string
 * @throws {Error} If time cannot be parsed or minutes is invalid
 * @example addMinutesToTime('09:00:00', 30) // '09:30:00'
 * @example addMinutesToTime('23:45:00', 30) // '00:15:00' (crosses midnight)
 */
export function addMinutesToTime(time: string, minutes: number): string {
  try {
    const parsedTime = parseTime(time)
    const newTime = parsedTime.add({ minutes })
    return newTime.toString()
  } catch (error) {
    throw new Error(`Failed to parse time: "${time}"`)
  }
}

/**
 * Subtracts minutes from a time string
 * @throws {Error} If time cannot be parsed or minutes is invalid
 * @example subtractMinutesFromTime('09:30:00', 30) // '09:00:00'
 * @example subtractMinutesFromTime('00:15:00', 30) // '23:45:00' (crosses midnight)
 */
export function subtractMinutesFromTime(time: string, minutes: number): string {
  try {
    const parsedTime = parseTime(time)
    const newTime = parsedTime.subtract({ minutes })
    return newTime.toString()
  } catch (error) {
    throw new Error(`Failed to parse time: "${time}"`)
  }
}

/**
 * Adds hours to a time string
 * @throws {Error} If time cannot be parsed or hours is invalid
 * @example addHoursToTime('09:00:00', 2) // '11:00:00'
 * @example addHoursToTime('23:00:00', 2) // '01:00:00' (crosses midnight)
 */
export function addHoursToTime(time: string, hours: number): string {
  try {
    const parsedTime = parseTime(time)
    const newTime = parsedTime.add({ hours })
    return newTime.toString()
  } catch (error) {
    throw new Error(`Failed to parse time: "${time}"`)
  }
}

/**
 * Calculates the end time given a start time and duration in minutes
 * @throws {Error} If time cannot be parsed
 * @example calculateEndTime('09:00:00', 30) // '09:30:00'
 * @example calculateEndTime('23:45:00', 30) // '00:15:00' (crosses midnight)
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  try {
    const start = parseTime(startTime)
    const end = start.add({ minutes: durationMinutes })
    return end.toString()
  } catch (error) {
    throw new Error(`Failed to calculate end time: ${error}`)
  }
}

/**
 * Calculates the time difference between two time strings in seconds
 * Handles times that cross midnight
 * @returns Difference in seconds, or 0 if parsing fails
 * @example calculateTimeDifference('09:00:00', '10:30:00') // 5400
 * @example calculateTimeDifference('23:00:00', '01:00:00') // 7200 (crosses midnight)
 */
export function calculateTimeDifference(startTime: string, endTime: string): number {
  try {
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    const startSeconds = start.hour * SECONDS_PER_HOUR + start.minute * SECONDS_PER_MINUTE + start.second
    const endSeconds = end.hour * SECONDS_PER_HOUR + end.minute * SECONDS_PER_MINUTE + end.second

    // Handle midnight crossover
    return endSeconds >= startSeconds ? endSeconds - startSeconds : endSeconds - startSeconds + SECONDS_PER_DAY
  } catch (error) {
    console.error('Error calculating time difference:', error)
    return 0
  }
}

/**
 * Compares two time strings
 * @returns Negative if time1 < time2, 0 if equal, positive if time1 > time2
 * @example compareTimes('09:00:00', '10:00:00') // -1
 * @example compareTimes('10:00:00', '09:00:00') // 1
 * @example compareTimes('09:00:00', '09:00:00') // 0
 */
export function compareTimes(time1: string, time2: string): number {
  const t1 = parseTime(time1)
  const t2 = parseTime(time2)
  const comparison = t1.compare(t2)
  // Return standardized -1, 0, 1 based on comparison result
  return comparison < 0 ? -1 : comparison > 0 ? 1 : 0
}

/**
 * Checks if a time string is between two other times (inclusive)
 * Handles time ranges that cross midnight
 * @example isTimeBetween('09:30:00', '09:00:00', '10:00:00') // true
 * @example isTimeBetween('11:00:00', '09:00:00', '10:00:00') // false
 * @example isTimeBetween('09:00:00', '09:00:00', '10:00:00') // true
 * @example isTimeBetween('10:00:00', '09:00:00', '10:00:00') // true
 * @example isTimeBetween('00:30:00', '23:00:00', '02:00:00') // true (crosses midnight)
 */
export function isTimeBetween(time: string, start: string, end: string): boolean {
  const t = parseTime(time)
  const s = parseTime(start)
  const e = parseTime(end)

  // Check if range crosses midnight
  const crossesMidnight = e.compare(s) < 0

  if (crossesMidnight) {
    // Time is between if it's >= start OR <= end
    return t.compare(s) >= 0 || t.compare(e) <= 0
  } else {
    // Normal range: time must be >= start AND <= end
    return t.compare(s) >= 0 && t.compare(e) <= 0
  }
}

/**
 * Formats seconds as a Time object
 * @example formatSecondsAsTime(3665) // Time object for 01:01:05
 */
export function formatSecondsAsTime(seconds: number): Time {
  const normalized = Math.max(0, seconds)
  const hours = Math.floor(normalized / SECONDS_PER_HOUR) % HOURS_PER_DAY
  const minutes = Math.floor((normalized % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const secs = normalized % SECONDS_PER_MINUTE
  return new Time(hours, minutes, secs)
}

/**
 * Formats seconds as HH:MM:SS or MM:SS depending on duration
 * @example formatSecondsAsHHMMSS(90) // '01:30'
 * @example formatSecondsAsHHMMSS(3665) // '01:01:05'
 */
export function formatSecondsAsHHMMSS(seconds: number): string {
  const normalized = Math.max(0, seconds)

  if (normalized < SECONDS_PER_HOUR) {
    return formatSecondsAsTime(normalized).toString().slice(3)
  }

  return formatSecondsAsTime(normalized).toString()
}

/**
 * Formats a time string consistently
 * Handles both "HH:MM:SS" and "HH:MM" formats
 * Also handles single-digit hours (e.g., "9:05:30" -> "09:05")
 * @param includeSeconds - Whether to include seconds in output (default: false)
 * @throws {Error} If the time string cannot be parsed
 * @example formatTimeString('09:30:45') // '09:30'
 * @example formatTimeString('09:30:45', true) // '09:30:45'
 * @example formatTimeString('09:30') // '09:30'
 * @example formatTimeString('9:05:30') // '09:05'
 */
export function formatTimeString(timeString: string, includeSeconds = false): string {
  try {
    let normalizedTime = timeString
    const parts = timeString.split(':')
    if (parts.length >= 2) {
      const hour = parts[0]
      if (hour && hour.length === 1 && hour >= '0' && hour <= '9') {
        normalizedTime = `0${timeString}`
      }
    }

    const time = parseTime(normalizedTime)
    return includeSeconds ? time.toString() : time.toString().slice(0, 5)
  } catch (error) {
    throw new Error(`Invalid time format: "${timeString}"`)
  }
}

/**
 * Gets a human-readable time elapsed since pause started
 * @returns Empty string if no pause time, otherwise formatted duration
 * @example getTimeSincePause('09:00:00') // '15min' (if called at 09:15:00)
 * @example getTimeSincePause('09:00:00') // '1h 30min' (if called at 10:30:00)
 */
export function getTimeSincePause(pauseStartTime: string | null): string {
  if (!pauseStartTime) return ''

  const elapsedSeconds = calculateTimeDifference(pauseStartTime, getCurrentTimeHHMMSS())

  if (elapsedSeconds < SECONDS_PER_MINUTE) {
    return `${elapsedSeconds}s`
  }

  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return `${Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)}min`
  }

  const hours = Math.floor(elapsedSeconds / SECONDS_PER_HOUR)
  const remainingMinutes = Math.floor((elapsedSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

/**
 * Generates a series of time strings at regular intervals within a time range.
 * Used for iterating through possible slot start times.
 *
 * @param startTime - Start of the range (e.g., '09:00:00')
 * @param endTime - End of the range (e.g., '17:00:00')
 * @param incrementMinutes - Interval between times in minutes (e.g., 15 for 15-minute slots)
 * @returns Array of time strings in HH:MM:SS format
 * @example generateTimeSeriesInRange('09:00:00', '10:00:00', 30) // ['09:00:00', '09:30:00']
 */
export function generateTimeSeriesInRange(startTime: string, endTime: string, incrementMinutes: number): string[] {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const times: string[] = []

  let current = start
  while (current.compare(end) < 0) {
    times.push(current.toString())
    current = current.add({ minutes: incrementMinutes })
  }

  return times
}
