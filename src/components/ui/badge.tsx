import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

const badgeDot = tv({
	base: ["shrink-0 rounded-full size-2"],
	variants: {
		variant: {
			critical: "bg-accent-red",
			warning: "bg-accent-amber",
			good: "bg-accent-green",
		},
	},
	defaultVariants: {
		variant: "good",
	},
})

const badge = tv({
	base: ["inline-flex items-center gap-2", "font-mono text-xs"],
	variants: {
		variant: {
			critical: "text-accent-red",
			warning: "text-accent-amber",
			good: "text-accent-green",
		},
	},
	defaultVariants: {
		variant: "good",
	},
})

type BadgeProps = ComponentProps<"span"> &
	VariantProps<typeof badge> & {
		label?: string
	}

export function Badge({ variant, label, className, children, ...props }: BadgeProps) {
	return (
		<span {...props} className={badge({ variant, className })}>
			<span className={badgeDot({ variant })} />
			{label ?? children}
		</span>
	)
}
