"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { submitCode } from "@/app/actions/submit-code"
import { Button } from "@/components/ui/button"
import { CODE_MAX_LENGTH, CodeEditor } from "@/components/ui/code-editor"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Toggle } from "@/components/ui/toggle"

export function CodeEditorSection() {
	const router = useRouter()
	const [code, setCode] = useState("")
	const [detectedLang, setDetectedLang] = useState("plaintext")
	const [selectedLang, setSelectedLang] = useState<string | null>(null)
	const [roastMode, setRoastMode] = useState<"roast" | "honest">("roast")
	const [isPending, setIsPending] = useState(false)

	const isEmpty = code.trim().length === 0
	const isOverLimit = code.length > CODE_MAX_LENGTH
	const activeLang = selectedLang ?? detectedLang

	async function handleSubmit() {
		if (isEmpty) return
		setIsPending(true)
		try {
			const id = await submitCode({
				code,
				lang: activeLang,
				roastMode,
			})
			router.push(`/roast/${id}`)
		} finally {
			setIsPending(false)
		}
	}

	return (
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
					maxLength={CODE_MAX_LENGTH}
				/>
			</div>

			{/* Actions bar */}
			<div className="flex w-[780px] items-center justify-between">
				<div className="flex items-center gap-4">
					<Toggle
						defaultChecked
						onCheckedChange={(checked) => setRoastMode(checked ? "roast" : "honest")}
					/>
					<span className="font-mono text-xs text-text-tertiary">
						{roastMode === "roast" ? "// maximum sarcasm enabled" : "// honest feedback mode"}
					</span>
				</div>
				<Button
					variant="primary"
					size="md"
					disabled={isEmpty || isOverLimit || isPending}
					onClick={handleSubmit}
				>
					{isPending ? "$ roasting..." : "$ roast_my_code"}
				</Button>
			</div>
		</section>
	)
}
