import type { BundledLanguage, BundledTheme, HighlighterGeneric } from "shiki/bundle/web"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WebHighlighter = HighlighterGeneric<BundledLanguage, BundledTheme>

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let highlighterPromise: Promise<WebHighlighter> | null = null

function getHighlighter(): Promise<WebHighlighter> {
	if (!highlighterPromise) {
		highlighterPromise = import("shiki/bundle/web").then(({ getSingletonHighlighter }) =>
			getSingletonHighlighter({
				themes: ["vesper"],
				langs: [],
			})
		)
	}
	return highlighterPromise
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const loadedLangs = new Set<string>()

async function ensureLangLoaded(highlighter: WebHighlighter, lang: string): Promise<void> {
	if (loadedLangs.has(lang)) return
	try {
		await highlighter.loadLanguage(lang as BundledLanguage)
		loadedLangs.add(lang)
	} catch {
		// Unknown language — fall back silently to plaintext
	}
}

export async function highlight(code: string, lang: string): Promise<string> {
	const hl = await getHighlighter()
	await ensureLangLoaded(hl, lang)
	const safeLang = loadedLangs.has(lang) ? lang : "plaintext"
	return hl.codeToHtml(code, { lang: safeLang as BundledLanguage, theme: "vesper" })
}
