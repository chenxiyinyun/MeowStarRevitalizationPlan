/**
 * 猫咪状态 Store
 * 依据：development-design.md 4.4 猫咪、5.4 猫咪系统
 *
 * 职责：
 * - 管理猫咪实例列表（生成 / 状态 / 位置）
 * - 定时移动逻辑（按 moveIntervalMs 随机选相邻已解锁空格）
 * - 点击互动与对话（冷却机制 + 不重复上一次）
 */
import { create } from 'zustand'
import type { CatInstance } from '@/types'
import { DIALOG_COOLDOWN_MS } from '@/types'
import { CAT_TYPES, getCatType } from '@/game/data/cats'
import { useMapStore } from './mapStore'
import { useBuildingStore } from './buildingStore'

interface CatStore {
  cats: CatInstance[]
  /** 最近互动的猫咪对话（供 UI 显示，消费后清空） */
  lastDialog: { catId: string; catName: string; text: string } | null

  /** 根据等级和番茄钟数生成满足条件的猫咪 */
  spawnCats: (level: number, pomodoroCount: number) => void
  /** 移动一只猫咪到相邻已解锁空格（返回是否移动成功） */
  moveCat: (catId: string) => boolean
  /** 检查所有猫咪是否需要移动（按 moveIntervalMs） */
  tickCats: () => void
  /** 点击互动，返回对话文本或 null（冷却中） */
  interactCat: (catId: string) => string | null
  /** 完成移动动画，将猫咪状态设回 idle */
  finishMove: (catId: string) => void
  /** 完成互动，将猫咪状态设回 idle */
  finishInteract: (catId: string) => void
  /** 清空最近对话 */
  clearLastDialog: () => void
  /** 从存档恢复 */
  hydrate: (cats: CatInstance[]) => void
  /** 重置 */
  reset: () => void
}

/** 生成唯一猫咪实例 ID */
function generateCatId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 获取已解锁且无建筑的空瓦片 */
function getEmptyUnlockedTiles(): Array<{ x: number; y: number }> {
  const { tiles, gridWidth, gridHeight } = useMapStore.getState()
  const buildings = useBuildingStore.getState().buildings
  const occupied = new Set(buildings.map((b) => `${b.x},${b.y}`))
  const catOccupied = new Set(useCatStore.getState().cats.map((c) => `${c.x},${c.y}`))

  const result: Array<{ x: number; y: number }> = []
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tile = tiles[y]?.[x]
      if (!tile || !tile.unlocked) continue
      const key = `${x},${y}`
      if (occupied.has(key) || catOccupied.has(key)) continue
      result.push({ x, y })
    }
  }
  return result
}

/** 获取猫咪相邻的已解锁空格 */
function getAdjacentEmptyTiles(cx: number, cy: number): Array<{ x: number; y: number }> {
  const { tiles, gridWidth, gridHeight } = useMapStore.getState()
  const buildings = useBuildingStore.getState().buildings
  const occupied = new Set(buildings.map((b) => `${b.x},${b.y}`))
  const catOccupied = new Set(useCatStore.getState().cats.map((c) => `${c.x},${c.y}`))

  const candidates = [
    { x: cx, y: cy - 1 },
    { x: cx, y: cy + 1 },
    { x: cx - 1, y: cy },
    { x: cx + 1, y: cy },
  ]

  return candidates.filter(({ x, y }) => {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return false
    const tile = tiles[y]?.[x]
    if (!tile || !tile.unlocked) return false
    const key = `${x},${y}`
    if (occupied.has(key) || catOccupied.has(key)) return false
    return true
  })
}

/** 从对话池随机抽取，避免重复上一次 */
function pickDialog(dialogPool: string[], lastIndex: number): { text: string; index: number } {
  if (dialogPool.length === 0) return { text: '……', index: -1 }
  if (dialogPool.length === 1) return { text: dialogPool[0], index: 0 }

  let index = lastIndex
  while (index === lastIndex) {
    index = Math.floor(Math.random() * dialogPool.length)
  }
  return { text: dialogPool[index], index }
}

export const useCatStore = create<CatStore>((set, get) => ({
  cats: [],
  lastDialog: null,

  spawnCats: (level, pomodoroCount) => {
    const existing = get().cats
    const existingTypeIds = new Set(existing.map((c) => c.typeId))

    const toSpawn = CAT_TYPES.filter((catType) => {
      if (existingTypeIds.has(catType.id)) return false
      const cond = catType.unlockCondition
      if (cond.type === 'initial') return true
      if (cond.type === 'pomodoroCount' && pomodoroCount >= (cond.count ?? 0)) return true
      if (cond.type === 'level' && level >= (cond.level ?? 0)) return true
      return false
    })

    if (toSpawn.length === 0) return

    const emptyTiles = getEmptyUnlockedTiles()
    if (emptyTiles.length === 0) return

    const newCats: CatInstance[] = toSpawn.map((catType) => {
      const tile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)]
      return {
        id: generateCatId(),
        typeId: catType.id,
        name: catType.name,
        x: tile.x,
        y: tile.y,
        state: 'idle',
        lastMovedAt: Date.now(),
        dialogCooldownUntil: 0,
        lastDialogIndex: -1,
      }
    })

    set({ cats: [...existing, ...newCats] })
  },

  moveCat: (catId) => {
    const cat = get().cats.find((c) => c.id === catId)
    if (!cat) return false
    if (cat.state === 'interacting') return false

    const candidates = getAdjacentEmptyTiles(cat.x, cat.y)
    if (candidates.length === 0) return false

    const target = candidates[Math.floor(Math.random() * candidates.length)]

    set((state) => ({
      cats: state.cats.map((c) =>
        c.id === catId
          ? { ...c, x: target.x, y: target.y, state: 'walking', lastMovedAt: Date.now() }
          : c
      ),
    }))

    return true
  },

  tickCats: () => {
    const now = Date.now()
    const cats = get().cats
    let moved = false

    for (const cat of cats) {
      if (cat.state === 'interacting' || cat.state === 'walking') continue
      const catType = getCatType(cat.typeId)
      if (!catType) continue

      if (now - cat.lastMovedAt >= catType.moveIntervalMs) {
        if (get().moveCat(cat.id)) {
          moved = true
        }
      }
    }

    return moved
  },

  interactCat: (catId) => {
    const cat = get().cats.find((c) => c.id === catId)
    if (!cat) return null

    const now = Date.now()
    // 冷却检查
    if (now < cat.dialogCooldownUntil) return null

    const catType = getCatType(cat.typeId)
    if (!catType) return null

    const { text, index } = pickDialog(catType.dialogPool, cat.lastDialogIndex)

    set((state) => ({
      cats: state.cats.map((c) =>
        c.id === catId
          ? {
              ...c,
              state: 'interacting',
              dialogCooldownUntil: now + DIALOG_COOLDOWN_MS,
              lastDialogIndex: index,
            }
          : c
      ),
      lastDialog: { catId, catName: cat.name, text },
    }))

    return text
  },

  clearLastDialog: () => set({ lastDialog: null }),

  finishMove: (catId) => {
    set((state) => ({
      cats: state.cats.map((c) =>
        c.id === catId && c.state === 'walking' ? { ...c, state: 'idle' } : c
      ),
    }))
  },

  finishInteract: (catId) => {
    set((state) => ({
      cats: state.cats.map((c) =>
        c.id === catId && c.state === 'interacting' ? { ...c, state: 'idle' } : c
      ),
    }))
  },

  hydrate: (cats) => set({ cats, lastDialog: null }),

  reset: () => set({ cats: [], lastDialog: null }),
}))
