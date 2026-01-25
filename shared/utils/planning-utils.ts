import type { AvailabilityException, WeeklyAvailabilityTemplate } from '../types/availability.types'
import { WORKING_HOURS } from './constants.availability'
import { getDayOfWeek } from './date-utils'
import { minutesToTime, timeToMinutes } from './time'

export interface TimeRange {
  start: string
  end: string
}

export interface BookedPeriod {
  start: string
  end: string
  sessionId: string
}

/**
 * Calculates the effective availability for a specific date by combining:
 * 1. Weekly availability template for that day of week
 * 2. Date-specific availability exceptions (extra availability)
 * 3. Date-specific unavailability exceptions (blocking time)
 *
 * Returns array of available time ranges after subtracting unavailable periods
 */
export function getEffectiveAvailability(
  date: string,
  templates: WeeklyAvailabilityTemplate[],
  exceptions: AvailabilityException[]
): TimeRange[] {
  // Get day of week for the date
  const dayOfWeek = getDayOfWeek(date)
  // Filter exceptions that apply to this specific date
  const dateExceptions = exceptions.filter((e) => e.date === date)

  // Filter for availability exceptions (extra time added to normal schedule)
  const availableExceptions = dateExceptions.filter((e) => e.isAvailable && e.startTime && e.endTime)

  // Check if there's a full-day unavailability exception (block the entire day)
  const fullDayUnavailable = dateExceptions.find((e) => !e.isAvailable && !e.startTime && !e.endTime)

  // Check if there's a full-day availability exception (add working hours as availability)
  const fullDayAvailable = dateExceptions.find((e) => e.isAvailable && !e.startTime && !e.endTime)

  // If fully unavailable day with no extra availability added, return empty array
  if (fullDayUnavailable && availableExceptions.length === 0 && !fullDayAvailable) {
    return []
  }

  // Collect all available time ranges
  const availableRanges: TimeRange[] = []

  // Add weekly template ranges for this day of week
  const dayTemplates = templates.filter((t) => t.dayOfWeek === dayOfWeek)
  for (const template of dayTemplates) {
    availableRanges.push({
      start: template.startTime,
      end: template.endTime
    })
  }

  // Add full-day availability exception as working hours
  if (fullDayAvailable) {
    availableRanges.push({
      start: WORKING_HOURS.start,
      end: WORKING_HOURS.end
    })
  }

  // Add exception ranges for extra availability
  for (const exception of availableExceptions) {
    availableRanges.push({
      start: exception.startTime!,
      end: exception.endTime!
    })
  }

  // If no available ranges exist, return empty array
  if (availableRanges.length === 0) {
    return []
  }

  // Filter for unavailability exceptions (blocking time ranges)
  const unavailablePeriods = dateExceptions
    .filter((e) => !e.isAvailable && e.startTime && e.endTime)
    .map((e) => ({ start: e.startTime!, end: e.endTime!, sessionId: '' }))

  // Start with all available ranges
  let remainingRanges = availableRanges
  // Subtract unavailable periods from available ranges (carve out blocked time)
  if (unavailablePeriods.length > 0) {
    remainingRanges = subtractBookedPeriods(availableRanges, unavailablePeriods, 0)
  }

  // If all ranges were subtracted, return empty array
  if (remainingRanges.length === 0) {
    return []
  }

  // Return all remaining ranges
  return remainingRanges
}

/**
 * Generates available time slots within given time ranges.
 * Iterates through each available range and checks if slots of the specified duration
 * can be placed without conflicting with existing bookings and respecting the gap.
 *
 * @param availableRanges - Time ranges where appointments can be scheduled
 * @param bookedPeriods - Existing appointments that need to be avoided
 * @param duration - Length of each time slot in minutes
 * @param gapMinutes - Minimum gap between appointments in minutes
 * @param slotIncrementMinutes - Increment between possible slot start times in minutes
 * @returns Array of start times for available slots
 */
