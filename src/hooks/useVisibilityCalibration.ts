/**
 * 后台计时校准 Hook
 * 依据：development-design.md 5.1.1 后台运行、10.1 风险应对
 *
 * 原理：番茄钟基于 startedAt 时间戳计算剩余时间，不依赖 setInterval 精确性。
 * 当标签页切到后台再切回时，setInterval 可能被浏览器节流或暂停，
 * 此 Hook 监听 visibilitychange 事件，切回时主动调用 tick() 校准：
 * - 若后台期间已到时，tick() 会触发完成流程
 * - 若未到时，触发一次重渲染以更新显示
 */
import { useEffect } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'

export function useVisibilityCalibration(): void {
  const tick = usePomodoroStore((s) => s.tick)
  const phase = usePomodoroStore((s) => s.phase)

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // 切回可见时校准：若后台已到时则完成，否则仅触发重渲染
        if (usePomodoroStore.getState().phase === 'running') {
          tick()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [tick, phase])
}
