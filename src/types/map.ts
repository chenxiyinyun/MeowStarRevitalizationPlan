/**
 * 地图与瓦片数据模型
 * 依据：development-design.md 4.3 地图与建筑、5.2 等距地图系统
 */

/** 瓦片像素尺寸（标准 2:1 等距投影） */
export interface TileSize {
  w: number
  h: number
}

/** 地形类型 */
export type Terrain = 'grass' | 'dirt' | 'forest' | 'water' | 'road'

/** 瓦片数据 */
export interface TileData {
  x: number // 网格坐标 x
  y: number // 网格坐标 y
  terrain: Terrain
  unlocked: boolean // 是否已解锁（非迷雾）
  buildingId?: string // 占据该瓦片的建筑实例 ID
  /** 道路子类型 ID（仅当 terrain === 'road' 时有值），对应 RoadType.id */
  roadType?: string
}

/** 相机状态 */
export interface Camera {
  x: number // 世界容器 x 偏移（屏幕像素）
  y: number // 世界容器 y 偏移（屏幕像素）
  zoom: number // 缩放比例
}

/** 地图状态 */
export interface MapState {
  gridWidth: number
  gridHeight: number
  tileSize: TileSize
  camera: Camera
  tiles: TileData[][] // 二维数组 [y][x]
}

// ─── 常量 ───────────────────────────────────────────────

/** 默认瓦片尺寸 64×32 */
export const TILE_SIZE: TileSize = { w: 64, h: 32 }

/** 默认网格尺寸 20×20 */
export const GRID_WIDTH = 20
export const GRID_HEIGHT = 20

/** 缩放范围 */
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 2.0

/** 平移边界外扩 padding（屏幕像素） */
export const PAN_PADDING = 200

/** 地形颜色映射（纯色占位，后期替换为 AI 生成贴图） */
export const TERRAIN_COLORS: Record<Terrain, number> = {
  grass: 0x4a9d5e, // 草地绿
  dirt: 0x8d6e63, // 泥土棕
  forest: 0x2e7d32, // 森林深绿
  water: 0x42a5f5, // 水蓝
  road: 0x757575, // 道路灰
}

/** 瓦片描边颜色 */
export const TILE_STROKE_COLOR = 0x000000
export const TILE_STROKE_ALPHA = 0.1

// ─── 迷雾系统 ───────────────────────────────────────────

/** 迷雾揭开条件 */
export interface FogRevealCondition {
  type: 'level' | 'pomodoroCount'
  level?: number
  count?: number
}

/** 迷雾区域 */
export interface FogRegion {
  id: string
  x: number // 区域左上角网格坐标 x
  y: number // 区域左上角网格坐标 y
  w: number // 区域宽（瓦片数）
  h: number // 区域高（瓦片数）
  revealed: boolean
  revealCondition: FogRevealCondition
}

/** 迷雾遮罩颜色与透明度 */
export const FOG_COLOR = 0x0a0e1a
export const FOG_ALPHA = 0.85
