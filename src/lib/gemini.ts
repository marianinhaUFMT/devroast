import { z } from "zod"

// ---------------------------------------------------------------------------
// Output schema — shape Gemini must return
// z.union and z.record are NOT supported by the Gemini provider — avoid them
// ---------------------------------------------------------------------------

export const roastSchema = z.object({
	score: z.number().min(0).max(10),
	verdict: z.enum([
		"clean_code",
		"could_be_worse",
		"needs_work",
		"needs_serious_help",
		"delete_this_now",
	]),
	roastQuote: z.string().min(10).max(200),
	issues: z
		.array(
			z.object({
				severity: z.enum(["critical", "warning", "good"]),
				title: z.string(),
				description: z.string(),
			})
		)
		.min(2)
		.max(5),
	diffLines: z
		.array(
			z.object({
				type: z.enum(["removed", "added", "context"]),
				content: z.string(),
				lineNumber: z.number().int().min(1),
			})
		)
		.min(1)
		.max(20),
})

export type RoastOutput = z.infer<typeof roastSchema>

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildPrompt(code: string, language: string, roastMode: boolean): string {
	const sharedInstructions = `
Language: ${language}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Respond with a JSON object matching this exact shape:
- score: number 0–10 (decimals like 3.5 or 7.0 are encouraged). Score as a strict senior engineer would — most production code scores 5–7, only truly clean code reaches 8+, and only genuinely broken or dangerous code scores below 3. Do NOT default to 4 or 5 just to be safe. If the code is good, score it high. If it's bad, score it low.
- verdict: your honest assessment of the overall code quality, independent of the score:
    "clean_code" — well-structured, idiomatic, easy to maintain
    "could_be_worse" — functional with some rough edges
    "needs_work" — works but has clear problems worth fixing
    "needs_serious_help" — multiple significant issues, risky to ship
    "delete_this_now" — fundamentally broken, dangerous, or unsalvageable
- roastQuote: string (see persona instructions below)
- issues: array of 2–5 objects, each with:
    - severity: "critical" | "warning" | "good"
    - title: short label
    - description: 1–2 sentence explanation
- diffLines: array of at least 1 object showing the most important improvement as a unified diff, each with:
    - type: "removed" | "added" | "context"
    - content: the line content (no leading +/- characters)
    - lineNumber: 1-based line number in the original file (use the last context/removed line number for added lines)

Return ONLY the JSON object. No markdown fences, no explanation.`

	if (roastMode) {
		return `You are a brutally sarcastic senior software engineer reviewing code.
Your job is to roast this code mercilessly — but every criticism must point to a real, specific issue.
The roastQuote must be a short, cutting one-liner (in quotes) that captures the overall quality.
${sharedInstructions}`
	}

	return `You are a constructive, direct code reviewer.
Give honest, specific feedback without sarcasm or cruelty.
The roastQuote is a single neutral sentence summarizing the overall code quality.
${sharedInstructions}`
}
