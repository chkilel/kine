import { integer } from 'drizzle-orm/sqlite-core'

export const timestamps = {
  createdAt: integer({ mode: 'timestamp_ms' })
    .$default(() => new Date())
    .notNull(),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$default(() => new Date())
    .$onUpdateFn(() => new Date())
}

export const timestampsSoftDelete = {
  ...timestamps,
  deletedAt: integer({ mode: 'timestamp_ms' })
}
