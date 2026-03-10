import { eq } from 'drizzle-orm'
import { members, organizations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { name, slug, contact, address, sessionRates } = await readValidatedBody(event, onboardingSchema.parse)
  const db = useDrizzle(event)

  const { userId } = await requireAuth(event, { requireOrganization: false })

  const existingOrg = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1)

  if (existingOrg.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Organization slug already exists'
    })
  }

  const orgRecord = await db
    .insert(organizations)
    .values({
      name,
      slug,
      contact,
      address,
      pricing: {
        sessionRates,
        packages: []
      },
      status: 'active',
      timezone: 'Africa/Casablanca'
    })
    .returning()
    .then((rows) => rows[0])

  if (!orgRecord) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create organization'
    })
  }

  await db.insert(members).values({
    organizationId: orgRecord.id,
    userId,
    role: 'owner'
  })

  return orgRecord
})
