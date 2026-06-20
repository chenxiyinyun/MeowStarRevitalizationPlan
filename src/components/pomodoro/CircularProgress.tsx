/**
 * 环形进度组件
 * SVG 圆环，根据 progress (0-1) 显示填充比例
 */
interface CircularProgressProps {
  /** 进度 0-1 */
  progress: number
  /** 中心显示的文本（如剩余时间） */
  label: string
  /** 副标题 */
  sublabel?: string
  /** 圆环直径（px） */
  size?: number
  /** 进度条颜色，默认番茄钟橙色 */
  color?: string
  /** 是否暂停态（暂停时进度条变灰） */
  dimmed?: boolean
}

export default function CircularProgress({
  progress,
  label,
  sublabel,
  size = 240,
  color = 'var(--accent-orange)',
  dimmed = false,
}: CircularProgressProps) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const offset = circumference * (1 - clampedProgress)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-card-hover)"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dimmed ? 'var(--text-dim)' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
            filter: dimmed ? 'none' : `drop-shadow(0 0 8px var(--glow-orange))`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-5xl tabular-nums text-text-primary">{label}</span>
        {sublabel && <span className="mt-1 text-sm text-text-secondary">{sublabel}</span>}
      </div>
    </div>
  )
}
