/**
 * 建筑实例 Store
 * 依据：development-design.md 5.3.2 放置规则、5.3.3 解锁流程
 *
 * 职责：
 * - 管理已放置的建筑实例列表
 * - 放置校验（已解锁 / 空地 / 燃料充足 / 建筑已解锁）
 * - 放置成功后扣燃料、写入瓦片、发放 XP
 */
import { create } from 'zustand'
import type { BuildingInstance, PlacementResult } from '@/types'
import { PLACE_BUILDING_XP } from '@/types'
import { getBuildingType } from '@/game/data/buildings'
import { useProgressStore } from './progressStore'
import { useMapStore } from './mapStore'

interface BuildingStore {
  buildings: BuildingInstance[]
  /** 最近放置的建筑（供 UI 反馈用，消费后清空） */
  lastPlaced: BuildingInstance | null
  /** 最近放置失败原因（供 UI 提示用，消费后清空） */
  lastPlacementError: PlacementResult | null

  /**
   * 放置建筑
   * 校验：建筑类型存在 → 建筑已解锁 → 瓦片已解锁 → 瓦片无建筑 → 燃料充足
   * 成功：扣燃料、写入瓦片 buildingId、添加 BuildingInstance、XP+10
   */
  placeBuilding: (typeId: string, x: number, y: number) => PlacementResult
  /** 获取指定位置的建筑实例 */
  getBuildingAt: (x: number, y: number) => BuildingInstance | null
  /** 清空最近放置/错误状态 */
  clearLastAction: () => void
  /** 从存档恢复 */
  hydrate: (buildings: BuildingInstance[]) => void
  /** 重置 */
  reset: () => void
}

/** 生成唯一建筑实例 ID */
function generateBuildingId(): string {
  return `bldg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useBuildingStore = create<BuildingStore>((set, get) => ({
  buildings: [],
  lastPlaced: null,
  lastPlacementError: null,

  placeBuilding: (typeId, x, y) => {
    const buildingType = getBuildingType(typeId)
    if (!buildingType) {
      const result: PlacementResult = { ok: false, reason: 'locked_building' }
      set({ lastPlacementError: result })
      return result
    }

    const mapStore = useMapStore.getState()
    const progressStore = useProgressStore.getState()

    // 校验瓦片是否在范围内
    const { gridWidth, gridHeight, tiles } = mapStore
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      const result: PlacementResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastPlacementError: result })
      return result
    }

    const tile = tiles[y]?.[x]
    if (!tile) {
      const result: PlacementResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastPlacementError: result })
      return result
    }

    // 校验瓦片是否已解锁
    if (!tile.unlocked) {
      const result: PlacementResult = { ok: false, reason: 'locked' }
      set({ lastPlacementError: result })
      return result
    }

    // 校验瓦片是否已有建筑
    if (tile.buildingId) {
      const result: PlacementResult = { ok: false, reason: 'occupied' }
      set({ lastPlacementError: result })
      return result
    }

    // 校验建筑是否已解锁（等级足够）
    if (buildingType.unlockLevel > progressStore.level) {
      const result: PlacementResult = { ok: false, reason: 'locked_building' }
      set({ lastPlacementError: result })
      return result
    }

    // 校验燃料是否充足
    if (buildingType.cost.fuel > 0 && progressStore.fuel < buildingType.cost.fuel) {
      const result: PlacementResult = { ok: false, reason: 'no_fuel' }
      set({ lastPlacementError: result })
      return result
    }

    // 校验通过，执行放置
    const instance: BuildingInstance = {
      id: generateBuildingId(),
      typeId,
      x,
      y,
      placedAt: Date.now(),
    }

    // 扣燃料
    if (buildingType.cost.fuel > 0) {
      progressStore.spendFuel(buildingType.cost.fuel)
    }
    // XP +10
    progressStore.addXp(PLACE_BUILDING_XP)
    // 写入瓦片
    mapStore.setTileBuilding(x, y, instance.id)

    set((state) => ({
      buildings: [...state.buildings, instance],
      lastPlaced: instance,
      lastPlacementError: null,
    }))

    return { ok: true }
  },

  getBuildingAt: (x, y) => {
    const { buildings } = get()
    return buildings.find((b) => b.x === x && b.y === y) ?? null
  },

  clearLastAction: () => set({ lastPlaced: null, lastPlacementError: null }),

  hydrate: (buildings) => set({ buildings, lastPlaced: null, lastPlacementError: null }),

  reset: () => set({ buildings: [], lastPlaced: null, lastPlacementError: null }),
}))
