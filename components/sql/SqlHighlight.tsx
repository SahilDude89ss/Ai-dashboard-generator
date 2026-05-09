"use client";

const KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|DISTINCT|UNION|ALL|CASE|WHEN|THEN|ELSE|END|WITH|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|TRUNCATE|SET|VALUES|INTO|BY|ASC|DESC)\b/gi;
const FUNCTIONS = /\b(COUNT|SUM|AVG|MIN|MAX|ROUND|COALESCE|NULLIF|IFNULL|DATE_TRUNC|DATE_FORMAT|STRFTIME|EXTRACT|NOW|CURRENT_TIMESTAMP|CONCAT|LOWER|UPPER|TRIM|LENGTH|SUBSTRING|CAST|CONVERT|ABS|FLOOR|CEIL|CEILING|MOD|POWER|SQRT|DATE|TIME|YEAR|MONTH|DAY|HOUR|MINUTE|SECOND|INTERVAL)\b/gi;
const STRINGS = /'[^']*'/g;
const NUMBERS = /\b(\d+(?:\.\d+)?)\b/g;
const COMMENTS = /(--[^\n]*|\/\*[\s\S]*?\*\/)/g;
const ALIASES = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\./g;

type Token = {
  text: string;
  type: "keyword" | "function" | "string" | "number" | "comment" | "alias" | "plain";
};

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let remaining = sql;
  let pos = 0;

  // Build a combined regex-based tokenizer
  const combined = new RegExp(
    [
      `(${COMMENTS.source})`,
      `(${STRINGS.source})`,
      `(${KEYWORDS.source})`,
      `(${FUNCTIONS.source})`,
      `(${NUMBERS.source})`,
    ].join("|"),
    "gi"
  );

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(sql)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: sql.slice(lastIndex, match.index), type: "plain" });
    }

    const text = match[0];
    if (match[1]) tokens.push({ text, type: "comment" });
    else if (match[3]) tokens.push({ text, type: "string" });
    else if (match[4]) tokens.push({ text, type: "keyword" });
    else if (match[6]) tokens.push({ text, type: "function" });
    else if (match[8]) tokens.push({ text, type: "number" });
    else tokens.push({ text, type: "plain" });

    lastIndex = match.index + text.length;
  }

  if (lastIndex < sql.length) {
    tokens.push({ text: sql.slice(lastIndex), type: "plain" });
  }

  return tokens;
}

const TOKEN_COLORS: Record<Token["type"], string> = {
  keyword: "text-accent font-semibold",
  function: "text-a2",
  string: "text-a4",
  number: "text-a3",
  comment: "text-muted",
  alias: "text-a5",
  plain: "text-text",
};

interface SqlHighlightProps {
  sql: string;
}

export function SqlHighlight({ sql }: SqlHighlightProps) {
  const tokens = tokenize(sql);

  return (
    <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words p-4 bg-s2 rounded-input overflow-x-auto">
      {tokens.map((token, i) => (
        <span key={i} className={TOKEN_COLORS[token.type]}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}
