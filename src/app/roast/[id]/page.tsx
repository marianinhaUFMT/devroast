import { asc, eq } from "drizzle-orm"
import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { CardBadge, CardDescription, CardRoot, CardTitle } from "@/components/ui/card"
import { CodeBlockBody, CodeBlockRoot } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import { ScoreRing } from "@/components/ui/score-ring"
import { db } from "@/db"
import { VERDICT_COLOR, VERDICT_LABEL } from "@/db/roast"
import { submissionDiffLines, submissionIssues, submissions } from "@/db/schema"

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
		twitter: {
			card: "summary_large_image",
		},
	}
}

export default async function RoastPage({ params }: Props) {
	const { id } = await params
	await connection()

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
						<Link
							href={`/roast/${id}/share`}
							className="inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
						>
							$ share_roast
						</Link>
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
