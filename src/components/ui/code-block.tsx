import type { ComponentProps } from "react"
import { codeToHtml } from "shiki"
import { tv } from "tailwind-variants"

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const codeBlockRoot = tv({
	base: ["overflow-hidden border border-border-primary", "bg-bg-input font-mono"],
})

const codeBlockHeader = tv({
	base: ["flex h-10 items-center gap-3", "border-b border-border-primary px-4"],
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CodeBlockRootProps = ComponentProps<"div">

export function CodeBlockRoot({ className, ...props }: CodeBlockRootProps) {
	return <div {...props} className={codeBlockRoot({ className })} />
}

type CodeBlockHeaderProps = ComponentProps<"div"> & {
	filename?: string
}

export function CodeBlockHeader({ filename, className, ...props }: CodeBlockHeaderProps) {
	return (
		<div {...props} className={codeBlockHeader({ className })}>
			<span className="size-[10px] rounded-full bg-accent-red" />
			<span className="size-[10px] rounded-full bg-accent-amber" />
			<span className="size-[10px] rounded-full bg-accent-green" />
			<span className="flex-1" />
			{filename && <span className="font-mono text-xs text-text-tertiary">{filename}</span>}
		</div>
	)
}

type CodeBlockBodyProps = {
	code: string
	lang?: string
	className?: string
}

export async function CodeBlockBody({ code, lang = "text", className }: CodeBlockBodyProps) {
	const highlighted = await codeToHtml(code, { lang, theme: "vesper" })
	const lineCount = code.split("\n").length
	const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

	return (
		<div className={["flex", className ?? ""].join(" ")}>
			{/* Line numbers */}
			<div
				className={[
					"flex w-10 shrink-0 flex-col gap-[6px]",
					"border-r border-border-primary bg-bg-surface",
					"px-[10px] py-3",
				].join(" ")}
			>
				{lineNumbers.map((n) => (
					<span
						key={n}
						className="text-right font-mono text-[13px] leading-normal text-text-tertiary"
					>
						{n}
					</span>
				))}
			</div>

			{/* Highlighted code */}
			<div
				className="min-w-0 flex-1 overflow-x-auto p-3 text-[13px] [&_pre]:!bg-transparent [&_pre]:leading-normal"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Shiki output
				dangerouslySetInnerHTML={{ __html: highlighted }}
			/>
		</div>
	)
}
