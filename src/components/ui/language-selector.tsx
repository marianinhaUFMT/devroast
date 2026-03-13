"use client"

import { Popover } from "@base-ui/react/popover"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

// ---------------------------------------------------------------------------
// Supported languages
// ---------------------------------------------------------------------------

export type SupportedLanguage = {
	id: string
	label: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
	{ id: "javascript", label: "JavaScript" },
	{ id: "typescript", label: "TypeScript" },
	{ id: "tsx", label: "TSX" },
	{ id: "jsx", label: "JSX" },
	{ id: "python", label: "Python" },
	{ id: "rust", label: "Rust" },
	{ id: "go", label: "Go" },
	{ id: "java", label: "Java" },
	{ id: "kotlin", label: "Kotlin" },
	{ id: "swift", label: "Swift" },
	{ id: "css", label: "CSS" },
	{ id: "scss", label: "SCSS" },
	{ id: "html", label: "HTML" },
	{ id: "json", label: "JSON" },
	{ id: "yaml", label: "YAML" },
	{ id: "sql", label: "SQL" },
	{ id: "bash", label: "Bash" },
	{ id: "dockerfile", label: "Dockerfile" },
	{ id: "markdown", label: "Markdown" },
	{ id: "php", label: "PHP" },
	{ id: "ruby", label: "Ruby" },
	{ id: "csharp", label: "C#" },
	{ id: "cpp", label: "C++" },
]

function getLangLabel(id: string): string {
	return SUPPORTED_LANGUAGES.find((l) => l.id === id)?.label ?? id
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type LanguageSelectorProps = {
	detectedLang: string
	selectedLang: string | null
	onSelect: (lang: string | null) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LanguageSelector({ detectedLang, selectedLang, onSelect }: LanguageSelectorProps) {
	const [filter, setFilter] = useState("")
	const isAuto = selectedLang === null
	const activeLang = selectedLang ?? detectedLang
	const isDetecting = detectedLang === "plaintext"

	const filtered = filter.trim()
		? SUPPORTED_LANGUAGES.filter(
				(l) =>
					l.label.toLowerCase().includes(filter.toLowerCase()) ||
					l.id.toLowerCase().includes(filter.toLowerCase())
			)
		: SUPPORTED_LANGUAGES

	return (
		<div className="flex items-center gap-2">
			<Popover.Root
				onOpenChange={(open) => {
					if (!open) setFilter("")
				}}
			>
				<Popover.Trigger
					className={[
						"inline-flex items-center gap-1.5",
						"border border-border-primary bg-transparent",
						"px-2.5 py-1 font-mono text-xs",
						"transition-colors duration-150",
						"hover:border-border-focus hover:text-accent-green",
						"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus",
						isDetecting ? "text-text-tertiary" : "text-text-secondary",
					].join(" ")}
				>
					{isDetecting ? (
						<span>Detectando...</span>
					) : (
						<>
							<span className="text-text-primary">{getLangLabel(activeLang)}</span>
							{isAuto && <span className="text-text-tertiary">(auto)</span>}
						</>
					)}
					<ChevronDown size={12} className="text-text-tertiary" aria-hidden="true" />
				</Popover.Trigger>

				<Popover.Portal>
					<Popover.Positioner side="bottom" align="start" sideOffset={4}>
						<Popover.Popup
							className={[
								"z-50 w-52 overflow-hidden",
								"border border-border-primary bg-bg-elevated",
								"shadow-lg",
							].join(" ")}
						>
							{/* Search input */}
							<div className="border-b border-border-primary px-3 py-2">
								<input
									type="text"
									value={filter}
									onChange={(e) => setFilter(e.target.value)}
									placeholder="Filtrar linguagens..."
									className={[
										"w-full bg-transparent font-mono text-xs text-text-primary",
										"placeholder:text-text-tertiary",
										"focus:outline-none",
									].join(" ")}
									// biome-ignore lint/a11y/noAutofocus: intentional for popover search
									autoFocus
								/>
							</div>

							{/* Language list */}
							<div role="listbox" className="max-h-60 overflow-y-auto py-1">
								{filtered.length === 0 ? (
									<div className="px-3 py-2 font-mono text-xs text-text-tertiary">
										Nenhuma linguagem encontrada
									</div>
								) : (
									filtered.map((lang) => {
										const isActive = lang.id === activeLang
										return (
											<Popover.Close
												key={lang.id}
												render={
													<button
														type="button"
														role="option"
														aria-selected={isActive}
														onClick={() => onSelect(lang.id)}
														className={[
															"flex w-full cursor-pointer items-center justify-between",
															"px-3 py-1.5 font-mono text-xs",
															"transition-colors duration-100",
															isActive
																? "text-accent-green"
																: "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
														].join(" ")}
													>
														{lang.label}
														{isActive && (
															<svg
																width="12"
																height="12"
																viewBox="0 0 12 12"
																fill="none"
																aria-hidden="true"
																className="shrink-0"
															>
																<path
																	d="M2 6L5 9L10 3"
																	stroke="currentColor"
																	strokeWidth="1.5"
																	strokeLinecap="round"
																	strokeLinejoin="round"
																/>
															</svg>
														)}
													</button>
												}
											/>
										)
									})
								)}
							</div>
						</Popover.Popup>
					</Popover.Positioner>
				</Popover.Portal>
			</Popover.Root>

			{/* Reset to auto button */}
			{!isAuto && (
				<button
					type="button"
					onClick={() => onSelect(null)}
					className={[
						"inline-flex items-center justify-center",
						"size-5 border border-border-primary",
						"font-mono text-[10px] text-text-tertiary",
						"transition-colors duration-150",
						"hover:border-accent-red hover:text-accent-red",
						"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus",
					].join(" ")}
					aria-label="Resetar para detecção automática"
				>
					✕
				</button>
			)}
		</div>
	)
}
