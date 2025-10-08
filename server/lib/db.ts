import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({
  connectionString,
  max: 10
})

export const db = drizzle({ client: pool })

export type DB = typeof db
