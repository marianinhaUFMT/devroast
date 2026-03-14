import { asc, avg, count, eq } from "drizzle-orm"
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

	list: baseProcedure.query(async () => {
		const [rows, [stats]] = await Promise.all([
			db
				.select({
					id: submissions.id,
					score: submissions.score,
					lang: submissions.lang,
					code: submissions.code,
				})
				.from(submissions)
				.where(eq(submissions.isPublic, true))
				.orderBy(asc(submissions.score))
				.limit(3),
			db.select({ total: count() }).from(submissions).where(eq(submissions.isPublic, true)),
		])

		return {
			rows: rows.map((row, i) => ({ ...row, rank: i + 1 })),
			total: stats?.total ?? 0,
		}
	}),

	fullList: baseProcedure.query(async () => {
		const [rows, [stats]] = await Promise.all([
			db
				.select({
					id: submissions.id,
					score: submissions.score,
					lang: submissions.lang,
					code: submissions.code,
				})
				.from(submissions)
				.where(eq(submissions.isPublic, true))
				.orderBy(asc(submissions.score))
				.limit(20),
			db
				.select({ total: count(), avgScore: avg(submissions.score) })
				.from(submissions)
				.where(eq(submissions.isPublic, true)),
		])

		return {
			rows: rows.map((row, i) => ({ ...row, rank: i + 1 })),
			total: stats?.total ?? 0,
			avgScore: stats?.avgScore ? Number(stats.avgScore) : 0,
		}
	}),
})
