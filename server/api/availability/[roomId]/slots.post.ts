import { and, eq, inArray, ne } from 'drizzle-orm'
import { rooms } from '~~/server/database/schema/rooms'
import { availabilityExceptions, consultations, users, weeklyAvailabilityTemplates } from '~~/server/database/schema'
import { roomSlotsRequestSchema } from '~~/shared/types/availability.types'
import {
  getEffectiveAvailability,
  subtractBookedPeriods,
  generateTimeSlots,
  type TimeRange,
  type BookedPeriod
} from '~~/shared/utils/planning-utils'
import { getDayOfWeek } from '~~/shared/utils/date-utils'
import { requireAuth } from '~~/server/utils/auth'

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

  const roomData = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.organizationId, organizationId)))
    .limit(1)

  const room = roomData[0]

  if (!room) {
    throw createError({
      statusCode: 404,
      message: 'Room not found'
    })
  }

  const therapistData = await db
    .select({ consultationGapMinutes: users.consultationGapMinutes, slotIncrementMinutes: users.slotIncrementMinutes })
    .from(users)
    .limit(1)

  const gapMinutes = therapistData[0]?.consultationGapMinutes || 15
  const slotIncrementMinutes = therapistData[0]?.slotIncrementMinutes || 15

  const templates = await db
    .select()
    .from(weeklyAvailabilityTemplates)
    .where(eq(weeklyAvailabilityTemplates.location, 'clinic'))

  const exceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(inArray(availabilityExceptions.date, body.dates))

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
        eq(consultations.roomId, roomId),
        inArray(consultations.date, body.dates),
        ne(consultations.status, 'cancelled')
      )
    )

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

    const availability = getEffectiveAvailability(date, templates, exceptions)

    if (!availability) {
      slotsResponse.slots[date] = {
        availableSlots: [],
        unavailable: true
      }
      continue
    }

    const dayConsultations = existingConsultations.filter((c: any) => c.date === date)

    const bookedPeriods: BookedPeriod[] = dayConsultations.map((c: any) => ({
      start: c.startTime || '',
      end: c.endTime || '',
      sessionId: c.id
    }))

    let availableRanges: TimeRange[] = [availability]

    availableRanges = subtractBookedPeriods(availableRanges, bookedPeriods, gapMinutes)

    const availableSlots = generateTimeSlots(
      availableRanges,
      bookedPeriods,
      body.duration,
      gapMinutes,
      slotIncrementMinutes,
      1
    )

    slotsResponse.slots[date] = {
      availableSlots,
      unavailable: availableSlots.length === 0
    }
  }

  return slotsResponse
})
