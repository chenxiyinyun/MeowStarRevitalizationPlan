/**
 * 地图状态 Store
 * 依据：development-design.md 4.3 地图与建筑、5.2 等距地图系统、5.6 迷雾系统
 *
 * 瓦片数据由 store 管理；相机状态由 MapEngine 内部直接操作 PixiJS Container，
 * 仅在存档/恢复时通过 getCamera / setCamera 同步，避免拖拽时频繁触发 React 重渲染。
 */
import { create } from 'zustand'
import type { Camera, FogRegion, TileData, TileSize, Terrain } from '@/types'
import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE, ZOOM_MAX, ZOOM_MIN } from '@/types'
import type { PaveResult } from '@/types'
import { PAVE_ROAD_XP } from '@/types'
import { getRoadType } from '@/game/data/roads'
import { createInitialFogRegions, getFogRegionAt } from '@/game/data/fogRegions'
import { useProgressStore } from './progressStore'

interface MapStore {
  gridWidth: number
  gridHeight: number
  tileSize: TileSize
  tiles: TileData[][]
  fogRegions: FogRegion[]
  /** 相机状态快照（存档用，引擎运行时由引擎内部管理） */
  cameraSnapshot: Camera
  initialized: boolean
  /** 最近揭开的迷雾区域 ID（供 UI 提示用，消费后清空） */
  lastRevealedRegionId: string | null

  /** 初始化地图（生成 20×20 网格 + 迷雾区域） */
  initMap: () => void
  /** 获取相机快照 */
  getCamera: () => Camera
  /** 设置相机快照（引擎同步用） */
  setCamera: (camera: Camera) => void
  /** 检查并揭开满足条件的迷雾区域 */
  checkFogReveal: (level: number, pomodoroCount: number) => string[]
  /** 设置瓦片的 buildingId */
  setTileBuilding: (x: number, y: number, buildingId: string | undefined) => void
  /**
   * 铺设道路：将瓦片地形改为 road 并记录道路子类型
   * 校验：瓦片在范围内 → 已解锁 → 非水面 → 道路类型已解锁 → 燃料充足
   * 成功：扣燃料、设 terrain='road' + roadType、XP+5
   */
  paveRoad: (x: number, y: number, roadTypeId: string) => PaveResult
  /** 清空最近揭开的区域 ID */
  clearLastRevealed: () => void
  /** 从存档恢复 */
  hydrate: (data: {
    gridWidth: number
    gridHeight: number
    tiles: TileData[][]
    camera: Camera
    fogRegions?: FogRegion[]
  }) => void
  /** 重置 */
  reset: () => void
}

/** 生成初始瓦片网格（全草地，根据迷雾区域设置 unlocked） */
function createInitialTiles(width: number, height: number, fogRegions: FogRegion[]): TileData[][] {
  const tiles: TileData[][] = []
  for (let y = 0; y < height; y++) {
    const row: TileData[] = []
    for (let x = 0; x < width; x++) {
      const region = getFogRegionAt(fogRegions, x, y)
      const unlocked = region ? region.revealed : false
      row.push({
        x,
        y,
        terrain: 'grass' as Terrain,
        unlocked,
      })
    }
    tiles.push(row)
  }
  return tiles
}

/** 根据迷雾区域状态更新瓦片 unlocked */
function syncTileUnlock(tiles: TileData[][], fogRegions: FogRegion[]): TileData[][] {
  const newTiles = tiles.map((row) =>
    row.map((tile) => {
      const region = getFogRegionAt(fogRegions, tile.x, tile.y)
      const unlocked = region ? region.revealed : false
      return tile.unlocked === unlocked ? tile : { ...tile, unlocked }
    })
  )
  return newTiles
}

/** 默认相机（居中） */
function createDefaultCamera(): Camera {
  return { x: 0, y: 0, zoom: 1.0 }
}

