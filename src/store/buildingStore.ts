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
import type { BuildingInstance, PlacementResult, DemolishResult, MoveResult } from '@/types'
import { PLACE_BUILDING_XP, ADJACENT_ROAD_BONUS_RATE, DEMOLISH_FUEL_REFUND_RATE } from '@/types'
import { getBuildingType } from '@/game/data/buildings'
import { isAdjacentToRoad } from '@/game/data/roads'
import { useProgressStore } from './progressStore'
import { useMapStore } from './mapStore'

interface BuildingStore {
  buildings: BuildingInstance[]
  /** 最近放置的建筑（供 UI 反馈用，消费后清空） */
  lastPlaced: BuildingInstance | null
  /** 最近放置失败原因（供 UI 提示用，消费后清空） */
  lastPlacementError: PlacementResult | null
  /** 最近拆除结果（供 UI 反馈用，消费后清空） */
  lastDemolish: DemolishResult | null
  /** 最近移动结果（供 UI 反馈用，消费后清空） */
  lastMove: MoveResult | null

  /**
   * 放置建筑
   * 校验：建筑类型存在 → 建筑已解锁 → 瓦片已解锁 → 瓦片无建筑 → 燃料充足
   * 成功：扣燃料、写入瓦片 buildingId、添加 BuildingInstance、XP+10
   */
  placeBuilding: (typeId: string, x: number, y: number) => PlacementResult
  /**
   * 拆除建筑（迭代2）
   * 校验：瓦片在范围内 → 瓦片有建筑
   * 成功：移除 BuildingInstance、清空瓦片 buildingId、返还 50% 燃料
   */
  demolishBuilding: (x: number, y: number) => DemolishResult
  /**
   * 移动建筑（迭代2）
   * 校验：源位置有建筑 → 目标位置在范围内 → 目标已解锁 → 目标无建筑 → 目标非水面
   * 成功：更新建筑坐标、迁移瓦片 buildingId
   */
  moveBuilding: (fromX: number, fromY: number, toX: number, toY: number) => MoveResult
  /** 获取指定位置的建筑实例 */
  getBuildingAt: (x: number, y: number) => BuildingInstance | null
  /** 清空最近放置/拆除/移动/错误状态 */
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
  lastDemolish: null,
  lastMove: null,

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

    // 水面地形不可放置建筑
    if (tile.terrain === 'water') {
      const result: PlacementResult = { ok: false, reason: 'water' }
      set({ lastPlacementError: result })
      return result
    }

    // 校验瓦片是否已有建筑（道路地形允许放置建筑 = 沿街建筑）
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

    // 邻路加成：建筑相邻道路时放置 XP +20%
    const adjacentToRoad = isAdjacentToRoad(tiles, x, y, gridWidth, gridHeight)
    const baseXp = PLACE_BUILDING_XP
    const bonusXp = adjacentToRoad ? Math.round(baseXp * ADJACENT_ROAD_BONUS_RATE) : 0
    progressStore.addXp(baseXp + bonusXp)

    // 写入瓦片
    mapStore.setTileBuilding(x, y, instance.id)

    set((state) => ({
      buildings: [...state.buildings, instance],
      lastPlaced: instance,
      lastPlacementError: null,
    }))

    return { ok: true, bonusXp: bonusXp || undefined, adjacentToRoad: adjacentToRoad || undefined }
  },

  demolishBuilding: (x, y) => {
    const mapStore = useMapStore.getState()
    const progressStore = useProgressStore.getState()
    const { gridWidth, gridHeight, tiles } = mapStore

    // 校验瓦片是否在范围内
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      const result: DemolishResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastDemolish: result })
      return result
    }

    const tile = tiles[y]?.[x]
    if (!tile) {
      const result: DemolishResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastDemolish: result })
      return result
    }

    // 校验瓦片是否有建筑
    if (!tile.buildingId) {
      const result: DemolishResult = { ok: false, reason: 'no_building' }
      set({ lastDemolish: result })
      return result
    }

    // 查找建筑实例
    const { buildings } = get()
    const building = buildings.find((b) => b.id === tile.buildingId)
    if (!building) {
      const result: DemolishResult = { ok: false, reason: 'no_building' }
      set({ lastDemolish: result })
      return result
    }

    const buildingType = getBuildingType(building.typeId)
    const buildingName = buildingType?.name ?? '建筑'

    // 返还 50% 燃料（向下取整，至少 0）
    const refundedFuel = Math.floor(
      buildingType ? buildingType.cost.fuel * DEMOLISH_FUEL_REFUND_RATE : 0
    )
    if (refundedFuel > 0) {
      progressStore.addFuel(refundedFuel)
    }

    // 清空瓦片 buildingId、移除建筑实例
    mapStore.setTileBuilding(x, y, undefined)
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== building.id),
      lastDemolish: { ok: true, refundedFuel, buildingName },
    }))

    return { ok: true, refundedFuel, buildingName }
  },

  getBuildingAt: (x, y) => {
    const { buildings } = get()
    return buildings.find((b) => b.x === x && b.y === y) ?? null
  },

  moveBuilding: (fromX, fromY, toX, toY) => {
    const mapStore = useMapStore.getState()
    const { gridWidth, gridHeight, tiles } = mapStore

    // 校验源位置
    if (fromX < 0 || fromX >= gridWidth || fromY < 0 || fromY >= gridHeight) {
      const result: MoveResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastMove: result })
      return result
    }

    const fromTile = tiles[fromY]?.[fromX]
    if (!fromTile || !fromTile.buildingId) {
      const result: MoveResult = { ok: false, reason: 'no_building' }
      set({ lastMove: result })
      return result
    }

    // 校验目标位置
    if (toX < 0 || toX >= gridWidth || toY < 0 || toY >= gridHeight) {
      const result: MoveResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastMove: result })
      return result
    }

    const toTile = tiles[toY]?.[toX]
    if (!toTile) {
      const result: MoveResult = { ok: false, reason: 'out_of_bounds' }
      set({ lastMove: result })
      return result
    }

    if (!toTile.unlocked) {
      const result: MoveResult = { ok: false, reason: 'locked' }
      set({ lastMove: result })
      return result
    }

    if (toTile.terrain === 'water') {
      const result: MoveResult = { ok: false, reason: 'water' }
      set({ lastMove: result })
      return result
    }

    if (toTile.buildingId) {
      const result: MoveResult = { ok: false, reason: 'occupied' }
      set({ lastMove: result })
      return result
    }

    // 查找建筑实例
    const { buildings } = get()
    const building = buildings.find((b) => b.id === fromTile.buildingId)
    if (!building) {
      const result: MoveResult = { ok: false, reason: 'no_building' }
      set({ lastMove: result })
      return result
    }

    const buildingType = getBuildingType(building.typeId)
    const buildingName = buildingType?.name ?? '建筑'

    // 执行移动：迁移瓦片 buildingId、更新建筑坐标
    mapStore.setTileBuilding(fromX, fromY, undefined)
    mapStore.setTileBuilding(toX, toY, building.id)
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === building.id ? { ...b, x: toX, y: toY } : b
      ),
      lastMove: { ok: true, buildingName },
    }))

    return { ok: true, buildingName }
  },

  clearLastAction: () => set({ lastPlaced: null, lastPlacementError: null, lastDemolish: null, lastMove: null }),

  hydrate: (buildings) =>
    set({ buildings, lastPlaced: null, lastPlacementError: null, lastDemolish: null, lastMove: null }),

  reset: () =>
    set({ buildings: [], lastPlaced: null, lastPlacementError: null, lastDemolish: null, lastMove: null }),
}))
