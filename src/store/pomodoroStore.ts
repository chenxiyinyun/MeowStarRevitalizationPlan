/**
 * 番茄钟 Store（Zustand）
 * 依据：development-design.md 5.1 番茄钟系统
 *
 * 核心设计：
 * - 基于时间戳的倒计时，不依赖 setInterval 精确性
 * - 状态机：idle → running → paused → running / completed / abandoned → idle
 * - 完成时通过 progressStore 发放奖励（fuel +3, xp +50）
 * - 历史记录保留最近 100 条
 */
import { create } from 'zustand'
import type { PomodoroSession, PomodoroState, PomodoroReward } from '@/types'
import {
  POMODORO_CONFIG,
  getRemainingMs,
  ADJACENT_ROAD_XP_PER_BUILDING,
  minutesToMs,
  POMODORO_DURATION_MIN,
  POMODORO_DURATION_MAX,
  calculateReward,
} from '@/types'
import { countAdjacentRoadBuildings } from '@/game/data/roads'
import { useProgressStore } from './progressStore'
import { useMapStore } from './mapStore'
import { useBuildingStore } from './buildingStore'
import { useUserStore } from './userStore'

interface PomodoroStore extends PomodoroState {
  /** 历史会话记录（最近 100 条） */
  history: PomodoroSession[]
  /** 最近一次升级信息（完成弹窗展示用，关闭后清空） */
  lastLevelUp: { from: number; to: number } | null

  /** 开始专注：idle → running */
  start: () => void
  /** 暂停：running → paused */
  pause: () => void
  /** 恢复：paused → running */
  resume: () => void
  /** 重置：running/paused → idle（标记 abandoned，不发放奖励） */
  reset: () => void
  /** 检查是否到时并完成（由 tick 调用）：running → completed */
  tick: () => boolean
  /** 清空最近奖励（关闭完成弹窗后调用） */
  clearLastReward: () => void
  /** 从存档恢复运行中的会话 */
  hydrate: (current: PomodoroSession | null, history: PomodoroSession[]) => void
}

