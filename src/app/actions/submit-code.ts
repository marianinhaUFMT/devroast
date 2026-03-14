"use server"

import { createGroq } from "@ai-sdk/groq"
import { generateText, Output } from "ai"

import { db } from "@/db"
import { submissionDiffLines, submissionIssues, submissions } from "@/db/schema"
import { buildPrompt, roastSchema } from "@/lib/gemini"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

const CODE_MAX_LENGTH = 10_000

export async function submitCode(
	code: string,
	language: string,
	roastMode: boolean
): Promise<{ id: string }> {
	// ── 1. Validate inputs ────────────────────────────────────────────────
	if (!code.trim()) {
		throw new Error("paste some code first")
	}
	if (code.length > CODE_MAX_LENGTH) {
		throw new Error(`code must be ${CODE_MAX_LENGTH.toLocaleString()} characters or fewer`)
	}
	if (!language.trim()) {
		throw new Error("select a language first")
	}

	// ── 2. Call Gemini ────────────────────────────────────────────────────
	const { output } = await generateText({
		model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
		output: Output.object({ schema: roastSchema }),
		prompt: buildPrompt(code, language, roastMode),
	})

	// ── 2a. Guard against unparseable response ────────────────────────────
	if (!output) {
		throw new Error("failed to generate roast — try again")
	}

	// ── 3. Insert all rows in a transaction ───────────────────────────────
	const trimmedCode = code.trimEnd()
	const result = await db.transaction(async (tx) => {
		const [submission] = await tx
			.insert(submissions)
			.values({
				code: trimmedCode,
				lang: language,
				lineCount: trimmedCode.split("\n").length,
				roastMode: roastMode ? "roast" : "honest",
				isPublic: true,
				verdict: output.verdict,
				score: String(output.score),
				roastQuote: output.roastQuote,
			})
			.returning({ id: submissions.id })

		await Promise.all([
			tx.insert(submissionIssues).values(
				output.issues.map((issue, i) => ({
					submissionId: submission.id,
					severity: issue.severity,
					title: issue.title,
					description: issue.description,
					order: i,
				}))
			),
			tx.insert(submissionDiffLines).values(
				output.diffLines.map((line) => ({
					submissionId: submission.id,
					type: line.type,
					content: line.content,
					lineNumber: line.lineNumber,
				}))
			),
		])

		return { id: submission.id }
	})

	// ── 4. Return UUID ────────────────────────────────────────────────────
	return result
}
