"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { submitCode } from "@/app/actions/submit-code"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/ui/code-editor"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Toggle } from "@/components/ui/toggle"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomePageClient({
	statsSlot,
	leaderboardSlot,
}: {
	statsSlot: React.ReactNode
	leaderboardSlot: React.ReactNode
}) {
	const router = useRouter()

	const [code, setCode] = useState("")
	const [detectedLang, setDetectedLang] = useState("plaintext")
	const [selectedLang, setSelectedLang] = useState<string | null>(null)
	const [roastMode, setRoastMode] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const isEmpty = code.trim().length === 0
	const activeLang = selectedLang ?? detectedLang

	function handleSubmit() {
		if (!code.trim()) {
			setError("paste some code first")
			return
		}
		setError(null)
		startTransition(async () => {
			try {
				const { id } = await submitCode(code, activeLang, roastMode)
				router.push(`/roast/${id}`)
			} catch (e) {
				setError(e instanceof Error ? e.message : "something went wrong")
			}
		})
	}

	return (
		<main className="mx-auto w-full max-w-[960px] px-10 py-20">
			{/* ── Hero ──────────────────────────────────────────────────────── */}
			<section className="flex flex-col items-center gap-3 pb-12">
				<div className="flex items-center gap-3">
					<span className="font-mono text-4xl font-bold text-accent-green">$</span>
					<h1 className="font-mono text-4xl font-bold text-text-primary">
						paste your code. get roasted.
					</h1>
				</div>
				<p className="font-mono text-sm text-text-secondary">
					{"// drop your code below and we'll rate it — brutally honest or full roast mode"}
				</p>
			</section>

			{/* ── Code editor ───────────────────────────────────────────────── */}
			<section className="flex flex-col items-center gap-4">
				<div className="w-[780px] overflow-hidden border border-border-primary bg-bg-input">
					{/* Window chrome */}
					<div className="flex h-10 w-full items-center justify-between border-b border-border-primary px-4">
						<div className="flex items-center gap-2">
							<span className="size-3 rounded-full bg-accent-red" />
							<span className="size-3 rounded-full bg-accent-amber" />
							<span className="size-3 rounded-full bg-accent-green" />
						</div>
						<LanguageSelector
							detectedLang={detectedLang}
							selectedLang={selectedLang}
							onSelect={setSelectedLang}
						/>
					</div>

					<CodeEditor
						value={code}
						onChange={setCode}
						activeLang={activeLang}
						onDetect={setDetectedLang}
					/>
				</div>

				{/* Actions bar */}
				<div className="flex w-[780px] items-center justify-between">
					<div className="flex items-center gap-4">
						<Toggle checked={roastMode} onCheckedChange={setRoastMode} />
						<span className="font-mono text-xs text-text-tertiary">
							{roastMode ? "// maximum sarcasm enabled" : "// honest mode enabled"}
						</span>
					</div>
					<Button
						variant="primary"
						size="md"
						disabled={isEmpty || isPending}
						onClick={handleSubmit}
					>
						{isPending ? "$ roasting..." : "$ roast_my_code"}
					</Button>
				</div>

				{/* Inline error */}
				{error && <p className="w-[780px] font-mono text-xs text-accent-red">{error}</p>}

				{/* Footer stats — injected from Server Component via slot */}
				{statsSlot}
			</section>

			{/* Divider spacer */}
			<div className="py-12" />

			{/* ── Leaderboard — injected from Server Component via slot ─────── */}
			{leaderboardSlot}
		</main>
	)
}
