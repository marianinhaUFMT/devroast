import { eq } from "drizzle-orm"
import type { Metadata, ResolvingMetadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { db } from "@/db"
import { VERDICT_LABEL } from "@/db/roast"
import { submissions } from "@/db/schema"

type Props = {
	params: Promise<{ id: string }>
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://devroast.com"

export async function generateMetadata(
	{ params }: Props,
	_parent: ResolvingMetadata
): Promise<Metadata> {
	const { id } = await params
	await connection()

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		columns: { roastQuote: true },
	})

	return {
		title: "Share Your Roast | DevRoast",
		description: roast?.roastQuote ?? "Share your roast results.",
		openGraph: {
			images: [`${baseUrl}/roast/${id}/opengraph-image`],
		},
		twitter: {
			card: "summary_large_image",
			images: [`${baseUrl}/roast/${id}/opengraph-image`],
		},
	}
}

export default async function SharePage({ params }: Props) {
	const { id } = await params
	await connection()

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		columns: { score: true, verdict: true },
	})

	if (!roast) notFound()

	const score = Number(roast.score).toFixed(1)
	const verdictLabel = VERDICT_LABEL[roast.verdict]

	const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${baseUrl}/roast/${id}/share`)}&text=${encodeURIComponent(`I got ${score}/10 on DevRoast — ${verdictLabel}`)}`

	return (
		<main className="mx-auto w-full max-w-[960px] px-20 py-10">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<section className="flex flex-col gap-4 pb-10">
				<div className="flex items-center gap-3">
					<span className="font-mono text-3xl font-bold text-accent-green">&gt;</span>
					<h1 className="font-mono text-3xl font-bold text-text-primary">share_roast</h1>
				</div>
				<p className="font-mono text-sm text-text-secondary">{"// share your roast results"}</p>
			</section>

			{/* ── OG Image Preview ────────────────────────────────────────────── */}
			<section className="flex flex-col gap-6">
				<Image
					src={`/roast/${id}/opengraph-image`}
					alt="Roast result preview"
					width={1200}
					height={630}
					className="w-full border border-border-primary"
				/>

				{/* Twitter share button */}
				<div>
					<a
						href={twitterUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
					>
						$ share_on_twitter
					</a>
				</div>
			</section>
		</main>
	)
}
