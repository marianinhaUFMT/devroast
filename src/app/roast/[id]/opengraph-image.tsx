import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "@takumi-rs/image-response"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { db } from "@/db"
import { submissions } from "@/db/schema"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = false

// Verdict → hex color (matches VERDICT_COLOR semantic: good=green, warning=amber, critical=red)
// Defined inline to avoid importing VERDICT_COLOR which uses non-hex semantic strings
const VERDICT_HEX: Record<string, string> = {
	clean_code: "#10B981",
	could_be_worse: "#10B981",
	needs_work: "#F59E0B",
	needs_serious_help: "#EF4444",
	delete_this_now: "#EF4444",
}

// Load font binaries (runs at request time in Node.js runtime)
function loadFonts() {
	const fontsDir = join(process.cwd(), "public", "fonts")
	return [
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-Regular.ttf")).buffer,
			weight: 400 as const,
			style: "normal" as const,
		},
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-Medium.ttf")).buffer,
			weight: 500 as const,
			style: "normal" as const,
		},
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-Bold.ttf")).buffer,
			weight: 700 as const,
			style: "normal" as const,
		},
		{
			name: "JetBrains Mono",
			data: readFileSync(join(fontsDir, "JetBrainsMono-ExtraBold.ttf")).buffer,
			weight: 800 as const,
			style: "normal" as const,
		},
		{
			name: "IBM Plex Mono",
			data: readFileSync(join(fontsDir, "IBMPlexMono-Regular.ttf")).buffer,
			weight: 400 as const,
			style: "normal" as const,
		},
	]
}

type Props = {
	params: Promise<{ id: string }>
}

export default async function OgImage({ params }: Props) {
	const { id } = await params

	const roast = await db.query.submissions.findFirst({
		where: eq(submissions.id, id),
		columns: {
			score: true,
			verdict: true,
			roastQuote: true,
			lang: true,
			lineCount: true,
		},
	})

	if (!roast) notFound()

	const score = Number(roast.score).toFixed(1)
	const verdictColor = VERDICT_HEX[roast.verdict] ?? "#FAFAFA"

	// Lang info line — omit if both are null
	const langInfo =
		roast.lang && roast.lineCount != null
			? `lang: ${roast.lang} · ${roast.lineCount} lines`
			: roast.lineCount != null
				? `${roast.lineCount} lines`
				: null

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				background: "#0A0A0A",
				padding: "64px",
				gap: "28px",
				fontFamily: "JetBrains Mono",
			}}
		>
			{/* logoRow */}
			<div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
				<span style={{ color: "#10B981", fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>
					{">"}
				</span>
				<span style={{ color: "#FAFAFA", fontSize: "20px", fontWeight: 500, lineHeight: 1 }}>
					devroast
				</span>
			</div>

			{/* scoreRow */}
			<div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "4px" }}>
				<span style={{ color: "#F59E0B", fontSize: "160px", fontWeight: 800, lineHeight: 1 }}>
					{score}
				</span>
				<span style={{ color: "#4B5563", fontSize: "56px", fontWeight: 400, lineHeight: 1 }}>
					/10
				</span>
			</div>

			{/* verdictRow */}
			<div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
				<div
					style={{
						width: "12px",
						height: "12px",
						borderRadius: "50%",
						background: verdictColor,
					}}
				/>
				<span style={{ color: verdictColor, fontSize: "20px", fontWeight: 400 }}>
					{roast.verdict}
				</span>
			</div>

			{/* langInfo — conditional */}
			{langInfo != null && (
				<span
					style={{
						color: "#4B5563",
						fontSize: "16px",
						fontWeight: 400,
						fontFamily: "JetBrains Mono",
						textAlign: "center",
					}}
				>
					{langInfo}
				</span>
			)}

			{/* roastQuote */}
			<span
				style={{
					color: "#FAFAFA",
					fontSize: "22px",
					fontWeight: 400,
					fontFamily: "IBM Plex Mono",
					textAlign: "center",
					lineHeight: 1.5,
					maxWidth: "100%",
				}}
			>
				{`"${roast.roastQuote}"`}
			</span>
		</div>,
		{
			...size,
			fonts: loadFonts(),
		}
	)
}
