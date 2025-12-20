import { format, differenceInYears, parseISO } from 'date-fns'
import { CalendarDate } from '@internationalized/date'
import { MINIMUM_CONSULTATION_GAP_MINUTES } from './constants.consultation'
import { fr } from 'date-fns/locale'

/**
 * Safely converts ISO date string to Date object with validation.
 *
 * @param dateString - ISO date string (YYYY-MM-DD format) or null/undefined
 * @returns Date object if valid, null otherwise
 *
 * @example
 * toDate('2023-12-25') // => Date object
 * toDate(null) // => null
 * toDate('invalid') // => null (with console warning)
 */
export function toDate(dateString: string | null): Date | null {
  if (!dateString) return null

  try {
    const date = parseISO(dateString)
    // Verify the parsed date is actually valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return null
    }
    return date
  } catch (error) {
    console.warn('Invalid date string:', dateString, error)
    return null
  }
}

/**
 * Formats date for display in French locale (dd/MM/yyyy format).
 * Returns "-" for null, undefined, or invalid dates.
 *
 * @param date - Date object or ISO string to format
 * @returns Formatted date string or "-" if invalid
 *
 * @example
 * formatDate(new Date('2023-12-25')) // => "25/12/2023"
 * formatDate('2023-12-25') // => "25/12/2023"
 * formatDate(null) // => "-"
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? toDate(date) : date
  if (!dateObj || isNaN(dateObj.getTime())) return '-'

  return format(dateObj, 'dd/MM/yyyy', { locale: fr })
}

/**
 * Calculates current age in years from date of birth.
 * Returns empty string for invalid or missing dates.
 *
 * @param dateOfBirth - Date of birth as Date object or ISO string
 * @returns Age as string, or empty string if invalid
 *
 * @example
 * getAge('1990-01-15') // => "34" (as of 2024)
 * getAge(new Date('1990-01-15')) // => "34"
 * getAge(null) // => ""
 */
export function getAge(dateOfBirth: Date | string | null): string {
  if (!dateOfBirth) return ''

  try {
    const birth = dateOfBirth instanceof Date
      ? dateOfBirth
      : parseISO(dateOfBirth)

    if (isNaN(birth.getTime())) {
      console.error('Invalid date of birth:', dateOfBirth)
      return ''
    }

    const age = differenceInYears(new Date(), birth)

    // Ensure age is non-negative (future dates return negative)
    return age >= 0 ? age.toString() : ''
  } catch (error) {
    console.error('Error calculating age:', error, dateOfBirth)
    return ''
  }
}

/**
 * Formats a date range for display with start and end dates.
 * Shows "En cours" (Ongoing) if end date is missing.
 *
 * @param startDate - Range start date (Date or ISO string)
 * @param endDate - Range end date (Date, ISO string, or null for ongoing)
 * @returns Formatted range string (e.g., "01/01/2023 - 31/12/2023")
 *
 * @example
 * formatDateRange('2023-01-01', '2023-12-31') // => "01/01/2023 - 31/12/2023"
 * formatDateRange('2023-01-01', null) // => "01/01/2023 - En cours"
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string | null
): string => {
  const start = formatDate(startDate)
  const end = endDate ? formatDate(endDate) : 'En cours'
  return `${start} - ${end}`
}

/**
 * Converts native Date object to CalendarDate for component libraries.
 * CalendarDate is timezone-agnostic and works with date pickers.
 *
 * @param date - Native JavaScript Date object
 * @returns CalendarDate object with year, month (1-12), and day
 *
 * @example
 * dateToCalendarDate(new Date('2023-12-25')) // => CalendarDate(2023, 12, 25)
 */
export const dateToCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1, // Convert 0-indexed month to 1-indexed
    date.getDate()
  )
}

/**
 * Checks if a date should be unavailable for selection.
 * Currently blocks:
 * - Sundays (day === 0)
 * - Past dates (before today)
 *
 * @param date - Date to check (Date object or compatible object)
 * @returns true if date should be unavailable, false otherwise
 *
 * @example
 * isDateUnavailable(new Date('2020-01-01')) // => true (past date)
 * isDateUnavailable(sundayDate) // => true
 *
 * @note Add day === 6 to condition to also disable Saturdays
 */
export const isDateUnavailable = (date: Date | any): boolean => {
  const dateObj = date instanceof Date ? date : new Date(date.toString())
  const day = dateObj.getDay()

  // Set today to midnight for accurate comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Block Sundays and past dates
  return day === 0 || dateObj < today
}

/**
 * Converts time string (HH:mm) to total minutes since midnight.
 * Useful for time arithmetic and comparisons.
 *
 * @param time - Time string in HH:mm format (e.g., "14:30")
 * @returns Total minutes since midnight
 *
 * @example
 * timeToMinutes('14:30') // => 870 (14 * 60 + 30)
 * timeToMinutes('00:00') // => 0
 */
export const timeToMinutes = (time: string): number => {
  const [hoursStr = '0', minutesStr = '0'] = time.split(':')
  const hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)
  return hours * 60 + minutes
}

/**
 * Converts total minutes since midnight to time string (HH:mm).
 * Inverse operation of timeToMinutes.
 *
 * @param minutes - Total minutes since midnight
 * @returns Time string in HH:mm format with zero-padding
 *
 * @example
 * minutesToTime(870) // => "14:30"
 * minutesToTime(0) // => "00:00"
 * minutesToTime(1439) // => "23:59"
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Checks if two time ranges overlap, accounting for a minimum gap buffer.
 * Ensures appointments have sufficient spacing between them.
 *
 * Algorithm: Two ranges DON'T overlap if one ends (+ gap) before the other starts.
 * We return true if they DO overlap (by negating the non-overlap condition).
 *
 * @param existingStart - Start time of existing appointment (HH:mm)
 * @param existingEnd - End time of existing appointment (HH:mm)
 * @param newStart - Start time of new appointment (HH:mm)
 * @param newEnd - End time of new appointment (HH:mm)
 * @param minGap - Minimum required gap in minutes between appointments
 * @returns true if appointments overlap (including gap), false if safely separated
 *
 * @example
 * // Appointments overlap
 * checkTimeOverlap('10:00', '11:00', '10:30', '11:30') // => true
 *
 * // Appointments don't overlap but violate minimum gap
 * checkTimeOverlap('10:00', '11:00', '11:00', '12:00', 15) // => true
 *
 * // Appointments properly separated with gap
 * checkTimeOverlap('10:00', '11:00', '11:20', '12:00', 15) // => false
 */
export const checkTimeOverlap = (
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string,
  minGap: number = MINIMUM_CONSULTATION_GAP_MINUTES
): boolean => {
  const existingStartMin = timeToMinutes(existingStart)
  const existingEndMin = timeToMinutes(existingEnd)
  const newStartMin = timeToMinutes(newStart)
  const newEndMin = timeToMinutes(newEnd)

  // Ranges don't overlap if:
  // - New ends (+ gap) before existing starts, OR
  // - New starts after existing ends (+ gap)
  const noOverlap = (
    newEndMin + minGap <= existingStartMin ||
    newStartMin >= existingEndMin + minGap
  )

  // Return true if they DO overlap
  return !noOverlap
}

/**
 * Gets abbreviated French month name from date.
 *
 * @param date - Date object to extract month from
 * @returns Abbreviated month name in French (e.g., "janv.", "déc.")
 *
 * @example
 * getShortMonthName(new Date('2023-12-25')) // => "déc."
 * getShortMonthName(new Date('2023-01-15')) // => "janv."
 */
export function getShortMonthName(date: Date): string {
  return format(date, 'MMM', { locale: fr })
}