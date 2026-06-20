/**
 * 进度状态 Store（fuel / xp / level / 累计统计）
 * 依据：development-design.md 4.1、5.5 等级与进度系统
 */
import { create } from 'zustand'
import type { ProgressState } from '@/types'
import { INITIAL_PROGRESS } from '@/types'
import { levelFromXp } from '@/utils/level'

interface ProgressStore extends ProgressState {
  /** 增加燃料 */
  addFuel: (amount: number) => void
  /** 消耗燃料（建造等），不足返回 false */
  spendFuel: (amount: number) => boolean
  /** 增加 XP，返回是否升级 */
  addXp: (amount: number) => { leveledUp: boolean; newLevel: number; oldLevel: number }
  /** 记录完成一个番茄钟（累计统计） */
  recordPomodoroCompleted: (focusMinutes: number) => void
  /** 直接设置整个进度（存档加载用） */
  setProgress: (progress: ProgressState) => void
  /** 重置为初始状态 */
  reset: () => void
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...INITIAL_PROGRESS,

  addFuel: (amount) => {
    if (amount === 0) return
    set((state) => ({ fuel: Math.max(0, state.fuel + amount) }))
  },

  spendFuel: (amount) => {
    const { fuel } = get()
    if (fuel < amount) return false
    set({ fuel: fuel - amount })
    return true
  },

  addXp: (amount) => {
    const oldLevel = get().level
    const newXp = get().xp + amount
    const newLevel = levelFromXp(newXp)
    set({ xp: newXp, level: newLevel })
    return { leveledUp: newLevel > oldLevel, newLevel, oldLevel }
  },

  recordPomodoroCompleted: (focusMinutes) => {
    set((state) => ({
      totalPomodoros: state.totalPomodoros + 1,
      totalFocusMinutes: state.totalFocusMinutes + focusMinutes,
    }))
  },

  setProgress: (progress) => set({ ...progress }),

  reset: () => set({ ...INITIAL_PROGRESS }),
}))
