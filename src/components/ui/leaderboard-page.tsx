import { cacheLife } from "next/cache"
import { caller } from "@/trpc/server"
import { CodeBlockBody } from "./code-block"
import { CollapsibleCode } from "./collapsible-code"
import { LeaderboardRowLang, LeaderboardRowRank, LeaderboardRowScore } from "./leaderboard-row"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreVariant(score: string): "critical" | "warning" | "good" {
	const n = Number(score)
	if (n <= 3.5) return "critical"
	if (n <= 6.5) return "warning"
	return "good"
}

// ---------------------------------------------------------------------------
// LeaderboardPageContent — async Server Component
// ---------------------------------------------------------------------------

export async function LeaderboardPageContent() {
	"use cache"
	cacheLife("hours")
	const { rows, total, avgScore } = await caller.leaderboard.fullList()

	return (
		<>
			{/* Stats */}
			<div className="flex items-center gap-2">
				<span className="font-mono text-xs text-text-tertiary">
					{total.toLocaleString("en-US")} submissions
				</span>
				<span className="font-mono text-xs text-text-tertiary">·</span>
				<span className="font-mono text-xs text-text-tertiary">
					avg score: {avgScore.toFixed(1)}/10
				</span>
			</div>

			{/* Entries */}
			<div className="mt-6 flex flex-col gap-5">
				{rows.map((row) => (
					<div key={row.id} className="overflow-hidden border border-border-primary bg-bg-input">
						{/* Meta row */}
						<div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
							<div className="flex items-center gap-4">
								<LeaderboardRowRank variant="highlight">
									<span className="font-normal text-text-tertiary">#</span>
									{row.rank}
								</LeaderboardRowRank>
								<LeaderboardRowScore variant={scoreVariant(row.score)}>
									<span className="font-normal text-text-tertiary">score:</span>{" "}
									{Number(row.score).toFixed(1)}
								</LeaderboardRowScore>
							</div>
							<LeaderboardRowLang>{row.lang ?? "—"}</LeaderboardRowLang>
						</div>

						{/* Collapsible code block */}
						<CollapsibleCode
							codeSlot={<CodeBlockBody code={row.code} lang={row.lang ?? "text"} />}
						/>
					</div>
				))}
			</div>
		</>
	)
}

// ---------------------------------------------------------------------------
// LeaderboardPageSkeleton — Suspense fallback
// ---------------------------------------------------------------------------

export function LeaderboardPageSkeleton() {
	return (
		<>
			{/* Stats skeleton */}
			<div className="flex items-center gap-2">
				<span className="inline-block h-3 w-28 animate-pulse rounded-sm bg-text-tertiary/20" />
				<span className="font-mono text-xs text-text-tertiary">·</span>
				<span className="inline-block h-3 w-24 animate-pulse rounded-sm bg-text-tertiary/20" />
			</div>

			{/* Entries skeleton */}
			<div className="mt-6 flex flex-col gap-5">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="overflow-hidden border border-border-primary bg-bg-input">
						{/* Meta row skeleton */}
						<div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
							<div className="flex items-center gap-4">
								<span className="inline-block h-3 w-6 animate-pulse rounded-sm bg-text-tertiary/20" />
								<span className="inline-block h-3 w-16 animate-pulse rounded-sm bg-text-tertiary/20" />
							</div>
							<span className="inline-block h-3 w-14 animate-pulse rounded-sm bg-text-tertiary/20" />
						</div>

						{/* Code block skeleton */}
						<div className="flex h-[120px] flex-col gap-2 p-3">
							{[80, 60, 72, 48].map((w) => (
								<span
									key={w}
									style={{ width: `${w}%` }}
									className="inline-block h-3 animate-pulse rounded-sm bg-text-tertiary/20"
								/>
							))}
						</div>

						{/* Trigger skeleton */}
						<div className="flex h-9 items-center justify-center border-t border-border-primary">
							<span className="inline-block h-3 w-24 animate-pulse rounded-sm bg-text-tertiary/20" />
						</div>
					</div>
				))}
			</div>
		</>
	)
}
