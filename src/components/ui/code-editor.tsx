"use client"

import { useEffect, useRef, useState } from "react"
import { detectLanguage } from "@/lib/language-detector"
import { highlight } from "@/lib/shiki-client"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CodeEditorProps = {
	value: string
	onChange: (code: string) => void
	activeLang: string
	onDetect: (lang: string) => void
	className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodeEditor({ value, onChange, activeLang, onDetect, className }: CodeEditorProps) {
	const [highlightedHtml, setHighlightedHtml] = useState("")
	const [isReady, setIsReady] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Run detection + highlight with debounce
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)

		debounceRef.current = setTimeout(async () => {
			// Detect language
			if (value.trim().length >= 10) {
				const result = detectLanguage(value)
				onDetect(result.language)
			}

			// Highlight
			if (value.length === 0) {
				setHighlightedHtml("")
				setIsReady(true)
				return
			}

			try {
				const html = await highlight(value, activeLang)
				setHighlightedHtml(html)
				setIsReady(true)
			} catch {
				setIsReady(true)
			}
		}, 200)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [value, activeLang, onDetect])

	// Sync textarea scroll to overlay
	const overlayRef = useRef<HTMLDivElement>(null)

	function handleScroll() {
		if (overlayRef.current && textareaRef.current) {
			overlayRef.current.scrollTop = textareaRef.current.scrollTop
			overlayRef.current.scrollLeft = textareaRef.current.scrollLeft
		}
	}

	return (
		<div className={["relative h-[320px] w-full overflow-hidden", className ?? ""].join(" ")}>
			{/* Overlay — highlighted HTML (pointer-events: none) */}
			<div
				ref={overlayRef}
				aria-hidden="true"
				className={[
					"pointer-events-none absolute inset-0 overflow-hidden",
					"p-4 font-mono text-[12px] leading-6",
					"transition-opacity duration-150",
					isReady && value.length > 0 ? "opacity-100" : "opacity-0",
					// Strip Shiki's background so our bg-bg-input shows through
					"[&_pre]:!bg-transparent [&_pre]:leading-6 [&_pre]:font-mono [&_pre]:text-[12px]",
				].join(" ")}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Shiki output
				dangerouslySetInnerHTML={{ __html: highlightedHtml }}
			/>

			{/* Placeholder — shown when no value and ready */}
			{value.length === 0 && (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 p-4 font-mono text-[12px] leading-6 text-text-tertiary"
				>
					{"// paste your code here"}
				</div>
			)}

			{/* Textarea — invisible but receives input */}
			<textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onScroll={handleScroll}
				spellCheck={false}
				autoCapitalize="off"
				autoCorrect="off"
				autoComplete="off"
				className={[
					"absolute inset-0 h-full w-full resize-none bg-transparent",
					"p-4 font-mono text-[12px] leading-6",
					// Make text invisible so the overlay shows through
					"text-transparent caret-text-primary",
					"focus:outline-none",
				].join(" ")}
			/>
		</div>
	)
}