export const useMapStore = create<MapStore>((set, get) => ({
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  tileSize: { ...TILE_SIZE },
  tiles: [],
  fogRegions: [],
  cameraSnapshot: createDefaultCamera(),
  initialized: false,
  lastRevealedRegionId: null,

  initMap: () => {
    if (get().initialized) return
    const fogRegions = createInitialFogRegions()
    // 初始时按 level=1 揭开中心区
    const initialLevel = 1
    const initialPomodoroCount = 0
    for (const region of fogRegions) {
      if (
        region.revealCondition.type === 'level' &&
        (region.revealCondition.level ?? 0) <= initialLevel
      ) {
        region.revealed = true
      }
      if (
        region.revealCondition.type === 'pomodoroCount' &&
        (region.revealCondition.count ?? 0) <= initialPomodoroCount
      ) {
        region.revealed = true
      }
    }
    set({
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize: { ...TILE_SIZE },
      fogRegions,
      tiles: createInitialTiles(GRID_WIDTH, GRID_HEIGHT, fogRegions),
      cameraSnapshot: createDefaultCamera(),
      initialized: true,
    })
  },

  getCamera: () => get().cameraSnapshot,

  setCamera: (camera) => {
    const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.zoom))
    set({ cameraSnapshot: { x: camera.x, y: camera.y, zoom } })
  },

  checkFogReveal: (level, pomodoroCount) => {
    const { fogRegions, tiles } = get()
    const newlyRevealed: string[] = []

    const updatedRegions = fogRegions.map((region) => {
      if (region.revealed) return region
      let shouldReveal = false
      if (region.revealCondition.type === 'level' && level >= (region.revealCondition.level ?? 0)) {
        shouldReveal = true
      } else if (
        region.revealCondition.type === 'pomodoroCount' &&
        pomodoroCount >= (region.revealCondition.count ?? 0)
      ) {
        shouldReveal = true
      }
      if (shouldReveal) {
        newlyRevealed.push(region.id)
        return { ...region, revealed: true }
      }
      return region
    })

    if (newlyRevealed.length > 0) {
      const newTiles = syncTileUnlock(tiles, updatedRegions)
      set({
        fogRegions: updatedRegions,
        tiles: newTiles,
        lastRevealedRegionId: newlyRevealed[newlyRevealed.length - 1],
      })
    }

    return newlyRevealed
  },

  setTileBuilding: (x, y, buildingId) => {
    const { tiles, gridWidth, gridHeight } = get()
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return
    const newTiles = tiles.map((row, ry) =>
      ry === y ? row.map((tile, tx) => (tx === x ? { ...tile, buildingId } : tile)) : row
    )
    set({ tiles: newTiles })
  },

  paveRoad: (x, y, roadTypeId) => {
    const roadType = getRoadType(roadTypeId)
    if (!roadType) {
      return { ok: false, reason: 'locked_road' as const }
    }

    const { tiles, gridWidth, gridHeight } = get()
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      return { ok: false, reason: 'out_of_bounds' as const }
    }

    const tile = tiles[y]?.[x]
    if (!tile) {
      return { ok: false, reason: 'out_of_bounds' as const }
    }

    // 未解锁（迷雾覆盖）
    if (!tile.unlocked) {
      return { ok: false, reason: 'locked' as const }
    }

    // 水面不可铺路
    if (tile.terrain === 'water') {
      return { ok: false, reason: 'water' as const }
    }

    // 道路类型未解锁
    const progressStore = useProgressStore.getState()
    if (roadType.unlockLevel > progressStore.level) {
      return { ok: false, reason: 'locked_road' as const }
    }

    // 燃料不足
    if (roadType.cost.fuel > 0 && progressStore.fuel < roadType.cost.fuel) {
      return { ok: false, reason: 'no_fuel' as const }
    }

    // 如果已经是同类型道路，不重复扣费
    if (tile.terrain === 'road' && tile.roadType === roadTypeId) {
      return { ok: true }
    }

    // 扣燃料
    if (roadType.cost.fuel > 0) {
      progressStore.spendFuel(roadType.cost.fuel)
    }
    // XP +5
    progressStore.addXp(PAVE_ROAD_XP)

    // 更新瓦片地形
    const newTiles = tiles.map((row, ry) =>
      ry === y
        ? row.map((t, tx) =>
            tx === x ? { ...t, terrain: 'road' as Terrain, roadType: roadTypeId } : t
          )
        : row
    )
    set({ tiles: newTiles })

    return { ok: true }
  },

  clearLastRevealed: () => set({ lastRevealedRegionId: null }),

  hydrate: (data) => {
    const fogRegions = data.fogRegions ?? createInitialFogRegions()
    set({
      gridWidth: data.gridWidth,
      gridHeight: data.gridHeight,
      tiles: data.tiles,
      fogRegions,
      cameraSnapshot: data.camera,
      initialized: true,
    })
  },

  reset: () => {
    set({
      tiles: [],
      fogRegions: [],
      cameraSnapshot: createDefaultCamera(),
      initialized: false,
      lastRevealedRegionId: null,
    })
  },
}))
