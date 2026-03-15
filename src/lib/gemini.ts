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
- score: number 0–10 (decimals allowed, e.g. 6.5). Use the FULL range — most real code falls between 3 and 8. Scoring rubric:
    0–1: completely broken, does not run, dangerous
    2–3: major structural problems, bad practices throughout
    4–5: works but has significant issues — unclear naming, poor structure, missing error handling
    6–7: decent code with some issues — minor smells, could be more idiomatic
    8–9: good code, minor nits only
    10: flawless, nothing to improve
  Avoid defaulting to 0, 2, or 10. Use decimal precision to reflect nuance.
- verdict: pick based on score:
    0–2 → "delete_this_now"
    3–4 → "needs_serious_help"
    5–6 → "needs_work"
    7–8 → "could_be_worse"
    9–10 → "clean_code"
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
