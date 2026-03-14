"use server"

import { google } from "@ai-sdk/google"
import { generateText, Output } from "ai"

import { db } from "@/db"
import { submissionDiffLines, submissionIssues, submissions } from "@/db/schema"
import { buildPrompt, roastSchema } from "@/lib/gemini"

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
		model: google("gemini-2.0-flash"),
		output: Output.object({ schema: roastSchema }),
		prompt: buildPrompt(code, language, roastMode),
	})

	// ── 3a. Insert submission (parent) ────────────────────────────────────
	const [submission] = await db
		.insert(submissions)
		.values({
			code,
			lang: language,
			lineCount: code.split("\n").length,
			roastMode: roastMode ? "roast" : "honest",
			isPublic: true,
			verdict: output.verdict,
			score: String(output.score),
			roastQuote: output.roastQuote,
		})
		.returning({ id: submissions.id })

	// ── 3b. Insert children in parallel ──────────────────────────────────
	await Promise.all([
		db.insert(submissionIssues).values(
			output.issues.map((issue, i) => ({
				submissionId: submission.id,
				severity: issue.severity,
				title: issue.title,
				description: issue.description,
				order: i,
			}))
		),
		db.insert(submissionDiffLines).values(
			output.diffLines.map((line) => ({
				submissionId: submission.id,
				type: line.type,
				content: line.content,
				lineNumber: line.lineNumber,
			}))
		),
	])

	// ── 4. Return UUID ────────────────────────────────────────────────────
	return { id: submission.id }
}
