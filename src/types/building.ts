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

/** 放置校验结果 */
export type PlacementResult =
  | { ok: true }
  | {
      ok: false
      reason: 'locked' | 'occupied' | 'no_fuel' | 'locked_building' | 'out_of_bounds' | 'water'
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
