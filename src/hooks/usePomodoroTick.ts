/**
 * 番茄钟倒计时 Tick Hook
 * 每秒触发重渲染并检查是否到时完成
 *
 * 注意：setInterval 仅用于驱动 UI 刷新，实际倒计时基于时间戳计算
 * 即使 setInterval 不精确或被节流，切回标签页时也会通过时间戳校准
 */
import { useEffect, useState } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { getRemainingMs, getProgress } from '@/types'

const TICK_INTERVAL_MS = 1000

export function usePomodoroTick() {
  const phase = usePomodoroStore((s) => s.phase)
  const current = usePomodoroStore((s) => s.current)
  const tick = usePomodoroStore((s) => s.tick)

  // 用一个递增的 tick 计数器驱动重渲染
  const [, setTickCount] = useState(0)

  useEffect(() => {
    if (phase !== 'running') return

    const interval = setInterval(() => {
      // 检查是否到时完成（基于时间戳）
      const completed = tick()
      if (!completed) {
        // 未完成则触发重渲染以更新剩余时间显示
        setTickCount((c) => c + 1)
      }
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [phase, tick])

  const remainingMs = getRemainingMs(current)
  const progress = getProgress(current)
  const totalMs = current?.durationMs ?? 0

  return { phase, remainingMs, progress, totalMs }
}
