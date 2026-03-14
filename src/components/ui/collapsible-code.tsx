"use client"

import { Collapsible } from "@base-ui/react"

type CollapsibleCodeProps = {
	codeSlot: React.ReactNode
}

export function CollapsibleCode({ codeSlot }: CollapsibleCodeProps) {
	return (
		<Collapsible.Root>
			<div className="relative">
				<Collapsible.Panel className="data-[closed]:max-h-[120px] data-[closed]:overflow-hidden">
					{codeSlot}
				</Collapsible.Panel>

				{/* Bottom fade — only visible when collapsed */}
				<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t from-bg-input to-transparent data-[closed]:block hidden" />
			</div>

			<Collapsible.Trigger className="flex w-full cursor-pointer items-center justify-center border-t border-border-primary py-2 font-mono text-xs text-text-tertiary transition-colors hover:text-text-secondary">
				<span className="data-[panel-open]:hidden">{"// show more ▼"}</span>
				<span className="hidden data-[panel-open]:inline">{"// show less ▲"}</span>
			</Collapsible.Trigger>
		</Collapsible.Root>
	)
}
