# Share Page — Design Spec

**Date:** 2026-03-14
**Status:** Approved

---

## Overview

Add a `/roast/[id]/share` page that lets users share their roast result on Twitter. The existing `$ share_roast` button on the result page navigates to this page. The share page shows the OG image preview and a Twitter share button — nothing else.

---

## Goals

- Give users a dedicated, shareable page with a one-click Twitter share action.
- Reuse the existing OG image endpoint (`/roast/[id]/opengraph-image`) — no duplicate image generation.
- Zero client-side JavaScript.

---

## Non-Goals

- Copy-link button.
- Score/verdict summary on the share page.
- Any social platform other than Twitter.
- Any modal or overlay variant.

---

## Routes

| Route | Purpose |
|---|---|
| `/roast/[id]/share` | New share page (server component) |
| `/roast/[id]/opengraph-image` | Existing OG image endpoint — unchanged |

---

## Architecture

### `/roast/[id]/share/page.tsx`

- **Type:** async Server Component (no `"use client"`).
- **DB query:** `db.query.submissions.findFirst` fetching `{ score, verdict, roastQuote }` for the given `id`. If not found, call `notFound()`.
- **No tRPC** — direct Drizzle query, same pattern as `roast/[id]/page.tsx`.
- **No state, no interactivity** — Twitter share is a plain `<a>` tag.

### `$ share_roast` button on result page (`roast/[id]/page.tsx`)

- Replace the existing `<button>` (lines 98–103) with a Next.js `<Link href={`/roast/${id}/share`}>`.
- Same className as the current button — no style changes.
- No `"use client"` import needed on the result page.

---

## UI

### Layout

```
max-w-[960px] mx-auto px-20 py-10
```

Matches the roast result page layout.

### Page Header

```
> share_roast
// share your roast results
```

- `>` — `font-mono text-3xl font-bold text-accent-green`
- `share_roast` — `font-mono text-3xl font-bold text-text-primary`
- comment line — `font-mono text-sm text-text-secondary`
- Matches the header pattern used on the leaderboard page.

### OG Image Preview

- `<img src={`/roast/${id}/opengraph-image`} alt="Roast result preview" />`
- `width="100%"` with explicit `aspect-ratio: 1200 / 630` via Tailwind (`aspect-[1200/630]`).
- `border border-border-primary` container.
- No additional wrapper needed.

### Twitter Share Button

- `<a href={twitterIntentUrl} target="_blank" rel="noopener noreferrer">`
- Styled to match the `$ share_roast` button visual style. Because this is an `<a>` tag (not a `<button>`), use plain `hover:` — not `enabled:hover:`:
  ```
  inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent-green hover:text-accent-green
  ```
- Label: `$ share_on_twitter`

**Twitter intent URL:**

```
https://twitter.com/intent/tweet?url=https%3A%2F%2Fdevroast.com%2Froast%2F{id}&text=I+got+{score}%2F10+on+DevRoast+%E2%80%94+{verdictLabel}
```

- `score` — `Number(roast.score).toFixed(1)`
- `verdictLabel` — from `VERDICT_LABEL[roast.verdict]` (imported from `@/db/roast`)
- Both `url` and `text` params are `encodeURIComponent`-encoded.

---

## Data Flow

```
Request /roast/[id]/share
  → RPC params → id
  → DB: submissions.findFirst({ where: eq(submissions.id, id), columns: { score, verdict, roastQuote } })
  → if not found: notFound()
  → render page with:
      - <img src="/roast/{id}/opengraph-image" />
      - <a href="https://twitter.com/intent/tweet?..."> $ share_on_twitter </a>
```

The OG image endpoint is called by the browser independently when rendering the `<img>` tag — the share page itself only fetches roast metadata.

---

## Metadata

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  await connection()

  const roast = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    columns: { roastQuote: true },
  })

  return {
    title: "Share Your Roast | DevRoast",
    description: roast?.roastQuote ?? "Share your roast results.",
  }
}
```

No `twitter` or `openGraph` block — the file-convention `opengraph-image.tsx` already handles OG image for this subtree.

---

## Error Handling

- `notFound()` if `id` does not exist in DB — renders Next.js 404 page.
- No other error states (the `<img>` gracefully degrades if the image endpoint fails).

---

## Files Changed

| File | Change |
|---|---|
| `src/app/roast/[id]/share/page.tsx` | New file |
| `src/app/roast/[id]/page.tsx` | Replace `<button>` with `<Link>` (lines 98–103) |

---

## Constraints

- Named exports only — except `page.tsx` (Next.js default export convention).
- Tailwind design tokens only — no hardcoded hex values.
- `font-mono` for all text (JetBrains Mono).
- No `twMerge` — use `tv()` only if variants are needed (none expected here).
- Extend native HTML props if extracting sub-components (not expected here).
- Tabs for indentation.
