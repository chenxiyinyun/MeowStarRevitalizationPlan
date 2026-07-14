import { Container, Graphics } from 'pixi.js'
import type { BuildingType, TileSize, ZoneType } from '@/types'
import { TILE_STROKE_COLOR, TILE_STROKE_ALPHA, ZONE_COLORS } from '@/types'
import { darkenColor } from './colors'
import { adjustColor } from './pixelArt'

/**
 * 绘制可爱的像素风建筑
 * 使用等距盒子 + 像素装饰细节
 */

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

export function drawBuilding(
  container: Container,
  building: BuildingType,
  sx: number,
  sy: number,
  tileSize: TileSize
): void {
  const w = tileSize.w
  const h = tileSize.h

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
    case 'zone':
      drawZone(container, building, sx, sy, w, h)
      break
  }
}

/**
 * 绘制可爱的像素树
 */
function drawPixelTree(
  g: Graphics,
  sx: number,
  sy: number,
  w: number,
  h: number,
  color: number,
  height: number
): void {
  const trunkW = Math.max(4, w * 0.14)
  const trunkH = h * 0.28
  const trunkColor = 0x6d4c41

  // 树干
  g.rect(sx - trunkW / 2, sy + h - trunkH, trunkW, trunkH)
  g.fill({ color: trunkColor })

  // 树冠三层椭圆
  const canopyColors = [color, adjustColor(color, 0.88), adjustColor(color, 1.08)]
  const layers = 3
  const maxRadius = w * 0.42
  for (let i = 0; i < layers; i++) {
    const ratio = (i + 1) / layers
    const radiusX = maxRadius * ratio
    const radiusY = maxRadius * ratio * 0.65
    const cy = sy + h - trunkH - height * (1 - ratio * 0.4)
    g.ellipse(sx, cy, radiusX, radiusY)
    g.fill({ color: canopyColors[i % canopyColors.length] })
  }

  // 树冠高光
  g.ellipse(sx - w * 0.1, sy + h - trunkH - height * 0.55, w * 0.1, h * 0.07)
  g.fill({ color: adjustColor(color, 1.25), alpha: 0.35 })
}

/** nature：树、灌木、池塘 */
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
    // 可爱的像素水池
    g.poly([sx, sy + h * 0.3, sx + w / 2, sy + h * 0.6, sx, sy + h * 0.9, sx - w / 2, sy + h * 0.6])
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
    // 水波高光
    g.ellipse(sx - w * 0.1, sy + h * 0.58, w * 0.12, h * 0.06)
    g.fill({ color: 0xffffff, alpha: 0.3 })
  } else if (b.id === 'bush') {
    // 圆球灌木，带高光
    g.circle(sx, sy + h / 2, h * 0.38)
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
    g.circle(sx - w * 0.08, sy + h * 0.42, w * 0.06)
    g.fill({ color: adjustColor(b.color, 1.2), alpha: 0.4 })
  } else {
    drawPixelTree(g, sx, sy, w, h, b.color, Math.max(8, b.height))
  }
  container.addChild(g)
}

/** residence：可爱的像素小屋 */
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

  // 可爱的三角屋顶
  const roofTop = sy - b.height - h * 0.35
  const roofColor = adjustColor(b.color, 1.15)
  g.poly([sx, roofTop, sx + w / 2, sy + h / 2 - b.height, sx - w / 2, sy + h / 2 - b.height])
  g.fill({ color: roofColor })
  g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })

  // 烟囱
  const chimneyColor = darkenColor(b.color, 0.8)
  g.rect(sx + w * 0.15, roofTop + h * 0.15, w * 0.08, h * 0.25)
  g.fill({ color: chimneyColor })

  // 像素窗户（右墙）
  const rows = Math.max(1, Math.floor(b.height / 14))
  const winW = w * 0.14
  const winH = h * 0.16
  for (let i = 0; i < rows; i++) {
    const wy = sy + h / 2 - (b.height * (i + 0.5)) / rows - winH / 2
    g.rect(sx + w * 0.12, wy, winW, winH)
    g.fill({ color: 0xfff9c4 })
    // 窗框
    g.rect(sx + w * 0.12, wy, winW, winH)
    g.stroke({ color: 0x5d4037, width: 1, alpha: 0.6 })
  }

  // 门（左墙）
  const doorW = w * 0.12
  const doorH = h * 0.28
  const doorY = sy + h - b.height * 0.4 - doorH
  g.rect(sx - w * 0.2, doorY, doorW, doorH)
  g.fill({ color: 0x5d4037 })
  // 门把手
  g.circle(sx - w * 0.15, doorY + doorH * 0.5, 1.5)
  g.fill({ color: 0xffd54f })

  // 猫窝加猫门
  if (b.id === 'cat_house') {
    g.circle(sx - w * 0.15, sy + h - b.height * 0.35, w * 0.1)
    g.fill({ color: 0x3e2723 })
    // 屋顶猫耳朵
    g.poly([sx - w * 0.25, roofTop + h * 0.1, sx - w * 0.18, roofTop - h * 0.05, sx - w * 0.1, roofTop + h * 0.1])
    g.fill({ color: roofColor })
    g.poly([sx + w * 0.1, roofTop + h * 0.1, sx + w * 0.18, roofTop - h * 0.05, sx + w * 0.25, roofTop + h * 0.1])
    g.fill({ color: roofColor })
  }

  container.addChild(g)
}

