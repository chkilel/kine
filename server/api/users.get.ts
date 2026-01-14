import { eq } from 'drizzle-orm'
import { users, members } from '../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuth(event)

    const results = await db
      .select()
      .from(users)
      .innerJoin(members, eq(users.id, members.userId))
      .where(eq(members.organizationId, organizationId))

    return results
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération des utilisateurs')
  }
})
