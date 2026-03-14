# OpenGraph Image Generation for Roast Result Pages

**Date:** 2026-03-14
**Status:** Approved

## Problem

Shared links to `/roast/[id]` pages have no OpenGraph image. When posted to Twitter, Discord, Slack, etc., the embed is bare — no visual preview of the roast result. This reduces the shareability of the core product loop.

## Goal

Auto-generate a per-roast OG image that faithfully reproduces the `leftSide` Pencil design frame, showing the score, verdict, language info, and roast quote. The image is attached automatically to the embed for every shared roast link.

## Approach

Use the **Next.js file convention** (`opengraph-image.tsx`) placed inside `src/app/roast/[id]/`. Next.js automatically serves this as the OG image for the route and injects `og:image` / `twitter:image` tags into the `<head>` — no manual URL wiring needed.

Image rendering uses **Takumi** (`@takumi-rs/image-response`) as a drop-in replacement for `next/og`'s `ImageResponse`. Takumi uses a Rust rendering engine for faster generation.

## Files Changed

| File | Change |
|---|---|
| `src/app/roast/[id]/opengraph-image.tsx` | New — Takumi `ImageResponse`, the OG image handler |
| `src/app/roast/[id]/page.tsx` | Modified — replace static `metadata` with `generateMetadata` |
| `next.config.ts` | Modified — add `serverExternalPackages: ["@takumi-rs/core"]` |
| `public/fonts/*.ttf` | New — font binary files for Takumi to load |

## Image Layout (1200×630)

Exact translation of the `leftSide` Pencil frame. Vertical flex column, centered both axes, `background: #0A0A0A`, `padding: 64px`, `gap: 28px`.

### Elements (top to bottom)

**Logo row** (`logoRow`)
- Flex row, gap 8px, centered
- `>` — JetBrains Mono 24px weight 700, color `#10B981`
- `devroast` — JetBrains Mono 20px weight 500, color `#FAFAFA`

**Score row** (`scoreRow`)
- Flex row, align-items end, gap 4px, centered
- `{score}` — JetBrains Mono 160px weight 900, color `#F59E0B`, lineHeight 1
- `/10` — JetBrains Mono 56px weight 400, color `#4B5563`, lineHeight 1

**Verdict row** (`verdictRow`)
- Flex row, centered, gap 8px
- Colored dot — 12×12px circle, color determined by verdict
- `{verdict}` text — JetBrains Mono 20px weight 400, same color as dot

**Lang info** (`langInfo`)
- `lang: {lang} · {lineCount} lines` — JetBrains Mono 16px weight 400, color `#4B5563`, centered
- If `lang` is null: `{lineCount} lines`
- If both null: element omitted

**Roast quote** (`roastQuote`)
- `"{roastQuote}"` — IBM Plex Mono 22px weight 400, color `#FAFAFA`, centered, lineHeight 1.5

### Verdict Color Map

Matches the existing `VERDICT_COLOR` semantic mapping in `src/db/roast.ts` (`good` → green, `warning` → amber, `critical` → red):

| Verdict | Semantic | Color | Token |
|---|---|---|---|
| `clean_code` | good | `#10B981` | accent-green |
| `could_be_worse` | good | `#10B981` | accent-green |
| `needs_work` | warning | `#F59E0B` | accent-amber |
| `needs_serious_help` | critical | `#EF4444` | accent-red |
| `delete_this_now` | critical | `#EF4444` | accent-red |

## Fonts

Loaded from `public/fonts/` via `fs.readFileSync` (Node.js runtime, not edge). Passed as `ArrayBuffer` in the `fonts` array of `ImageResponse`.

| File | Font | Weight |
|---|---|---|
| `JetBrainsMono-Regular.ttf` | JetBrains Mono | 400 |
| `JetBrainsMono-Medium.ttf` | JetBrains Mono | 500 |
| `JetBrainsMono-Bold.ttf` | JetBrains Mono | 700 |
| `JetBrainsMono-ExtraBold.ttf` | JetBrains Mono | 900 |
| `IBMPlexMono-Regular.ttf` | IBM Plex Mono | 400 |

If any files are missing from `public/fonts/` (currently loaded via CDN in CSS), they must be downloaded from the open-source releases and committed to the repo.

## `generateMetadata` Update

The static `metadata` export in `src/app/roast/[id]/page.tsx` is replaced with `generateMetadata`. It performs a lightweight DB query (no joins — only `score`, `verdict`, `roastQuote`) and returns:

```ts
{
  title: `${Number(score).toFixed(1)}/10 — ${VERDICT_LABEL[verdict]} | DevRoast`,
  description: roastQuote,
  openGraph: {
    type: "website",
    images: [],  // Next.js auto-wires the file-convention image
  },
  twitter: {
    card: "summary_large_image",
  },
}
```

Falls back to the original static metadata if the submission is not found: `title: "Roast Result | DevRoast"`, `description: "See how your code was roasted."`.

## Caching

`opengraph-image.tsx` exports `revalidate = false`. Roast results are immutable — generated once, never updated. The image is cached indefinitely by Next.js and served from the CDN on subsequent requests.

## Error Handling

- Submission not found → `notFound()` (404), same as `page.tsx`
- DB error → unhandled, bubbles to 500
- Nullable `lang` / `lineCount` → handled per layout rules above
- `score` from Drizzle is a `string` → coerce with `Number(score).toFixed(1)` before rendering

## Dependencies

- `@takumi-rs/image-response` — new package to install
- No other new runtime dependencies
