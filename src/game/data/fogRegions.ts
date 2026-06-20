/**
 * 迷雾区域划分配置
 * 依据：development-design.md 5.6.2 揭开条件
 *
 * 20×20 地图区域划分：
 * - 中心区 (7,7)-(11,11)：初始解锁
 * - 东区 (12,7)-(19,11)：等级 2
 * - 西区 (0,7)-(6,11)：等级 2
 * - 北区 (7,0)-(11,6)：完成 5 个番茄钟
 * - 南区 (7,12)-(11,19)：完成 5 个番茄钟
 * - 四角（其余）：等级 4
 */
import type { FogRegion } from '@/types'
import { GRID_HEIGHT, GRID_WIDTH } from '@/types'

/** 初始迷雾区域配置（全部 revealed=false，由 mapStore 在初始化时按条件揭开） */
export function createInitialFogRegions(): FogRegion[] {
  return [
    {
      id: 'center',
      x: 7,
      y: 7,
      w: 5,
      h: 5,
      revealed: false,
      revealCondition: { type: 'level', level: 1 },
    },
    {
      id: 'east',
      x: 12,
      y: 7,
      w: GRID_WIDTH - 12,
      h: 5,
      revealed: false,
      revealCondition: { type: 'level', level: 2 },
    },
    {
      id: 'west',
      x: 0,
      y: 7,
      w: 7,
      h: 5,
      revealed: false,
      revealCondition: { type: 'level', level: 2 },
    },
    {
      id: 'north',
      x: 7,
      y: 0,
      w: 5,
      h: 7,
      revealed: false,
      revealCondition: { type: 'pomodoroCount', count: 5 },
    },
    {
      id: 'south',
      x: 7,
      y: 12,
      w: 5,
      h: GRID_HEIGHT - 12,
      revealed: false,
      revealCondition: { type: 'pomodoroCount', count: 5 },
    },
    {
      id: 'corner_nw',
      x: 0,
      y: 0,
      w: 7,
      h: 7,
      revealed: false,
      revealCondition: { type: 'level', level: 4 },
    },
    {
      id: 'corner_ne',
      x: 12,
      y: 0,
      w: GRID_WIDTH - 12,
      h: 7,
      revealed: false,
      revealCondition: { type: 'level', level: 4 },
    },
    {
      id: 'corner_sw',
      x: 0,
      y: 12,
      w: 7,
      h: GRID_HEIGHT - 12,
      revealed: false,
      revealCondition: { type: 'level', level: 4 },
    },
    {
      id: 'corner_se',
      x: 12,
      y: 12,
      w: GRID_WIDTH - 12,
      h: GRID_HEIGHT - 12,
      revealed: false,
      revealCondition: { type: 'level', level: 4 },
    },
  ]
}

/**
 * 检查网格坐标是否在某个迷雾区域内
 * @returns 区域 ID 或 null
 */
export function getFogRegionAt(regions: FogRegion[], gx: number, gy: number): FogRegion | null {
  for (const region of regions) {
    if (gx >= region.x && gx < region.x + region.w && gy >= region.y && gy < region.y + region.h) {
      return region
    }
  }
  return null
}
