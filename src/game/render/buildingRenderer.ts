import { Container, Graphics } from 'pixi.js'
import type { BuildingType, TileSize } from '@/types'
import { TILE_STROKE_COLOR, TILE_STROKE_ALPHA } from '@/types'
import { darkenColor } from './colors'

/**
 * 绘制建筑：按 category 分发，统一光照模型（顶面原色/左墙×0.7/右墙×0.85）
 */
export function drawBuilding(
  container: Container,
  building: BuildingType,
  sx: number,
  sy: number,
  tileSize: TileSize
): void {
  const w = tileSize.w
  const h = tileSize.h

  // 地标特化分支
  if (building.id === 'landmark_tower') {
    drawLandmarkTower(container, building, sx, sy, w, h)
    return
  }
  if (building.id === 'neon_sign') {
    drawNeonSign(container, building, sx, sy, w, h)
    return
  }
  if (building.id === 'skyscraper') {
    drawSkyscraper(container, building, sx, sy, w, h)
    return
  }

  // 按 category 分发
  switch (building.category) {
    case 'nature':
      drawNature(container, building, sx, sy, w, h)
      break
    case 'residence':
      drawResidence(container, building, sx, sy, w, h)
      break
    case 'commercial':
      drawCommercial(container, building, sx, sy, w, h)
      break
    case 'facility':
      drawFacility(container, building, sx, sy, w, h)
      break
    case 'decoration':
      drawDecoration(container, building, sx, sy, w, h)
      break
    case 'landmark':
      drawLandmarkTower(container, building, sx, sy, w, h)
      break
  }
}

/** 等距盒子底座（顶面+左墙+右墙），返回 Graphics 供叠加细节 */
function drawIsoBox(
  g: Graphics,
  sx: number,
  sy: number,
  w: number,
  h: number,
  color: number,
  height: number
): void {
  const right = { x: sx + w / 2, y: sy + h / 2 }
  const bottom = { x: sx, y: sy + h }
  const left = { x: sx - w / 2, y: sy + h / 2 }
  const topTop = { x: sx, y: sy - height }
  const topRight = { x: sx + w / 2, y: sy + h / 2 - height }
  const topLeft = { x: sx - w / 2, y: sy + h / 2 - height }

  // 左墙（暗）
  g.poly([left.x, left.y, bottom.x, bottom.y, sx, sy + h - height, topLeft.x, topLeft.y])
  g.fill({ color: darkenColor(color, 0.7) })
  // 右墙（中）
  g.poly([right.x, right.y, bottom.x, bottom.y, sx, sy + h - height, topRight.x, topRight.y])
  g.fill({ color: darkenColor(color, 0.85) })
  // 顶面（亮）
  g.poly([topTop.x, topTop.y, topRight.x, topRight.y, sx, sy + h - height, topLeft.x, topLeft.y])
  g.fill({ color })
  g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
}

/** nature：树=锥冠+干，灌木=圆球，池塘=扁菱形 */
function drawNature(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  if (b.id === 'pond') {
    // 扁菱形水面
    g.poly([sx, sy + h * 0.3, sx + w / 2, sy + h * 0.6, sx, sy + h * 0.9, sx - w / 2, sy + h * 0.6])
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
  } else if (b.id === 'bush') {
    // 圆球灌木
    g.circle(sx, sy + h / 2, h * 0.4)
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
  } else {
    // 树：三角锥树冠 + 棕色短干
    const trunkH = h * 0.3
    g.rect(sx - w * 0.08, sy + h - trunkH, w * 0.16, trunkH)
    g.fill({ color: 0x6d4c41 })
    const canopyTop = sy + h - trunkH - b.height
    g.poly([sx, canopyTop, sx + w * 0.35, sy + h - trunkH, sx - w * 0.35, sy + h - trunkH])
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
  }
  container.addChild(g)
}

/** residence：盒子+三角屋顶+窗户，height 决定窗户行数 */
function drawResidence(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  drawIsoBox(g, sx, sy, w, h, b.color, b.height)
  // 三角屋顶（顶面上方）
  const roofTop = sy - b.height - h * 0.3
  g.poly([sx, roofTop, sx + w / 2, sy + h / 2 - b.height, sx - w / 2, sy + h / 2 - b.height])
  g.fill({ color: darkenColor(b.color, 1.1) })
  g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
  // 窗户：右墙亮色小方块，行数=height/12
  const rows = Math.max(1, Math.floor(b.height / 12))
  const winColor = 0xfff9c4
  for (let i = 0; i < rows; i++) {
    const wy = sy + h / 2 - (b.height * (i + 0.5)) / rows
    g.rect(sx + w * 0.1, wy, w * 0.15, h * 0.2)
    g.fill({ color: winColor })
  }
  // 猫窝加圆门洞
  if (b.id === 'cat_house') {
    g.circle(sx - w * 0.15, sy + h - b.height * 0.4, w * 0.1)
    g.fill({ color: 0x3e2723 })
  }
  container.addChild(g)
}

