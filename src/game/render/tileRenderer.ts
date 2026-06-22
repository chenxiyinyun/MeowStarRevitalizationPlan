import { Container, Graphics } from 'pixi.js'
import type { TileSize, Terrain } from '@/types'
import { TERRAIN_COLORS, TILE_STROKE_COLOR, TILE_STROKE_ALPHA } from '@/types'
import type { RoadNeighbors } from '@/game/data/roads'
import { getRoadType } from '@/game/data/roads'

/**
 * 绘制地形瓦片：纯色菱形 + 描边（无图片，天然无缝）
 */
export function drawTerrain(
  container: Container,
  terrain: Terrain,
  sx: number,
  sy: number,
  tileSize: TileSize
): void {
  const w = tileSize.w
  const h = tileSize.h
  const color = TERRAIN_COLORS[terrain]

  const g = new Graphics()
  g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
  g.fill({ color })
  g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
  container.addChild(g)
}

/**
 * 绘制道路瓦片：道路色菱形底 + 白色半透明连接线
 * 连接线根据 4 方向邻居走向，自然形成直道/弯道/T字/十字形态
 */
export function drawRoad(
  container: Container,
  neighbors: RoadNeighbors,
  roadTypeId: string | undefined,
  sx: number,
  sy: number,
  tileSize: TileSize
): void {
  const w = tileSize.w
  const h = tileSize.h
  const roadType = roadTypeId ? getRoadType(roadTypeId) : undefined
  const color = roadType?.color ?? TERRAIN_COLORS.road

  const g = new Graphics()
  // 底色菱形
  g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
  g.fill({ color })
  g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })

  // 4 方向连接线（中心→边中点）
  const centerX = sx
  const centerY = sy + h / 2
  const edgeMid = {
    n: { x: sx + w / 4, y: sy + h / 4 },
    e: { x: sx + w / 4, y: sy + (3 * h) / 4 },
    s: { x: sx - w / 4, y: sy + (3 * h) / 4 },
    w: { x: sx - w / 4, y: sy + h / 4 },
  }
  let hasConnector = false
  ;(['n', 'e', 's', 'w'] as const).forEach((dir) => {
    if (neighbors[dir]) {
      g.moveTo(centerX, centerY)
      g.lineTo(edgeMid[dir].x, edgeMid[dir].y)
      hasConnector = true
    }
  })
  if (hasConnector) {
    g.stroke({ color: 0xffffff, width: 3, alpha: 0.4 })
  }
  container.addChild(g)
}