/** 生成唯一会话 ID */
function generateSessionId(): string {
  return `pomo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 创建新会话（使用用户自定义时长，默认 25 分钟） */
function createSession(): PomodoroSession {
  const settings = useUserStore.getState().settings
  const durationMin = Math.min(
    Math.max(settings.pomodoroDurationMin ?? 25, POMODORO_DURATION_MIN),
    POMODORO_DURATION_MAX
  )
  return {
    id: generateSessionId(),
    startedAt: Date.now(),
    durationMs: minutesToMs(durationMin),
    status: 'running',
    accumulatedPausedMs: 0,
  }
}

/** 完成会话，返回带完成信息的副本 */
function completeSession(session: PomodoroSession, reward: PomodoroReward): PomodoroSession {
  return {
    ...session,
    status: 'completed',
    completedAt: Date.now(),
    reward,
  }
}

/** 放弃会话，返回带放弃信息的副本 */
function abandonSession(session: PomodoroSession): PomodoroSession {
  return {
    ...session,
    status: 'abandoned',
    abandonedAt: Date.now(),
  }
}

/**
 * 计算邻路建筑 XP 加成（迭代2）
 * 统计所有邻路建筑数量，每个额外产出 ADJACENT_ROAD_XP_PER_BUILDING XP
 * @returns { bonusXp, buildingCount } 加成 XP 和邻路建筑数
 */
function computeRoadBonus(): { bonusXp: number; buildingCount: number } {
  const mapState = useMapStore.getState()
  const buildingState = useBuildingStore.getState()
  const count = countAdjacentRoadBuildings(
    mapState.tiles,
    buildingState.buildings,
    mapState.gridWidth,
    mapState.gridHeight
  )
  return {
    bonusXp: count * ADJACENT_ROAD_XP_PER_BUILDING,
    buildingCount: count,
  }
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  phase: 'idle',
  current: null,
  lastReward: null,
  lastLevelUp: null,
  history: [],

  start: () => {
    if (get().phase !== 'idle') return
    const session = createSession()
    set({ phase: 'running', current: session, lastReward: null, lastLevelUp: null })
  },

  pause: () => {
    const { phase, current } = get()
    if (phase !== 'running' || !current) return
    set({
      phase: 'paused',
      current: { ...current, status: 'paused', pausedAt: Date.now() },
    })
  },

  resume: () => {
    const { phase, current } = get()
    if (phase !== 'paused' || !current || !current.pausedAt) return
    const now = Date.now()
    const additionalPaused = now - current.pausedAt
    set({
      phase: 'running',
      current: {
        ...current,
        status: 'running',
        pausedAt: undefined,
        accumulatedPausedMs: current.accumulatedPausedMs + additionalPaused,
      },
    })
  },

  reset: () => {
    const { phase, current, history } = get()
    if (phase === 'idle' || !current) return
    const abandoned = abandonSession(current)
    set({
      phase: 'idle',
      current: null,
      lastReward: null,
      lastLevelUp: null,
      history: [abandoned, ...history].slice(0, POMODORO_CONFIG.HISTORY_LIMIT),
    })
  },

  tick: () => {
    const { phase, current } = get()
    if (phase !== 'running' || !current) return false

    const remaining = getRemainingMs(current)
    if (remaining > 0) return false

    // 倒计时归零，完成会话
    const focusMinutes = current.durationMs / 1000 / 60
    const baseReward = calculateReward(focusMinutes)
    // 邻路加成：每个邻路建筑额外产出 XP
    const roadBonus = computeRoadBonus()
    const reward: PomodoroReward = {
      fuel: baseReward.fuel,
      xp: baseReward.xp,
      roadBonusXp: roadBonus.bonusXp || undefined,
      roadBonusBuildings: roadBonus.buildingCount || undefined,
    }
    const completed = completeSession(current, reward)

    // 发放奖励（基础 + 邻路加成）
    const progressStore = useProgressStore.getState()
    progressStore.addFuel(reward.fuel)
    const xpResult = progressStore.addXp(reward.xp + roadBonus.bonusXp)
    progressStore.recordPomodoroCompleted(focusMinutes)

    set((state) => ({
      phase: 'completed',
      current: completed,
      lastReward: reward,
      lastLevelUp: xpResult.leveledUp ? { from: xpResult.oldLevel, to: xpResult.newLevel } : null,
      history: [completed, ...state.history].slice(0, POMODORO_CONFIG.HISTORY_LIMIT),
    }))

    return true
  },

  clearLastReward: () => {
    set({ lastReward: null, lastLevelUp: null, phase: 'idle', current: null })
  },

  hydrate: (current, history) => {
    if (current && (current.status === 'running' || current.status === 'paused')) {
      // 恢复运行中的会话，需检查是否在后台已到时
      const remaining = getRemainingMs(current)
      if (remaining <= 0) {
        // 后台已到时，直接完成
        const focusMinutes = current.durationMs / 1000 / 60
        const baseReward = calculateReward(focusMinutes)
        const roadBonus = computeRoadBonus()
        const reward: PomodoroReward = {
          fuel: baseReward.fuel,
          xp: baseReward.xp,
          roadBonusXp: roadBonus.bonusXp || undefined,
          roadBonusBuildings: roadBonus.buildingCount || undefined,
        }
        const completed = completeSession(current, reward)
        const progressStore = useProgressStore.getState()
        progressStore.addFuel(reward.fuel)
        const xpResult = progressStore.addXp(reward.xp + roadBonus.bonusXp)
        progressStore.recordPomodoroCompleted(focusMinutes)
        set({
          phase: 'completed',
          current: completed,
          lastReward: reward,
          lastLevelUp: xpResult.leveledUp
            ? { from: xpResult.oldLevel, to: xpResult.newLevel }
            : null,
          history: [completed, ...history].slice(0, POMODORO_CONFIG.HISTORY_LIMIT),
        })
      } else {
        set({
          phase: current.status === 'paused' ? 'paused' : 'running',
          current,
          history,
          lastReward: null,
          lastLevelUp: null,
        })
      }
    } else {
      set({ phase: 'idle', current: null, history, lastReward: null, lastLevelUp: null })
    }
  },
}))
