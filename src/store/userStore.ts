/**
 * 用户档案与设置 Store
 * 依据：development-design.md 4.1 UserProfile、4.6 UserSettings
 */
import { create } from 'zustand'
import type { UserProfile, UserSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

interface UserStore {
  profile: UserProfile | null
  settings: UserSettings
  /** 初始化用户档案（首次进入生成 userId） */
  initProfile: () => UserProfile
  /** 从存档恢复（合并默认值，兼容旧存档缺少字段） */
  hydrate: (profile: UserProfile, settings: Partial<UserSettings>) => void
  /** 更新昵称 */
  setNickname: (nickname: string) => void
  /** 更新最近活跃时间 */
  touchLastActive: () => void
  /** 更新设置（部分） */
  updateSettings: (partial: Partial<UserSettings>) => void
  /** 切换通知开关 */
  toggleNotification: () => void
  /** 切换音效开关 */
  toggleSound: () => void
}

/** 生成简易 UUID（不依赖 crypto.randomUUID 的兼容性） */
function generateUserId(): string {
  return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  settings: { ...DEFAULT_SETTINGS },

  initProfile: () => {
    const existing = get().profile
    if (existing) return existing
    const profile: UserProfile = {
      userId: generateUserId(),
      nickname: '喵星开拓者',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    }
    set({ profile })
    return profile
  },

  hydrate: (profile, settings) => set({ profile, settings: { ...DEFAULT_SETTINGS, ...settings } }),

  setNickname: (nickname) => {
    const profile = get().profile
    if (!profile) return
    set({ profile: { ...profile, nickname } })
  },

  touchLastActive: () => {
    const profile = get().profile
    if (!profile) return
    set({ profile: { ...profile, lastActiveAt: Date.now() } })
  },

  updateSettings: (partial) => {
    set((state) => ({ settings: { ...state.settings, ...partial } }))
  },

  toggleNotification: () => {
    set((state) => ({
      settings: { ...state.settings, notificationEnabled: !state.settings.notificationEnabled },
    }))
  },

  toggleSound: () => {
    set((state) => ({
      settings: { ...state.settings, soundEnabled: !state.settings.soundEnabled },
    }))
  },
}))