export function generateTimeSlots(
  availableRanges: TimeRange[],
  bookedPeriods: BookedPeriod[],
  duration: number,
  gapMinutes: number,
  slotIncrementMinutes: number
): string[] {
  // Initialize array to hold all available slot start times
  const slots: string[] = []

  // // Log input parameters for debugging
  // console.log('🎰 generateTimeSlots', {
  //   availableRanges,
  //   bookedPeriods,
  //   duration,
  //   gapMinutes,
  //   slotIncrementMinutes
  // })

  // Iterate through each available time range
  for (const range of availableRanges) {
    // Convert range times to minutes for easier calculations
    const startMinutes = timeToMinutes(range.start)
    const endMinutes = timeToMinutes(range.end)

    // Try to place slots at slotIncrement-minute intervals within the range
    for (let time = startMinutes; time + duration <= endMinutes; time += slotIncrementMinutes) {
      // Convert current position to time strings
      const startTime = minutesToTime(time)
      const endTime = minutesToTime(time + duration)

      // Check if this time slot conflicts with any existing booking
      const hasConflictWithBookings = checkTimeSlotConflicts(startTime, endTime, bookedPeriods, gapMinutes)

      // Add slot only if there's no conflict
      if (!hasConflictWithBookings) {
        slots.push(startTime)
      }
    }
  }

  // Log final results for debugging
  // console.log('=======================================================  Final slots:', slots)
  return slots
}

/**
 * Subtracts booked/unavailable periods from available time ranges.
 * This is used to "carve out" unavailable time from available windows.
 *
 * For example:
 *   available: 09:00 - 17:00
 *   booked:    13:00 - 14:00
 *   result:    09:00 - 13:00 and 14:00 - 17:00
 *
 * @param availableRanges - Initial available time windows
 * @param bookedPeriods - Periods to subtract (booked/unavailable)
 * @param gapMinutes - Buffer time to add around booked periods
 * @returns Remaining available ranges after subtraction
 */
export function subtractBookedPeriods(
  availableRanges: TimeRange[],
  bookedPeriods: BookedPeriod[],
  gapMinutes: number
): TimeRange[] {
  // Initialize result array to hold remaining available ranges
  const result: TimeRange[] = []

  // Process each initial available range
  for (const available of availableRanges) {
    // Start with the current available range
    let currentRanges = [available]

    // Iterate through each booked period to subtract
    for (const booked of bookedPeriods) {
      // Create array to hold ranges after subtracting this booked period
      const newRanges: TimeRange[] = []

      // Split each current range by the booked period
      for (const range of currentRanges) {
        const splitRanges = subtractPeriodFromRange(range, booked, gapMinutes)
        newRanges.push(...splitRanges)
      }

      // Update current ranges for next booked period iteration
      currentRanges = newRanges
    }

    // Add all remaining ranges after all subtractions to result
    result.push(...currentRanges)
  }

  return result
}

/**
 * Subtracts a single booked period from a single available range.
 * Handles all overlap scenarios: no overlap, partial overlap, full overlap.
 *
 * The gapMinutes parameter ensures a buffer time around the booked period.
 *
 * @param range - The available time range to subtract from
 * @param booked - The booked period to subtract
 * @param gapMinutes - Buffer time before and after booked period
 * @returns Array of remaining available ranges (0, 1, or 2 ranges)
 */
function subtractPeriodFromRange(range: TimeRange, booked: BookedPeriod, gapMinutes: number): TimeRange[] {
  // Convert all times to minutes for easier comparison
  const rangeStart = timeToMinutes(range.start)
  const rangeEnd = timeToMinutes(range.end)
  const bookedStart = timeToMinutes(booked.start)
  const bookedEnd = timeToMinutes(booked.end)

  // Set gap buffer before and after booked period
  const gapBefore = gapMinutes
  const gapAfter = gapMinutes

  // Calculate effective booked period with gaps
  const effectiveBookedStart = Math.max(0, bookedStart - gapBefore)
  const effectiveBookedEnd = bookedEnd + gapAfter

  // If no overlap between range and booked period, return original range
  if (effectiveBookedEnd <= rangeStart || effectiveBookedStart >= rangeEnd) {
    return [range]
  }

  // Initialize result array for remaining ranges
  const result: TimeRange[] = []

  // If booked period starts after range starts, add range before gap
  if (effectiveBookedStart > rangeStart) {
    result.push({
      start: range.start,
      end: minutesToTime(effectiveBookedStart)
    })
  }

  // If booked period ends before range ends, add range after gap
  if (effectiveBookedEnd < rangeEnd) {
    result.push({
      start: minutesToTime(effectiveBookedEnd),
      end: range.end
    })
  }

  // Return remaining ranges (0, 1, or 2)
  return result
}

