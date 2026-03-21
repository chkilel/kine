import { eq, and } from 'drizzle-orm'
import { appointments, treatmentSessions, organizations, treatmentPlans } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const { appointmentId, primaryConcern, treatmentSummary } = await readValidatedBody(
      event,
      createTreatmentSessionSchema.parse
    )

    // Fetch the appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, appointmentId)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Appointment not found'
      })
    }

    // Check if appointment is cancelled
    if (appointment.status === 'cancelled') {
      throw createError({
        statusCode: 400,
        message: 'Cannot create treatment session for cancelled appointment'
      })
    }

    // Check if treatment session already exists
    const [existingSession] = await db
      .select()
      .from(treatmentSessions)
      .where(eq(treatmentSessions.appointmentId, appointmentId))
      .limit(1)

    if (existingSession) {
      throw createError({
        statusCode: 409,
        message: 'Treatment session already exists for this appointment'
      })
    }

    // Fetch organization with pricing
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)

    if (!organization) {
      throw createError({
        statusCode: 404,
        message: 'Organization not found'
      })
    }

    // Fetch treatment plan with pricing if it exists
    let treatmentPlan = null
    if (appointment.treatmentPlanId) {
      const [plan] = await db
        .select()
        .from(treatmentPlans)
        .where(eq(treatmentPlans.id, appointment.treatmentPlanId))
        .limit(1)
      if (plan) {
        treatmentPlan = {
          ...plan,
          notes: plan.notes || []
        }
      }
    }

    // Calculate inherited price
    const priceCent = calculateInheritedPrice({
      appointment,
      treatmentPlan,
      organization: organization as any
    })

    // Create treatment session
    const [treatmentSession] = await db
      .insert(treatmentSessions)
      .values({
        organizationId,
        appointmentId,
        patientId: appointment.patientId,
        therapistId: appointment.therapistId,
        treatmentPlanId: appointment.treatmentPlanId,
        primaryConcern,
        treatmentSummary,
        status: 'pre_session',
        priceCent
      })
      .returning()

    // Update appointment status to confirmed (keeps scheduling context)
    await db
      .update(appointments)
      .set({ status: 'confirmed' })
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, appointmentId)))

    setResponseStatus(event, 201)
    return successResponse(treatmentSession, 'Treatment session created successfully')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to create treatment session')
  }
})
