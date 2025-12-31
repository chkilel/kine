import { eq, and, desc, or, isNull, like } from 'drizzle-orm'
import { rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuth(event)

    const validatedQuery = await getValidatedQuery(event, roomQuerySchema.parse)

    const filters = [eq(rooms.organizationId, organizationId), isNull(rooms.deletedAt)]

    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`
      filters.push(or(like(rooms.name, searchTerm), like(rooms.description || '', searchTerm))!)
    }

    const roomsList = await db
      .select()
      .from(rooms)
      .where(and(...filters))
      .orderBy(desc(rooms.createdAt))

    return roomsList
  } catch (error: any) {
    handleApiError(error)
  }
})
