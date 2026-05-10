import {
  ConversationContext,
  SummarizedTurn,
  ActiveFilter,
  ExecutedQuery,
  AssistantTurn,
  LastQueryContext,
  QueryResult,
} from "@/types";

/**
 * Returns a compact string summary of conversation context for LLM prompts.
 * Kept under ~400 tokens.
 */
export function buildContextBlock(context: ConversationContext): string {
  const parts: string[] = [];

  // Recent turns — show last 3
  const turns = context.recentTurns.slice(-3);
  if (turns.length > 0) {
    const turnLines = turns.map((t) => {
      const filterPart =
        t.filtersApplied.length > 0
          ? ` (Filters: ${t.filtersApplied.join(", ")})`
          : "";
      return `Q: ${t.userQuestion} → Intent: ${t.intent}${filterPart}`;
    });
    parts.push(`Recent conversation:\n${turnLines.join("\n")}`);
  }

  // Active filters
  if (context.activeFilters.length > 0) {
    const filterLines = context.activeFilters.map(
      (f) => `  ${f.dimension} = ${f.value} (${f.sqlFragment})`
    );
    parts.push(`Active filters:\n${filterLines.join("\n")}`);
  }

  // Last query shape
  if (context.lastQuery) {
    const lq = context.lastQuery;
    const shapeParts: string[] = [`title: ${lq.title}`];
    if (lq.whereClause) shapeParts.push(`WHERE: ${lq.whereClause}`);
    if (lq.resultShape.columns.length > 0) {
      shapeParts.push(`columns: ${lq.resultShape.columns.join(", ")}`);
    }
    if (lq.resultShape.numericColumns.length > 0) {
      shapeParts.push(`numeric: ${lq.resultShape.numericColumns.join(", ")}`);
    }
    if (lq.resultShape.dateColumns.length > 0) {
      shapeParts.push(`dates: ${lq.resultShape.dateColumns.join(", ")}`);
    }
    parts.push(`Last query: ${shapeParts.join(" | ")}`);
  }

  return parts.join("\n\n");
}

/**
 * Returns new context after a completed turn.
 * - Adds summarized turn (keeps last 6)
 * - Extracts and merges filters
 * - Updates lastQuery from the first successful query
 */
export function updateContext(
  context: ConversationContext,
  userQuestion: string,
  turn: AssistantTurn,
  intent: string
): ConversationContext {
  // Build summarized turn
  const successfulQueries = turn.queries.filter((q) => q.status === "success");
  const resultSummary =
    successfulQueries.length > 0
      ? `${successfulQueries.length} quer${successfulQueries.length === 1 ? "y" : "ies"} returned`
      : "no results";

  // Collect filters from all successful queries
  let mergedFilters = [...context.activeFilters];
  for (const q of successfulQueries) {
    const newFilters = extractFilters(q.sql, mergedFilters);
    // Merge: deduplicate by dimension (new wins)
    for (const nf of newFilters) {
      const idx = mergedFilters.findIndex((f) => f.dimension === nf.dimension);
      if (idx >= 0) {
        mergedFilters[idx] = nf;
      } else {
        mergedFilters.push(nf);
      }
    }
  }

  const filtersApplied = mergedFilters.map((f) => f.sqlFragment);

  const newTurn: SummarizedTurn = {
    turnId: turn.id,
    userQuestion,
    intent,
    resultSummary,
    filtersApplied,
  };

  // Keep last 6 turns
  const recentTurns = [...context.recentTurns, newTurn].slice(-6);

  // Update lastQuery from first successful query that has a result
  let lastQuery = context.lastQuery;
  const firstSuccess = successfulQueries.find((q) => q.result != null);
  if (firstSuccess?.result) {
    lastQuery = buildLastQueryContext(firstSuccess) ?? lastQuery;
  }

  return {
    recentTurns,
    activeFilters: mergedFilters,
    lastQuery,
    clarificationCount: context.clarificationCount,
    usesSonnet: context.usesSonnet,
  };
}

/**
 * Parses WHERE clause from SQL to extract dimension=value filters.
 * Only handles simple equality conditions: col = 'value' or col = value.
 */
export function extractFilters(
  sql: string,
  activeFilters: ActiveFilter[]
): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  // Extract WHERE clause (simple regex — not a full SQL parser)
  const whereMatch = sql.match(/\bWHERE\b([\s\S]+?)(?:\bGROUP\b|\bORDER\b|\bHAVING\b|\bLIMIT\b|$)/i);
  if (!whereMatch) return filters;

  const whereClause = whereMatch[1];

  // Match patterns like: col = 'value' or col = 123
  const equalityPattern = /(\w+)\s*=\s*(?:'([^']*)'|(\d+(?:\.\d+)?))/g;
  let match: RegExpExecArray | null;

  while ((match = equalityPattern.exec(whereClause)) !== null) {
    const dimension = match[1];
    const value = match[2] ?? match[3]; // string or numeric
    if (!dimension || !value) continue;

    // Skip common non-filter columns (IDs, technical fields)
    if (/^(id|pk|key|created_at|updated_at)$/i.test(dimension)) continue;

    const sqlFragment = match[2]
      ? `${dimension} = '${match[2]}'`
      : `${dimension} = ${match[3]}`;

    // Only add if not already tracked
    const alreadyTracked = activeFilters.some(
      (f) => f.dimension === dimension && f.value === value
    );
    if (!alreadyTracked) {
      filters.push({
        dimension,
        value,
        sqlFragment,
        establishedAtTurn: "",
      });
    }
  }

  return filters;
}

/**
 * Extracts lastQuery shape from a completed ExecutedQuery.
 */
export function buildLastQueryContext(
  query: ExecutedQuery
): LastQueryContext | null {
  if (!query.result) return null;

  const result: QueryResult = query.result;

  // Extract WHERE clause from SQL
  const whereMatch = query.sql.match(
    /\bWHERE\b([\s\S]+?)(?:\bGROUP\b|\bORDER\b|\bHAVING\b|\bLIMIT\b|$)/i
  );
  const whereClause = whereMatch ? whereMatch[1].trim() : "";

  // Classify columns as numeric or date based on sample row values
  const sampleRow = result.rows[0] ?? {};
  const numericColumns: string[] = [];
  const dateColumns: string[] = [];

  for (const col of result.columns) {
    const val = sampleRow[col];
    if (val instanceof Date) {
      dateColumns.push(col);
    } else if (typeof val === "number") {
      numericColumns.push(col);
    } else if (typeof val === "string") {
      // Check if it looks like a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
        dateColumns.push(col);
      } else if (!isNaN(Number(val)) && val.trim() !== "") {
        numericColumns.push(col);
      }
    }
  }

  return {
    sql: query.sql,
    title: query.title,
    whereClause,
    resultShape: {
      columns: result.columns,
      rowCount: result.rowCount,
      numericColumns,
      dateColumns,
    },
  };
}
