import { Container, Graphics } from 'pixi.js'
import type { TileSize, Terrain } from '@/types'
import { TERRAIN_COLORS, TILE_STROKE_COLOR, TILE_STROKE_ALPHA } from '@/types'
import type { RoadNeighbors } from '@/game/data/roads'
import { getRoadType } from '@/game/data/roads'
import { drawIsoPixelTile, gridFromStrings, adjustColor, type PixelGrid } from './pixelArt'

/**
 * 绘制可爱的像素风地形瓦片
 * 使用等距菱形 + 顶面像素纹理，替代原本单调的纯色填充
 */

const GRASS_VARIATIONS: PixelGrid[] = [
  gridFromStrings(['ggg', 'glg', 'ggg']),
  gridFromStrings(['glg', 'ggg', 'lgg']),
  gridFromStrings(['ggg', 'ggl', 'ggg']),
  gridFromStrings(['lgg', 'ggg', 'ggl']),
]

const ROAD_PATTERN: PixelGrid = gridFromStrings(['ssss', 'ssss', 'ssss', 'ssss'])

function getTerrainPalette(terrain: Terrain): Record<string, number> {
  const baseColor = TERRAIN_COLORS[terrain]
  switch (terrain) {
    case 'grass':
    case 'forest':
      return {
        g: baseColor,
        l: adjustColor(baseColor, 1.12),
        d: adjustColor(baseColor, 0.85),
      }
    case 'dirt':
      return {
        g: baseColor,
        l: adjustColor(baseColor, 1.1),
        d: adjustColor(baseColor, 0.88),
      }
    case 'water':
      return {
        g: baseColor,
        l: adjustColor(baseColor, 1.15),
        d: adjustColor(baseColor, 0.9),
      }
    case 'road':
      return {
        s: baseColor,
        l: adjustColor(baseColor, 1.2),
        d: adjustColor(baseColor, 0.8),
      }
    default:
      return { g: baseColor }
  }
}

function hashTile(x: number, y: number): number {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
}

/**
 * 绘制地形瓦片：像素等距菱形 + 顶面纹理
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
  const baseColor = TERRAIN_COLORS[terrain]

  const g = new Graphics()

  // 水/道路不使用随机纹理，使用固定图案
  let pattern: PixelGrid | undefined
  let pixelSize = 4
  if (terrain === 'grass' || terrain === 'forest') {
    const idx = Math.floor(hashTile(sx, sy) * GRASS_VARIATIONS.length)
    pattern = GRASS_VARIATIONS[idx]
  } else if (terrain === 'road') {
    pattern = ROAD_PATTERN
    pixelSize = 6
  }

  drawIsoPixelTile(
    g,
    sx,
    sy,
    w,
    h,
    baseColor,
    adjustColor(baseColor, 0.75),
    adjustColor(baseColor, 0.9),
    {
      borderColor: TILE_STROKE_COLOR,
      borderAlpha: TILE_STROKE_ALPHA,
      topPattern: pattern,
      topPalette: getTerrainPalette(terrain),
      pixelSize,
    }
  )

  // 草地偶尔添加小像素花/草点缀
  if (terrain === 'grass' && hashTile(sx + 100, sy + 100) > 0.75) {
    const flowerColors = [0xffeb3b, 0xf48fb1, 0xffffff]
    const color = flowerColors[Math.floor(hashTile(sx, sy + 200) * flowerColors.length)]
    const fx = sx + (hashTile(sx + 50, sy + 50) - 0.5) * w * 0.4
    const fy = sy + h / 2 + (hashTile(sx + 150, sy + 150) - 0.5) * h * 0.3
    g.rect(fx, fy, 2, 2)
    g.fill({ color })
  }

  container.addChild(g)
}

/**
 * 绘制道路瓦片：像素道路 + 道路标线
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
  const baseColor = roadType?.color ?? TERRAIN_COLORS.road

  const g = new Graphics()

  drawIsoPixelTile(
    g,
    sx,
    sy,
    w,
    h,
    baseColor,
    adjustColor(baseColor, 0.75),
    adjustColor(baseColor, 0.9),
    {
      borderColor: TILE_STROKE_COLOR,
      borderAlpha: TILE_STROKE_ALPHA,
      topPattern: ROAD_PATTERN,
      topPalette: { s: baseColor, l: adjustColor(baseColor, 1.15), d: adjustColor(baseColor, 0.8) },
      pixelSize: 6,
    }
  )

  // 道路连接线和标线
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
    // 像素风道路标线（更粗的浅色线条）
    g.stroke({ color: 0xe0e0e0, width: 4, alpha: 0.5 })
  }

  container.addChild(g)
}

/**
 * 绘制可爱的像素树（用于建筑渲染器中 nature 分类，或特殊装饰）
 */
export function drawPixelTree(
  g: Graphics,
  sx: number,
  sy: number,
  w: number,
  h: number,
  color: number,
  height: number
): void {
  const trunkW = w * 0.15
  const trunkH = h * 0.25
  const trunkColor = 0x6d4c41

  // 树干（像素风格）
  g.rect(sx - trunkW / 2, sy + h - trunkH, trunkW, trunkH)
  g.fill({ color: trunkColor })

  // 树冠像素层次
  const canopyColors = [color, adjustColor(color, 0.85), adjustColor(color, 1.1)]
  const layers = 3
  const maxRadius = w * 0.4
  for (let i = 0; i < layers; i++) {
    const ratio = (i + 1) / layers
    const radiusX = maxRadius * ratio
    const radiusY = maxRadius * ratio * 0.7
    const cy = sy + h - trunkH - (height * (1 - ratio * 0.5))
    g.ellipse(sx, cy, radiusX, radiusY)
    g.fill({ color: canopyColors[i % canopyColors.length] })
  }

  // 树冠高光点缀
  g.ellipse(sx - w * 0.12, sy + h - trunkH - height * 0.6, w * 0.1, h * 0.08)
  g.fill({ color: adjustColor(color, 1.2), alpha: 0.4 })
}
