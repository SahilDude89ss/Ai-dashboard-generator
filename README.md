# AI Dashboard Generator

An AI-powered SQL intelligence suite built with Next.js 14 and Claude. Two products, one codebase.

---

## Products

### Dashcraft — AI SQL Dashboard Builder
Connect your database (or upload a SQL dump), describe what you want to see, and Claude generates a full dashboard with production-ready SQL queries — no SQL knowledge required.

**Features:**
- Live DB connection (PostgreSQL, MySQL, SQLite) or SQL dump upload
- 3-step setup wizard: source → schema preview → natural language prompt
- Claude Sonnet generates widget specs via NDJSON streaming
- 6 widget types: KPI, timeseries, bar, horizontal bar, donut, table
- CodeMirror SQL editor with `Cmd+Enter` to run
- Dashboard persistence via localStorage

### QueryTalk — Conversational Database Interface
Ask your database anything in plain English. Multi-turn conversations with full context memory, live query execution, and automatic chart selection.

**Features:**
- Two-phase AI: Haiku planning (~300ms) + parallel SQL execution
- Multi-turn context (last 6 turns, active filters, last query shape — ~400 token budget)
- Auto-visualization: number, line, bar, bar_h, donut, table (via Recharts)
- Session management with localStorage persistence
- Export to Dashcraft: converts query results to dashboard widgets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Charts | Recharts |
| SQL Editor | CodeMirror 6 |
| AI | Anthropic Claude (Haiku + Sonnet) |
| Validation | Zod |
| DB Drivers | pg, mysql2, better-sqlite3 |

---

## Project Structure

```
app/
  dashcraft/          # Dashcraft pages
  querytalk/          # QueryTalk pages
  api/
    dashcraft/        # Dashboard generation API (NDJSON stream)
    querytalk/        # Chat + starters API (NDJSON stream)
    connect/          # DB connection + introspection
    query/            # Direct SQL execution

components/
  dashcraft/          # Setup wizard, dashboard canvas, widgets
  querytalk/          # Chat bubbles, result renderers, sidebar
  sql/                # Shared SQL editor + inspector
  ui/                 # Shared primitives (Button, Card, Input...)

lib/
  ai/
    dashcraft/        # Widget generation prompts + Claude calls
    querytalk/        # Plan, context, retry, prompts
  db/                 # connect, execute, introspect, compress, relevance
  schema/             # Zod schemas
  utils/              # format, grid helpers

store/
  dashcraft.ts        # Zustand store for Dashcraft
  querytalk.ts        # Zustand store for QueryTalk
  connection.ts       # Shared DB connection store

types/
  index.ts            # All shared TypeScript types
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |

---

## Security

- All SQL queries are validated server-side — only `SELECT` statements are allowed
- Queries are wrapped in an outer `LIMIT` to cap row counts
- 30-second query timeout enforced via `Promise.race`
- Database credentials are never stored in localStorage
- Security headers set on all responses (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

---

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # TypeScript check (zero errors)
```
