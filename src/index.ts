import * as kysely from "kysely";
import type { InArgs, createClient } from "@libsql/client";

type Client = ReturnType<typeof createClient>;

export interface LibsqlDiarectConfig {
  client: Client;
}

export class LibsqlDiarect implements kysely.Dialect {
  #config: LibsqlDiarectConfig;

  constructor(config: LibsqlDiarectConfig) {
    this.#config = config;
  }

  createAdapter(): kysely.DialectAdapter {
    return new kysely.SqliteAdapter();
  }

  createDriver(): kysely.Driver {
    return new LibsqlDriver(this.#config.client);
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  createIntrospector(db: kysely.Kysely<any>): kysely.DatabaseIntrospector {
    return new kysely.SqliteIntrospector(db);
  }

  createQueryCompiler(): kysely.QueryCompiler {
    return new kysely.SqliteQueryCompiler();
  }
}

export class LibsqlDriver {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async init(): Promise<void> {}
  async acquireConnection(): Promise<LibsqlConnection> {
    return new LibsqlConnection(this.client);
  }
  async beginTransaction(
    connection: LibsqlConnection,
    _settings: kysely.TransactionSettings
  ): Promise<void> {
    await connection.client.execute("BEGIN IMMEDIATE");
  }

  async commitTransaction(connection: LibsqlConnection): Promise<void> {
    await connection.client.execute("COMMIT");
  }

  async rollbackTransaction(connection: LibsqlConnection): Promise<void> {
    await connection.client.execute("ROLLBACK");
  }

  async releaseConnection(connection: LibsqlConnection): Promise<void> {
    // nop
  }

  async destroy(): Promise<void> {
    this.client.close();
  }
}

export class LibsqlConnection implements kysely.DatabaseConnection {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async executeQuery<R>(
    compiledQuery: kysely.CompiledQuery
  ): Promise<kysely.QueryResult<R>> {
    const resultSet = await this.client.execute({
      sql: compiledQuery.sql,
      args: compiledQuery.parameters as InArgs,
    });

    return {
      numAffectedRows: BigInt(resultSet.rowsAffected),
      rows: resultSet.rows as R[],
    };
  }

  // biome-ignore lint/correctness/useYield: <explanation>
  async *streamQuery<R>(
    _compiledQuery: kysely.CompiledQuery,
    _chunkSize: number
  ): AsyncIterableIterator<kysely.QueryResult<R>> {
    throw new Error("Libsql protocol does not support streaming yet");
  }
}
