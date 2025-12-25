import { eq, and, isNull } from 'drizzle-orm'
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
      message: 'Patient ID and Document ID are required'
    })
  }

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

  try {
    const [document] = await db
      .select()
      .from(patientDocuments)
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, activeOrganizationId)
        )
      )
      .limit(1)

    if (!document) {
      throw createError({
        statusCode: 404,
        message: 'Document not found'
      })
    }

    const config = useRuntimeConfig(event)
    const accountId = config.r2AccountId
    const downloadUrl = `https://pub-${accountId}.r2.dev/${document.storageKey}`

    return { ...document, downloadUrl }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching document:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch document'
    })
  }
})
