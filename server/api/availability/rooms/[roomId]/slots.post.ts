import { and, eq, inArray, ne } from 'drizzle-orm'
import {
  rooms,
  availabilityExceptions,
  appointments,
  organizations,
  weeklyAvailabilityTemplates
} from '~~/server/database/schema'
import { WORKING_HOURS } from '~~/shared/utils/constants.availability'

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'roomId')
  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: 'ID de salle requis'
    })
  }

  const body = await readValidatedBody(event, roomSlotsRequestSchema.parse)

  const db = useDrizzle(event)

  const { organizationId } = await requireAuthWithOrg(event)

  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.organizationId, organizationId), eq(rooms.id, roomId)))
    .limit(1)

  if (!room) {
    throw createError({
      statusCode: 404,
      message: 'Salle introuvable'
    })
  }

  let gapMinutes = 15
  let slotIncrementMinutes = 15
  let templates: any[] = []
  let exceptions: any[] = []

  if (body.therapistId) {
    const [org] = await db
      .select({ scheduling: organizations.scheduling })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    const scheduling = org?.scheduling
    gapMinutes = scheduling?.appointmentGapMinutes ?? 0
    slotIncrementMinutes = scheduling?.slotIncrementMinutes ?? 15

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

  const appointmentQuery = body.therapistId
    ? and(
        eq(appointments.roomId, roomId),
        eq(appointments.therapistId, body.therapistId),
        inArray(appointments.date, body.dates),
        ne(appointments.status, 'cancelled')
      )
    : and(eq(appointments.roomId, roomId), inArray(appointments.date, body.dates), ne(appointments.status, 'cancelled'))

  const existingAppointments = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      startTime: appointments.startTime,
      endTime: appointments.endTime
    })
    .from(appointments)
    .where(appointmentQuery)

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

    const dayAppointments = existingAppointments.filter((a) => a.date === date)

    const bookedPeriods: BookedPeriod[] = dayAppointments.map((a: any) => ({
      start: a.startTime || '',
      end: a.endTime || '',
      sessionId: a.id
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
