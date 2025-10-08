import 'dotenv/config'
import { db } from '../lib/db'
import { setOrganizationContext } from '../lib/orgContext'
import { organization, user, member, patients, appointments } from '../database/schema'
import { sql, eq } from 'drizzle-orm'

async function ensureSchemaPreconditions() {
  // Ensure the app.current_organization_id GUC exists (if your setup/migrations didn't create it)
  // Safely attempt to create; ignore error if it already exists.
  try {
    await db.execute(sql`SELECT set_config('app.current_organization_id', NULL, false)`)
  } catch {
    // ignore
  }
}

async function seedOrgsUsers() {
  const orgA = { id: 'org_a', name: 'Org A', slug: 'org-a' }
  const orgB = { id: 'org_b', name: 'Org B', slug: 'org-b' }

  await db.insert(organization).values([orgA, orgB]).onConflictDoNothing()

  const users = [
    { id: 'user_a1', name: 'Alice A', email: 'alice.a@example.com' },
    { id: 'user_b1', name: 'Bob B', email: 'bob.b@example.com' }
  ]
  await db.insert(user).values(users).onConflictDoNothing()

  const memberships = [
    { id: 'mem_a1', organizationId: orgA.id, userId: 'user_a1', role: 'admin' },
    { id: 'mem_b1', organizationId: orgB.id, userId: 'user_b1', role: 'admin' }
  ]
  await db.insert(member).values(memberships).onConflictDoNothing()

  return { orgA, orgB, users }
}

async function seedPatientsAndAppointments(orgId: string, practitionerUserId: string) {
  // Seed a patient for the given org
  const patientRes = await db
    .insert(patients)
    .values({
      organizationId: orgId,
      patientNumber: `${orgId}-P-001`,
      firstName: 'John',
      lastName: orgId === 'org_a' ? 'Alpha' : 'Beta',
      email: `${orgId}.john@example.com`
    })
    .returning({ id: patients.id })

  const patientId = patientRes[0]?.id
  if (!patientId) throw new Error('Failed to insert patient')

  // Seed an appointment for that patient
  const start = new Date()
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  await db.insert(appointments).values({
    organizationId: orgId,
    patientId,
    practitionerId: practitionerUserId,
    title: 'Initial Consultation',
    description: 'RLS verification appointment',
    startAt: start,
    endAt: end
  })
}

async function verifyIsolation(orgId: string) {
  await setOrganizationContext(db, orgId)

  const pts = await db.select().from(patients)
  const appts = await db.select().from(appointments)

  console.log(
    `Org ${orgId} can see patients:`,
    pts.map((p) => ({ id: p.id, org: p.organizationId, pn: p.patientNumber }))
  )
  console.log(
    `Org ${orgId} can see appointments:`,
    appts.map((a) => ({ id: a.id, org: a.organizationId, patientId: a.patientId }))
  )
}

async function attemptCrossTenantRead(orgId: string, otherOrgId: string) {
  await setOrganizationContext(db, orgId)
  // Try to read other org's patient by known patientNumber pattern
  const rows = await db
    .select()
    .from(patients)
    .where(eq(patients.patientNumber, `${otherOrgId}-P-001`))
  console.log(`Cross-tenant read from ${orgId} for ${otherOrgId}-P-001 returned rows:`, rows.length)
}

async function main() {
  await ensureSchemaPreconditions()

  // 1) Seed organizations and users
  const { orgA, orgB } = await seedOrgsUsers()

  // 2) Seed org-specific data by setting context before inserts
  await setOrganizationContext(db, orgA.id)
  await seedPatientsAndAppointments(orgA.id, 'user_a1')

  await setOrganizationContext(db, orgB.id)
  await seedPatientsAndAppointments(orgB.id, 'user_b1')

  // 3) Verify that each org sees only its data
  await verifyIsolation(orgA.id)
  await verifyIsolation(orgB.id)

  // 4) Attempt cross-tenant reads explicitly
  await attemptCrossTenantRead(orgA.id, orgB.id)
  await attemptCrossTenantRead(orgB.id, orgA.id)

  console.log('RLS verification complete.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
