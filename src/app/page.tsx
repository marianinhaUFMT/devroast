import { HomeStats } from "@/components/ui/home-stats"
import { HomePageClient } from "./home-page-client"

export default function Home() {
	return <HomePageClient statsSlot={<HomeStats />} />
}
