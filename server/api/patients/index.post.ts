import type { Session } from '~~/shared/types/auth.types'
import { patients } from '~~/server/database/schema'

// POST /api/patients - Create new patient
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  // Get current user and organization from session
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  try {
    // Read raw body first to preprocess dates
    const rawBody = await readBody(event)

    // Convert date strings to Date objects before validation
    const processedBody = {
      ...rawBody,
      dateOfBirth: rawBody.dateOfBirth ? new Date(rawBody.dateOfBirth) : undefined,
      notes: rawBody.notes?.map((note: any) => ({
        ...note,
        date: note.date ? new Date(note.date) : undefined
      }))
    }

    // Validate input
    const body = patientCreateSchema.parse(processedBody)

    const validatedData = {
      ...body,
      organizationId: activeOrganizationId
    }

    // Create patient
    const [newPatient] = await db.insert(patients).values(validatedData).returning()

    return newPatient
  } catch (error: any) {
    console.error('Error creating patient:', error)
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid patient data',
        data: error.errors
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create patient'
    })
  }
})