/** commercial：盒子+玻璃窗网格 */
function drawCommercial(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  drawIsoBox(g, sx, sy, w, h, b.color, b.height)
  // 玻璃窗网格：右墙亮色小方块阵列
  const rows = Math.max(1, Math.floor(b.height / 10))
  const winColor = 0xb3e5fc
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      const wx = sx + w * 0.08 + c * w * 0.18
      const wy = sy + h / 2 - (b.height * (r + 0.5)) / rows
      g.rect(wx, wy, w * 0.12, h * 0.18)
      g.fill({ color: winColor })
    }
  }
  container.addChild(g)
}

/** facility：细杆+灯头 */
function drawFacility(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  // 杆
  g.rect(sx - w * 0.04, sy + h - b.height, w * 0.08, b.height)
  g.fill({ color: 0x607d8b })
  if (b.id === 'traffic_light') {
    // 三色竖排小圆
    const top = sy + h - b.height
    const colors = [0xef5350, 0xffeb3b, 0x66bb6a]
    colors.forEach((c, i) => {
      g.circle(sx, top + i * h * 0.35 + h * 0.2, w * 0.1)
      g.fill({ color: c })
    })
  } else {
    // 路灯/街灯：顶部圆灯
    g.circle(sx, sy + h - b.height, w * 0.14)
    g.fill({ color: b.color })
    g.circle(sx, sy + h - b.height, w * 0.22)
    g.fill({ color: b.color, alpha: 0.3 })
  }
  container.addChild(g)
}

/** decoration：花圃/长椅/公园/广场 */
function drawDecoration(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  if (b.id === 'bench') {
    // 扁木条
    g.rect(sx - w * 0.3, sy + h * 0.4, w * 0.6, h * 0.2)
    g.fill({ color: b.color })
  } else if (b.id === 'flower_bed' || b.id === 'small_park' || b.id === 'grand_park') {
    // 低盒+彩色点
    drawIsoBox(g, sx, sy, w, h, b.color, b.height)
    const flowerColors = [0xec407a, 0xffeb3b, 0xab47bc, 0xff8a65]
    for (let i = 0; i < 4; i++) {
      g.circle(sx + (i - 1.5) * w * 0.15, sy + h / 2 - b.height / 2, w * 0.06)
      g.fill({ color: flowerColors[i] })
    }
  } else {
    // 广场：几何铺装
    g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
  }
  container.addChild(g)
}

/** landmark：尖塔+发光顶球 */
function drawLandmarkTower(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  drawIsoBox(g, sx, sy, w, h, b.color, b.height)
  // 尖塔
  const spireTop = sy - b.height - h * 0.6
  g.poly([sx, spireTop, sx + w * 0.2, sy - b.height, sx - w * 0.2, sy - b.height])
  g.fill({ color: darkenColor(b.color, 0.9) })
  // 发光顶球
  g.circle(sx, spireTop, w * 0.1)
  g.fill({ color: 0xfff176 })
  g.circle(sx, spireTop, w * 0.18)
  g.fill({ color: 0xfff176, alpha: 0.4 })
  container.addChild(g)
}

/** neon_sign 特化：立式色板+发光描边 */
function drawNeonSign(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  // 色板
  g.rect(sx - w * 0.3, sy + h - b.height, w * 0.6, b.height)
  g.fill({ color: darkenColor(b.color, 0.4) })
  g.rect(sx - w * 0.3, sy + h - b.height, w * 0.6, b.height)
  g.stroke({ color: b.color, width: 2, alpha: 1 })
  // 杆
  g.rect(sx - w * 0.04, sy + h * 0.7, w * 0.08, h * 0.3)
  g.fill({ color: 0x424242 })
  container.addChild(g)
}

/** skyscraper 特化：高瘦+顶部收窄+密集窗 */
function drawSkyscraper(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  const narrowW = w * 0.7
  drawIsoBox(g, sx, sy, narrowW, h, b.color, b.height)
  // 密集窗网格
  const rows = Math.max(3, Math.floor(b.height / 8))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      const wx = sx + narrowW * 0.1 + c * narrowW * 0.3
      const wy = sy + h / 2 - (b.height * (r + 0.5)) / rows
      g.rect(wx, wy, narrowW * 0.1, h * 0.12)
      g.fill({ color: r % 2 === 0 ? 0xb3e5fc : 0xfff9c4 })
    }
  }
  container.addChild(g)
}
