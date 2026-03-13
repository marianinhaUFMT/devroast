type ScoreRingProps = {
	score: number
	maxScore?: number
	className?: string
}

export function ScoreRing({ score, maxScore = 10, className }: ScoreRingProps) {
	const size = 180
	const strokeWidth = 4
	const radius = (size - strokeWidth) / 2
	const circumference = 2 * Math.PI * radius

	const ratio = Math.min(Math.max(score / maxScore, 0), 1)
	const dashOffset = circumference * (1 - ratio)

	return (
		<div
			className={["relative inline-flex items-center justify-center", className ?? ""].join(" ")}
			style={{ width: size, height: size }}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				fill="none"
				aria-hidden="true"
			>
				<defs>
					<linearGradient id="score-ring-gradient" x1="1" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#10B981" />
						<stop offset="35%" stopColor="#F59E0B" />
						<stop offset="36%" stopColor="transparent" stopOpacity="0" />
					</linearGradient>
				</defs>

				{/* Outer ring */}
				<circle cx={size / 2} cy={size / 2} r={radius} stroke="#2A2A2A" strokeWidth={strokeWidth} />

				{/* Gradient arc */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="url(#score-ring-gradient)"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={dashOffset}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</svg>

			{/* Centered score text */}
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
				<span className="font-mono text-5xl font-bold leading-none text-text-primary">{score}</span>
				<span className="font-mono text-base leading-none text-text-tertiary">/10</span>
			</div>
		</div>
	)
}
