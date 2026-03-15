# Share Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/roast/[id]/share` page that shows the OG image preview and a one-click Twitter share button, and wire the `$ share_roast` button on the result page to navigate there.

**Architecture:** Two small, independent changes — (1) create `src/app/roast/[id]/share/page.tsx` as a pure async Server Component with a direct Drizzle query, and (2) replace the inert `<button>` on the result page with a Next.js `<Link>`. No client JS, no new components, no tRPC.

**Tech Stack:** Next.js 15 App Router, TypeScript, Drizzle ORM, Tailwind CSS v4, pnpm

**Spec:** `docs/superpowers/specs/2026-03-14-share-page-design.md`

---

## Chunk 1: Share page + result page wiring

### Task 1: Create `/roast/[id]/share/page.tsx`

**Files:**
- Create: `src/app/roast/[id]/share/page.tsx`

This is a pure server component. No tests needed beyond a production build check.

- [ ] **Step 1: Create the file**

Create `src/app/roast/[id]/share/page.tsx` with the following content (tabs for indentation):

```tsx
import { eq } from "drizzle-orm"
import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { db } from "@/db"
import { VERDICT_LABEL } from "@/db/roast"
import { submissions } from "@/db/schema"

type Props = {
	params: Promise<{ id: string }>
}

export async function generateMetadata(
	{ params }: Props,
	_parent: ResolvingMetadata
): Promise<Metadata> {
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

export default async function SharePage({ params }: Props) {
	const { id } = await params
	await connection()

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		columns: { score: true, verdict: true },
	})

	if (!roast) notFound()

	const score = Number(roast.score).toFixed(1)
	const verdictLabel = VERDICT_LABEL[roast.verdict]

	const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://devroast.com/roast/${id}`)}&text=${encodeURIComponent(`I got ${score}/10 on DevRoast — ${verdictLabel}`)}`

	return (
		<main className="mx-auto w-full max-w-[960px] px-20 py-10">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<section className="flex flex-col gap-4 pb-10">
				<div className="flex items-center gap-3">
					<span className="font-mono text-3xl font-bold text-accent-green">&gt;</span>
					<h1 className="font-mono text-3xl font-bold text-text-primary">share_roast</h1>
				</div>
				<p className="font-mono text-sm text-text-secondary">
					{"// share your roast results"}
				</p>
			</section>

			{/* ── OG Image Preview ────────────────────────────────────────────── */}
			<section className="flex flex-col gap-6">
				<img
					src={`/roast/${id}/opengraph-image`}
					alt="Roast result preview"
					className="aspect-[1200/630] w-full border border-border-primary"
				/>

				{/* Twitter share button */}
				<div>
					<a
						href={twitterUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
					>
						$ share_on_twitter
					</a>
				</div>
			</section>
		</main>
	)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22 && pnpm build
```

Expected: build succeeds, `ƒ /roast/[id]/share` appears in the output routes table.

- [ ] **Step 3: Commit**

```bash
git add src/app/roast/[id]/share/page.tsx
git commit -m "feat: add /roast/[id]/share page"
```

---

### Task 2: Wire the `$ share_roast` button on the result page

**Files:**
- Modify: `src/app/roast/[id]/page.tsx` (lines 96–104)

- [ ] **Step 1: Replace the `<button>` with a `<Link>`**

In `src/app/roast/[id]/page.tsx`:

1. Add `Link` to the `next/link` import at the top of the file (add a new import line — there is no existing `next/link` import):

```tsx
import Link from "next/link"
```

2. Replace the share button block (lines 96–104):

```tsx
{/* Share button */}
<div>
    <button
        type="button"
        className="inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors enabled:hover:border-accent-green enabled:hover:text-accent-green"
    >
        $ share_roast
    </button>
</div>
```

With:

```tsx
{/* Share button */}
<div>
    <Link
        href={`/roast/${id}/share`}
        className="inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
    >
        $ share_roast
    </Link>
</div>
```

Note: `enabled:hover:` becomes plain `hover:` because `<Link>` is an `<a>` tag, not a `<button>`.

- [ ] **Step 2: Run lint + format**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22 && pnpm check
```

Expected: no errors.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: build succeeds cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: wire share_roast button to /roast/[id]/share"
```
