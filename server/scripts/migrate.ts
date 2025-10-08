import 'dotenv/config'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../lib/db'

async function main() {
  await migrate(db, { migrationsFolder: './server/database/migrations' })
  console.log('✅ Database migrations applied successfully')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  })
