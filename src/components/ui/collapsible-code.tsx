"use client"

import { useState } from "react"

type CollapsibleCodeProps = {
	codeSlot: React.ReactNode
}

export function CollapsibleCode({ codeSlot }: CollapsibleCodeProps) {
	const [open, setOpen] = useState(false)

	return (
		<div>
			{/* Code panel — always mounted, height clamped when collapsed */}
			<div className="relative">
				<div className={open ? undefined : "max-h-[120px] overflow-hidden"}>{codeSlot}</div>

				{/* Bottom fade overlay — only when collapsed */}
				{!open && (
					<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t from-bg-input to-transparent" />
				)}
			</div>

			{/* Toggle trigger */}
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full cursor-pointer items-center justify-center border-t border-border-primary py-2 font-mono text-xs text-text-tertiary transition-colors hover:text-text-secondary"
			>
				{open ? "// show less ▲" : "// show more ▼"}
			</button>
		</div>
	)
}
