import { Badge } from "@/components/ui/badge"
import { CardBadge, CardDescription, CardRoot, CardTitle } from "@/components/ui/card"
import { CodeBlockBody, CodeBlockHeader, CodeBlockRoot } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import { ScoreRing } from "@/components/ui/score-ring"

// ---------------------------------------------------------------------------
// Static mock data (will be replaced with DB fetch once Docker is available)
// ---------------------------------------------------------------------------

const MOCK_SUBMISSION = {
	id: "demo",
	score: 2.4,
	verdict: "needs_serious_help" as const,
	roastMode: "roast" as const,
	lang: "javascript",
	lineCount: 12,
	roastQuote:
		"This code looks like it was written by someone who learned JavaScript from a 2009 tutorial and never looked back.",
	issues: [
		{
			id: "1",
			severity: "critical" as const,
			title: "using var instead of const/let",
			description:
				"All variable declarations use `var`, which has function scope and can lead to subtle bugs. Use `const` for values that don't change and `let` for those that do.",
		},
		{
			id: "2",
			severity: "critical" as const,
			title: "eval() usage detected",
			description:
				"Using `eval()` is a major security vulnerability. It executes arbitrary code and can be exploited to run malicious scripts. Remove it entirely.",
		},
		{
			id: "3",
			severity: "warning" as const,
			title: "no error handling on async operations",
			description:
				"Async operations have no try/catch or `.catch()` handlers. If the operation fails, the error will be silently swallowed and the app will be in an inconsistent state.",
		},
		{
			id: "4",
			severity: "good" as const,
			title: "function is at least named",
			description:
				"The function has a name, which helps with stack traces and debugging. Small mercies.",
		},
	],
	diffLines: [
		{ id: "d1", type: "removed" as const, lineNumber: 1, content: "var getData = function() {" },
		{ id: "d2", type: "added" as const, lineNumber: 2, content: "async function getData() {" },
		{
			id: "d3",
			type: "removed" as const,
			lineNumber: 3,
			content: "  var result = eval(fetch(url))",
		},
		{
			id: "d4",
			type: "added" as const,
			lineNumber: 4,
			content: "  const result = await fetch(url)",
		},
		{ id: "d5", type: "context" as const, lineNumber: 5, content: "  return result.json()" },
		{ id: "d6", type: "context" as const, lineNumber: 6, content: "}" },
	],
	code: `var getData = function() {
  var url = "https://api.example.com/data"
  var result = eval(fetch(url))
  return result
}

var processData = function(data) {
  for (var i = 0; i < data.length; i++) {
    var item = data[i]
    console.log(item)
  }
}`,
}

const VERDICT_LABEL: Record<string, string> = {
	clean_code: "clean_code",
	could_be_worse: "could_be_worse",
	needs_work: "needs_work",
	needs_serious_help: "needs_serious_help",
	delete_this_now: "delete_this_now",
}

const VERDICT_COLOR: Record<string, "critical" | "warning" | "good"> = {
	clean_code: "good",
	could_be_worse: "good",
	needs_work: "warning",
	needs_serious_help: "critical",
	delete_this_now: "critical",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Props = {
	params: Promise<{ id: string }>
}

export default async function RoastPage({ params }: Props) {
	const { id } = await params
	// Once DB is live: const submission = await db.query.submissions.findFirst(...)
	// For now always use mock data regardless of id param
	void id
	const submission = MOCK_SUBMISSION
	const verdictVariant = VERDICT_COLOR[submission.verdict] ?? "warning"

	return (
		<main className="mx-auto w-full max-w-[960px] px-10 py-20">
			{/* ── Result header ─────────────────────────────────────────────── */}
			<section className="flex flex-col items-center gap-8 pb-16">
				<ScoreRing score={submission.score} />

				<div className="flex flex-col items-center gap-3">
					<Badge variant={verdictVariant} label={VERDICT_LABEL[submission.verdict]} />
					<p className="max-w-[640px] text-center font-mono text-sm leading-relaxed text-text-secondary">
						{`"${submission.roastQuote}"`}
					</p>
				</div>

				{/* Meta info */}
				<div className="flex items-center gap-6">
					<span className="font-mono text-xs text-text-tertiary">
						{submission.lang} · {submission.lineCount} lines
					</span>
					<span className="font-mono text-xs text-text-tertiary">·</span>
					<span className="font-mono text-xs text-text-tertiary">
						mode:{" "}
						<span className="text-accent-amber">
							{submission.roastMode === "roast" ? "full roast" : "honest feedback"}
						</span>
					</span>
				</div>
			</section>

			{/* ── Original code ─────────────────────────────────────────────── */}
			<section className="flex flex-col gap-4 pb-12">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">{"// "}</span>
					<span className="font-mono text-sm font-bold text-text-primary">your_code</span>
				</div>
				<CodeBlockRoot>
					<CodeBlockHeader filename={`snippet.${submission.lang}`} />
					<CodeBlockBody code={submission.code} lang={submission.lang} />
				</CodeBlockRoot>
			</section>

			{/* ── Detailed analysis ─────────────────────────────────────────── */}
			<section className="flex flex-col gap-4 pb-12">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">{"// "}</span>
					<span className="font-mono text-sm font-bold text-text-primary">detailed_analysis</span>
				</div>
				<p className="font-mono text-[13px] text-text-tertiary">
					{"// here's what we found, in excruciating detail"}
				</p>
				<div className="grid grid-cols-2 gap-3">
					{submission.issues.map((issue) => (
						<CardRoot key={issue.id}>
							<CardBadge variant={issue.severity} />
							<CardTitle>{issue.title}</CardTitle>
							<CardDescription>{issue.description}</CardDescription>
						</CardRoot>
					))}
				</div>
			</section>

			{/* ── Suggested fix (diff) ──────────────────────────────────────── */}
			<section className="flex flex-col gap-4 pb-16">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">{"// "}</span>
					<span className="font-mono text-sm font-bold text-text-primary">suggested_fix</span>
				</div>
				<p className="font-mono text-[13px] text-text-tertiary">
					{"// what it should look like (you're welcome)"}
				</p>
				<div className="overflow-hidden border border-border-primary bg-bg-input">
					<div className="flex h-10 items-center border-b border-border-primary px-4">
						<div className="flex items-center gap-2">
							<span className="size-[10px] rounded-full bg-accent-red" />
							<span className="size-[10px] rounded-full bg-accent-amber" />
							<span className="size-[10px] rounded-full bg-accent-green" />
						</div>
					</div>
					<div className="flex flex-col">
						{submission.diffLines.map((line) => (
							<DiffLine key={line.id} variant={line.type} code={line.content} />
						))}
					</div>
				</div>
			</section>

			{/* ── Actions ───────────────────────────────────────────────────── */}
			<section className="flex items-center justify-between border-t border-border-primary pt-8">
				<a
					href="/"
					className="inline-flex cursor-pointer items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-border-focus hover:text-accent-green"
				>
					← roast_another
				</a>
				<a
					href="/leaderboard"
					className="inline-flex cursor-pointer items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-border-focus hover:text-accent-green"
				>
					shame_leaderboard &gt;&gt;
				</a>
			</section>
		</main>
	)
}
