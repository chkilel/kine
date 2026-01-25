import {
  format,
  differenceInYears,
  parseISO,
  differenceInCalendarDays,
  differenceInWeeks,
  differenceInMonths
} from 'date-fns'
import { CalendarDate } from '@internationalized/date'
import { fr } from 'date-fns/locale'

// ============================================================================
// DATE PARSING & VALIDATION
// ============================================================================

export function safeParseISODate(dateString: string | null): Date | null {
  if (!dateString) return null

  try {
    const date = parseISO(dateString)
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

export const isDateDisabled = (date: Date | any): boolean => {
  const dateObj = date instanceof Date ? date : new Date(date.toString())
  const day = dateObj.getDay()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return day === 0 || dateObj < today
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

export function getAbbreviatedMonthName(date: Date): string {
  return format(date, 'MMM', { locale: fr })
}

export function extractDayAndMonth(dateString: string) {
  const date = parseISO(dateString)

  return {
    dayName: format(date, 'EEEE', { locale: fr }), // ex: "lundi"
    dayNameShort: format(date, 'EEE', { locale: fr }).replace('.', ''), // "Lun", "Mar", etc.
    day: format(date, 'd', { locale: fr }),
    month: format(date, 'MMM', { locale: fr }).slice(0, 3).replace('.', '') // remove the dot
  }
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
  const rtfAlways = new Intl.RelativeTimeFormat('fr', { numeric: 'always' })

  const diffDays = differenceInCalendarDays(d, now)

  // Always use days as minimum unit
  if (diffDays === 0) return rtf.format(0, 'day') // "aujourd'hui"

  if (diffDays === -1) return rtf.format(-1, 'day') // "hier"

  if (Math.abs(diffDays) < 7) return rtfAlways.format(diffDays, 'day')

  const diffWeeks = differenceInWeeks(d, now)
  if (Math.abs(diffWeeks) < 4) return rtfAlways.format(diffWeeks, 'week')

  const diffMonths = differenceInMonths(d, now)
  if (Math.abs(diffMonths) < 12) return rtfAlways.format(diffMonths, 'month')

  const diffYears = differenceInYears(d, now)
  return rtfAlways.format(diffYears, 'year')
}

export function formatFrenchDate(date: Date | string | null): string {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? safeParseISODate(date) : date
  if (!dateObj || isNaN(dateObj.getTime())) return '-'

  return format(dateObj, 'dd/MM/yyyy', { locale: fr })
}

export const formatFrenchDateRange = (startDate: Date | string, endDate: Date | string | null): string => {
  const start = formatFrenchDate(startDate)
  const end = endDate ? formatFrenchDate(endDate) : 'En cours'
  return `${start} - ${end}`
}

export function getDayOfWeek(date: string): string {
  const d = parseISO(date)
  return format(d, 'EEE').toLowerCase() // Returns 'sun', 'mon', 'tue', 'wed', etc.
}

// ============================================================================
// DATE CALCULATIONS
// ============================================================================

export function calculateAge(dateOfBirth: Date | string | null): string {
  if (!dateOfBirth) return ''

  try {
    const birth = dateOfBirth instanceof Date ? dateOfBirth : parseISO(dateOfBirth)

    if (isNaN(birth.getTime())) {
      console.error('Invalid date of birth:', dateOfBirth)
      return ''
    }

    const age = differenceInYears(new Date(), birth)
    return age >= 0 ? age.toString() : ''
  } catch (error) {
    console.error('Error calculating age:', error, dateOfBirth)
    return ''
  }
}

// ============================================================================
// DATE CONVERSIONS
// ============================================================================

export const convertToCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}
