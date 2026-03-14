# OpenGraph Image Generation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-generate a per-roast OpenGraph image at `/roast/[id]` using the Next.js file convention + Takumi, matching the approved Pencil design exactly.

**Architecture:** `opengraph-image.tsx` placed alongside `page.tsx` in `src/app/roast/[id]/`. Next.js automatically serves it as the OG image and injects `og:image`/`twitter:image` into the page `<head>`. `generateMetadata` replaces the static `metadata` export in `page.tsx` to produce per-roast title/description. Takumi (`@takumi-rs/image-response`) renders the JSX to a PNG using a Rust engine.

**Tech Stack:** Next.js 16 (App Router), Takumi `@takumi-rs/image-response`, Drizzle ORM (postgres), TypeScript, pnpm

**Spec:** `docs/superpowers/specs/2026-03-14-opengraph-image-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `public/fonts/JetBrainsMono-Regular.ttf` | Create | Font binary for Takumi (weight 400) |
| `public/fonts/JetBrainsMono-Medium.ttf` | Create | Font binary for Takumi (weight 500) |
| `public/fonts/JetBrainsMono-Bold.ttf` | Create | Font binary for Takumi (weight 700) |
| `public/fonts/JetBrainsMono-ExtraBold.ttf` | Create | Font binary for Takumi (weight 800/900 — verify) |
| `public/fonts/IBMPlexMono-Regular.ttf` | Create | Font binary for Takumi (weight 400) |
| `next.config.ts` | Modify | Add `serverExternalPackages: ["@takumi-rs/core"]` |
| `src/app/roast/[id]/opengraph-image.tsx` | Create | Takumi `ImageResponse` — the OG image handler |
| `src/app/roast/[id]/page.tsx` | Modify | Replace static `metadata` with `generateMetadata` |

---

## Chunk 1: Setup — fonts, package, config

### Task 1: Install Takumi

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `next.config.ts`

- [ ] **Step 1: Install the package**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm add @takumi-rs/image-response
```

Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Add `serverExternalPackages` to `next.config.ts`**

Current `next.config.ts`:
```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
}

export default nextConfig
```

Updated:
```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
	serverExternalPackages: ["@takumi-rs/core"],
}

export default nextConfig
```

- [ ] **Step 3: If using pnpm, add `.npmrc` entry (required for pnpm virtual store)**

Check if `.npmrc` exists. If it does, add the line. If not, create it.

```
public-hoist-pattern[]=@takumi-rs/core-*
```

Then reinstall:
```bash
pnpm install
```

- [ ] **Step 4: Commit**

```bash
git add next.config.ts .npmrc package.json pnpm-lock.yaml
git commit -m "feat: install takumi and configure serverExternalPackages"
```

---

### Task 2: Download font files

**Files:**
- Create: `public/fonts/JetBrainsMono-Regular.ttf`
- Create: `public/fonts/JetBrainsMono-Medium.ttf`
- Create: `public/fonts/JetBrainsMono-Bold.ttf`
- Create: `public/fonts/JetBrainsMono-ExtraBold.ttf`
- Create: `public/fonts/IBMPlexMono-Regular.ttf`

JetBrains Mono is open-source (Apache 2.0). IBM Plex Mono is open-source (SIL OFL 1.1). Download directly from GitHub releases.

- [ ] **Step 1: Create the fonts directory**

```bash
mkdir -p public/fonts
```

- [ ] **Step 2: Download JetBrains Mono TTFs**

```bash
cd public/fonts

# Regular (400)
curl -L -o JetBrainsMono-Regular.ttf \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf"

# Medium (500)
curl -L -o JetBrainsMono-Medium.ttf \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Medium.ttf"

# Bold (700)
curl -L -o JetBrainsMono-Bold.ttf \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Bold.ttf"

# ExtraBold (800)
curl -L -o JetBrainsMono-ExtraBold.ttf \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-ExtraBold.ttf"
```

- [ ] **Step 3: Verify ExtraBold weight value**

The score (`160px`) uses font weight 900, but JetBrains Mono ExtraBold may register as weight 800. Check with:

```bash
# Install fonttools if needed: pip install fonttools
python3 -c "
from fontTools.ttLib import TTFont
font = TTFont('public/fonts/JetBrainsMono-ExtraBold.ttf')
for record in font['name'].names:
    if record.nameID == 4:
        print(record.toUnicode())
os2 = font['OS/2']
print('usWeightClass:', os2.usWeightClass)
"
```

Note the `usWeightClass` value — the plan defaults to `900`. If the value is `800`, update the `weight` in `loadFonts()` and the JSX `fontWeight` for the score in Task 3 from `900` to `800`.

