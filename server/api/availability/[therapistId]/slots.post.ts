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
  const therapistId = getRouterParam(event, 'therapistId')
  if (!therapistId) {
    throw createError({
      statusCode: 400,
      message: 'Therapist ID is required'
    })
  }

  const body = await readValidatedBody(event, slotsRequestSchema.parse)
  console.log('🚀 >>> ', 'body', ': ', body)

  const db = useDrizzle(event)

  const [therapist] = await db
    .select({ consultationGapMinutes: users.consultationGapMinutes })
    .from(users)
    .where(eq(users.id, therapistId))
    .limit(1)

  console.log('🚀 >>> ', 'theraipst API', ': ', therapist)

  const gapMinutes = therapist?.consultationGapMinutes || 15

  const templates = await db
    .select()
    .from(weeklyAvailabilityTemplates)
    .where(
      and(eq(weeklyAvailabilityTemplates.userId, therapistId), eq(weeklyAvailabilityTemplates.location, body.location))
    )

  const exceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(and(eq(availabilityExceptions.userId, therapistId), inArray(availabilityExceptions.date, body.dates)))

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

  console.log('🚀 >>> ', 'first', ': ', {
    templates,
    exceptions,
    existingConsultations
  })

  const slotsResponse: SlotsResponse = {
    slots: {}
  }

  for (const date of body.dates) {
    const dayOfWeek = getDayOfWeek(date)

    if (!dayOfWeek) {
      slotsResponse.slots[date] = {
        availableSlots: [],
        unavailable: true
      }
      continue
    }

    const availability = getEffectiveAvailability(date, templates, exceptions)

    if (!availability) {
      slotsResponse.slots[date] = {
        availableSlots: [],
        unavailable: true
      }
      continue
    }

    const template = templates.find((t: WeeklyAvailabilityTemplate) => t.dayOfWeek === dayOfWeek)
    const maxSessions = template?.maxSessions || 1

    const dayConsultations = existingConsultations.filter((c: any) => c.date === date)

    const bookedPeriods: BookedPeriod[] = dayConsultations.map((c: any) => ({
      start: c.startTime || '',
      end: c.endTime || '',
      sessionId: c.id
    }))

    let availableRanges: TimeRange[] = [availability]

    availableRanges = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

    const availableSlots = generateTimeSlots(availableRanges, bookedPeriods, body.duration, gapMinutes, maxSessions)

    slotsResponse.slots[date] = {
      availableSlots,
      unavailable: availableSlots.length === 0
    }
  }

  return slotsResponse
})
