/**
 * 道路类型配置（5 阶段递进）
 * 依据：development-design.md 5.2.5 道路网与分区、5.3.1 建筑体系
 *
 * 道路作为地形（terrain: 'road'）铺设，不占用建筑位，
 * 建筑可放置在道路地形上（沿街建筑），形成天际线式路网骨架。
 * 颜色为纯色占位，后期替换为 AI 生成等距道路贴图。
 */
import type { RoadType, TileData } from '@/types'

export const ROAD_TYPES: RoadType[] = [
  // ─── 阶段一 · 荒野（Lv1）───
  {
    id: 'dirt_path',
    name: '泥土小路',
    description: '最基础的道路',
    cost: { fuel: 1 },
    unlockLevel: 1,
    color: 0x8d6e63,
  },

  // ─── 阶段二 · 村落（Lv2）───
  {
    id: 'gravel_path',
    name: '碎石路',
    description: '比泥路更结实',
    cost: { fuel: 2 },
    unlockLevel: 2,
    color: 0x9e9e9e,
  },

  // ─── 阶段三 · 小镇（Lv4）───
  {
    id: 'asphalt_road',
    name: '柏油路',
    description: '平整的黑色路面',
    cost: { fuel: 4 },
    unlockLevel: 4,
    color: 0x424242,
  },

  // ─── 阶段四 · 城市（Lv7）───
  {
    id: 'city_road',
    name: '城市道路',
    description: '宽阔的城市干道',
    cost: { fuel: 6 },
    unlockLevel: 7,
    color: 0x37474f,
  },

  // ─── 阶段五 · 都市（Lv11）───
  {
    id: 'highway',
    name: '高速路',
    description: '城市间的高速通道',
    cost: { fuel: 10 },
    unlockLevel: 11,
    color: 0x263238,
  },
]

/** 道路 ID → 配置 的映射 */
export const ROAD_TYPE_MAP: Record<string, RoadType> = Object.fromEntries(
  ROAD_TYPES.map((r) => [r.id, r])
)

/** 获取道路配置 */
export function getRoadType(id: string): RoadType | undefined {
  return ROAD_TYPE_MAP[id]
}

// ─── 道路形态（4方向邻居连接判断） ───────────────────────

/**
 * 道路形态枚举
 * 用于后续贴图选择：不同形态对应不同等距贴图（直道/弯道/T字/十字）
 */
export type RoadShape = 'isolated' | 'endpoint' | 'straight' | 'turn' | 't_junction' | 'cross'

/** 4方向邻居的道路连接状态（n=北/e=东/s=南/w=西） */
export interface RoadNeighbors {
  n: boolean
  e: boolean
  s: boolean
  w: boolean
}

/**
 * 查询某瓦片4方向邻居是否为道路（任意 roadType 均视为连通，
 * 不同等级道路可相互衔接，形成统一路网）
 *
 * @param tiles 瓦片二维数组
 * @param x 当前瓦片 x
 * @param y 当前瓦片 y
 * @param gridWidth 地图宽
 * @param gridHeight 地图高
 */
export function getRoadNeighbors(
  tiles: TileData[][],
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number
): RoadNeighbors {
  const isRoad = (nx: number, ny: number): boolean => {
    if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) return false
    return tiles[ny]?.[nx]?.terrain === 'road'
  }
  return {
    n: isRoad(x, y - 1),
    e: isRoad(x + 1, y),
    s: isRoad(x, y + 1),
    w: isRoad(x - 1, y),
  }
}

/**
 * 根据4方向邻居连接状态判断道路形态
 * - 0 邻居：isolated（孤立）
 * - 1 邻居：endpoint（端点）
 * - 2 邻居：对向→straight（直道），垂直→turn（弯道）
 * - 3 邻居：t_junction（T字路口）
 * - 4 邻居：cross（十字路口）
 */
export function getRoadShape(neighbors: RoadNeighbors): RoadShape {
  const count = [neighbors.n, neighbors.e, neighbors.s, neighbors.w].filter(Boolean).length
  if (count === 0) return 'isolated'
  if (count === 1) return 'endpoint'
  if (count === 3) return 't_junction'
  if (count === 4) return 'cross'
  // count === 2：判断对向（直道）或垂直（弯道）
  const opposite = (neighbors.n && neighbors.s) || (neighbors.e && neighbors.w)
  return opposite ? 'straight' : 'turn'
}

// ─── 邻路加成（迭代2） ───────────────────────────────────

/**
 * 检查指定瓦片是否相邻于道路（4方向任意一个为 road 即算邻路）
 * 用于建筑放置时的 XP 加成判断
 */
export function isAdjacentToRoad(
  tiles: TileData[][],
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  const neighbors = getRoadNeighbors(tiles, x, y, gridWidth, gridHeight)
  return neighbors.n || neighbors.e || neighbors.s || neighbors.w
}

/**
 * 统计所有相邻于道路的建筑数量（用于番茄钟完成时的 XP 加成）
 * 遍历所有建筑，检查其所在瓦片是否邻路
 *
 * @param tiles 瓦片二维数组
 * @param buildings 建筑实例列表
 * @param gridWidth 地图宽
 * @param gridHeight 地图高
 * @returns 邻路建筑数量
 */
export function countAdjacentRoadBuildings(
  tiles: TileData[][],
  buildings: { x: number; y: number }[],
  gridWidth: number,
  gridHeight: number
): number {
  let count = 0
  for (const building of buildings) {
    if (isAdjacentToRoad(tiles, building.x, building.y, gridWidth, gridHeight)) {
      count++
    }
  }
  return count
}
