/**
 * 时间格式化工具
 */

/** 毫秒转 mm:ss 格式（如 1500000 → "25:00"） */
export function formatMsToMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/** 毫秒转可读时长（如 1500000 → "25 分钟"） */
export function formatMsToReadable(ms: number): string {
  const minutes = Math.round(ms / 1000 / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return remainMinutes > 0 ? `${hours} 小时 ${remainMinutes} 分钟` : `${hours} 小时`
}
