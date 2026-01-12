import { patients } from '~~/server/database/schema'

// POST /api/patients - Create new patient
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  try {
    // 1. Validate request body
    const body = await readValidatedBody(event, patientCreateSchema.parse)

    // 2. Require current user and organization from session
    await requireAuth(event)

    // 3. Insert new patient record
    const [newPatient] = await db.insert(patients).values(body).returning()

    return newPatient
  } catch (error) {
    handleApiError(error, 'Erreur lors de la création du patient')
  }
})