/** commercial：像素商店/办公楼 */
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

  // 店铺招牌
  const signY = sy + h / 2 - b.height - h * 0.05
  g.rect(sx - w * 0.3, signY - h * 0.1, w * 0.6, h * 0.12)
  g.fill({ color: 0xffffff })
  g.stroke({ color: 0x5d4037, width: 1, alpha: 0.5 })

  // 玻璃窗网格
  const rows = Math.max(1, Math.floor(b.height / 10))
  const winW = w * 0.1
  const winH = h * 0.14
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      const wx = sx + w * 0.06 + c * w * 0.16
      const wy = sy + h / 2 - (b.height * (r + 0.5)) / rows - winH / 2
      g.rect(wx, wy, winW, winH)
      g.fill({ color: 0xb3e5fc })
      g.rect(wx, wy, winW, winH)
      g.stroke({ color: 0x5d4037, width: 1, alpha: 0.5 })
    }
  }

  // 入口门
  const doorW = w * 0.12
  const doorH = h * 0.25
  const doorY = sy + h - b.height * 0.35 - doorH
  g.rect(sx - w * 0.18, doorY, doorW, doorH)
  g.fill({ color: 0x5d4037 })

  container.addChild(g)
}

/** facility：路灯/街灯/红绿灯 */
function drawFacility(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  const poleColor = 0x607d8b
  const poleW = Math.max(3, w * 0.08)

  // 杆
  g.rect(sx - poleW / 2, sy + h - b.height, poleW, b.height)
  g.fill({ color: poleColor })

  if (b.id === 'traffic_light') {
    const top = sy + h - b.height
    const colors = [0xef5350, 0xffeb3b, 0x66bb6a]
    colors.forEach((c, i) => {
      g.rect(sx - w * 0.06, top + i * h * 0.28 + h * 0.1, w * 0.12, h * 0.16)
      g.fill({ color: c })
      g.rect(sx - w * 0.06, top + i * h * 0.28 + h * 0.1, w * 0.12, h * 0.16)
      g.stroke({ color: 0x37474f, width: 1, alpha: 0.7 })
    })
  } else {
    // 路灯顶部
    const topY = sy + h - b.height
    g.circle(sx, topY, w * 0.12)
    g.fill({ color: b.color })
    g.circle(sx, topY, w * 0.2)
    g.fill({ color: b.color, alpha: 0.25 })
    // 灯柱顶盖
    g.rect(sx - w * 0.12, topY + h * 0.05, w * 0.24, h * 0.06)
    g.fill({ color: poleColor })
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
    // 像素长椅
    const benchY = sy + h * 0.45
    g.rect(sx - w * 0.25, benchY, w * 0.5, h * 0.08)
    g.fill({ color: 0x8d6e63 })
    g.rect(sx - w * 0.25, benchY + h * 0.12, w * 0.5, h * 0.06)
    g.fill({ color: 0x6d4c41 })
    // 椅腿
    g.rect(sx - w * 0.2, benchY + h * 0.18, w * 0.04, h * 0.08)
    g.fill({ color: 0x5d4037 })
    g.rect(sx + w * 0.16, benchY + h * 0.18, w * 0.04, h * 0.08)
    g.fill({ color: 0x5d4037 })
  } else if (b.id === 'flower_bed' || b.id === 'small_park' || b.id === 'grand_park') {
    drawIsoBox(g, sx, sy, w, h, b.color, b.height)
    // 像素小花
    const flowerColors = [0xec407a, 0xffeb3b, 0xab47bc, 0xff8a65, 0x66bb6a]
    const count = b.id === 'grand_park' ? 6 : 4
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const fx = sx + Math.cos(angle) * w * 0.15
      const fy = sy + h / 2 - b.height / 2 + Math.sin(angle) * h * 0.1
      g.circle(fx, fy, w * 0.05)
      g.fill({ color: flowerColors[i % flowerColors.length] })
    }
  } else {
    // 广场
    g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
    g.fill({ color: b.color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })
    // 广场中心像素装饰
    g.circle(sx, sy + h / 2, w * 0.06)
    g.fill({ color: adjustColor(b.color, 1.2) })
  }
  container.addChild(g)
}

