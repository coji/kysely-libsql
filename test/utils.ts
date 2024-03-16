import { sql, type Kysely } from 'kysely'

export interface DB {
  book: {
    id?: number
    title: string
  }
}

export const createTable = async (db: Kysely<DB>) => {
  await sql`DROP TABLE IF EXISTS book`.execute(db)
  await sql`CREATE TABLE book (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT)`.execute(
    db,
  )
}

export const dropTable = async (db: Kysely<DB>) => {
  await sql`DROP TABLE book`.execute(db)
}
