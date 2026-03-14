# Create Roast Feature — Design Spec

**Date:** 2026-03-14  
**Status:** Approved

---

## Overview

Implement the end-to-end "create roast" flow: user pastes code on the homepage, selects a language and roast mode, submits, the server calls Google Gemini to analyze the code, persists the result to the database, and redirects the user to the roast result page.

---

## Scope

- Wire homepage editor state (toggle, submit, loading, inline error)
- Implement `submitCode` Server Action (Gemini call + DB inserts)
- Replace static data on `/roast/[id]` with a real DB query
- Install required packages (`ai`, `@ai-sdk/google`)
- Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.example`

**Out of scope:** share button/flow, per-user rate limiting, dedicated error page, loading overlay.

---

## Section 1 — Architecture

### Packages to install

```bash
pnpm add ai @ai-sdk/google
```

### New files

| File | Purpose |
|------|---------|
| `src/lib/gemini.ts` | `roastSchema` Zod schema + `buildPrompt` helper |

### Modified files

| File | Change |
|------|--------|
| `src/app/actions/submit-code.ts` | Full implementation (currently a stub) |
| `src/app/home-page-client.tsx` | Wire toggle state, submit handler, loading, error |
| `src/app/roast/[id]/page.tsx` | Replace `STATIC_ROAST` with real DB query |
| `.env.example` | Add `GOOGLE_GENERATIVE_AI_API_KEY=` entry |

### Data flow

```
HomePageClient
  → submitCode(code, language, roastMode)   [Server Action]
      → buildPrompt(code, language, roastMode)
      → generateText({ model: gemini-2.0-flash, output: Output.object({ schema: roastSchema }) })
      → db.insert(submissions)              [returns id]
      → Promise.all([
          db.insert(submissionIssues),
          db.insert(submissionDiffLines)
        ])
      → return { id }
  → router.push("/roast/" + id)

/roast/[id]/page.tsx
  → db.query.submissions.findFirst({ where: eq(submissions.id, id), with: { issues, diffLines } })
  → render result (or notFound())
```

---

## Section 2 — Prompt & AI Schema

### File: `src/lib/gemini.ts`

**Zod schema** (`roastSchema`) — output shape returned by Gemini:

```ts
z.object({
  score: z.number().min(0).max(10),
  verdict: z.enum(["clean_code", "could_be_worse", "needs_work", "needs_serious_help", "delete_this_now"]),
  roastQuote: z.string(),
  issues: z.array(z.object({
    severity: z.enum(["critical", "warning", "good"]),
    title: z.string(),
    description: z.string(),
  })),
  diffLines: z.array(z.object({
    type: z.enum(["removed", "added", "context"]),
    content: z.string(),
    lineNumber: z.number().int(),
  })),
})
```

Note: `z.union` and `z.record` are not supported by the Gemini provider — avoid them.

**`buildPrompt(code, language, roastMode)`** — returns a string prompt. Two variants:

- **roast mode:** Persona is a sarcastic senior dev. Roast the code mercilessly but point to real issues. `roastQuote` must be a short, cutting one-liner in quotes.
- **honest mode:** Persona is a constructive code reviewer. Give honest, direct feedback without sarcasm. `roastQuote` is a neutral summary sentence.

Both variants instruct the model to return valid JSON matching the schema, with 2–5 issues and a complete diff covering the most important improvement.

**Gemini call:**

```ts
import { google } from "@ai-sdk/google"
import { generateText, Output } from "ai"

