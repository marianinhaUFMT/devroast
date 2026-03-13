export type IssueSeverity = "critical" | "warning" | "good"
export type Verdict =
	| "clean_code"
	| "could_be_worse"
	| "needs_work"
	| "needs_serious_help"
	| "delete_this_now"

export type RoastIssue = {
	id: string
	severity: IssueSeverity
	title: string
	description: string
}

export type DiffLine = {
	id: string
	type: "removed" | "added" | "context"
	content: string
}

export type RoastResult = {
	id: string
	score: number
	verdict: Verdict
	lang: string
	lineCount: number
	roastQuote: string
	issues: RoastIssue[]
	diffLines: DiffLine[]
	code: string
}

export const STATIC_ROAST: RoastResult = {
	id: "00000000-0000-0000-0000-000000000001",
	score: 3.5,
	verdict: "needs_serious_help",
	lang: "javascript",
	lineCount: 16,
	roastQuote: '"this code looks like it was written during a power outage... in 2005."',
	issues: [
		{
			id: "issue-1",
			severity: "critical",
			title: "using var instead of const/let",
			description:
				"var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
		},
		{
			id: "issue-2",
			severity: "warning",
			title: "imperative loop pattern",
			description:
				"for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
		},
		{
			id: "issue-3",
			severity: "good",
			title: "clear naming conventions",
			description:
				"calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
		},
		{
			id: "issue-4",
			severity: "good",
			title: "single responsibility",
			description:
				"the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.",
		},
	],
	diffLines: [
		{ id: "d1", type: "context", content: "function calculateTotal(items) {" },
		{ id: "d2", type: "removed", content: "  var total = 0;" },
		{ id: "d3", type: "removed", content: "  for (var i = 0; i < items.length; i++) {" },
		{ id: "d4", type: "removed", content: "    total = total + items[i].price;" },
		{ id: "d5", type: "removed", content: "  }" },
		{ id: "d6", type: "removed", content: "  return total;" },
		{
			id: "d7",
			type: "added",
			content: "  return items.reduce((sum, item) => sum + item.price, 0);",
		},
		{ id: "d8", type: "context", content: "}" },
	],
	code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`,
}

export const VERDICT_LABEL: Record<Verdict, string> = {
	clean_code: "clean_code",
	could_be_worse: "could_be_worse",
	needs_work: "needs_work",
	needs_serious_help: "needs_serious_help",
	delete_this_now: "delete_this_now",
}

export const VERDICT_COLOR: Record<Verdict, "critical" | "warning" | "good"> = {
	clean_code: "good",
	could_be_worse: "good",
	needs_work: "warning",
	needs_serious_help: "critical",
	delete_this_now: "critical",
}
