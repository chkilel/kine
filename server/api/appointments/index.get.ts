import { eq, and, asc, or, gt, inArray, sql, getColumns, isNull } from 'drizzle-orm'
import { appointments, rooms, treatmentPlans } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const q = await getValidatedQuery(event, appointmentQuerySchema.parse)

    const limit = Math.min(q.limit ?? 20, 100)

    // =========================
    // 1. CONDITIONS
    // =========================
    const conditions = [eq(appointments.organizationId, organizationId)]

    if (q.therapistId) conditions.push(eq(appointments.therapistId, q.therapistId))

    if (q.patientId) conditions.push(eq(appointments.patientId, q.patientId))

    if (q.type) conditions.push(eq(appointments.type, q.type))

    if (q.dateFrom) conditions.push(sql`${appointments.date} >= ${q.dateFrom}`)

    if (q.dateTo) conditions.push(sql`${appointments.date} <= ${q.dateTo}`)

    if (q.treatmentPlanId) {
      conditions.push(eq(appointments.treatmentPlanId, q.treatmentPlanId))
    } else if (q.onlyIndependent) {
      conditions.push(isNull(appointments.treatmentPlanId))
    }

    if (q.status?.length) {
      conditions.push(
        q.status.length === 1 ? eq(appointments.status, q.status[0]!) : inArray(appointments.status, q.status)
      )
    }

    // =========================
    // 2. CURSOR
    // =========================
    if (q.cursorDate && q.cursorId) {
      const cursorCondition = or(
        gt(appointments.date, q.cursorDate),
        and(eq(appointments.date, q.cursorDate), gt(appointments.id, q.cursorId))
      )

      conditions.push(cursorCondition!)
    }

    // =========================
    // 3. BASE SELECT (FLAT + SAFE)
    // =========================
    const selectFields: any = {
      ...getColumns(appointments),
      roomName: rooms.name
    }

    if (q.withPlan) {
      selectFields.planTitle = treatmentPlans.title
    }

    // Start query with room name
    let query = db.select(selectFields).from(appointments).leftJoin(rooms, eq(appointments.roomId, rooms.id))

    // =========================
    // 4. CONDITIONAL JOINS (SAFE ORDER)
    // =========================

    if (q.withPlan) {
      query = query.leftJoin(treatmentPlans, eq(appointments.treatmentPlanId, treatmentPlans.id))
    }

    // =========================
    // 5. EXECUTE BASE QUERY
    // =========================
    const rows = (await query
      .where(and(...conditions))
      .orderBy(asc(appointments.date), asc(appointments.id))
      .limit(limit + 1)) as unknown as Appointment[]

    // =========================
    // 6. CURSOR HANDLING (FIXED TYPE SAFETY)
    // =========================
    let nextCursor: null | { date: string; id: string } = null

    if (rows.length > limit) {
      const next = rows.pop()!

      nextCursor = {
        date: next.date,
        id: next.id
      }
    }

    return listResponse(rows, nextCursor)
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des rendez-vous')
  }
})