const { object } = await generateText({
  model: google("gemini-2.0-flash"),
  output: Output.object({ schema: roastSchema }),
  prompt: buildPrompt(code, language, roastMode),
})
```

- `GOOGLE_GENERATIVE_AI_API_KEY` is read automatically from env by the `@ai-sdk/google` provider.
- `generateObject` does not exist in AI SDK v5 — `generateText` + `Output.object()` is the correct API.

---

## Section 3 — `HomePageClient` wiring

**File:** `src/app/home-page-client.tsx`

### State

```ts
const [roastMode, setRoastMode] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)
const [isPending, startTransition] = useTransition()
```

### Toggle

```tsx
<Toggle checked={roastMode} onCheckedChange={setRoastMode} />
```

Currently uncontrolled (`defaultChecked`) — must be changed to controlled.

### Submit handler

```ts
function handleSubmit() {
  if (!code.trim()) {
    setError("paste some code first")
    return
  }
  setError(null)
  startTransition(async () => {
    try {
      const { id } = await submitCode(code, language, roastMode)
      router.push("/roast/" + id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong")
    }
  })
}
```

### Button

- `onClick={handleSubmit}`
- `disabled={isPending}`
- Visual loading indicator while `isPending` is true (e.g. button label changes to `roasting...`)

### Error display

```tsx
{error && (
  <p className="font-mono text-xs text-accent-red">{error}</p>
)}
```

Rendered below the editor. Cleared on each new submit attempt.

### `submitCode` signature

```ts
export async function submitCode(
  code: string,
  language: string,
  roastMode: boolean
): Promise<{ id: string }>
```

---

## Section 4 — `submitCode` action internals

**File:** `src/app/actions/submit-code.ts`

### Steps

**1. Input validation**

- `code.trim()` must be non-empty and ≤ 10,000 characters
- `language` must be a non-empty string
- Throw a descriptive `Error` if either check fails

**2. Call Gemini**

```ts
const { object } = await generateText({
  model: google("gemini-2.0-flash"),
  output: Output.object({ schema: roastSchema }),
  prompt: buildPrompt(code, language, roastMode),
})
```

**3. DB inserts**

Parent insert first, then children in parallel:

```ts
// Step A — insert submission
const [submission] = await db.insert(submissions).values({
  code,
  lang: language,
  lineCount: code.split("\n").length,
  roastMode: roastMode ? "roast" : "honest",
  isPublic: true,
  verdict: object.verdict,
  score: String(object.score),
  roastQuote: object.roastQuote,
}).returning({ id: submissions.id })

// Step B — insert children in parallel
await Promise.all([
  db.insert(submissionIssues).values(
    object.issues.map((issue, i) => ({
      submissionId: submission.id,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      order: i,
    }))
  ),
  db.insert(submissionDiffLines).values(
    object.diffLines.map((line, i) => ({
      submissionId: submission.id,
      type: line.type,
      content: line.content,
      lineNumber: line.lineNumber,
    }))
  ),
])
```

**4. Return**

```ts
return { id: submission.id }
```

**Error handling**

Any throw (Gemini failure, DB error, validation) propagates to the client, which catches it and displays the message inline. No retry logic.

---

## Section 5 — `/roast/[id]/page.tsx` real DB query

**File:** `src/app/roast/[id]/page.tsx`

### Query

```ts
const roast = await db.query.submissions.findFirst({
  where: eq(submissions.id, id),
  with: {
    issues: { orderBy: asc(submissionIssues.order) },
    diffLines: { orderBy: asc(submissionDiffLines.lineNumber) },
  },
})

if (!roast) notFound()
```

### Shape alignment

- `score` is stored as `numeric` in Postgres — Drizzle returns it as a `string`. Cast with `Number(roast.score)` before passing to `<ScoreRing>`.
- `lineCount` may be `null` if not set — use `roast.lineCount ?? roast.code.split("\n").length` as fallback.
- Remove `STATIC_ROAST` import and `void id` line.

### Not found

Call `notFound()` from `next/navigation` when `roast` is `undefined`. Next.js renders its default 404. No custom `not-found.tsx` needed.

---

## Constraints & Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| AI SDK call style | `generateText` + `Output.object()` | `generateObject` removed in AI SDK v5 |
| Gemini model | `gemini-2.0-flash` | Fast, capable, free tier available |
| All roasts public | `isPublic: true` hardcoded | Simplicity; no opt-in UI needed |
| Rate limiting | None | Low traffic dev tool; revisit if needed |
| Error handling | Inline on homepage | No dedicated error page needed |
| UX during processing | `useTransition` + `isPending` | No overlay; redirect after action completes |
| DB insert order | Parent first, children in `Promise.all` | Foreign key constraint requires parent to exist |
