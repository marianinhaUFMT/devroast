import { Suspense } from "react"
import { HomeLeaderboard, HomeLeaderboardSkeleton } from "@/components/ui/home-leaderboard"
import { HomeStats } from "@/components/ui/home-stats"
import { HomePageClient } from "./home-page-client"

export default function Home() {
	return (
		<HomePageClient
			statsSlot={<HomeStats />}
			leaderboardSlot={
				<Suspense fallback={<HomeLeaderboardSkeleton />}>
					<HomeLeaderboard />
				</Suspense>
			}
		/>
	)
}
