# tRPC — Patterns & Reference

> Rules for working inside `src/trpc/` and for consuming tRPC procedures in pages and components.

---

## File Map

```
src/trpc/
├── init.ts           # initTRPC, createTRPCContext (React cache), baseProcedure, createCallerFactory
├── query-client.ts   # makeQueryClient() — shared SSR/browser config
├── client.tsx        # "use client" — TRPCReactProvider, useTRPC
├── server.tsx        # server-only — trpc proxy, getQueryClient, HydrateClient, prefetch, caller
└── routers/
    ├── _app.ts       # appRouter (merge all routers here), AppRouter type
    └── [domain].ts   # one file per domain (leaderboard, submissions, …)
```

> **Note:** `server.tsx` must be `.tsx` (not `.ts`) because it contains JSX (`<HydrationBoundary>`).

---

## Consuming tRPC in pages

### Pattern A — Server Component with prefetch + client hydration (recommended for interactive pages)

Use when the page has a Client Component that also needs the data (e.g. for refetching, pagination).

```tsx
// app/leaderboard/page.tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { LeaderboardClient } from "./leaderboard-client"

export default function LeaderboardPage() {
  prefetch(trpc.leaderboard.list.queryOptions())
  return (
    <HydrateClient>
      <LeaderboardClient />
    </HydrateClient>
  )
}
```

```tsx
// app/leaderboard/leaderboard-client.tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function LeaderboardClient() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.leaderboard.list.queryOptions())
  // ...
}
```

---

### Pattern B — Server Component with direct caller (recommended for read-only data)

Use when the Server Component is the only consumer — no Client Component needs the same data.
Skips the Query Client cache entirely; simpler and faster.

```tsx
// components/ui/home-leaderboard.tsx
import { caller } from "@/trpc/server"

export async function HomeLeaderboard() {
  const { rows, total } = await caller.leaderboard.list()
  // render directly
}
```

---

### Pattern C — Slot pattern for Server → Client boundary

When a Client Component needs Server-fetched data as children, pass it as a `ReactNode` prop
(slot). This avoids prop-drilling across the server/client boundary.

```tsx
// app/page.tsx  (Server Component)
import { Suspense } from "react"
import { HomeLeaderboard, HomeLeaderboardSkeleton } from "@/components/ui/home-leaderboard"
import { HomePageClient } from "./home-page-client"

export default function Home() {
  return (
    <HomePageClient
      leaderboardSlot={
        <Suspense fallback={<HomeLeaderboardSkeleton />}>
          <HomeLeaderboard />
        </Suspense>
      }
    />
  )
}

// home-page-client.tsx  (Client Component)
export function HomePageClient({ leaderboardSlot }: { leaderboardSlot: React.ReactNode }) {
  // ... useState, event handlers ...
  return <main>... {leaderboardSlot}</main>
}
```

---

## Writing routers

### One file per domain

```
src/trpc/routers/leaderboard.ts   ← leaderboard.stats, leaderboard.list
src/trpc/routers/submissions.ts   ← submissions.byId, submissions.submit
```

Register every router in `_app.ts`:

```ts
export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
  submissions: submissionsRouter,
})
export type AppRouter = typeof appRouter
```

---

### Parallel queries with Promise.all

**Always use `Promise.all` when a procedure needs results from multiple independent queries.**
This runs them concurrently instead of sequentially, reducing latency proportionally.

```ts
// correct — both queries run in parallel
list: baseProcedure.query(async () => {
  const [rows, [stats]] = await Promise.all([
    db.select({ ... }).from(submissions).where(...).orderBy(...).limit(3),
    db.select({ total: count() }).from(submissions).where(...),
  ])
  return { rows, total: stats?.total ?? 0 }
})

// wrong — sequential, unnecessarily slow
list: baseProcedure.query(async () => {
  const rows = await db.select(...).from(submissions)...
  const [stats] = await db.select({ total: count() }).from(submissions)...
  return { rows, total: stats?.total ?? 0 }
})
```

This applies to both procedures and async Server Components that call `caller.*` multiple times.

```ts
// async Server Component — also use Promise.all
const [{ rows, total }, otherData] = await Promise.all([
  caller.leaderboard.list(),
  caller.someOther.query(),
])
```

---

### Drizzle return types

- `score` is `numeric` in Postgres → comes back as `string` from Drizzle. Always `Number(row.score)` before math or display.
- `avg()` also returns `string | null`. Coerce with `result?.avgScore ? Number(result.avgScore) : 0`.

---

## Suspense + Skeleton pattern

For async Server Components wrapped in `<Suspense>`, always provide a matching skeleton:

| Component | Role |
|---|---|
| `HomeLeaderboard` | async Server Component — fetches real data |
| `HomeLeaderboardSkeleton` | Suspense fallback — same layout, `animate-pulse` placeholders |

Skeleton rules:
- Keep the non-data parts (headers, labels, static text) **identical** to the real component — only replace variable data with `animate-pulse` blocks.
- Match widths loosely to the expected content so the layout doesn't shift on load.
- Use `inline-block h-3 w-{n} animate-pulse rounded-sm bg-text-tertiary/20` for text placeholders.
