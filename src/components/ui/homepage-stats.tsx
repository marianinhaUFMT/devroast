import { avg, count, eq } from "drizzle-orm"

import { db } from "@/db"
import { submissions } from "@/db/schema"

export async function HomepageStats() {
	const [stats] = await db
		.select({
			total: count(),
			avgScore: avg(submissions.score),
		})
		.from(submissions)
		.where(eq(submissions.isPublic, true))

	const total = stats?.total ?? 0
	const avgScore = stats?.avgScore ? Number(stats.avgScore).toFixed(1) : "—"

	return (
		<div className="flex items-center gap-6 pt-2">
			<span className="font-mono text-xs text-text-tertiary">
				{total.toLocaleString("en-US")} codes roasted
			</span>
			<span className="font-mono text-xs text-text-tertiary">·</span>
			<span className="font-mono text-xs text-text-tertiary">avg score: {avgScore}/10</span>
		</div>
	)
}
