"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	LeaderboardRowCode,
	LeaderboardRowLang,
	LeaderboardRowRank,
	LeaderboardRowRoot,
	LeaderboardRowScore,
} from "@/components/ui/leaderboard-row"
import { Toggle } from "@/components/ui/toggle"

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const LEADERBOARD_ROWS: Array<{
	rank: number
	score: string
	codePreview: string
	lang: string
}> = [
	{
		rank: 1,
		score: "1.2",
		codePreview: 'eval(prompt("enter code"))',
		lang: "javascript",
	},
	{
		rank: 2,
		score: "1.8",
		codePreview: "if (x == true) { return true; }",
		lang: "typescript",
	},
	{
		rank: 3,
		score: "2.1",
		codePreview: "SELECT * FROM users WHERE 1=1",
		lang: "sql",
	},
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
	const [code, setCode] = useState("")
	const isEmpty = code.trim().length === 0

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
					<div className="flex h-10 w-full items-center border-b border-border-primary px-4">
						<div className="flex items-center gap-2">
							<span className="size-3 rounded-full bg-accent-red" />
							<span className="size-3 rounded-full bg-accent-amber" />
							<span className="size-3 rounded-full bg-accent-green" />
						</div>
					</div>

					{/* Textarea */}
					<textarea
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="// paste your code here"
						spellCheck={false}
						className={[
							"h-[320px] w-full resize-none bg-transparent p-4",
							"font-mono text-[12px] leading-6 text-text-primary",
							"placeholder:text-text-tertiary",
							"focus:outline-none",
						].join(" ")}
					/>
				</div>

				{/* Actions bar */}
				<div className="flex w-[780px] items-center justify-between">
					<div className="flex items-center gap-4">
						<Toggle defaultChecked />
						<span className="font-mono text-xs text-text-tertiary">
							{"// maximum sarcasm enabled"}
						</span>
					</div>
					<Button variant="primary" size="md" disabled={isEmpty}>
						$ roast_my_code
					</Button>
				</div>

				{/* Footer stats */}
				<div className="flex items-center gap-6 pt-2">
					<span className="font-mono text-xs text-text-tertiary">2,847 codes roasted</span>
					<span className="font-mono text-xs text-text-tertiary">·</span>
					<span className="font-mono text-xs text-text-tertiary">avg score: 4.2/10</span>
				</div>
			</section>

			{/* Divider spacer */}
			<div className="py-12" />

			{/* ── Leaderboard preview ───────────────────────────────────────── */}
			<section className="flex flex-col gap-6">
				{/* Section header */}
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

				{/* Section subtitle */}
				<p className="font-mono text-[13px] text-text-tertiary">
					{"// the worst code on the internet, ranked by shame"}
				</p>

				{/* Table */}
				<div className="border border-border-primary">
					{/* Table header */}
					<div className="flex h-10 items-center border-b border-border-primary bg-bg-surface px-5">
						<div className="w-[50px] shrink-0">
							<span className="font-mono text-xs font-medium text-text-tertiary">#</span>
						</div>
						<div className="w-[70px] shrink-0">
							<span className="font-mono text-xs font-medium text-text-tertiary">score</span>
						</div>
						<div className="flex-1">
							<span className="font-mono text-xs font-medium text-text-tertiary">code</span>
						</div>
						<div className="w-[100px] shrink-0">
							<span className="font-mono text-xs font-medium text-text-tertiary">lang</span>
						</div>
					</div>

					{/* Rows */}
					{LEADERBOARD_ROWS.map((row) => (
						<LeaderboardRowRoot key={row.rank}>
							<LeaderboardRowRank>{row.rank}</LeaderboardRowRank>
							<LeaderboardRowScore variant="critical">{row.score}</LeaderboardRowScore>
							<LeaderboardRowCode>
								<span className="font-mono text-xs text-text-primary">{row.codePreview}</span>
							</LeaderboardRowCode>
							<LeaderboardRowLang>{row.lang}</LeaderboardRowLang>
						</LeaderboardRowRoot>
					))}
				</div>

				{/* Fade hint */}
				<p className="text-center font-mono text-xs text-text-tertiary">
					showing top 3 of 2,847 ·{" "}
					<a href="/leaderboard" className="transition-colors hover:text-text-primary">
						view full leaderboard &gt;&gt;
					</a>
				</p>
			</section>
		</main>
	)
}
