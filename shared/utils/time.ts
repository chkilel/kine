import { Time, parseTime } from '@internationalized/date'
import { format } from 'date-fns'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

// Time format regex for HH:MM:SS validation
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/

/**
 * Gets the current time in HH:mm:ss format
 */
export function getCurrentTimeHHMMSS(): string {
  return format(new Date(), 'HH:mm:ss')
}

/**
 * Gets the current time as a Time object
 */
export function getCurrentTime(): Time {
  const now = new Date()
  return new Time(now.getHours(), now.getMinutes(), now.getSeconds())
}

/**
 * Removes seconds from a time string (HH:MM:SS -> HH:MM)
 * @throws {Error} If the time format is invalid
 */
export function removeSecondsFromTime(timeString: string): string {
  if (!TIME_FORMAT_REGEX.test(timeString)) {
    throw new Error(`Invalid time format: "${timeString}". Expected HH:MM:SS`)
  }
  const lastColonIndex = timeString.lastIndexOf(':')
  return timeString.slice(0, lastColonIndex)
}

/**
 * Converts a time string to total minutes
 * @returns Total minutes, or 0 if parsing fails
 */
export function timeToMinutes(time: string): number {
  try {
    const parsed = parseTime(time)
    return parsed.hour * MINUTES_PER_HOUR + parsed.minute
  } catch {
    console.warn(`Failed to parse time: "${time}". Returning 0.`)
    return 0
  }
}

/**
 * Converts minutes to a time string (HH:MM)
 * @throws {Error} If minutes is not a valid number
 */
export function minutesToTime(minutes: number): string {
  if (typeof minutes !== 'number' || isNaN(minutes)) {
    throw new Error(`Invalid minutes value: ${minutes}`)
  }

  const normalizedMinutes =
    ((minutes % (HOURS_PER_DAY * MINUTES_PER_HOUR)) + HOURS_PER_DAY * MINUTES_PER_HOUR) %
    (HOURS_PER_DAY * MINUTES_PER_HOUR)
  const hours = Math.floor(normalizedMinutes / MINUTES_PER_HOUR)
  const mins = Math.floor(normalizedMinutes % MINUTES_PER_HOUR)

  return new Time(hours, mins).toString()
}

/**
 * Adds minutes to a time string
 * @throws {Error} If time cannot be parsed or minutes is invalid
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time)
  if (totalMinutes === 0 && time !== '00:00' && time !== '00:00:00') {
    throw new Error(`Failed to parse time: "${time}"`)
  }
  return minutesToTime(totalMinutes + minutes)
}

/**
 * Calculates the time difference between two time strings in seconds
 * Handles times that cross midnight
 * @returns Difference in seconds, or 0 if parsing fails
 */
export function calculateTimeDifference(startTime: string, endTime: string): number {
  try {
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    const startSeconds = start.hour * SECONDS_PER_HOUR + start.minute * SECONDS_PER_MINUTE + start.second
    const endSeconds = end.hour * SECONDS_PER_HOUR + end.minute * SECONDS_PER_MINUTE + end.second

    let diff = endSeconds - startSeconds

    // Handle case where end time is on the next day
    if (diff < 0) {
      diff += SECONDS_PER_DAY
    }

    return diff
  } catch (error) {
    console.error('Error calculating time difference:', error)
    return 0
  }
}

/**
 * Formats seconds as a Time object
 */
export function formatSecondsAsTime(seconds: number): Time {
  const normalizedSeconds = Math.max(0, seconds)
  const hours = Math.floor(normalizedSeconds / SECONDS_PER_HOUR) % HOURS_PER_DAY
  const minutes = Math.floor((normalizedSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const secs = Math.floor(normalizedSeconds % SECONDS_PER_MINUTE)

  return new Time(hours, minutes, secs)
}

/**
 * Formats seconds as MM:SS string
 */
export function formatSecondsAsMMSS(seconds: number): string {
  const time = formatSecondsAsTime(seconds)
  return time.toString().slice(3) // Remove "HH:" to get "MM:SS"
}

/**
 * Formats seconds as HH:MM:SS or MM:SS depending on duration
 */
export function formatSecondsAsHHMMSS(seconds: number): string {
  const time = formatSecondsAsTime(seconds)
  return time.hour > 0 ? time.toString() : formatSecondsAsMMSS(seconds)
}

/**
 * Gets a human-readable time elapsed since pause started
 * @returns Empty string if no pause time, otherwise formatted duration
 */
export function getTimeSincePause(pauseStartTime: string | null): string {
  if (!pauseStartTime) return ''

  const currentTime = getCurrentTimeHHMMSS()
  const elapsedSeconds = calculateTimeDifference(pauseStartTime, currentTime)

  if (elapsedSeconds < SECONDS_PER_MINUTE) {
    return `${elapsedSeconds}s`
  }

  if (elapsedSeconds < SECONDS_PER_HOUR) {
    const minutes = Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)
    return `${minutes}min`
  }

  const hours = Math.floor(elapsedSeconds / SECONDS_PER_HOUR)
  const remainingMinutes = Math.floor((elapsedSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}
