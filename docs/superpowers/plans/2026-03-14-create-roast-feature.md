# Create Roast Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the end-to-end create roast flow — user submits code, Gemini analyzes it, result is persisted to DB and displayed on the roast result page.

**Architecture:** A Next.js Server Action (`submitCode`) handles the full submission pipeline: input validation → Gemini AI call → DB inserts → return UUID. The homepage Client Component is wired to call the action and redirect on success. The roast result page is updated to fetch real data from the DB instead of static fixtures.

**Tech Stack:** Next.js 16 App Router, React 19 `useTransition`, AI SDK v5 (`ai` + `@ai-sdk/google`), Drizzle ORM (relational query API), Zod v4, Postgres.

---

## Chunk 1: Setup — packages, env, and Gemini schema

### Task 1: Install packages and update env

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `.env.example`

- [ ] **Step 1: Install AI SDK packages**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm add ai @ai-sdk/google
```

Expected: packages added to `node_modules`, `package.json` updated with `"ai"` and `"@ai-sdk/google"` in dependencies.

- [ ] **Step 2: Add env var to .env.example**

Open `.env.example` and add this line:

```
GOOGLE_GENERATIVE_AI_API_KEY=
```

The file currently contains only `DATABASE_URL`. The result should be:

```
DATABASE_URL="postgresql://user:password@localhost:5432/devroast"
GOOGLE_GENERATIVE_AI_API_KEY=
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: install ai sdk packages and add gemini env var"
```

---

### Task 2: Create `src/lib/gemini.ts` — Zod schema and prompt builder

**Files:**
- Create: `src/lib/gemini.ts`

This file has two exports: `roastSchema` (the Zod schema for Gemini's output) and `buildPrompt` (the prompt string factory). It has no side effects and no external dependencies beyond `zod`.

- [ ] **Step 1: Create `src/lib/gemini.ts`**

```ts
import { z } from "zod"

// ---------------------------------------------------------------------------
// Output schema — shape Gemini must return
// z.union and z.record are NOT supported by the Gemini provider — avoid them
// ---------------------------------------------------------------------------

export const roastSchema = z.object({
	score: z.number().min(0).max(10),
	verdict: z.enum([
		"clean_code",
		"could_be_worse",
		"needs_work",
		"needs_serious_help",
		"delete_this_now",
	]),
	roastQuote: z.string(),
	issues: z
		.array(
			z.object({
				severity: z.enum(["critical", "warning", "good"]),
				title: z.string(),
				description: z.string(),
			}),
		)
		.min(2)
		.max(5),
	diffLines: z
		.array(
			z.object({
				type: z.enum(["removed", "added", "context"]),
				content: z.string(),
				lineNumber: z.number().int(),
			}),
		)
		.min(1),
})

