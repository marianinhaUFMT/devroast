// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DetectionResult = {
	language: string
	confidence: "high" | "medium" | "low"
}

// ---------------------------------------------------------------------------
// Heuristics
// ---------------------------------------------------------------------------

const MIN_CHARS = 10

/**
 * Detects the programming language of a code snippet using lightweight
 * regex heuristics. No external dependencies.
 *
 * Returns the Shiki-compatible language ID and a confidence level.
 * When the snippet is too short or no pattern matches, falls back to
 * "javascript" with "low" confidence (never returns "plaintext").
 */
export function detectLanguage(code: string): DetectionResult {
	const trimmed = code.trim()

	if (trimmed.length < MIN_CHARS) {
		return { language: "plaintext", confidence: "low" }
	}

	// JSON — starts with { or [ and parses as valid JSON
	if (/^[[{]/.test(trimmed)) {
		try {
			JSON.parse(trimmed)
			return { language: "json", confidence: "high" }
		} catch {
			// Not valid JSON, but might still be JSON-like
			if (/^\s*\{[\s\S]*"[\w]+"\s*:/.test(trimmed)) {
				return { language: "json", confidence: "medium" }
			}
		}
	}

	// HTML — starts with HTML tags or doctype
	if (/^<!DOCTYPE\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
		return { language: "html", confidence: "high" }
	}
	if (/^<[a-zA-Z][a-zA-Z0-9]*[\s/>]/.test(trimmed) && /<\/[a-zA-Z]/.test(trimmed)) {
		return { language: "html", confidence: "medium" }
	}

	// SQL — SELECT/INSERT/UPDATE/DELETE/CREATE keywords
	if (
		/^\s*(SELECT|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|CREATE\s+(TABLE|DATABASE|INDEX)|DROP\s+(TABLE|DATABASE)|ALTER\s+TABLE|WITH\s+\w)/i.test(
			trimmed
		)
	) {
		return { language: "sql", confidence: "high" }
	}
	if (/\b(SELECT|FROM|WHERE|JOIN|GROUP\s+BY|ORDER\s+BY|HAVING)\b/i.test(trimmed)) {
		return { language: "sql", confidence: "medium" }
	}

	// YAML — key: value pattern with consistent indentation (no braces)
	if (
		!/[{}[\]]/.test(trimmed) &&
		/^[\w-]+:\s+\S/.test(trimmed) &&
		trimmed.split("\n").filter((l) => /^\s*[\w-]+:\s/.test(l)).length >= 2
	) {
		return { language: "yaml", confidence: "medium" }
	}

	// CSS / SCSS
	if (/\$[\w-]+\s*:/.test(trimmed) || /@mixin\s|@include\s|@extend\s/.test(trimmed)) {
		return { language: "scss", confidence: "high" }
	}
	if (
		/[.#][\w-]+\s*\{/.test(trimmed) ||
		/\b(body|html|div|span|p|a|h[1-6])\s*\{/.test(trimmed) ||
		/@media\s|@keyframes\s|@import\s+['"]/.test(trimmed)
	) {
		return { language: "css", confidence: "high" }
	}

	// Python
	if (
		/\bdef\s+\w+\s*\(/.test(trimmed) ||
		/\bclass\s+\w+[\s:(]/.test(trimmed) ||
		/\bif\s+__name__\s*==/.test(trimmed) ||
		(/\bimport\s+\w/.test(trimmed) && /\bprint\s*\(/.test(trimmed))
	) {
		return { language: "python", confidence: "high" }
	}
	if (/\bdef\s+\w+|print\s*\(|elif\s+|lambda\s+\w+:/.test(trimmed)) {
		return { language: "python", confidence: "medium" }
	}

	// Rust
	if (
		/\bfn\s+\w+\s*(<[^>]*>)?\s*\(/.test(trimmed) &&
		(/\blet\s+mut\s+/.test(trimmed) || /\bimpl\s+/.test(trimmed) || /\buse\s+\w+::/.test(trimmed))
	) {
		return { language: "rust", confidence: "high" }
	}
	if (/\bfn\s+\w+|\blet\s+mut\s+|\bimpl\s+\w+|\buse\s+\w+::/.test(trimmed)) {
		return { language: "rust", confidence: "medium" }
	}

	// Go
	if (
		/\bpackage\s+\w+/.test(trimmed) &&
		(/\bfunc\s+\w+\s*\(/.test(trimmed) || /\bimport\s+\(/.test(trimmed))
	) {
		return { language: "go", confidence: "high" }
	}
	if (/\bfunc\s+\w+\s*\(|\s+:=\s+/.test(trimmed) && !/=>/.test(trimmed)) {
		return { language: "go", confidence: "medium" }
	}

	// Java / Kotlin
	if (/\bpublic\s+(static\s+)?class\s+\w+|\bSystem\.out\.print/.test(trimmed)) {
		return { language: "java", confidence: "high" }
	}
	if (
		/\bfun\s+\w+\s*\(/.test(trimmed) &&
		(/\bval\s+\w+\s*=|\bvar\s+\w+\s*:/.test(trimmed) || /\bdata\s+class\s+/.test(trimmed))
	) {
		return { language: "kotlin", confidence: "high" }
	}

	// Bash / Shell
	if (
		/^#!\/bin\/(bash|sh|zsh)/.test(trimmed) ||
		(/\$[A-Z_]+/.test(trimmed) && /\becho\s+/.test(trimmed))
	) {
		return { language: "bash", confidence: "high" }
	}
	if (/\becho\s+["']|\bexport\s+\w+=|\bsource\s+|^\s*\$\s+/.test(trimmed)) {
		return { language: "bash", confidence: "medium" }
	}

	// Dockerfile
	if (
		/^FROM\s+\S+/m.test(trimmed) &&
		/\b(RUN|CMD|EXPOSE|ENV|COPY|ADD|WORKDIR|ENTRYPOINT)\b/.test(trimmed)
	) {
		return { language: "dockerfile", confidence: "high" }
	}

	// TypeScript — import + type annotations OR TypeScript-specific syntax
	if (
		(/\bimport\s+.*\s+from\s+['"]/.test(trimmed) || /\brequire\s*\(/.test(trimmed)) &&
		(/:\s*(string|number|boolean|void|never|unknown|any)\b/.test(trimmed) ||
			/\binterface\s+\w+\s*\{/.test(trimmed) ||
			/\btype\s+\w+\s*=/.test(trimmed) ||
			/<[A-Z]\w*>/.test(trimmed))
	) {
		return { language: "typescript", confidence: "high" }
	}
	if (/\binterface\s+\w+\s*\{|\btype\s+\w+\s*=|\bconst\s+\w+:\s+\w+\s*=/.test(trimmed)) {
		return { language: "typescript", confidence: "medium" }
	}

	// JavaScript — import/export/require, arrow functions, common patterns
	if (
		/\bimport\s+.*\s+from\s+['"]/.test(trimmed) ||
		/\bexport\s+(default\s+|const\s+|function\s+|class\s+)/.test(trimmed) ||
		/\brequire\s*\(['"]/.test(trimmed)
	) {
		return { language: "javascript", confidence: "high" }
	}
	if (/=>/.test(trimmed) || /\bconst\s+\w+\s*=|\blet\s+\w+\s*=|\bvar\s+\w+\s*=/.test(trimmed)) {
		return { language: "javascript", confidence: "medium" }
	}

	// Default: best guess at javascript with low confidence
	return { language: "javascript", confidence: "low" }
}
