import { format, differenceInYears, parseISO, isValid } from 'date-fns'
import { CalendarDate } from '@internationalized/date'

import { fr } from 'date-fns/locale'

/**
 * Safely converts ISO date string to Date object
 * Handles null/undefined inputs and invalid date strings with graceful fallback
 * @param dateString - ISO date string in YYYY-MM-DD format or null/undefined
 * @returns Date object if valid, null if input is null/undefined or invalid
 * @throws Logs warning to console for invalid date strings
 */
export function toDate(dateString: string | null): Date | null {
  if (!dateString) return null
  try {
    return parseISO(dateString)
  } catch {
    console.warn('Invalid date string:', dateString)
    return null
  }
}

/**
 * Formats date for display in French locale (dd/MM/yyyy format)
 * Accepts both Date objects and ISO date strings for maximum flexibility
 * Uses French locale for proper date formatting conventions
 * @param date - Date object or ISO date string (YYYY-MM-DD format)
 * @returns Formatted date string (e.g., "25/12/2023") or "-" if invalid/null
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? toDate(date) : date
  if (!dateObj) return '-'

  return format(dateObj, 'dd/MM/yyyy', { locale: fr })
}

/**
 * Calculates current age from date of birth
 * Computes precise age in years based on current date
 * Accepts both Date objects and ISO date strings for flexibility
 * @param dateOfBirth - Date object or ISO date string (YYYY-MM-DD format)
 * @returns Age as string (e.g., "25") or empty string if invalid input
 * @throws Logs error to console for invalid date calculations
 */ export function getAge(dateOfBirth: Date | string) {
  if (!dateOfBirth) return ''
  try {
    let birth: Date
    if (dateOfBirth instanceof Date) {
      birth = dateOfBirth
    } else if (typeof dateOfBirth === 'string') {
      birth = parseISO(dateOfBirth)
    } else {
      return ''
    }
    const age = differenceInYears(new Date(), birth)
    return age.toString()
  } catch (error) {
    console.error('Error calculating age:', error, dateOfBirth)
    return ''
  }
}

/**
 * Validates date string and converts to Date object if valid
 * Supports multiple date formats with comprehensive validation
 * @param dateString - Date string in various formats (ISO, DD/MM/YYYY, etc.)
 * @returns Date object if valid, null if invalid or null/undefined
 */
export function isValidDateAndConvert(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    try {
      const date = parseISO(dateString)
      if (isValid(date)) return date
    } catch {
      // Continue to other formats
    }
  }

  // Try DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts
      const day = Number(dayStr)
      const month = Number(monthStr)
      const year = Number(yearStr)

      // Validate that all are valid numbers
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month - 1, day)
        if (isValid(date) && date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date
        }
      }
    }
  }

  // Try MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [monthStr, dayStr, yearStr] = parts
      const month = Number(monthStr)
      const day = Number(dayStr)
      const year = Number(yearStr)

      // Validate that all are valid numbers
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month - 1, day)
        if (isValid(date) && date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date
        }
      }
    }
  }

  // Try generic Date parsing as last resort
  try {
    const date = new Date(dateString)
    if (isValid(date) && !isNaN(date.getTime())) {
      return date
    }
  } catch {
    // Invalid date
  }

  return null
}

// Formatted date range
export const formatDateRange = (startDate: Date | string, endDate: Date | string | null) => {
  const start = formatDate(startDate)
  const end = endDate ? formatDate(endDate) : 'En cours'
  return `${start} - ${end}`
}

// Helper: Convert Date to CalendarDate
export const dateToCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

// Check if date is unavailable (weekends and past dates)
export const isDateUnavailable = (date: any): boolean => {
  const dateObj = date instanceof Date ? date : new Date(date.toString())
  const day = dateObj.getDay()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  //day === 6 if we need to disable Saturdays
  return day === 0 || dateObj < today
}
