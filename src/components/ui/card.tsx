import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const cardRoot = tv({
	base: ["flex flex-col gap-3", "border border-border-primary", "p-5"],
})

const cardTitle = tv({
	base: ["font-mono text-[13px] font-normal text-text-primary"],
})

const cardDescription = tv({
	base: ["font-mono text-xs leading-[1.5] text-text-secondary"],
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CardRootProps = ComponentProps<"div">

export function CardRoot({ className, ...props }: CardRootProps) {
	return <div {...props} className={cardRoot({ className })} />
}

type CardBadgeProps = ComponentProps<"span"> & VariantProps<typeof Badge>

export function CardBadge({ variant = "critical", ...props }: CardBadgeProps) {
	return <Badge variant={variant} label={variant ?? "critical"} {...props} />
}

type CardTitleProps = ComponentProps<"p">

export function CardTitle({ className, ...props }: CardTitleProps) {
	return <p {...props} className={cardTitle({ className })} />
}

type CardDescriptionProps = ComponentProps<"p">

export function CardDescription({ className, ...props }: CardDescriptionProps) {
	return <p {...props} className={cardDescription({ className })} />
}
