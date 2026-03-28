import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

import { organizations } from '~~/server/database/schema'

export async function generateReceiptNumber(event: H3Event, organizationId: string): Promise<string> {
  const db = useDrizzle(event)
  const currentYear = new Date().getFullYear().toString()

  const [org] = await db
    .select({ fiscal: organizations.fiscal })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!org) {
    throw new Error('Organization not found')
  }

  const fiscal = org.fiscal
  if (!fiscal) {
    throw new Error('Organization fiscal configuration not found')
  }

  const prefix = fiscal.receiptPrefix || 'REC'
  const nextNumber = fiscal.nextReceiptNumber || 1

  const paddedNumber = String(nextNumber).padStart(4, '0')
  const receiptNumber = `${prefix}-${currentYear}-${paddedNumber}`

  await db
    .update(organizations)
    .set({
      fiscal: {
        ...fiscal,
        nextReceiptNumber: nextNumber + 1
      }
    })
    .where(eq(organizations.id, organizationId))

  return receiptNumber
}
