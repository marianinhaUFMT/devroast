import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const leaderboardRowRoot = tv({
	base: ["flex items-start", "border-b border-border-primary", "px-5 py-4"],
})

const leaderboardRowRank = tv({
	base: ["w-[50px] shrink-0 font-mono text-xs"],
	variants: {
		variant: {
			highlight: "text-accent-amber",
			default: "text-text-secondary",
		},
	},
	defaultVariants: {
		variant: "default",
	},
})

const leaderboardRowScore = tv({
	base: ["w-[70px] shrink-0 font-mono text-xs font-bold"],
	variants: {
		variant: {
			critical: "text-accent-red",
			warning: "text-accent-amber",
			good: "text-accent-green",
		},
	},
	defaultVariants: {
		variant: "critical",
	},
})

const leaderboardRowCode = tv({
	base: ["flex flex-1 flex-col gap-[3px]"],
})

const leaderboardRowLang = tv({
	base: ["w-[100px] shrink-0 font-mono text-xs text-text-secondary"],
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type LeaderboardRowRootProps = ComponentProps<"div">

export function LeaderboardRowRoot({ className, ...props }: LeaderboardRowRootProps) {
	return <div {...props} className={leaderboardRowRoot({ className })} />
}

type LeaderboardRowRankProps = ComponentProps<"span"> & VariantProps<typeof leaderboardRowRank>

export function LeaderboardRowRank({
	variant,
	className,
	children,
	...props
}: LeaderboardRowRankProps) {
	return (
		<span {...props} className={leaderboardRowRank({ variant, className })}>
			{children}
		</span>
	)
}

type LeaderboardRowScoreProps = ComponentProps<"span"> & VariantProps<typeof leaderboardRowScore>

export function LeaderboardRowScore({
	variant,
	className,
	children,
	...props
}: LeaderboardRowScoreProps) {
	return (
		<span {...props} className={leaderboardRowScore({ variant, className })}>
			{children}
		</span>
	)
}

type LeaderboardRowCodeProps = ComponentProps<"div">

export function LeaderboardRowCode({ className, ...props }: LeaderboardRowCodeProps) {
	return <div {...props} className={leaderboardRowCode({ className })} />
}

type LeaderboardRowLangProps = ComponentProps<"span">

export function LeaderboardRowLang({ className, ...props }: LeaderboardRowLangProps) {
	return <span {...props} className={leaderboardRowLang({ className })} />
}
