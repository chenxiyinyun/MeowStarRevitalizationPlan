interface CircularProgressProps {
  progress: number
  label: string
  sublabel?: string
  size?: number
  color?: string
  dimmed?: boolean
}

export default function CircularProgress({
  progress,
  label,
  sublabel,
  size = 220,
  color = 'var(--accent-orange)',
  dimmed = false,
}: CircularProgressProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress))

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative flex items-center justify-center pixel-panel bg-gradient-to-br from-bg-cream to-bg-paper"
        style={{ width: size, height: size }}
      >
        <svg
          width={size - 20}
          height={size - 20}
          viewBox={`0 0 ${size - 20} ${size - 20}`}
          className="-rotate-90"
        >
          <rect
            x="6"
            y="6"
            width={size - 32}
            height={size - 32}
            fill="none"
            stroke="var(--wood-light)"
            strokeWidth="4"
            rx="0"
          />
          <rect
            x="6"
            y="6"
            width={size - 32}
            height={size - 32}
            fill="none"
            stroke={dimmed ? 'var(--wood-light)' : color}
            strokeWidth="6"
            strokeLinecap="square"
            strokeDasharray={`${(size - 32) * 4 * clampedProgress} ${(size - 32) * 4}`}
            style={{
              transition: 'stroke-dasharray 0.5s ease',
            }}
          />
          <rect
            x="2"
            y="2"
            width={size - 24}
            height={size - 24}
            fill="none"
            stroke={dimmed ? 'var(--wood-light)' : color}
            strokeWidth="2"
            opacity="0.3"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-4xl tabular-nums text-brown-dark" style={{ textShadow: '2px 2px 0 var(--wood-light)' }}>
            {label}
          </span>
          {sublabel && (
            <span className="mt-1 text-sm font-display text-text-secondary">
              {sublabel}
            </span>
          )}
        </div>

        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-wood-dark" />
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-wood-dark" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-wood-dark" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-wood-dark" />
      </div>
    </div>
  )
}
