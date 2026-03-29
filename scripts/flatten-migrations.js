import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const MIGRATIONS_DIR = 'server/database/migrations'

async function flattenMigrations() {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true })
  const folders = entries.filter((e) => e.isDirectory())

  let index = 0
  for (const folder of folders) {
    const folderPath = join(MIGRATIONS_DIR, folder.name)
    const sqlPath = join(folderPath, 'migration.sql')

    try {
      const sql = await readFile(sqlPath, 'utf-8')
      const padded = String(index).padStart(4, '0')
      const name = folder.name.split('_').slice(1).join('_') || 'migration'
      const flatName = `${padded}_${name}.sql`

      await writeFile(join(MIGRATIONS_DIR, flatName), sql)
      console.log(`  ✓ ${flatName}`)
      index++
    } catch {
      // Folder without migration.sql, skip
    }
  }

  if (index === 0) {
    console.log('  No new migrations to flatten.')
  }
}

flattenMigrations().catch((err) => {
  console.error(err)
  process.exit(1)
})
