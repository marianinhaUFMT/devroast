type ScoreRingProps = {
	score: number
	maxScore?: number
	className?: string
}

export function ScoreRing({ score, maxScore = 10, className }: ScoreRingProps) {
	const size = 180
	const thickness = 4
	// The filled arc goes from 0% → ratio of the full circle.
	// The conic-gradient starts at the top (-90deg) and sweeps clockwise.
	// Colors: red (low) → amber (mid) → green (high), always spanning 0–100%
	// so the colour at any given score point is proportional to score/maxScore.
	const ratio = Math.min(Math.max(score / maxScore, 0), 1)
	const filledDeg = ratio * 360

	const conicGradient = [
		`conic-gradient(`,
		`#EF4444 0deg,`,
		`#F59E0B ${filledDeg * 0.5}deg,`,
		`#10B981 ${filledDeg}deg,`,
		`#2A2A2A ${filledDeg}deg`,
		`)`,
	].join(" ")

	// Inner mask: a circle cutout that leaves only the ring visible.
	// inner diameter = size - 2*thickness, so inner radius = size/2 - thickness
	const innerSize = size - thickness * 2
	const maskGradient = `radial-gradient(circle, transparent ${innerSize / 2}px, black ${innerSize / 2}px)`

	return (
		<div
			role="img"
			aria-label={`Score: ${score} out of ${maxScore}`}
			className={["relative inline-flex items-center justify-center", className ?? ""].join(" ")}
			style={{ width: size, height: size }}
		>
			{/* Ring rendered via conic-gradient + radial mask */}
			<div
				className="absolute inset-0 rounded-full"
				style={{
					background: conicGradient,
					WebkitMask: maskGradient,
					mask: maskGradient,
				}}
			/>

			{/* Centered score text */}
			<div className="relative flex flex-col items-center justify-center gap-0.5">
				<span className="font-mono text-5xl font-bold leading-none text-text-primary">{score}</span>
				<span className="font-mono text-base leading-none text-text-tertiary">/10</span>
			</div>
		</div>
	)
}
