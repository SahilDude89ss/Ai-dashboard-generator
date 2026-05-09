import { DbConnectionConfig, DbDialect } from "@/types";

export interface DbClient {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; fields?: { name: string }[] }>;
  close: () => Promise<void>;
}

export async function createConnection(config: DbConnectionConfig): Promise<DbClient> {
  switch (config.dialect) {
    case "postgresql":
      return createPostgresConnection(config);
    case "mysql":
      return createMysqlConnection(config);
    case "sqlite":
      return createSqliteConnection(config);
    default:
      throw new Error(`Unsupported dialect: ${config.dialect}`);
  }
}

async function createPostgresConnection(config: DbConnectionConfig): Promise<DbClient> {
  const { Client } = await import("pg");
  const client = new Client({
    host: config.host,
    port: config.port ?? 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return {
    async query(sql: string, params?: unknown[]) {
      const result = await client.query(sql, params as never[]);
      return {
        rows: result.rows,
        fields: result.fields?.map((f) => ({ name: f.name })),
      };
    },
    async close() {
      await client.end();
    },
  };
}

async function createMysqlConnection(config: DbConnectionConfig): Promise<DbClient> {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port ?? 3306,
    database: config.database,
    user: config.user,
    password: config.password,
    connectTimeout: 10000,
  });
  return {
    async query(sql: string, params?: unknown[]) {
      const [rows, fields] = await conn.execute(sql, params as never[]);
      return {
        rows: rows as Record<string, unknown>[],
        fields: (fields as { name: string }[])?.map((f) => ({ name: f.name })),
      };
    },
    async close() {
      await conn.end();
    },
  };
}

async function createSqliteConnection(config: DbConnectionConfig): Promise<DbClient> {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(config.database);
  return {
    async query(sql: string, params?: unknown[]) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...(params ?? [])) as Record<string, unknown>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      return {
        rows,
        fields: columns.map((name) => ({ name })),
      };
    },
    async close() {
      db.close();
    },
  };
}
