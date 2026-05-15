# CLAUDE.md

This file provides guidance for Claude Code when working in this repository.

## Project Overview

Two-product Next.js 14 app sharing a single codebase:
- **Dashcraft** (`/dashcraft`) — AI SQL dashboard builder
- **QueryTalk** (`/querytalk`) — Conversational database interface

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check (must pass with zero errors)
```

## Architecture

### Routing
- `app/dashcraft/` — Dashcraft pages
- `app/querytalk/` — QueryTalk pages
- `app/api/dashcraft/` — Dashboard generation (NDJSON streaming)
- `app/api/querytalk/` — Chat endpoint (NDJSON streaming) + starters
- `app/api/connect/` — DB connection and introspection
- `app/api/query/` — Direct SQL execution

### State Management
- `store/dashcraft.ts` — `useDashcraftStore` — all Dashcraft state (setup + dashboard)
- `store/querytalk.ts` — `useQueryTalkStore` — all QueryTalk state (sessions + turns)
- `store/connection.ts` — `useConnectionStore` — shared DB connection state
- All stores use Zustand. No Redux, no Context API.
- Dashboards and sessions persist to localStorage. Credentials are never stored.

### AI Layer
- `lib/ai/dashcraft/generate-widgets.ts` — async generator, yields NDJSON events
- `lib/ai/querytalk/plan.ts` — Phase 1: Haiku blocking call, returns PlanResult
- `lib/ai/querytalk/retry.ts` — SQL error retry with tight-scope Haiku call
- `lib/ai/querytalk/context.ts` — ConversationContext management (~400 token budget)
- Models: `claude-sonnet-4-6` for Dashcraft generation, `claude-haiku-4-5-20251001` for QueryTalk planning

### Database Layer
- `lib/db/connect.ts` — creates pg / mysql2 / better-sqlite3 clients
- `lib/db/execute.ts` — SELECT-only guard, LIMIT wrap, 30s timeout
- `lib/db/introspect.ts` — schema introspection via information_schema / PRAGMA
- `lib/db/compress.ts` — DbSchema → compact string for LLM prompts
- `lib/db/relevance.ts` — scores tables by question token overlap (for schemas >20 tables)

### Types and Validation
- `types/index.ts` — all shared TypeScript interfaces (single source of truth)
- `lib/schema/types.ts` — Zod schemas mirroring every type in types/index.ts
- Always validate API inputs with Zod. Never use `any`.

### Streaming Protocol
Both products use NDJSON (newline-delimited JSON) over `ReadableStream`. Each line is a `JSON.stringify(event) + "\n"`. Event shapes are documented in the respective route files.

## Code Conventions

- **TypeScript strict** — no `any`, no non-null assertions without justification
- **No comments** unless explaining a non-obvious constraint or workaround
- **No new abstractions** unless the same logic appears 3+ times
- **No error handling for impossible cases** — only validate at system boundaries
- **CSS-only animations** — no Framer Motion. Use keyframes defined in `tailwind.config.ts`
- **Tailwind custom tokens**: `bg-bg`, `bg-s1/s2/s3`, `text-text`, `text-muted/muted2`, `text-accent`, `text-a2/a3/a4/a5`, `border-DEFAULT`, `rounded-card/btn/input`
- **Fonts**: `font-syne` (UI text), `font-mono` (code/SQL)

## Key Constraints

- SQL execution: only `SELECT` allowed server-side. Checked in `lib/db/execute.ts`.
- Row limit: queries wrapped as `SELECT * FROM (...) AS __q LIMIT N` — never removed.
- Query timeout: 30 seconds via `Promise.race`. Never increased without good reason.
- ConversationContext: must stay under ~400 tokens. Max 6 summarized turns. See `lib/ai/querytalk/context.ts`.
- Widget types: `"kpi" | "timeseries" | "bar" | "bar_horizontal" | "donut" | "table"` — do not add others without updating `WIDGET_REGISTRY` in `components/dashcraft/widgets/index.ts`.

## Adding a New Widget Type

1. Add the type to `WidgetType` in `types/index.ts`
2. Add the Zod enum value in `lib/schema/types.ts`
3. Create `components/dashcraft/widgets/NewWidget.tsx`
4. Register it in `components/dashcraft/widgets/index.ts`
5. Update the Dashcraft system prompt in `lib/ai/dashcraft/prompts.ts`

## Adding a New Database Dialect

1. Add to `DbDialect` union in `types/index.ts` and `lib/schema/types.ts`
2. Add a connection factory in `lib/db/connect.ts`
3. Add introspection logic in `lib/db/introspect.ts`
4. Add dialect-specific SQL rules to `lib/ai/dashcraft/prompts.ts` and `lib/ai/querytalk/prompts.ts`