/**
 * Wrapper function to check if a time slot conflicts with existing bookings.
 * Alias for checkTimeSlotConflicts for better readability.
 */
export function hasConflict(
  startTime: string,
  endTime: string,
  bookedPeriods: BookedPeriod[],
  gapMinutes: number
): boolean {
  return checkTimeSlotConflicts(startTime, endTime, bookedPeriods, gapMinutes)
}

/**
 * Checks if a potential time slot conflicts with any existing booked periods.
 * A conflict exists if the new slot overlaps with a booked period
 * (considering the required gap between sessions).
 *
 * @param startTime - Start time of the potential slot
 * @param endTime - End time of the potential slot
 * @param bookedPeriods - Existing bookings to check against
 * @param gapMinutes - Required gap between sessions
 * @returns true if there's a conflict, false otherwise
 */
function checkTimeSlotConflicts(
  startTime: string,
  endTime: string,
  bookedPeriods: BookedPeriod[],
  gapMinutes: number
): boolean {
  // Convert slot times to minutes
  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)

  // Check each booked period for conflicts
  for (const booked of bookedPeriods) {
    // Convert booked period times to minutes
    const bookedStart = timeToMinutes(booked.start)
    const bookedEnd = timeToMinutes(booked.end)

    // Check if new slot ends before booked period starts (with gap buffer)
    const newEndsBeforeBooked = newEnd + gapMinutes <= bookedStart
    // Check if new slot starts after booked period ends (with gap buffer)
    const newStartsAfterBooked = newStart >= bookedEnd + gapMinutes

    // If neither condition is true, there's a conflict
    if (!newEndsBeforeBooked && !newStartsAfterBooked) {
      // console.log(`    ❌ Gap conflict: ${startTime}-${endTime} vs ${booked.start}-${booked.end} (gap: ${gapMinutes})`)
      return true
    }
  }

  // No conflicts found
  return false
}

/**
 * Adds seconds (:00) to a time string in HH:MM format.
 * Ensures consistent HH:MM:SS format.
 */
export function addSecondsToTime(time: string): string {
  // Check if time is in HH:MM format (5 characters)
  if (time.length === 5) {
    // Append seconds to make HH:MM:SS format
    return `${time}:00`
  }
  // Already has seconds, return as-is
  return time
}

/**
 * Calculates the end time based on start time and duration.
 * @param startTime - Start time in HH:MM format
 * @param duration - Duration in minutes
 * @returns End time in HH:MM format
 */
export function calculateEndTime(startTime: string, duration: number): string {
  // Convert start time to total minutes
  const startMinutes = timeToMinutes(startTime)
  // Add duration to get end time in minutes
  const endMinutes = startMinutes + duration
  // Convert back to time string format (HH:MM)
  return minutesToTime(endMinutes)
}

/**
 * Normalizes time format to HH:MM.
 * Handles both HH:MM and HH:MM:SS formats.
 * @throws Error if time format is invalid
 */
export function normalizeTimeFormat(time: string): string {
  // If already in HH:MM format (5 characters), return as-is
  if (time.length === 5) {
    return time
  }
  // If in HH:MM:SS format (8 characters), extract first 5 characters
  if (time.length === 8) {
    return time.slice(0, 5)
  }
  // Invalid format, throw error
  throw new Error(`Invalid time format: ${time}`)
}
