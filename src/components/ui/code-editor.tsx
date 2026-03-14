"use client"

import { useEffect, useRef, useState } from "react"
import { detectLanguage } from "@/lib/language-detector"
import { highlight } from "@/lib/shiki-client"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Width of the line-number gutter (matches CodeBlockBody in code-block.tsx)
const GUTTER_WIDTH = 40 // px — w-10

export const CODE_MAX_LENGTH = 10_000

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CodeEditorProps = {
	value: string
	onChange: (code: string) => void
	activeLang: string
	onDetect: (lang: string) => void
	maxLength?: number
	className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodeEditor({
	value,
	onChange,
	activeLang,
	onDetect,
	maxLength = CODE_MAX_LENGTH,
	className,
}: CodeEditorProps) {
	const [highlightedHtml, setHighlightedHtml] = useState("")
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const gutterRef = useRef<HTMLDivElement>(null)
	const overlayRef = useRef<HTMLDivElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const lineCount = value ? value.trimEnd().split("\n").length : 1
	const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

	const charCount = value.length
	const isOverLimit = charCount > maxLength
	const isNearLimit = !isOverLimit && charCount > maxLength * 0.9

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
				return
			}

			try {
				const html = await highlight(value, activeLang)
				setHighlightedHtml(html)
			} catch {
				// ignore — overlay stays as plaintext
			}
		}, 200)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [value, activeLang, onDetect])

	// Sync gutter + overlay scroll with textarea
	function handleScroll() {
		if (!textareaRef.current) return
		const { scrollTop, scrollLeft } = textareaRef.current
		if (overlayRef.current) {
			overlayRef.current.scrollTop = scrollTop
			overlayRef.current.scrollLeft = scrollLeft
		}
		if (gutterRef.current) {
			gutterRef.current.scrollTop = scrollTop
		}
	}

	return (
		<div className={["relative flex h-[320px] w-full overflow-hidden", className ?? ""].join(" ")}>
			{/* Line numbers gutter */}
			<div
				ref={gutterRef}
				aria-hidden="true"
				className={[
					"pointer-events-none shrink-0 overflow-hidden",
					"flex flex-col",
					"border-r border-border-primary bg-bg-surface",
					"px-[10px] py-4",
				].join(" ")}
				style={{ width: GUTTER_WIDTH }}
			>
				{lineNumbers.map((n) => (
					<span
						key={n}
						className="block text-right font-mono text-[12px] leading-6 text-text-tertiary"
					>
						{n}
					</span>
				))}
			</div>

			{/* Right side: overlay + textarea stacked */}
			<div className="relative min-w-0 flex-1">
				{/* Overlay — highlighted HTML or plaintext fallback */}
				<div
					ref={overlayRef}
					aria-hidden="true"
					className={[
						"pointer-events-none absolute inset-0 overflow-hidden",
						"p-4 font-mono text-[12px] leading-6",
						// Strip Shiki's background so our bg-bg-input shows through
						"[&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:leading-6 [&_pre]:font-mono [&_pre]:text-[12px]",
					].join(" ")}
				>
					{highlightedHtml ? (
						// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Shiki output
						<div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
					) : (
						<span className="text-text-primary whitespace-pre">{value}</span>
					)}
				</div>

				{/* Placeholder */}
				{value.length === 0 && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 p-4 font-mono text-[12px] leading-6 text-text-tertiary"
					>
						{"// paste your code here"}
					</div>
				)}

				{/* Textarea — invisible, captures input */}
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
						"text-transparent caret-text-primary",
						"focus:outline-none",
					].join(" ")}
				/>

				{/* Character counter */}
				<div
					aria-live="polite"
					className={[
						"pointer-events-none absolute right-3 bottom-2",
						"font-mono text-[11px] tabular-nums",
						isOverLimit
							? "text-accent-red"
							: isNearLimit
								? "text-accent-amber"
								: "text-text-tertiary",
					].join(" ")}
				>
					{charCount.toLocaleString("en-US")}/{maxLength.toLocaleString("en-US")}
				</div>
			</div>
		</div>
	)
}
