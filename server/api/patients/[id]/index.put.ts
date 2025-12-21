import { eq, and, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'
import { patientUpdateSchema } from '~~/shared/types/patient.types'

// PUT /api/patients/[id] - Update patient
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID is required'
    })
  }

  // Get current user and organization from session
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  const body = await readBody(event)

  try {
    // Convert date strings to Date objects
    const processedBody = {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      notes: body.notes?.map((note: any) => ({
        ...note,
        date: new Date(note.date)
      }))
    }

    // Validate input
    const validatedData = patientUpdateSchema.parse(processedBody)

    // Update patient
    const [updatedPatient] = await db
      .update(patients)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(and(eq(patients.id, id), eq(patients.organizationId, activeOrganizationId), isNull(patients.deletedAt)))
      .returning()

    if (!updatedPatient) {
      throw createError({
        statusCode: 404,
        message: 'Patient not found'
      })
    }

    return updatedPatient
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Invalid patient data',
        data: error.errors
      })
    }
    console.error('Error updating patient:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update patient'
    })
  }
})
