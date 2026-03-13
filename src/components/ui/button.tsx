import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

const button = tv({
	base: [
		"inline-flex items-center justify-center gap-2",
		"font-mono font-medium cursor-pointer",
		"transition-colors duration-150",
		"disabled:opacity-50 disabled:pointer-events-none",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
	],
	variants: {
		variant: {
			primary: ["bg-accent-green text-[#0A0A0A]", "enabled:hover:bg-accent-green/90"],
			secondary: [
				"bg-bg-elevated text-text-primary border border-border-primary",
				"enabled:hover:bg-bg-surface",
			],
			ghost: [
				"bg-transparent text-text-secondary",
				"enabled:hover:bg-bg-elevated enabled:hover:text-text-primary",
			],
			danger: ["bg-accent-red text-white", "enabled:hover:bg-accent-red/90"],
			outline: [
				"bg-transparent text-text-primary border border-border-primary",
				"enabled:hover:border-border-focus enabled:hover:text-accent-green",
			],
		},
		size: {
			sm: "text-xs px-3 py-1.5 rounded-sm",
			md: "text-[13px] px-6 py-2.5 rounded",
			lg: "text-sm px-8 py-3 rounded-md",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "md",
	},
})

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>

export function Button({ variant, size, className, ...props }: ButtonProps) {
	return <button {...props} className={button({ variant, size, className })} />
}
