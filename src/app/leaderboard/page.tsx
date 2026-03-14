import type { Metadata } from "next"
import { Suspense } from "react"
import { LeaderboardPageContent, LeaderboardPageSkeleton } from "@/components/ui/leaderboard-page"

export const metadata: Metadata = {
	title: "Shame Leaderboard | DevRoast",
	description: "The most roasted code on the internet.",
}

export default function LeaderboardPage() {
	return (
		<main className="mx-auto w-full max-w-[960px] px-10 py-10">
			{/* Hero */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-3">
					<span className="font-mono text-3xl font-bold text-accent-green">&gt;</span>
					<h1 className="font-mono text-3xl font-bold text-text-primary">shame_leaderboard</h1>
				</div>

				<p className="font-mono text-sm text-text-secondary">
					{"// the most roasted code on the internet"}
				</p>

				<Suspense fallback={<LeaderboardPageSkeleton />}>
					<LeaderboardPageContent />
				</Suspense>
			</div>
		</main>
	)
}
