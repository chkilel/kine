import { and, eq, inArray, ne } from 'drizzle-orm'
import { availabilityExceptions, consultations, users, weeklyAvailabilityTemplates } from '~~/server/database/schema'
import { slotsRequestSchema } from '~~/shared/types/availability.types'

interface SlotsResponse {
  slots: Record<
    string,
    {
      availableSlots: string[]
      unavailable: boolean
    }
  >
}

export default defineEventHandler(async (event) => {
  // Extract therapist ID from route parameters
  const therapistId = getRouterParam(event, 'therapistId')
  if (!therapistId) {
    throw createError({
      statusCode: 400,
      message: 'Therapist ID is required'
    })
  }

  // Parse and validate request body using schema
  const body = await readValidatedBody(event, slotsRequestSchema.parse)
  // console.log('🚀 >>> ', 'body', ': ', { therapistId, body })

  // Get database connection for this request
  const db = useDrizzle(event)

  // Fetch therapist's consultation gap and slot increment settings
  const [therapist] = await db
    .select({ consultationGapMinutes: users.consultationGapMinutes, slotIncrementMinutes: users.slotIncrementMinutes })
    .from(users)
    .where(eq(users.id, therapistId))
    .limit(1)

  // Default to 15 minutes gap if not set
  const gapMinutes = therapist?.consultationGapMinutes || 15
  // Default to 15 minutes slot increment if not set
  const slotIncrementMinutes = therapist?.slotIncrementMinutes || 15

  // Fetch weekly availability templates for the therapist at the requested location
  const templates = await db
    .select()
    .from(weeklyAvailabilityTemplates)
    .where(
      and(eq(weeklyAvailabilityTemplates.userId, therapistId), eq(weeklyAvailabilityTemplates.location, body.location))
    )

  // Fetch availability exceptions for the requested dates
  const exceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(and(eq(availabilityExceptions.userId, therapistId), inArray(availabilityExceptions.date, body.dates)))

  // Fetch existing consultations for the requested dates (excluding cancelled ones)
  const existingConsultations = await db
    .select({
      id: consultations.id,
      date: consultations.date,
      startTime: consultations.startTime,
      endTime: consultations.endTime
    })
    .from(consultations)
    .where(
      and(
        eq(consultations.therapistId, therapistId),
        inArray(consultations.date, body.dates),
        ne(consultations.status, 'cancelled')
      )
    )

  console.log(
    '🚀 >>> ',
    '=========================================================================================================\n',
    ': ',
    {
      templates,
      exceptions,
      existingConsultations
    }
  )

  // Initialize response object with empty slots object
  const slotsResponse: SlotsResponse = {
    slots: {}
  }

  // Process each date to calculate available slots
  for (const date of body.dates) {
    // Get day of week (0-6) for the date
    const dayOfWeek = getDayOfWeek(date)

    // Skip invalid dates
    if (!dayOfWeek) {
      slotsResponse.slots[date] = {
        availableSlots: [],
        unavailable: true
      }
      continue
    }

    // Calculate effective availability by combining templates and exceptions
    const availability = getEffectiveAvailability(date, templates, exceptions)

    // Skip if no availability for this date
    if (!availability) {
      slotsResponse.slots[date] = {
        availableSlots: [],
        unavailable: true
      }
      continue
    }

    // Get max concurrent sessions from template (default to 1)
    const template = templates.find((t: WeeklyAvailabilityTemplate) => t.dayOfWeek === dayOfWeek)
    const maxSessions = template?.maxSessions || 1

    // Filter consultations for this specific date
    const dayConsultations = existingConsultations.filter((c: any) => c.date === date)

    // Map consultations to booked periods format
    const bookedPeriods: BookedPeriod[] = dayConsultations.map((c: any) => ({
      start: c.startTime || '',
      end: c.endTime || '',
      sessionId: c.id
    }))

    // Start with the calculated availability as the initial available range
    let availableRanges: TimeRange[] = [availability]

    // Subtract booked periods from available ranges with gap buffer (only when maxSessions == 1)
    if (maxSessions === 1) {
      availableRanges = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)
    }

    // Generate time slots from the remaining available ranges
    const availableSlots = generateTimeSlots(
      availableRanges,
      bookedPeriods,
      body.duration,
      gapMinutes,
      slotIncrementMinutes,
      maxSessions
    )

    // Store slots for this date
    slotsResponse.slots[date] = {
      availableSlots,
      unavailable: availableSlots.length === 0
    }
  }

  // Return all calculated slots
  return slotsResponse
})