- [ ] **Step 4: Download IBM Plex Mono Regular**

```bash
curl -L -o IBMPlexMono-Regular.ttf \
  "https://github.com/IBM/plex/raw/master/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf"
```

- [ ] **Step 5: Verify all files downloaded**

```bash
ls -lh public/fonts/
```

Expected: 5 `.ttf` files, each several hundred KB.

- [ ] **Step 6: Commit**

```bash
cd /home/marianinha/PROJETOS/NLW/devroast
git add public/fonts/
git commit -m "feat: add font TTF files for OG image generation"
```

---

## Chunk 2: OG image handler

### Task 3: Create `opengraph-image.tsx`

**Files:**
- Create: `src/app/roast/[id]/opengraph-image.tsx`

This file uses the Next.js file convention for route-level OG images. It exports:
- `size` — image dimensions
- `contentType` — MIME type
- `revalidate` — cache strategy
- A default async function that receives `params`, queries the DB, and returns a Takumi `ImageResponse`

The JSX layout is a direct translation of the Pencil `leftSide` frame. All styles are **inline** (no Tailwind, no CSS — Takumi/Satori only supports inline styles).

- [ ] **Step 1: Create the file**

```tsx
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { ImageResponse } from "@takumi-rs/image-response"

import { db } from "@/db"
import { submissions } from "@/db/schema"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = false

// Verdict → hex color (matches VERDICT_COLOR semantic: good=green, warning=amber, critical=red)
// Defined inline to avoid importing VERDICT_COLOR which uses non-hex semantic strings
const VERDICT_HEX: Record<string, string> = {
	clean_code: "#10B981",
	could_be_worse: "#10B981",
	needs_work: "#F59E0B",
	needs_serious_help: "#EF4444",
	delete_this_now: "#EF4444",
}

// Load font binaries (runs at request time in Node.js runtime)
function loadFonts() {
	const fontsDir = join(process.cwd(), "public", "fonts")
	return [
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-Regular.ttf")).buffer,
			weight: 400 as const,
			style: "normal" as const,
		},
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-Medium.ttf")).buffer,
			weight: 500 as const,
			style: "normal" as const,
		},
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-Bold.ttf")).buffer,
			weight: 700 as const,
			style: "normal" as const,
		},
		{
			name: "JetBrains Mono",
			// Use the actual usWeightClass from the font (verified in Task 2 Step 3 — default to 900)
			data: readFileSync(join(fontsDir, "JetBrainsMono-ExtraBold.ttf")).buffer,
			weight: 900 as const,
			style: "normal" as const,
		},
		{
			name: "IBM Plex Mono",
			data: readFileSync(join(fontsDir, "IBMPlexMono-Regular.ttf")).buffer,
			weight: 400 as const,
			style: "normal" as const,
		},
	]
}

type Props = {
	params: Promise<{ id: string }>
}

export default async function OgImage({ params }: Props) {
	const { id } = await params

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		columns: {
			score: true,
			verdict: true,
			roastQuote: true,
			lang: true,
			lineCount: true,
		},
	})

	if (!roast) notFound()

	const score = Number(roast.score).toFixed(1)
	const verdictColor = VERDICT_HEX[roast.verdict] ?? "#FAFAFA"

	// Lang info line — omit if both are null
	const langInfo =
		roast.lang && roast.lineCount != null
			? `lang: ${roast.lang} · ${roast.lineCount} lines`
			: roast.lineCount != null
				? `${roast.lineCount} lines`
				: null

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				background: "#0A0A0A",
				padding: "64px",
				gap: "28px",
				fontFamily: "JetBrains Mono",
			}}
		>
			{/* logoRow */}
			<div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
				<span style={{ color: "#10B981", fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>{">"}</span>
				<span style={{ color: "#FAFAFA", fontSize: "20px", fontWeight: 500, lineHeight: 1 }}>devroast</span>
			</div>

			{/* scoreRow */}
			<div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "4px" }}>
				<span style={{ color: "#F59E0B", fontSize: "160px", fontWeight: 900, lineHeight: 1 }}>{score}</span>
				<span style={{ color: "#4B5563", fontSize: "56px", fontWeight: 400, lineHeight: 1 }}>/10</span>
			</div>

			{/* verdictRow */}
			<div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
				<div
					style={{
						width: "12px",
						height: "12px",
						borderRadius: "50%",
						background: verdictColor,
					}}
				/>
				<span style={{ color: verdictColor, fontSize: "20px", fontWeight: 400 }}>{roast.verdict}</span>
			</div>

			{/* langInfo — conditional */}
			{langInfo != null && (
				<span
					style={{
						color: "#4B5563",
						fontSize: "16px",
						fontWeight: 400,
						fontFamily: "JetBrains Mono",
						textAlign: "center",
					}}
				>
					{langInfo}
				</span>
			)}

			{/* roastQuote */}
			<span
				style={{
					color: "#FAFAFA",
					fontSize: "22px",
					fontWeight: 400,
					fontFamily: "IBM Plex Mono",
					textAlign: "center",
					lineHeight: 1.5,
					maxWidth: "100%",
				}}
			>
				{`"${roast.roastQuote}"`}
			</span>
		</div>,
		{
			...size,
			fonts: loadFonts(),
		},
	)
}
```

