import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { patientDocuments } from '../../../../database/schema'
import { useDrizzle } from '../../../../utils/database'
import { createAuth } from '../../../../utils/auth'
import type { Session } from '~~/shared/types/auth.types'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const docId = getRouterParam(event, 'docId')

  if (!patientId || !docId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Patient ID and Document ID are required'
    })
  }

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

  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  try {
    const body = await readBody(event)

    const updateSchema = z.object({
      category: z.enum(['referral', 'imaging', 'lab_results', 'treatment_notes', 'other']),
      description: z.string().optional()
    })

    const validatedData = updateSchema.parse(body)

    const [updatedDocument] = await db
      .update(patientDocuments)
      .set({
        category: validatedData.category,
        description: validatedData.description
      })
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, activeOrganizationId),
          isNull(patientDocuments.deletedAt)
        )
      )
      .returning()

    if (!updatedDocument) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    return updatedDocument
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid document data',
        data: error.errors
      })
    }
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating document:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update document'
    })
  }
})