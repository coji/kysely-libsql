import type { InArgs, Transaction, createClient } from '@libsql/client'
import * as kysely from 'kysely'

type Client = ReturnType<typeof createClient>

export interface LibsqlDiarectConfig {
  client: Client
}

export class LibsqlDiarect implements kysely.Dialect {
  #config: LibsqlDiarectConfig

  constructor(config: LibsqlDiarectConfig) {
    this.#config = config
  }

  createAdapter(): kysely.DialectAdapter {
    return new kysely.SqliteAdapter()
  }

  createDriver(): kysely.Driver {
    return new LibsqlDriver(this.#config.client)
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  createIntrospector(db: kysely.Kysely<any>): kysely.DatabaseIntrospector {
    return new kysely.SqliteIntrospector(db)
  }

  createQueryCompiler(): kysely.QueryCompiler {
    return new kysely.SqliteQueryCompiler()
  }
}

export class LibsqlDriver {
  client: Client

  constructor(client: Client) {
    this.client = client
  }

  async init(): Promise<void> {}
  async acquireConnection(): Promise<LibsqlConnection> {
    return new LibsqlConnection(this.client)
  }
  async beginTransaction(
    connection: LibsqlConnection,
    _settings: kysely.TransactionSettings,
  ): Promise<void> {
    await connection.beginTransaction()
  }

  async commitTransaction(connection: LibsqlConnection): Promise<void> {
    await connection.commitTransaction()
  }

  async rollbackTransaction(connection: LibsqlConnection): Promise<void> {
    await connection.rollbackTransaction()
  }

  async releaseConnection(connection: LibsqlConnection): Promise<void> {}

  async destroy(): Promise<void> {
    this.client.close()
  }
}

export class LibsqlConnection implements kysely.DatabaseConnection {
  client: Client
  txn: Transaction | null

  constructor(client: Client) {
    this.client = client
    this.txn = null
  }

  async beginTransaction() {
    if (this.txn) {
      throw new Error('Transaction already started')
    }
    this.txn = await this.client.transaction('write')
  }

  async commitTransaction() {
    if (!this.txn) {
      throw new Error('No transaction to commit')
    }
    await this.txn.commit()
    this.txn.close()
    this.txn = null
  }

  async rollbackTransaction() {
    if (!this.txn) {
      throw new Error('No transaction to rollback')
    }
    await this.txn.rollback()
    this.txn.close()
    this.txn = null
  }

  async executeQuery<R>(
    compiledQuery: kysely.CompiledQuery,
  ): Promise<kysely.QueryResult<R>> {
    const executor = this.txn ? this.txn : this.client
    const resultSet = await executor.execute({
      sql: compiledQuery.sql,
      args: compiledQuery.parameters as InArgs,
    })

    return {
      numAffectedRows: BigInt(resultSet.rowsAffected),
      rows: resultSet.rows as R[],
    }
  }

  // biome-ignore lint/correctness/useYield: <explanation>
  async *streamQuery<R>(
    _compiledQuery: kysely.CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<kysely.QueryResult<R>> {
    throw new Error('Libsql protocol does not support streaming yet')
  }
}
