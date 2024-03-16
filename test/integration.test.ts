import { createClient } from '@libsql/client/web'
import { Kysely } from 'kysely'
import { describe, expect, test } from 'vitest'
import { LibsqlDiarect } from '../src/index'
import { createTable, dropTable, type DB } from './utils'

export const createKysely = () => {
  const libsql = createClient({
    url: import.meta.env.VITE_DATABASE_URL ?? 'file:./test/data/test.db',
  })
  const db = new Kysely<DB>({
    dialect: new LibsqlDiarect({ client: libsql }),
  })
  return db
}

describe(
  'kysely-libsql',
  () => {
    test('basic operations', async () => {
      const db = createKysely()
      await createTable(db)

      const inserted = await db
        .insertInto('book')
        .values({ title: 'test book' })
        .returningAll()
        .execute()
      expect(inserted.length).toBe(1)
      expect(inserted[0].id).toBeTruthy()

      const selected = await db
        .selectFrom('book')
        .select(['id', 'title'])
        .executeTakeFirst()
      expect(selected?.id).toBe(inserted[0].id)
      expect(selected?.title).toBe('test book')

      await dropTable(db)
      await db.destroy()
    })

    test('transaction', async () => {
      const db = createKysely()
      await createTable(db)

      const id = await db.transaction().execute(async (txn) => {
        const { id } = await txn
          .insertInto('book')
          .values({
            title: 'Sense and Sensibility',
          })
          .returning('id')
          .executeTakeFirstOrThrow()
        return id
      })

      const book = await db
        .selectFrom('book')
        .select(['id', 'title'])
        .where('book.id', '=', id)
        .executeTakeFirst()

      expect(book?.id).toBe(id)
      expect(book?.title).toBe('Sense and Sensibility')

      await dropTable(db)
      await db.destroy()
    })
  },
  {
    concurrent: false,
  },
)
