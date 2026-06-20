/**
 * Web Notification Hook
 * 依据：development-design.md 5.1.2 通知机制
 *
 * 职责：
 * - 请求通知权限
 * - 发送系统通知
 * - 监听番茄钟完成，自动发送完成通知
 */
import { useEffect } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { useUserStore } from '@/store/userStore'

/** 通知权限状态 */
export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

/** 获取当前通知权限 */
export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as NotificationPermissionState
}

/** 请求通知权限 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  } catch {
    return 'denied'
  }
}

/** 发送系统通知 */
export function sendNotification(title: string, options?: NotificationOptions): void {
  if (getNotificationPermission() !== 'granted') return
  try {
    new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options,
    })
  } catch (err) {
    console.warn('[notification] 发送通知失败：', err)
  }
}

/**
 * 监听番茄钟完成并自动发送通知
 * 在游戏页挂载一次即可
 */
export function usePomodoroCompletionNotification(): void {
  const lastReward = usePomodoroStore((s) => s.lastReward)

  useEffect(() => {
    if (!lastReward) return
    const { notificationEnabled } = useUserStore.getState().settings
    if (!notificationEnabled) return

    sendNotification('专注完成！喵～', {
      body: `获得 ${lastReward.fuel} 燃料、${lastReward.xp} 经验值。来建一座新建筑吧！`,
      tag: 'pomodoro-complete',
    })
  }, [lastReward])
}
