import { eq } from 'drizzle-orm'
import { members, users } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuth(event)

    const organizationMembers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        email: users.email,
        image: users.image,
        licenseNumber: users.licenseNumber,
        specialization: users.specialization,
        phoneNumbers: users.phoneNumbers
      })
      .from(members)
      .where(eq(members.organizationId, organizationId))
      .innerJoin(users, eq(members.userId, users.id))

    return organizationMembers
  } catch (error: any) {
    handleApiError(error)
  }
})
