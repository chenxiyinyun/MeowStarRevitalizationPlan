/**
 * 等级与 XP 工具函数
 *
 * 升级曲线设计（二次递增曲线）：
 * - 每级所需XP = 50 * (level - 1)
 * - 累计XP = Σ 50*i = 25 * level * (level - 1)
 *
 * 示例：
 * - Lv1: 0 XP（初始）
 * - Lv2: 50 XP（1次25分钟番茄钟）
 * - Lv3: 150 XP（3次）
 * - Lv4: 300 XP（6次）
 * - Lv5: 500 XP（10次）
 * - Lv7: 1050 XP（21次）
 * - Lv10: 2250 XP（45次）
 * - Lv12: 3300 XP（66次）
 *
 * 这样设计的优点：
 * 1. 新手友好：第1-2天就能升到Lv3-4，获得成就感
 * 2. 中期适中：每天3-5个番茄钟，约2周到Lv7
 * 3. 后期有挑战：Lv10+需要1-2个月，但仍有进度感
 */

/** 每级升级所需的增量 XP（每级递增），用于计算显示 */
export const XP_PER_LEVEL_INCREMENT = 50

/**
 * 由 XP 计算等级
 * 公式推导：累计XP = 25 * level * (level - 1)
 * 反解：level = (1 + √(1 + XP/6.25)) / 2
 */
export function levelFromXp(xp: number): number {
  if (xp < 0) return 1
  // 使用求根公式反解二次方程
  const discriminant = 1 + xp / 25
  return Math.floor((1 + Math.sqrt(discriminant)) / 2)
}

/**
 * 计算到达指定等级所需的累计 XP
 * levelFromXp 的反函数：xp = 25 * level * (level - 1)
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return 25 * level * (level - 1)
}

/**
 * 获取从上一级到当前级所需的 XP 差值
 */
export function xpDeltaForLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * (level - 1)
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
