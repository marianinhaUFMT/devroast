import { avg, count, eq } from "drizzle-orm"
import { db } from "@/db"
import { submissions } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "../init"

export const leaderboardRouter = createTRPCRouter({
	stats: baseProcedure.query(async () => {
		const [result] = await db
			.select({
				total: count(),
				avgScore: avg(submissions.score),
			})
			.from(submissions)
			.where(eq(submissions.isPublic, true))

		return {
			total: result?.total ?? 0,
			avgScore: result?.avgScore ? Number(result.avgScore) : 0,
		}
	}),
})
