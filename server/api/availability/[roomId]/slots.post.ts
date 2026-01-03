import { and, eq, inArray, ne } from 'drizzle-orm'
import { rooms } from '~~/server/database/schema/rooms'
import { availabilityExceptions, consultations, users, weeklyAvailabilityTemplates } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'roomId')
  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: 'Room ID is required'
    })
  }

  const body = await readValidatedBody(event, roomSlotsRequestSchema.parse)

  const db = useDrizzle(event)

  const { organizationId } = await requireAuth(event)

  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.organizationId, organizationId), eq(rooms.id, roomId)))
    .limit(1)

  if (!room) {
    throw createError({
      statusCode: 404,
      message: 'Room not found'
    })
  }

  let gapMinutes = 15
  let slotIncrementMinutes = 15
  let templates: any[] = []
  let exceptions: any[] = []

  if (body.therapistId) {
    const therapistData = await db
      .select({
        consultationGapMinutes: users.consultationGapMinutes,
        slotIncrementMinutes: users.slotIncrementMinutes
      })
      .from(users)
      .where(eq(users.id, body.therapistId))
      .limit(1)

    gapMinutes = therapistData[0]?.consultationGapMinutes || 15
    slotIncrementMinutes = therapistData[0]?.slotIncrementMinutes || 15

    templates = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.userId, body.therapistId),
          eq(weeklyAvailabilityTemplates.location, 'clinic')
        )
      )

    exceptions = await db
      .select()
      .from(availabilityExceptions)
      .where(and(eq(availabilityExceptions.userId, body.therapistId), inArray(availabilityExceptions.date, body.dates)))
  }

  const consultationQuery = body.therapistId
    ? and(
        eq(consultations.roomId, roomId),
        eq(consultations.therapistId, body.therapistId),
        inArray(consultations.date, body.dates),
        ne(consultations.status, 'cancelled')
      )
    : and(
        eq(consultations.roomId, roomId),
        inArray(consultations.date, body.dates),
        ne(consultations.status, 'cancelled')
      )

  const existingConsultations = await db
    .select({
      id: consultations.id,
      date: consultations.date,
      startTime: consultations.startTime,
      endTime: consultations.endTime
    })
    .from(consultations)
    .where(consultationQuery)

  const slotsResponse = {
    slots: {} as Record<string, { availableSlots: string[]; unavailable: boolean }>
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

    let availability: TimeRange[]

    if (body.therapistId) {
      availability = getEffectiveAvailability(date, templates, exceptions)
    } else {
      // FIXME get the working hours form the organization profile
      availability = [
        {
          start: WORKING_HOURS.start.slice(0, 5),
          end: WORKING_HOURS.end.slice(0, 5)
        }
      ]
    }

    if (availability.length === 0) {
      slotsResponse.slots[date] = {
        availableSlots: [],
        unavailable: true
      }
      continue
    }

    const dayConsultations = existingConsultations.filter((c) => c.date === date)

    const bookedPeriods: BookedPeriod[] = dayConsultations.map((c: any) => ({
      start: c.startTime || '',
      end: c.endTime || '',
      sessionId: c.id
    }))

    let availableRanges: TimeRange[] = availability

    availableRanges = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

    const availableSlots = generateTimeSlots(
      availableRanges,
      bookedPeriods,
      body.duration,
      gapMinutes,
      slotIncrementMinutes
    )

    slotsResponse.slots[date] = {
      availableSlots,
      unavailable: availableSlots.length === 0
    }
  }

  return slotsResponse
})
