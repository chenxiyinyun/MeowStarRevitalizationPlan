/**
 * 升级解锁 Hook
 * 依据：development-design.md 5.3.3 解锁流程、5.5.3 升级流程、5.6.2 揭开条件
 *
 * 监听 progressStore 的 level 变化，触发：
 * - 检查并揭开满足条件的迷雾区域
 * - 通知 UI 展示新解锁的建筑
 */
import { useEffect, useRef, useState } from 'react'
import { useProgressStore } from '@/store/progressStore'
import { useMapStore } from '@/store/mapStore'
import { BUILDING_TYPES } from '@/game/data/buildings'

export interface UnlockNotification {
  type: 'buildings' | 'fog'
  buildingNames?: string[]
  fogRegionIds?: string[]
}

export function useLevelUpUnlock() {
  const level = useProgressStore((s) => s.level)
  const totalPomodoros = useProgressStore((s) => s.totalPomodoros)
  const prevLevelRef = useRef(level)
  const prevPomodoroCountRef = useRef(totalPomodoros)
  const [notification, setNotification] = useState<UnlockNotification | null>(null)

  useEffect(() => {
    const prevLevel = prevLevelRef.current
    const prevPomodoroCount = prevPomodoroCountRef.current

    if (level > prevLevel) {
      // 等级提升，检查解锁
      const newlyUnlockedBuildings = BUILDING_TYPES.filter(
        (b) => b.unlockLevel > prevLevel && b.unlockLevel <= level
      ).map((b) => b.name)

      // 检查迷雾揭开
      const revealedRegions = useMapStore.getState().checkFogReveal(level, totalPomodoros)

      if (newlyUnlockedBuildings.length > 0 || revealedRegions.length > 0) {
        setNotification({
          type: 'buildings',
          buildingNames: newlyUnlockedBuildings.length > 0 ? newlyUnlockedBuildings : undefined,
          fogRegionIds: revealedRegions.length > 0 ? revealedRegions : undefined,
        })
      }
    } else if (totalPomodoros > prevPomodoroCount) {
      // 番茄钟数量增加（但等级未变），仅检查迷雾
      const revealedRegions = useMapStore.getState().checkFogReveal(level, totalPomodoros)
      if (revealedRegions.length > 0) {
        setNotification({
          type: 'fog',
          fogRegionIds: revealedRegions,
        })
      }
    }

    prevLevelRef.current = level
    prevPomodoroCountRef.current = totalPomodoros
  }, [level, totalPomodoros])

  const dismissNotification = () => setNotification(null)

  return { notification, dismissNotification }
}