**Important:** The score uses `fontWeight: 900`. If Task 2 Step 3 reveals the font's `usWeightClass` is `800`, update both the `loadFonts()` entry and the JSX `fontWeight` from `900` to `800`.

- [ ] **Step 2: Run the dev server and manually verify the OG image renders**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm dev
```

Open in browser: `http://localhost:3000/roast/<a-real-uuid>/opengraph-image`

(Get a real UUID from the DB or use the seed data.) Expected: a 1200×630 PNG with the dark background, big score, verdict dot, lang info, and roast quote — matching the Pencil design.

- [ ] **Step 3: Run lint/format check**

```bash
pnpm check
```

Fix any issues reported by Biome.

- [ ] **Step 4: Commit**

```bash
git add src/app/roast/[id]/opengraph-image.tsx
git commit -m "feat: add opengraph-image route for roast result pages using Takumi"
```

---

## Chunk 3: `generateMetadata` + wiring

### Task 4: Replace static `metadata` with `generateMetadata` in `page.tsx`

**Files:**
- Modify: `src/app/roast/[id]/page.tsx:14-17`

The existing static export:
```ts
export const metadata: Metadata = {
	title: "Roast Result | DevRoast",
	description: "See how your code was roasted.",
}
```

Is replaced with a `generateMetadata` async function. It performs a lightweight DB query (no joins, using `columns` projection) and returns per-roast metadata. Falls back to static values if not found.

- [ ] **Step 1: Update `page.tsx`**

Replace lines 14–17 with the following. Also add `type { ResolvingMetadata }` to the `next` import if needed. The full replacement:

```ts
export async function generateMetadata(
	{ params }: Props,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { id } = await params

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		columns: { score: true, verdict: true, roastQuote: true },
	})

	if (!roast) {
		return {
			title: "Roast Result | DevRoast",
			description: "See how your code was roasted.",
		}
	}

	const score = Number(roast.score).toFixed(1)

	return {
		title: `${score}/10 — ${VERDICT_LABEL[roast.verdict]} | DevRoast`,
		description: roast.roastQuote,
		openGraph: {
			type: "website",
			images: [], // Next.js auto-wires opengraph-image.tsx
		},
		twitter: {
			card: "summary_large_image",
		},
	}
}
```

Add `ResolvingMetadata` to the `next` import at the top:

```ts
import type { Metadata, ResolvingMetadata } from "next"
```

The `eq` import and `submissions` import are already present (lines 1, 12). The `VERDICT_LABEL` import is already present (line 11). The `db` import is already present (line 10).

- [ ] **Step 2: Remove the now-unused `type Props` duplication**

`Props` is already defined at line 19–21 for the page component — `generateMetadata` reuses it. Make sure `Props` is defined once and used by both exports. No new type needed.

- [ ] **Step 3: Run lint/format**

```bash
pnpm check
```

- [ ] **Step 4: Verify in browser**

Run `pnpm dev` and open a roast page: `http://localhost:3000/roast/<uuid>`

View page source or use browser devtools to confirm the `<head>` contains:
- `<meta property="og:image" content="...opengraph-image..." />`
- `<meta name="twitter:card" content="summary_large_image" />`
- `<title>3.5/10 — needs_serious_help | DevRoast</title>` (values match the roast)

- [ ] **Step 5: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: add generateMetadata with per-roast og title and description"
```

---

## Chunk 4: Final verification

### Task 5: Production build check

- [ ] **Step 1: Run lint/format check**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm check
```

Expected: no errors. Fix any Biome issues before proceeding.

- [ ] **Step 2: Run production build**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm build
```

Expected: build completes without errors. The `opengraph-image.tsx` route should appear in the build output as a dynamic route under `/roast/[id]`.

- [ ] **Step 3: Fix any build errors**

Common issues:
- Takumi not in `serverExternalPackages` → verify `next.config.ts`
- Font file not found → verify paths in `loadFonts()` match actual filenames in `public/fonts/`
- TypeScript errors from `generateMetadata` → ensure `ResolvingMetadata` is imported

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues for OG image route"
```
