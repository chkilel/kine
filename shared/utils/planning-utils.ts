import type { AvailabilityException, WeeklyAvailabilityTemplate } from '../types/availability.types'
import { getDayOfWeek, minutesToTime, timeToMinutes } from './date-utils'

export interface TimeRange {
  start: string
  end: string
}

export interface BookedPeriod {
  start: string
  end: string
  sessionId: string
}

export function getEffectiveAvailability(
  date: string,
  templates: WeeklyAvailabilityTemplate[],
  exceptions: AvailabilityException[]
): TimeRange | null {
  const dayOfWeek = getDayOfWeek(date)

  const dateExceptions = exceptions.filter((e) => e.date === date)

  const unavailableException = dateExceptions.find((e) => !e.isAvailable)
  if (unavailableException) {
    return null
  }

  const availableException = dateExceptions.find((e) => e.isAvailable)
  if (availableException) {
    if (availableException.startTime && availableException.endTime) {
      return {
        start: availableException.startTime,
        end: availableException.endTime
      }
    }
  }

  const template = templates.find((t) => t.dayOfWeek === dayOfWeek)

  if (!template) {
    return null
  }

  return {
    start: template.startTime,
    end: template.endTime
  }
}

export function generateTimeSlots(
  availableRanges: TimeRange[],
  bookedPeriods: BookedPeriod[],
  duration: number,
  gapMinutes: number,
  maxSessions: number
): string[] {
  const slots: string[] = []
  // const slotInterval = 15

  for (const range of availableRanges) {
    const startMinutes = timeToMinutes(range.start)
    const endMinutes = timeToMinutes(range.end)

    for (let time = startMinutes; time + duration <= endMinutes; time += gapMinutes) {
      const startTime = minutesToTime(time)
      const endTime = minutesToTime(time + duration)

      const concurrentBookings = countConcurrentBookings(startTime, endTime, bookedPeriods)

      if (concurrentBookings < maxSessions) {
        const hasConflict = checkTimeSlotConflicts(startTime, endTime, bookedPeriods, gapMinutes)
        if (!hasConflict) {
          slots.push(startTime)
        }
      }
    }
  }

  return slots
}

export function subtractBookedPeriods(
  availableRanges: TimeRange[],
  bookedPeriods: BookedPeriod[],
  gapMinutes: number
): TimeRange[] {
  const result: TimeRange[] = []

  for (const available of availableRanges) {
    let currentRanges = [available]

    for (const booked of bookedPeriods) {
      const newRanges: TimeRange[] = []

      for (const range of currentRanges) {
        const splitRanges = subtractPeriodFromRange(range, booked, gapMinutes)
        newRanges.push(...splitRanges)
      }

      currentRanges = newRanges
    }

    result.push(...currentRanges)
  }

  return result
}

function subtractPeriodFromRange(range: TimeRange, booked: BookedPeriod, gapMinutes: number): TimeRange[] {
  const rangeStart = timeToMinutes(range.start)
  const rangeEnd = timeToMinutes(range.end)
  const bookedStart = timeToMinutes(booked.start)
  const bookedEnd = timeToMinutes(booked.end)

  const gapBefore = gapMinutes
  const gapAfter = gapMinutes

  const effectiveBookedStart = Math.max(0, bookedStart - gapBefore)
  const effectiveBookedEnd = bookedEnd + gapAfter

  if (effectiveBookedEnd <= rangeStart || effectiveBookedStart >= rangeEnd) {
    return [range]
  }

  const result: TimeRange[] = []

  if (effectiveBookedStart > rangeStart) {
    result.push({
      start: range.start,
      end: minutesToTime(effectiveBookedStart)
    })
  }

  if (effectiveBookedEnd < rangeEnd) {
    result.push({
      start: minutesToTime(effectiveBookedEnd),
      end: range.end
    })
  }

  return result
}

export function hasConflict(
  startTime: string,
  endTime: string,
  bookedPeriods: BookedPeriod[],
  gapMinutes: number
): boolean {
  return checkTimeSlotConflicts(startTime, endTime, bookedPeriods, gapMinutes)
}

function checkTimeSlotConflicts(
  startTime: string,
  endTime: string,
  bookedPeriods: BookedPeriod[],
  gapMinutes: number
): boolean {
  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)

  for (const booked of bookedPeriods) {
    const bookedStart = timeToMinutes(booked.start)
    const bookedEnd = timeToMinutes(booked.end)

    const newEndsBeforeBooked = newEnd + gapMinutes <= bookedStart
    const newStartsAfterBooked = newStart >= bookedEnd + gapMinutes

    if (!newEndsBeforeBooked && !newStartsAfterBooked) {
      return true
    }
  }

  return false
}

export function countConcurrentBookings(startTime: string, endTime: string, bookedPeriods: BookedPeriod[]): number {
  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)

  let count = 0

  for (const booked of bookedPeriods) {
    const bookedStart = timeToMinutes(booked.start)
    const bookedEnd = timeToMinutes(booked.end)

    if (newEnd > bookedStart && newStart < bookedEnd) {
      count++
    }
  }

  return count
}

export function addSecondsToTime(time: string): string {
  if (time.length === 5) {
    return `${time}:00`
  }
  return time
}

export function calculateEndTime(startTime: string, duration: number): string {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration
  return minutesToTime(endMinutes)
}

export function normalizeTimeFormat(time: string): string {
  if (time.length === 5) {
    return time
  }
  if (time.length === 8) {
    return time.slice(0, 5)
  }
  throw new Error(`Invalid time format: ${time}`)
}
