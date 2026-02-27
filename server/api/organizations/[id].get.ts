import { eq } from 'drizzle-orm'
import { organizations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate patient ID
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Organization ID is required'
      })
    }

    // 2. Require current user and organization from session
    await requireAuth(event)

    // 3. Fetch organization
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1)

    if (!organization) {
      throw createError({
        statusCode: 404,
        message: 'Organization not found'
      })
    }

    return organization
  } catch (error) {
    handleApiError(error, "Erreur lors de la récupération de l'organisation")
  }
})
