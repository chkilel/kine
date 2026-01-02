import { format, differenceInYears, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns'
import { CalendarDate, parseTime, Time } from '@internationalized/date'
import { fr } from 'date-fns/locale'

// ============================================================================
// TIME UTILITIES
// ============================================================================

export const removeSecondsFromTime = (timeString: string): string => {
  const timeRegex = /^\d{2}:\d{2}:\d{2}$/

  if (!timeRegex.test(timeString)) {
    throw new Error('Invalid time format. Expected HH:MM:SS')
  }

  return timeString.slice(0, 5)
}

export const timeToMinutes = (time: string): number => {
  const parsed = parseTime(time)
  if (!parsed) return 0
  return parsed.hour * 60 + parsed.minute
}

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return new Time(hours, mins).toString().slice(0, 5)
}

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
    day: format(date, 'd', { locale: fr }),
    month: format(date, 'MMM', { locale: fr })
  }
}

export function formatRelativeDate(date: Date | string): string {
  const noteDate = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffInDays = differenceInDays(now, noteDate)

  if (diffInDays === 0) return "Aujourd'hui"
  if (diffInDays === 1) return 'Hier'

  return formatDistanceToNow(noteDate, { addSuffix: true, locale: fr })
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
