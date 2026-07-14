import { Container, Graphics } from 'pixi.js'

/**
 * 像素画绘制工具
 * 将整数坐标的像素点阵放大绘制，模拟真实的 16-bit 像素画效果
 */

/** 单个像素点：颜色索引字符或 null */
export type Pixel = string | null

/** 像素画网格，左上角为原点 */
export type PixelGrid = Pixel[][]

/** 调色板映射 */
export type PixelPalette = Record<string, number | null>

interface PixelDrawOptions {
  /** 像素网格 */
  grid: PixelGrid
  /** 调色板 */
  palette: PixelPalette
  /** 单个像素的显示尺寸 */
  pixelSize: number
  /** 水平翻转（用于左右朝向） */
  flipX?: boolean
  /** 整体透明度 */
  alpha?: number
  /** 描边颜色（可选） */
  outlineColor?: number
  /** 渲染起点 x */
  x?: number
  /** 渲染起点 y */
  y?: number
}

/**
 * 绘制像素画到 Graphics
 * @returns 添加像素画的 Graphics 对象
 */
export function drawPixelArt(options: PixelDrawOptions): Graphics {
  const { grid, palette, pixelSize, flipX = false, alpha = 1, x = 0, y = 0 } = options
  const g = new Graphics()

  const rows = grid.length
  if (rows === 0) return g
  const cols = grid[0].length

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pixel = grid[row][col]
      if (pixel === null || pixel === undefined || pixel === '.') continue

      const color = palette[pixel]
      if (color === undefined || color === null) continue

      const drawCol = flipX ? cols - 1 - col : col
      const px = x + drawCol * pixelSize
      const py = y + row * pixelSize

      g.rect(px, py, pixelSize, pixelSize)
      g.fill({ color, alpha })
    }
  }

  return g
}

/**
 * 从字符数组创建像素网格
 * 每个字符对应调色板中的一个颜色键
 */
export function gridFromStrings(lines: string[]): PixelGrid {
  return lines.map((line) => line.split(''))
}

/**
 * 创建像素画容器（居中定位）
 */
export function createPixelSprite(options: PixelDrawOptions & { pivotX?: number; pivotY?: number }): Container {
  const { grid, pixelSize, pivotX = 0.5, pivotY = 1, x = 0, y = 0, ...rest } = options
  const container = new Container()
  const g = drawPixelArt({ grid, pixelSize, x: 0, y: 0, ...rest })

  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const width = cols * pixelSize
  const height = rows * pixelSize

  g.x = x - width * pivotX
  g.y = y - height * pivotY

  container.addChild(g)
  return container
}

/**
 * 绘制简单的等距像素瓦片
 * 使用像素点阵生成可爱的等距地块
 */
export function drawIsoPixelTile(
  g: Graphics,
  sx: number,
  sy: number,
  tileW: number,
  tileH: number,
  topColor: number,
  leftColor: number,
  rightColor: number,
  options?: {
    borderColor?: number
    borderAlpha?: number
    topPattern?: PixelGrid
    topPalette?: PixelPalette
    pixelSize?: number
  }
): void {
  const top = { x: sx, y: sy }
  const right = { x: sx + tileW / 2, y: sy + tileH / 2 }
  const bottom = { x: sx, y: sy + tileH }
  const left = { x: sx - tileW / 2, y: sy + tileH / 2 }

  // 左侧面
  g.poly([left.x, left.y, bottom.x, bottom.y, sx, sy + tileH, sx, sy + tileH / 2])
  g.fill({ color: leftColor })

  // 右侧面
  g.poly([right.x, right.y, bottom.x, bottom.y, sx, sy + tileH, sx, sy + tileH / 2])
  g.fill({ color: rightColor })

  // 顶面
  g.poly([top.x, top.y, right.x, right.y, bottom.x, bottom.y, left.x, left.y])
  g.fill({ color: topColor })

  const borderColor = options?.borderColor ?? 0x3e2723
  const borderAlpha = options?.borderAlpha ?? 0.2
  g.poly([top.x, top.y, right.x, right.y, bottom.x, bottom.y, left.x, left.y])
  g.stroke({ color: borderColor, width: 1, alpha: borderAlpha })

  // 可选顶面像素图案
  if (options?.topPattern && options?.topPalette) {
    const pattern = options.topPattern
    const palette = options.topPalette
    const pixelSize = options.pixelSize ?? 2
    const rows = pattern.length
    const cols = pattern[0]?.length ?? 0
    const patW = cols * pixelSize
    const patH = rows * pixelSize
    const startX = sx - patW / 2
    const startY = sy + tileH / 2 - patH / 2

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const p = pattern[row][col]
        if (p === null || p === undefined || p === '.') continue
        const color = palette[p]
        if (color === undefined || color === null) continue
        g.rect(startX + col * pixelSize, startY + row * pixelSize, pixelSize, pixelSize)
        g.fill({ color })
      }
    }
  }
}

/**
 * 颜色工具：变亮/变暗
 */
export function adjustColor(color: number, factor: number): number {
  const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor))
  const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor))
  const b = Math.min(255, Math.floor((color & 0xff) * factor))
  return (r << 16) | (g << 8) | b
}

/**
 * 混合两种颜色
 */
export function mixColor(c1: number, c2: number, ratio: number): number {
  const r = Math.floor((((c1 >> 16) & 0xff) * (1 - ratio) + ((c2 >> 16) & 0xff) * ratio))
  const g = Math.floor((((c1 >> 8) & 0xff) * (1 - ratio) + ((c2 >> 8) & 0xff) * ratio))
  const b = Math.floor(((c1 & 0xff) * (1 - ratio) + (c2 & 0xff) * ratio))
  return (r << 16) | (g << 8) | b
}
