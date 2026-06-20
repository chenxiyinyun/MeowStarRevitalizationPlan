/**
 * 等距坐标转换函数
 * 依据：development-design.md 5.2.1 坐标系与转换
 *
 * 采用标准 2:1 等距投影，瓦片尺寸 64×32。
 * 网格坐标 (gx, gy) → 屏幕坐标 (sx, sy) 为瓦片顶部顶点位置。
 */
import type { TileSize } from '@/types'
import { TILE_SIZE } from '@/types'

/**
 * 网格坐标 → 屏幕坐标（瓦片顶部顶点）
 *
 * @param gx 网格 x
 * @param gy 网格 y
 * @param tileSize 瓦片尺寸，默认 64×32
 * @returns 屏幕坐标 { sx, sy }（瓦片菱形的顶部顶点）
 */
export function gridToScreen(
  gx: number,
  gy: number,
  tileSize: TileSize = TILE_SIZE
): { sx: number; sy: number } {
  return {
    sx: ((gx - gy) * tileSize.w) / 2,
    sy: ((gx + gy) * tileSize.h) / 2,
  }
}

/**
 * 网格坐标 → 屏幕坐标（瓦片中心点）
 *
 * 顶部顶点向下偏移 tileSize.h / 2 即为中心点。
 */
export function gridToScreenCenter(
  gx: number,
  gy: number,
  tileSize: TileSize = TILE_SIZE
): { cx: number; cy: number } {
  const { sx, sy } = gridToScreen(gx, gy, tileSize)
  return {
    cx: sx,
    cy: sy + tileSize.h / 2,
  }
}

/**
 * 屏幕坐标 → 网格坐标
 *
 * @param sx 屏幕 x（世界坐标系，不含相机变换）
 * @param sy 屏幕 y（世界坐标系，不含相机变换）
 * @param tileSize 瓦片尺寸，默认 64×32
 * @returns 网格坐标 { gx, gy }
 */
export function screenToGrid(
  sx: number,
  sy: number,
  tileSize: TileSize = TILE_SIZE
): { gx: number; gy: number } {
  return {
    gx: Math.floor((sx / (tileSize.w / 2) + sy / (tileSize.h / 2)) / 2),
    gy: Math.floor((sy / (tileSize.h / 2) - sx / (tileSize.w / 2)) / 2),
  }
}

/**
 * 计算地图的世界坐标边界
 *
 * 返回地图四个角中最大的范围，用于相机平移限制。
 */
export function getMapWorldBounds(
  gridWidth: number,
  gridHeight: number,
  tileSize: TileSize = TILE_SIZE
): { minX: number; maxX: number; minY: number; maxY: number } {
  // 四个角的屏幕坐标
  const corners = [
    gridToScreen(0, 0, tileSize),
    gridToScreen(gridWidth - 1, 0, tileSize),
    gridToScreen(0, gridHeight - 1, tileSize),
    gridToScreen(gridWidth - 1, gridHeight - 1, tileSize),
  ]

  // 瓦片底部需要加上 tileSize.h
  const xs = corners.map((c) => c.sx)
  const ys = corners.map((c) => c.sy)

  return {
    minX: Math.min(...xs) - tileSize.w / 2,
    maxX: Math.max(...xs) + tileSize.w / 2,
    minY: Math.min(...ys),
    maxY: Math.max(...ys) + tileSize.h,
  }
}
