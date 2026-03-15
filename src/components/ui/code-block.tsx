import type { ComponentProps } from "react"
import { codeToHtml } from "shiki"
import { tv } from "tailwind-variants"

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const codeBlockRoot = tv({
	base: ["overflow-hidden border border-border-primary", "bg-bg-input font-mono"],
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CodeBlockRootProps = ComponentProps<"div">

export function CodeBlockRoot({ className, ...props }: CodeBlockRootProps) {
	return <div {...props} className={codeBlockRoot({ className })} />
}

type CodeBlockBodyProps = {
	code: string
	lang?: string
	className?: string
}

export async function CodeBlockBody({ code, lang = "text", className }: CodeBlockBodyProps) {
	"use cache"
	const trimmed = code.trimEnd()
	const highlighted = await codeToHtml(trimmed, { lang, theme: "vesper" })
	const lineCount = trimmed.split("\n").length
	const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

	return (
		<div className={["flex", className ?? ""].join(" ")}>
			{/* Line numbers — must match the pre's padding and line-height exactly */}
			<div
				className={[
					"flex w-10 shrink-0 flex-col",
					"border-r border-border-primary bg-bg-surface",
					"px-[10px] py-3",
				].join(" ")}
			>
				{lineNumbers.map((n) => (
					<span
						key={n}
						className="block text-right font-mono text-[13px] leading-6 text-text-tertiary"
					>
						{n}
					</span>
				))}
			</div>

			{/* Highlighted code — py-3 and leading-6 must match the gutter */}
			<div
				className="min-w-0 flex-1 overflow-x-auto p-3 text-[13px] [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:leading-6 [&_pre]:font-mono [&_pre]:text-[13px]"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Shiki output
				dangerouslySetInnerHTML={{ __html: highlighted }}
			/>
		</div>
	)
}
