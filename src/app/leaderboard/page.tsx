import type { Metadata } from "next"

import { CodeBlockBody } from "@/components/ui/code-block"
import {
	LeaderboardRowLang,
	LeaderboardRowRank,
	LeaderboardRowScore,
} from "@/components/ui/leaderboard-row"
import { leaderboardEntries, leaderboardStats } from "@/db/leaderboard"

export const metadata: Metadata = {
	title: "Shame Leaderboard | DevRoast",
	description: "The most roasted code on the internet.",
}

export default async function LeaderboardPage() {
	return (
		<main className="mx-auto w-full max-w-[960px] px-10 py-10">
			{/* Hero */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-3">
						<span className="font-mono text-3xl font-bold text-accent-green">&gt;</span>
						<h1 className="font-mono text-3xl font-bold text-text-primary">shame_leaderboard</h1>
					</div>

					<p className="font-mono text-sm text-text-secondary">
						{"// the most roasted code on the internet"}
					</p>

					<div className="flex items-center gap-2">
						<span className="font-mono text-xs text-text-tertiary">
							{leaderboardStats.totalSubmissions.toLocaleString("en-US")} submissions
						</span>
						<span className="font-mono text-xs text-text-tertiary">·</span>
						<span className="font-mono text-xs text-text-tertiary">
							avg score: {leaderboardStats.avgScore}/10
						</span>
					</div>
				</div>

				{/* Entries */}
				<div className="mt-6 flex flex-col gap-5">
					{leaderboardEntries.map((entry) => (
						<div
							key={entry.id}
							className="overflow-hidden border border-border-primary bg-bg-input"
						>
							{/* Meta row */}
							<div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
								<div className="flex items-center gap-4">
									<LeaderboardRowRank variant="highlight">
										<span className="text-text-tertiary">#</span>
										{entry.rank}
									</LeaderboardRowRank>
									<LeaderboardRowScore variant="critical">
										<span className="font-normal text-text-tertiary">score:</span>{" "}
										{entry.score.toFixed(1)}
									</LeaderboardRowScore>
								</div>
								<div className="flex items-center gap-3">
									<LeaderboardRowLang>{entry.lang}</LeaderboardRowLang>
									<span className="font-mono text-xs text-text-tertiary">{entry.lines} lines</span>
								</div>
							</div>

							{/* Code block */}
							<CodeBlockBody code={entry.code} lang={entry.lang} />
						</div>
					))}
				</div>
			</div>
		</main>
	)
}
