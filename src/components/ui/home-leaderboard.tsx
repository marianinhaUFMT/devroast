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
// HomeLeaderboard — async Server Component
// ---------------------------------------------------------------------------

export async function HomeLeaderboard() {
	"use cache"
	cacheLife("hours")
	const { rows, total } = await caller.leaderboard.list()

	return (
		<section className="flex flex-col gap-6">
			<LeaderboardSectionHeader />

			<p className="font-mono text-[13px] text-text-tertiary">
				{"// the worst code on the internet, ranked by shame"}
			</p>

			<div className="flex flex-col gap-5">
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

			<p className="text-center font-mono text-xs text-text-tertiary">
				showing top 3 of {total.toLocaleString("en-US")} ·{" "}
				<a href="/leaderboard" className="transition-colors hover:text-text-primary">
					view full leaderboard &gt;&gt;
				</a>
			</p>
		</section>
	)
}

// ---------------------------------------------------------------------------
// HomeLeaderboardSkeleton — Suspense fallback
// ---------------------------------------------------------------------------

export function HomeLeaderboardSkeleton() {
	return (
		<section className="flex flex-col gap-6">
			<LeaderboardSectionHeader />

			<p className="font-mono text-[13px] text-text-tertiary">
				{"// the worst code on the internet, ranked by shame"}
			</p>

			<div className="flex flex-col gap-5">
				{[1, 2, 3].map((i) => (
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
					</div>
				))}
			</div>

			<p className="text-center font-mono text-xs text-text-tertiary">
				showing top 3 ·{" "}
				<a href="/leaderboard" className="transition-colors hover:text-text-primary">
					view full leaderboard &gt;&gt;
				</a>
			</p>
		</section>
	)
}

// ---------------------------------------------------------------------------
// Shared sub-pieces
// ---------------------------------------------------------------------------

function LeaderboardSectionHeader() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<span className="font-mono text-sm font-bold text-accent-green">{"// "}</span>
				<span className="font-mono text-sm font-bold text-text-primary">shame_leaderboard</span>
			</div>
			<a
				href="/leaderboard"
				className="inline-flex cursor-pointer items-center gap-2 border border-border-primary px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-border-focus hover:text-accent-green"
			>
				$ view_all &gt;&gt;
			</a>
		</div>
	)
}
