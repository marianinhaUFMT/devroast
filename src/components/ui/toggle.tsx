"use client"

import { Switch } from "@base-ui/react/switch"

type ToggleProps = {
	checked?: boolean
	defaultChecked?: boolean
	onCheckedChange?: (checked: boolean) => void
	disabled?: boolean
	className?: string
}

export function Toggle({
	checked,
	defaultChecked,
	onCheckedChange,
	disabled,
	className,
}: ToggleProps) {
	return (
		<div
			className={["group inline-flex cursor-pointer items-center gap-3", className ?? ""].join(" ")}
		>
			<Switch.Root
				checked={checked}
				defaultChecked={defaultChecked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
				className={[
					"relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full p-[3px]",
					"transition-colors duration-150",
					"bg-bg-elevated data-[checked]:bg-accent-green",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
					"disabled:pointer-events-none disabled:opacity-50",
				].join(" ")}
			>
				<Switch.Thumb
					className={[
						"block size-4 rounded-full",
						"transition-[transform,background-color] duration-150",
						"translate-x-0 bg-text-secondary",
						"data-[checked]:translate-x-[18px] data-[checked]:bg-[#0A0A0A]",
					].join(" ")}
				/>
			</Switch.Root>
			<span
				data-label
				className="font-mono text-xs text-text-secondary transition-colors duration-150 group-has-[[data-checked]]:text-accent-green"
			>
				roast mode
			</span>
		</div>
	)
}
