import { DbConnectionConfig, DbSchema, TableDef, ColumnDef } from "@/types";
import { createConnection } from "./connect";

export async function introspectDatabase(config: DbConnectionConfig): Promise<DbSchema> {
  const client = await createConnection(config);
  try {
    switch (config.dialect) {
      case "postgresql":
        return await introspectPostgres(client, config);
      case "mysql":
        return await introspectMysql(client, config);
      case "sqlite":
        return await introspectSqlite(client, config);
      default:
        throw new Error(`Unsupported dialect`);
    }
  } finally {
    await client.close();
  }
}

async function introspectPostgres(client: Awaited<ReturnType<typeof createConnection>>, config: DbConnectionConfig): Promise<DbSchema> {
  const { rows } = await client.query(`
    SELECT
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      tc.constraint_type
    FROM information_schema.tables t
    JOIN information_schema.columns c
      ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    LEFT JOIN information_schema.key_column_usage kcu
      ON kcu.column_name = c.column_name AND kcu.table_name = t.table_name AND kcu.table_schema = t.table_schema
    LEFT JOIN information_schema.table_constraints tc
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = t.table_schema
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `);

  // Row estimates
  const { rows: pgClassRows } = await client.query(
    `SELECT relname, reltuples::bigint AS estimate FROM pg_class WHERE relkind = 'r'`
  );
  const rowEstimates: Record<string, number> = {};
  for (const r of pgClassRows) {
    rowEstimates[r.relname as string] = Number(r.estimate);
  }

  const tableMap: Record<string, TableDef> = {};
  for (const row of rows) {
    const tname = row.table_name as string;
    if (!tableMap[tname]) {
      tableMap[tname] = { name: tname, columns: [], rowEstimate: rowEstimates[tname] };
    }
    const existing = tableMap[tname].columns.find((c) => c.name === row.column_name);
    if (existing) {
      if (row.constraint_type === "PRIMARY KEY") existing.isPrimaryKey = true;
      if (row.constraint_type === "FOREIGN KEY") existing.isForeignKey = true;
    } else {
      tableMap[tname].columns.push({
        name: row.column_name as string,
        type: (row.data_type as string).toUpperCase(),
        nullable: row.is_nullable === "YES",
        isPrimaryKey: row.constraint_type === "PRIMARY KEY",
        isForeignKey: row.constraint_type === "FOREIGN KEY",
      });
    }
  }

  return {
    dialect: config.dialect,
    tables: Object.values(tableMap),
    sourceType: "live",
    connectedAt: new Date(),
  };
}

async function introspectMysql(client: Awaited<ReturnType<typeof createConnection>>, config: DbConnectionConfig): Promise<DbSchema> {
  const { rows } = await client.query(`
    SELECT
      TABLE_NAME, COLUMN_NAME, DATA_TYPE,
      IS_NULLABLE, COLUMN_KEY
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  // Row estimates
  const { rows: tableRows } = await client.query(
    `SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`
  );
  const rowEstimates: Record<string, number> = {};
  for (const r of tableRows) {
    rowEstimates[r.TABLE_NAME as string] = Number(r.TABLE_ROWS);
  }

  const tableMap: Record<string, TableDef> = {};
  for (const row of rows) {
    const tname = row.TABLE_NAME as string;
    if (!tableMap[tname]) {
      tableMap[tname] = { name: tname, columns: [], rowEstimate: rowEstimates[tname] };
    }
    tableMap[tname].columns.push({
      name: row.COLUMN_NAME as string,
      type: (row.DATA_TYPE as string).toUpperCase(),
      nullable: row.IS_NULLABLE === "YES",
      isPrimaryKey: row.COLUMN_KEY === "PRI",
      isForeignKey: row.COLUMN_KEY === "MUL",
    });
  }

  return {
    dialect: config.dialect,
    tables: Object.values(tableMap),
    sourceType: "live",
    connectedAt: new Date(),
  };
}

async function introspectSqlite(client: Awaited<ReturnType<typeof createConnection>>, config: DbConnectionConfig): Promise<DbSchema> {
  const { rows: tableRows } = await client.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
  );

  const tables: TableDef[] = [];
  for (const tableRow of tableRows) {
    const tname = tableRow.name as string;
    const { rows: cols } = await client.query(`PRAGMA table_info(${tname})`);
    const { rows: fkRows } = await client.query(`PRAGMA foreign_key_list(${tname})`);
    const fkCols = new Set(fkRows.map((r) => r.from as string));

    tables.push({
      name: tname,
      columns: cols.map((col) => ({
        name: col.name as string,
        type: (col.type as string || "TEXT").toUpperCase(),
        nullable: col.notnull === 0,
        isPrimaryKey: col.pk === 1,
        isForeignKey: fkCols.has(col.name as string),
      })),
    });
  }

  return {
    dialect: config.dialect,
    tables,
    sourceType: "live",
    connectedAt: new Date(),
  };
}