/** landmark：尖塔 + 发光顶球 */
function drawLandmarkTower(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  drawIsoBox(g, sx, sy, w * 0.7, h, b.color, b.height)

  // 尖塔
  const spireTop = sy - b.height - h * 0.5
  g.poly([sx, spireTop, sx + w * 0.15, sy - b.height, sx - w * 0.15, sy - b.height])
  g.fill({ color: darkenColor(b.color, 0.9) })

  // 发光顶球 + 光晕
  g.circle(sx, spireTop, w * 0.08)
  g.fill({ color: 0xfff176 })
  g.circle(sx, spireTop, w * 0.15)
  g.fill({ color: 0xfff176, alpha: 0.3 })

  container.addChild(g)
}

/** neon_sign：立式霓虹招牌 */
function drawNeonSign(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  const signH = b.height
  const signW = w * 0.5
  const signY = sy + h - signH

  // 招牌板
  g.rect(sx - signW / 2, signY, signW, signH)
  g.fill({ color: darkenColor(b.color, 0.5) })
  g.rect(sx - signW / 2, signY, signW, signH)
  g.stroke({ color: b.color, width: 2, alpha: 1 })

  // 霓虹文字/图案（简单横条）
  for (let i = 0; i < 3; i++) {
    const ly = signY + signH * 0.2 + i * signH * 0.22
    g.rect(sx - signW * 0.35, ly, signW * 0.7, signH * 0.08)
    g.fill({ color: adjustColor(b.color, 1.3), alpha: 0.8 })
  }

  // 杆
  g.rect(sx - w * 0.04, sy + h * 0.7, w * 0.08, h * 0.3)
  g.fill({ color: 0x424242 })

  container.addChild(g)
}

/** skyscraper：高瘦摩天楼 */
function drawSkyscraper(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  const narrowW = w * 0.65
  drawIsoBox(g, sx, sy, narrowW, h, b.color, b.height)

  // 天线
  g.rect(sx - 1, sy - b.height - h * 0.25, 2, h * 0.25)
  g.fill({ color: 0x90a4ae })

  // 密集窗网格
  const rows = Math.max(3, Math.floor(b.height / 8))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      const wx = sx + narrowW * 0.1 + c * narrowW * 0.28
      const wy = sy + h / 2 - (b.height * (r + 0.5)) / rows
      g.rect(wx, wy, narrowW * 0.08, h * 0.1)
      g.fill({ color: r % 2 === 0 ? 0xb3e5fc : 0xfff9c4 })
    }
  }

  container.addChild(g)
}

/** zone：规划区域标记 */
function drawZone(
  container: Container,
  b: BuildingType,
  sx: number,
  sy: number,
  w: number,
  h: number
): void {
  const g = new Graphics()
  const zoneType = b.zoneType as ZoneType
  const colors = ZONE_COLORS[zoneType] || { base: b.color, outline: darkenColor(b.color, 0.7) }

  // 像素风格规划区域：半透明底色 + 虚线边框
  g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
  g.fill({ color: colors.base, alpha: 0.25 })

  // 虚线边框效果
  g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
  g.stroke({ color: colors.outline, width: 2, alpha: 0.7 })

  // 区域内小像素图标
  const iconSize = w * 0.12
  if (zoneType === 'residential') {
    // 小房子图标
    g.rect(sx - iconSize, sy + h / 2 - iconSize, iconSize * 2, iconSize * 1.2)
    g.fill({ color: colors.outline, alpha: 0.6 })
    g.poly([sx - iconSize * 1.2, sy + h / 2 - iconSize, sx, sy + h / 2 - iconSize * 1.8, sx + iconSize * 1.2, sy + h / 2 - iconSize])
    g.fill({ color: colors.outline, alpha: 0.6 })
  } else if (zoneType === 'commercial') {
    // 小商店图标
    g.rect(sx - iconSize, sy + h / 2 - iconSize * 0.8, iconSize * 2, iconSize * 1.2)
    g.fill({ color: colors.outline, alpha: 0.6 })
    g.rect(sx - iconSize * 0.6, sy + h / 2 + iconSize * 0.2, iconSize * 1.2, iconSize * 0.6)
    g.fill({ color: darkenColor(colors.outline, 0.6), alpha: 0.6 })
  } else if (zoneType === 'industrial') {
    // 小工厂图标
    g.rect(sx - iconSize * 0.8, sy + h / 2 - iconSize * 0.4, iconSize * 1.6, iconSize)
    g.fill({ color: colors.outline, alpha: 0.6 })
    g.rect(sx - iconSize * 0.3, sy + h / 2 - iconSize * 1.2, iconSize * 0.2, iconSize * 0.8)
    g.fill({ color: colors.outline, alpha: 0.6 })
    g.rect(sx + iconSize * 0.1, sy + h / 2 - iconSize * 1.2, iconSize * 0.2, iconSize * 0.8)
    g.fill({ color: colors.outline, alpha: 0.6 })
  }

  container.addChild(g)
}
