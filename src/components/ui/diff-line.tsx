import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

const diffLine = tv({
	base: ["flex items-baseline gap-2", "w-full px-4 py-2", "font-mono text-[13px]"],
	variants: {
		variant: {
			removed: "bg-[#1A0A0A]",
			added: "bg-[#0A1A0F]",
			context: "bg-transparent",
		},
	},
	defaultVariants: {
		variant: "context",
	},
})

const prefixColor = {
	removed: "text-accent-red",
	added: "text-accent-green",
	context: "text-text-tertiary",
} as const

const codeColor = {
	removed: "text-text-secondary",
	added: "text-text-primary",
	context: "text-text-secondary",
} as const

const prefixChar = {
	removed: "-",
	added: "+",
	context: " ",
} as const

type DiffLineProps = ComponentProps<"div"> &
	VariantProps<typeof diffLine> & {
		code: string
	}

export function DiffLine({ variant = "context", code, className, ...props }: DiffLineProps) {
	return (
		<div {...props} className={diffLine({ variant, className })}>
			<span className={`shrink-0 select-none ${prefixColor[variant ?? "context"]}`}>
				{prefixChar[variant ?? "context"]}
			</span>
			<span className={codeColor[variant ?? "context"]}>{code}</span>
		</div>
	)
}
