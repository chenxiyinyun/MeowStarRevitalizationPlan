/**
 * 番茄钟数据模型与状态机类型定义
 * 依据：development-design.md 4.2 番茄钟、5.1.1 核心规则、5.1.3 状态机
 */

/** 番茄钟阶段（状态机的四个节点） */
export type PomodoroPhase = 'idle' | 'running' | 'paused' | 'completed'

/** 单次会话的终态状态（用于历史记录） */
export type PomodoroSessionStatus = 'running' | 'paused' | 'completed' | 'abandoned'

/** 完成奖励 */
export interface PomodoroReward {
  fuel: number
  xp: number
}

/**
 * 番茄钟会话记录
 * - 运行中：status 为 running/paused
 * - 已结束：status 为 completed/abandoned
 */
export interface PomodoroSession {
  id: string
  startedAt: number // 开始时间戳（ms）
  durationMs: number // 设定时长（ms），MVP 固定 25*60*1000
  status: PomodoroSessionStatus
  pausedAt?: number // 暂停时间戳（暂停期间存在，恢复后清除）
  accumulatedPausedMs: number // 累计已暂停时长（ms）
  completedAt?: number // 完成时间戳
  abandonedAt?: number // 放弃时间戳
  reward?: PomodoroReward // 完成奖励（仅 completed 有）
}

/**
 * 番茄钟运行时状态（store 中持久化的当前会话状态）
 * 基于时间戳计算剩余时间，不依赖 setInterval 精确性
 */
export interface PomodoroState {
  phase: PomodoroPhase
  /** 当前进行中的会话（idle/abandoned 后为 null） */
  current: PomodoroSession | null
  /** 最近一次完成的奖励（用于完成弹窗展示，关闭后清空） */
  lastReward: PomodoroReward | null
}

/** 番茄钟配置常量 */
export const POMODORO_CONFIG = {
  /** 默认时长 25 分钟 */
  DURATION_MS: 25 * 60 * 1000,
  /** 完成奖励 */
  REWARD: { fuel: 3, xp: 50 } as PomodoroReward,
  /** 历史记录保留条数 */
  HISTORY_LIMIT: 100,
} as const

/**
 * 计算剩余时间（ms）
 * 基于时间戳：剩余 = 时长 - (now - startedAt - accumulatedPausedMs)
 * 暂停期间不递减
 */
export function getRemainingMs(session: PomodoroSession | null, now: number = Date.now()): number {
  if (!session) return POMODORO_CONFIG.DURATION_MS
  const pausedMs =
    session.status === 'paused' && session.pausedAt
      ? session.accumulatedPausedMs + (now - session.pausedAt)
      : session.accumulatedPausedMs
  const elapsed = now - session.startedAt - pausedMs
  return Math.max(0, session.durationMs - elapsed)
}

/** 计算已用时长占比（0-1），用于环形进度 */
export function getProgress(session: PomodoroSession | null, now: number = Date.now()): number {
  if (!session) return 0
  const remaining = getRemainingMs(session, now)
  return 1 - remaining / session.durationMs
}
