/**
 * 建筑数据模型
 * 依据：development-design.md 4.3 地图与建筑、5.3 建筑系统
 */

/** 建筑类别 */
export type BuildingCategory =
  | 'nature'
  | 'road'
  | 'residence'
  | 'commercial'
  | 'facility'
  | 'decoration'
  | 'landmark'

/** 建筑类型配置（静态数据） */
export interface BuildingType {
  id: string
  name: string
  description: string
  category: BuildingCategory
  cost: { fuel: number }
  unlockLevel: number
  footprint: { w: number; h: number }
  /** 纯色占位颜色（16 进制） */
  color: number
  /** 等距渲染高度（像素），用于 3D 立体效果 */
  height: number
}

/** 建筑实例（放置在地图上的具体建筑） */
export interface BuildingInstance {
  id: string
  typeId: string
  x: number
  y: number
  placedAt: number
}

/** 建筑类别显示信息 */
export interface CategoryInfo {
  key: BuildingCategory
  label: string
  icon: string
}

/** 建筑类别列表（用于面板分类筛选） */
export const BUILDING_CATEGORIES: CategoryInfo[] = [
  { key: 'nature', label: '自然', icon: '🌿' },
  { key: 'road', label: '道路', icon: '🛤️' },
  { key: 'residence', label: '住宅', icon: '🏠' },
  { key: 'commercial', label: '商业', icon: '🏪' },
  { key: 'facility', label: '设施', icon: '💡' },
  { key: 'decoration', label: '装饰', icon: '🌸' },
  { key: 'landmark', label: '地标', icon: '🗼' },
]

/** 放置建筑获得 XP */
export const PLACE_BUILDING_XP = 10

/** 铺设道路获得 XP */
export const PAVE_ROAD_XP = 5

/** 邻路加成比例（建筑邻路时放置 XP +20%） */
export const ADJACENT_ROAD_BONUS_RATE = 0.2

/** 番茄钟完成时每个邻路建筑额外产出 XP */
export const ADJACENT_ROAD_XP_PER_BUILDING = 5

/** 拆除建筑返还燃料比例（50%） */
export const DEMOLISH_FUEL_REFUND_RATE = 0.5

/** 放置校验结果（成功时携带邻路加成信息） */
export type PlacementResult =
  | { ok: true; bonusXp?: number; adjacentToRoad?: boolean }
  | {
      ok: false
      reason: 'locked' | 'occupied' | 'no_fuel' | 'locked_building' | 'out_of_bounds' | 'water'
    }

/** 拆除校验结果（成功时携带返还燃料数量） */
export type DemolishResult =
  | { ok: true; refundedFuel: number; buildingName: string }
  | { ok: false; reason: 'no_building' | 'out_of_bounds' }

/** 移动校验结果（成功时携带建筑名称） */
export type MoveResult =
  | { ok: true; buildingName: string }
  | {
      ok: false
      reason: 'no_building' | 'out_of_bounds' | 'locked' | 'occupied' | 'water'
    }

// ─── 道路类型（独立于建筑系统，作为地形铺设） ───────────────

/** 道路类型配置（静态数据） */
export interface RoadType {
  id: string
  name: string
  description: string
  cost: { fuel: number }
  unlockLevel: number
  /** 纯色占位颜色（16 进制） */
  color: number
}

/** 铺路校验结果 */
export type PaveResult =
  | { ok: true }
  | { ok: false; reason: 'locked' | 'no_fuel' | 'locked_road' | 'out_of_bounds' | 'water' }
