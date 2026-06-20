/**
 * 等级与 XP 工具函数
 * 依据：development-design.md 5.5.2 等级公式（平方根曲线）
 */

/**
 * 由 XP 计算等级
 * 公式：level = floor(sqrt(xp / 100)) + 1
 * 示例：Lv1=0xp, Lv2=100xp, Lv3=400xp, Lv4=900xp, Lv5=1600xp...
 */
export function levelFromXp(xp: number): number {
  if (xp < 0) return 1
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * 计算到达指定等级所需的累计 XP
 * levelFromXp 的反函数：xp = (level - 1)^2 * 100
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) * 100
}

/**
 * 计算当前等级的进度信息
 * @returns 当前等级起点 xp、下一等级起点 xp、当前等级内进度（0-1）
 */
export function getLevelProgress(xp: number): {
  currentLevelXp: number
  nextLevelXp: number
  progress: number
  level: number
} {
  const level = levelFromXp(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const progress =
    nextLevelXp === currentLevelXp ? 0 : (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progress: Math.max(0, Math.min(1, progress)),
  }
}
