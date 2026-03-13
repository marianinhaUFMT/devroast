import type { ComponentProps } from "react"
import { tv } from "tailwind-variants"

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const navbarRoot = tv({
	base: ["flex h-14 w-full items-center gap-2 px-10", "border-b border-border-primary bg-bg-page"],
})

const navbarLogo = tv({
	base: ["flex items-center gap-2"],
})

const navbarActions = tv({
	base: ["flex items-center gap-6"],
})

const navLink = tv({
	base: ["font-mono text-[13px] text-text-secondary", "transition-colors hover:text-text-primary"],
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type NavbarRootProps = ComponentProps<"nav">

export function NavbarRoot({ className, ...props }: NavbarRootProps) {
	return <nav {...props} className={navbarRoot({ className })} />
}

type NavbarLogoProps = ComponentProps<"div">

export function NavbarLogo({ className, ...props }: NavbarLogoProps) {
	return (
		<div {...props} className={navbarLogo({ className })}>
			<span className="font-mono text-xl font-bold text-accent-green">&gt;</span>
			<span className="font-mono text-lg font-medium text-text-primary">devroast</span>
		</div>
	)
}

type NavbarActionsProps = ComponentProps<"div">

export function NavbarActions({ className, ...props }: NavbarActionsProps) {
	return <div {...props} className={navbarActions({ className })} />
}

type NavLinkProps = ComponentProps<"a">

export function NavLink({ className, children, ...props }: NavLinkProps) {
	return (
		<a {...props} className={navLink({ className })}>
			{children}
		</a>
	)
}
