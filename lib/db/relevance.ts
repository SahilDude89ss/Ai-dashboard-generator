import { DbSchema, TableDef } from "@/types";

const STOPWORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could","should",
  "may","might","shall","can","need","dare","ought","used","to","of",
  "in","on","at","by","for","with","about","against","between","through",
  "during","before","after","above","below","from","up","down","out",
  "off","over","under","again","further","then","once","how","what",
  "which","who","whom","this","that","these","those","am","and","but",
  "or","nor","so","yet","both","either","neither","not","only","own",
  "same","than","too","very","just","because","as","until","while","me",
  "my","myself","we","our","ours","ourselves","you","your","yours",
  "yourself","he","him","his","himself","she","her","hers","herself",
  "it","its","itself","they","them","their","theirs","themselves","i",
  "show","me","give","get","find","list","tell","many","much","most",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreTable(table: TableDef, tokens: string[]): number {
  let score = 0;
  const tableName = table.name.toLowerCase();

  for (const token of tokens) {
    if (tableName === token) score += 2;
    else if (tableName.includes(token) || token.includes(tableName)) score += 1;

    for (const col of table.columns) {
      const colName = col.name.toLowerCase();
      if (colName === token) score += 1;
      else if (colName.includes(token)) score += 0.5;
    }
  }

  return score;
}

export function selectRelevantTables(
  schema: DbSchema,
  question: string,
  maxTables = 15
): DbSchema {
  if (schema.tables.length <= 20) return schema;

  const tokens = tokenize(question);
  const scores = schema.tables.map((t) => ({ table: t, score: scoreTable(t, tokens) }));
  scores.sort((a, b) => b.score - a.score);

  const selected = new Set<string>();
  const topTables = scores.slice(0, maxTables);

  for (const { table } of topTables) {
    selected.add(table.name);
  }

  // Add FK-connected tables
  const toAdd: string[] = [];
  for (const tableName of selected) {
    const table = schema.tables.find((t) => t.name === tableName);
    if (!table) continue;
    for (const col of table.columns) {
      if (col.isForeignKey && col.referencesTable && !selected.has(col.referencesTable)) {
        toAdd.push(col.referencesTable);
      }
    }
  }
  for (const name of toAdd) selected.add(name);

  const omitted = schema.tables.length - selected.size;
  const filteredTables = schema.tables.filter((t) => selected.has(t.name));

  if (omitted > 0) {
    // Add a sentinel table to signal omission (compressed output will include this comment)
    filteredTables.push({
      name: `-- ${omitted} other tables omitted`,
      columns: [],
    });
  }

  return { ...schema, tables: filteredTables };
}
