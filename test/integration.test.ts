import { Kysely, sql } from "kysely";
import { LibsqlDiarect } from "../src/index";
import { createClient } from "@libsql/client";
import { test, expect, describe } from "vitest";

interface DB {
  book: {
    id?: number;
    title: string;
  };
}

const createKysely = () => {
  const libsql = createClient({ url: "file:./test/data/test.db" });
  const db = new Kysely<DB>({
    dialect: new LibsqlDiarect({ client: libsql }),
  });
  return db;
};

const createTable = async (db: Kysely<DB>) => {
  await sql`DROP TABLE IF EXISTS book`.execute(db);
  await sql`CREATE TABLE book (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT)`.execute(
    db
  );
};

const dropTable = async (db: Kysely<DB>) => {
  await sql`DROP TABLE book`.execute(db);
};

describe("kysely-libsql", () => {
  test("basic operations", async () => {
    const db = createKysely();
    await createTable(db);

    const inserted = await db
      .insertInto("book")
      .values({ title: "test book" })
      .execute();
    expect(inserted.length).toBe(1);
    expect(inserted[0].numInsertedOrUpdatedRows).toBe(BigInt(1));

    const selected = await db
      .selectFrom("book")
      .select(["id", "title"])
      .executeTakeFirst();
    expect(selected?.id).toBe(1);
    expect(selected?.title).toBe("test book");

    await dropTable(db);
    await db.destroy();
  });
});
