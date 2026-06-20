/**
 * 道路类型配置（5 阶段递进）
 * 依据：development-design.md 5.2.5 道路网与分区、5.3.1 建筑体系
 *
 * 道路作为地形（terrain: 'road'）铺设，不占用建筑位，
 * 建筑可放置在道路地形上（沿街建筑），形成天际线式路网骨架。
 * 颜色为纯色占位，后期替换为 AI 生成等距道路贴图。
 */
import type { RoadType } from '@/types'

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
