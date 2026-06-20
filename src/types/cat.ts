/**
 * 猫咪数据模型
 * 依据：development-design.md 4.4 猫咪、5.4 猫咪系统
 */

/** 猫咪性格 */
export type CatPersonality = 'lazy' | 'playful' | 'curious' | 'shy'

/** 猫咪行为状态 */
export type CatState = 'idle' | 'walking' | 'sleeping' | 'interacting'

/** 猫咪类型配置（静态数据） */
export interface CatType {
  id: string
  name: string
  personality: CatPersonality
  /** 对话文案池 */
  dialogPool: string[]
  /** 移动间隔（毫秒） */
  moveIntervalMs: number
  /** 纯色占位颜色（16 进制） */
  color: number
  /** 出现条件 */
  unlockCondition:
    | { type: 'initial' }
    | { type: 'pomodoroCount'; count: number }
    | { type: 'level'; level: number }
}

/** 猫咪实例（地图上的具体猫咪） */
export interface CatInstance {
  id: string
  typeId: string
  name: string
  /** 当前网格坐标 x */
  x: number
  /** 当前网格坐标 y */
  y: number
  state: CatState
  /** 上次移动时间戳 */
  lastMovedAt: number
  /** 对话冷却到期时间戳 */
  dialogCooldownUntil: number
  /** 上次对话索引（避免重复） */
  lastDialogIndex: number
}

/** 对话冷却时间（毫秒） */
export const DIALOG_COOLDOWN_MS = 5000

/** 对话气泡显示时长（毫秒） */
export const DIALOG_DISPLAY_MS = 2500

/** 猫咪移动动画时长（毫秒） */
export const CAT_MOVE_DURATION_MS = 500
