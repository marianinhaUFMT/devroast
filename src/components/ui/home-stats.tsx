"use client"

import NumberFlow from "@number-flow/react"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function HomeStats() {
	const trpc = useTRPC()
	const { data } = useQuery(trpc.leaderboard.stats.queryOptions())

	return (
		<div className="flex items-center gap-6 pt-2">
			<span className="font-mono text-xs text-text-tertiary">
				<NumberFlow
					value={data?.total ?? 0}
					format={{ useGrouping: true }}
					className="tabular-nums"
				/>{" "}
				codes roasted
			</span>
			<span className="font-mono text-xs text-text-tertiary">·</span>
			<span className="font-mono text-xs text-text-tertiary">
				avg score:{" "}
				<NumberFlow
					value={data?.avgScore ?? 0}
					format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
					className="tabular-nums"
				/>
				/10
			</span>
		</div>
	)
}
