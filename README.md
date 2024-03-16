# kysely-libsql

A [Kysely][kysely] dialect for [libsql][libsql], using the [libsql-client-ts][libsql-client-ts], that supports embedded replicas.

[kysely]: https://github.com/koskimas/kysely
[libsql]: https://github.com/tursodatabase/libsql
[libsql-client-ts]: https://github.com/tursodatabase/libsql-client-ts

## Installation

```shell
pnpm install @coji/kysely-libsql
```

## Usage

### Initializing

Pass a `LibsqlDialect` instance as the `dialect` when creating the `Kysely` object:

```typescript
import { createClient } from '@libsql/client/web'
import { Kysely } from "kysely"
import { LibsqlDialect } from "@coji/kysely-libsql"

interface Database {
    ...
}

const client = createClient({
    url: 'libsql://[databaseName]-[organizationName].turso.io',
    authToken: "...",
})

const db = new Kysely<Database>({
    dialect: new LibsqlDialect({ client }),
})
```

### Embedded Replicas

You can work with embedded replicas by passing your Turso Database URL to syncUrl:

```typescript
import { createClient } from '@libsql/client/web'
import { Kysely } from 'kysely'
import { LibsqlDialect } from '@coji/kysely-libsql'

const client = createClient({
  url: 'file:path/to/db-file.db',
  syncUrl: 'libsql://[databaseName]-[organizationName].turso.io',
  authToken: '...',
})
```

> [!WARNING]
> Embedded Replicas only works where you have access to the file system.

[As described in the turso sdk documentation](https://docs.turso.tech/sdk/ts/reference#manual-sync), options can be set when creating the libsql client to manually synchronize the local and remote databases, automatically synchronize them at regular intervals, and enable encryption of SQLite files.

## Supported URLs

The library accepts the [same URL schemas][supported-urls] as [`@libsql/client`][libsql-client-ts] except `file:`:

- `http://` and `https://` connect to a libsql server over HTTP,
- `ws://` and `wss://` connect to the server over WebSockets,
- `libsql://` connects to the server using the default protocol (which is now HTTP). `libsql://` URLs use TLS by default, but you can use `?tls=0` to disable TLS (e.g. when you run your own instance of the server locally).

Connecting to a local SQLite file using `file:` URL is not supported; we suggest that you use the native Kysely dialect for SQLite.

> [!Caution]
> At this time, there is a known bug where the transaction does not end if :memory: is specified.

[libsql-client-ts]: https://github.com/libsql/libsql-client-ts
[supported-urls]: https://github.com/libsql/libsql-client-ts#supported-urls

## License

This project is licensed under the MIT license.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in `@coji/kysely-libsql` by you, shall be licensed as MIT, without any additional terms or conditions.