export type RoastOutput = z.infer<typeof roastSchema>

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildPrompt(
	code: string,
	language: string,
	roastMode: boolean,
): string {
	const sharedInstructions = `
Language: ${language}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Respond with a JSON object matching this exact shape:
- score: number 0–10 (0 = catastrophic, 10 = perfect)
- verdict: one of "clean_code" | "could_be_worse" | "needs_work" | "needs_serious_help" | "delete_this_now"
- roastQuote: string (see persona instructions below)
- issues: array of 2–5 objects, each with:
    - severity: "critical" | "warning" | "good"
    - title: short label
    - description: 1–2 sentence explanation
- diffLines: array of at least 1 object showing the most important improvement as a unified diff, each with:
    - type: "removed" | "added" | "context"
    - content: the line content (no leading +/- characters)
    - lineNumber: 1-based line number in the original file (use the last context/removed line number for added lines)

Return ONLY the JSON object. No markdown fences, no explanation.`

	if (roastMode) {
		return `You are a brutally sarcastic senior software engineer reviewing code.
Your job is to roast this code mercilessly — but every criticism must point to a real, specific issue.
The roastQuote must be a short, cutting one-liner (in quotes) that captures the overall quality.
${sharedInstructions}`
	}

	return `You are a constructive, direct code reviewer.
Give honest, specific feedback without sarcasm or cruelty.
The roastQuote is a single neutral sentence summarizing the overall code quality.
${sharedInstructions}`
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm build 2>&1 | head -30
```

Expected: no TypeScript errors related to `src/lib/gemini.ts`. (Build may fail on other files — that's fine at this stage.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/gemini.ts
git commit -m "feat: add gemini schema and prompt builder"
```

---

## Chunk 2: `submitCode` Server Action

### Task 3: Wire up `db` for relational queries

**Files:**
- Modify: `src/db/index.ts`

Drizzle's relational query API (`db.query.*`) requires the schema and relations to be passed to the `drizzle()` constructor. The current `src/db/index.ts` omits them.

- [ ] **Step 1: Update `src/db/index.ts`**

Replace the entire file with:

```ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as relations from "@/db/relations"
import * as schema from "@/db/schema"

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, {
	casing: "snake_case",
	schema: { ...schema, ...relations },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm build 2>&1 | head -30
```

Expected: no errors from `src/db/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/db/index.ts
git commit -m "fix: pass schema and relations to drizzle for relational query api"
```

---

### Task 4: Implement `submitCode` Server Action

**Files:**
- Modify: `src/app/actions/submit-code.ts`

The current file is a stub with an incompatible signature. Replace it entirely.

- [ ] **Step 1: Replace `src/app/actions/submit-code.ts`**

```ts
"use server"

import { google } from "@ai-sdk/google"
import { Output, generateText } from "ai"

import { db } from "@/db"
import { submissionDiffLines, submissionIssues, submissions } from "@/db/schema"
import { buildPrompt, roastSchema } from "@/lib/gemini"

const CODE_MAX_LENGTH = 10_000

export async function submitCode(
	code: string,
	language: string,
	roastMode: boolean,
): Promise<{ id: string }> {
	// ── 1. Validate inputs ────────────────────────────────────────────────
	if (!code.trim()) {
		throw new Error("paste some code first")
	}
	if (code.length > CODE_MAX_LENGTH) {
		throw new Error(`code must be ${CODE_MAX_LENGTH.toLocaleString()} characters or fewer`)
	}
	if (!language.trim()) {
		throw new Error("select a language first")
	}

	// ── 2. Call Gemini ────────────────────────────────────────────────────
	const { object } = await generateText({
		model: google("gemini-2.0-flash"),
		output: Output.object({ schema: roastSchema }),
		prompt: buildPrompt(code, language, roastMode),
	})

	// ── 3a. Insert submission (parent) ────────────────────────────────────
	const [submission] = await db
		.insert(submissions)
		.values({
			code,
			lang: language,
			lineCount: code.split("\n").length,
			roastMode: roastMode ? "roast" : "honest",
			isPublic: true,
			verdict: object.verdict,
			score: String(object.score),
			roastQuote: object.roastQuote,
		})
		.returning({ id: submissions.id })

	// ── 3b. Insert children in parallel ──────────────────────────────────
	await Promise.all([
		db.insert(submissionIssues).values(
			object.issues.map((issue, i) => ({
				submissionId: submission.id,
				severity: issue.severity,
				title: issue.title,
				description: issue.description,
				order: i,
			})),
		),
		db.insert(submissionDiffLines).values(
			object.diffLines.map((line) => ({
				submissionId: submission.id,
				type: line.type,
				content: line.content,
				lineNumber: line.lineNumber,
			})),
		),
	])

	// ── 4. Return UUID ────────────────────────────────────────────────────
	return { id: submission.id }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm build 2>&1 | head -50
```

Expected: no TypeScript errors from `src/app/actions/submit-code.ts`. The build may still fail on `home-page-client.tsx` (which hasn't been updated yet) — that's fine.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/submit-code.ts
git commit -m "feat: implement submitCode server action with gemini and db inserts"
```

---

## Chunk 3: `HomePageClient` wiring

### Task 5: Wire toggle state, submit handler, loading, and error display

**Files:**
- Modify: `src/app/home-page-client.tsx`

The current component has an uncontrolled `Toggle` and a `Button` with no `onClick`. This task adds `roastMode` state, wires the toggle, adds `useTransition`-based submit, and adds inline error display.

- [ ] **Step 1: Update `src/app/home-page-client.tsx`**

Replace the entire file with:

```tsx
"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { submitCode } from "@/app/actions/submit-code"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/ui/code-editor"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Toggle } from "@/components/ui/toggle"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomePageClient({
	statsSlot,
	leaderboardSlot,
}: {
	statsSlot: React.ReactNode
	leaderboardSlot: React.ReactNode
}) {
	const router = useRouter()

	const [code, setCode] = useState("")
	const [detectedLang, setDetectedLang] = useState("plaintext")
	const [selectedLang, setSelectedLang] = useState<string | null>(null)
	const [roastMode, setRoastMode] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const isEmpty = code.trim().length === 0
	const activeLang = selectedLang ?? detectedLang

	function handleSubmit() {
		if (!code.trim()) {
			setError("paste some code first")
			return
		}
		setError(null)
		startTransition(async () => {
			try {
				const { id } = await submitCode(code, activeLang, roastMode)
				router.push(`/roast/${id}`)
			} catch (e) {
				setError(e instanceof Error ? e.message : "something went wrong")
			}
		})
	}

	return (
		<main className="mx-auto w-full max-w-[960px] px-10 py-20">
			{/* ── Hero ──────────────────────────────────────────────────────── */}
			<section className="flex flex-col items-center gap-3 pb-12">
				<div className="flex items-center gap-3">
					<span className="font-mono text-4xl font-bold text-accent-green">$</span>
					<h1 className="font-mono text-4xl font-bold text-text-primary">
						paste your code. get roasted.
					</h1>
				</div>
				<p className="font-mono text-sm text-text-secondary">
					{"// drop your code below and we'll rate it — brutally honest or full roast mode"}
				</p>
			</section>

			{/* ── Code editor ───────────────────────────────────────────────── */}
			<section className="flex flex-col items-center gap-4">
				<div className="w-[780px] overflow-hidden border border-border-primary bg-bg-input">
					{/* Window chrome */}
					<div className="flex h-10 w-full items-center justify-between border-b border-border-primary px-4">
						<div className="flex items-center gap-2">
							<span className="size-3 rounded-full bg-accent-red" />
							<span className="size-3 rounded-full bg-accent-amber" />
							<span className="size-3 rounded-full bg-accent-green" />
						</div>
						<LanguageSelector
							detectedLang={detectedLang}
							selectedLang={selectedLang}
							onSelect={setSelectedLang}
						/>
					</div>

					<CodeEditor
						value={code}
						onChange={setCode}
						activeLang={activeLang}
						onDetect={setDetectedLang}
					/>
				</div>

				{/* Actions bar */}
				<div className="flex w-[780px] items-center justify-between">
					<div className="flex items-center gap-4">
						<Toggle checked={roastMode} onCheckedChange={setRoastMode} />
						<span className="font-mono text-xs text-text-tertiary">
							{roastMode
								? "// maximum sarcasm enabled"
								: "// honest mode enabled"}
						</span>
					</div>
					<Button
						variant="primary"
						size="md"
						disabled={isEmpty || isPending}
						onClick={handleSubmit}
					>
						{isPending ? "$ roasting..." : "$ roast_my_code"}
					</Button>
				</div>

				{/* Inline error */}
				{error && (
					<p className="w-[780px] font-mono text-xs text-accent-red">{error}</p>
				)}

				{/* Footer stats — injected from Server Component via slot */}
				{statsSlot}
			</section>

			{/* Divider spacer */}
			<div className="py-12" />

			{/* ── Leaderboard — injected from Server Component via slot ─────── */}
			{leaderboardSlot}
		</main>
	)
}
```

- [ ] **Step 2: Run lint/format check**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm check
```

Expected: no errors. Auto-fixes applied in place.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -50
```

Expected: no errors. The build may still fail on the roast page (static data not yet replaced) — that's fine.

- [ ] **Step 4: Commit**

```bash
git add src/app/home-page-client.tsx
git commit -m "feat: wire roast mode toggle, submit handler, loading state, and error display"
```

---

## Chunk 4: Roast result page — real DB query

### Task 6: Replace `STATIC_ROAST` with a real DB query

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

The current page ignores the `id` param and always renders static data. This task fetches the real submission from the DB.

- [ ] **Step 1: Update `src/app/roast/[id]/page.tsx`**

Replace the entire file with:

```tsx
import { asc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CardBadge, CardDescription, CardRoot, CardTitle } from "@/components/ui/card"
import { CodeBlockBody, CodeBlockRoot } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import { ScoreRing } from "@/components/ui/score-ring"
import { db } from "@/db"
import { submissionDiffLines, submissionIssues, submissions } from "@/db/schema"
import { VERDICT_COLOR, VERDICT_LABEL } from "@/db/roast"

export const metadata: Metadata = {
	title: "Roast Result | DevRoast",
	description: "See how your code was roasted.",
}

type Props = {
	params: Promise<{ id: string }>
}

export default async function RoastPage({ params }: Props) {
	const { id } = await params

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		with: {
			issues: { orderBy: asc(submissionIssues.order) },
			diffLines: { orderBy: asc(submissionDiffLines.lineNumber) },
		},
	})

	if (!roast) notFound()

	const score = Number(roast.score)
	const lineCount = roast.lineCount ?? roast.code.split("\n").length
	const lang = roast.lang ?? "plaintext"
	const verdictVariant = VERDICT_COLOR[roast.verdict]

	return (
		<main className="mx-auto w-full max-w-[960px] px-20 py-10">
			{/* ── Score Hero ──────────────────────────────────────────────────── */}
			<section className="flex items-center gap-12 pb-10">
				<ScoreRing score={score} />

				<div className="flex flex-1 flex-col gap-4">
					{/* Verdict badge */}
					<div className="flex items-center gap-2">
						<span
							className={`size-2 rounded-full ${verdictVariant === "critical" ? "bg-accent-red" : verdictVariant === "warning" ? "bg-accent-amber" : "bg-accent-green"}`}
						/>
						<span
							className={`font-mono text-[13px] font-medium ${verdictVariant === "critical" ? "text-accent-red" : verdictVariant === "warning" ? "text-accent-amber" : "text-accent-green"}`}
						>
							{`verdict: ${VERDICT_LABEL[roast.verdict]}`}
						</span>
					</div>

					{/* Quote */}
					<p className="font-mono text-xl leading-relaxed text-text-primary">{roast.roastQuote}</p>

					{/* Meta */}
					<div className="flex items-center gap-4">
						<span className="font-mono text-xs text-text-tertiary">{`lang: ${lang}`}</span>
						<span className="font-mono text-xs text-text-tertiary">·</span>
						<span className="font-mono text-xs text-text-tertiary">{`${lineCount} lines`}</span>
					</div>

					{/* Share button */}
					<div>
						<button
							type="button"
							className="inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors enabled:hover:border-accent-green enabled:hover:text-accent-green"
						>
							$ share_roast
						</button>
					</div>
				</div>
			</section>

			<hr className="border-border-primary" />

			{/* ── Your Submission ─────────────────────────────────────────────── */}
			<section className="flex flex-col gap-4 py-10">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">{"//"}</span>
					<span className="font-mono text-sm font-bold text-text-primary">your_submission</span>
				</div>

				<CodeBlockRoot>
					<CodeBlockBody code={roast.code} lang={lang} />
				</CodeBlockRoot>
			</section>

			<hr className="border-border-primary" />

			{/* ── Detailed Analysis ───────────────────────────────────────────── */}
			<section className="flex flex-col gap-6 py-10">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">{"//"}</span>
					<span className="font-mono text-sm font-bold text-text-primary">detailed_analysis</span>
				</div>

				<div className="grid grid-cols-2 gap-5">
					{roast.issues.map((issue) => (
						<CardRoot key={issue.id}>
							<CardBadge variant={issue.severity} />
							<CardTitle>{issue.title}</CardTitle>
							<CardDescription>{issue.description}</CardDescription>
						</CardRoot>
					))}
				</div>
			</section>

			<hr className="border-border-primary" />

			{/* ── Suggested Fix ───────────────────────────────────────────────── */}
			<section className="flex flex-col gap-6 py-10">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">{"//"}</span>
					<span className="font-mono text-sm font-bold text-text-primary">suggested_fix</span>
				</div>

				<div className="overflow-hidden border border-border-primary bg-bg-input">
					{/* Diff header */}
					<div className="flex h-10 items-center border-b border-border-primary px-4">
						<span className="font-mono text-xs font-medium text-text-secondary">
							{`your_code.${lang} → improved_code.${lang}`}
						</span>
					</div>

					{/* Diff lines */}
					<div className="py-1">
						{roast.diffLines.map((line) => (
							<DiffLine key={line.id} variant={line.type} code={line.content} />
						))}
					</div>
				</div>
			</section>
		</main>
	)
}
```

- [ ] **Step 2: Run lint/format check**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm check
```

Expected: no errors. Auto-fixes applied in place.

- [ ] **Step 3: Verify full build passes**

```bash
pnpm build 2>&1
```

Expected: build succeeds with no TypeScript or Next.js errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: replace static roast data with real db query on result page"
```

---

## Final verification

- [ ] **Step 1: Start dev server and smoke test**

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
pnpm dev
```

Manual checks:
1. Homepage loads, toggle is controlled (clicking changes the comment text between "maximum sarcasm enabled" and "honest mode enabled")
2. Submit button is disabled when editor is empty
3. Paste code → click roast → button shows "$ roasting..." while pending
4. On success, redirected to `/roast/<uuid>` with real roast result rendered
5. On error (e.g. empty code), inline red error message appears below editor
6. Navigate directly to `/roast/bad-uuid` → 404 page

- [ ] **Step 2: Final commit if any lint fixes were auto-applied**

```bash
git status
# if any files modified by pnpm check:
git add -A && git commit -m "chore: apply biome auto-fixes"
```
