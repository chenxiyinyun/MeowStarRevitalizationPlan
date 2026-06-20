/**
 * PixiJS 8 地图引擎
 * 依据：development-design.md 5.2.2 渲染方案、5.2.3 交互、5.2.4 性能策略、5.3 建筑系统、5.4 猫咪系统、5.6 迷雾系统
 *
 * 封装 PixiJS Application + Container，负责：
 * - 等距瓦片渲染（纯色菱形占位）
 * - 建筑渲染（等距立方体占位，按 x+y 深度排序）
 * - 猫咪渲染（纯色圆形 + 猫耳，GSAP 移动动画 + 对话气泡）
 * - 迷雾遮罩渲染（半透明遮罩覆盖未解锁区域 + GSAP 揭开动画）
 * - 相机控制（鼠标拖拽 + 滚轮缩放 + 移动端单指拖拽 + 双指捏合）
 * - 缩放范围限制 zoom ∈ [0.5, 2.0]
 * - 平移边界 padding
 * - 视口剔除（只渲染可见区域瓦片）
 * - 放置模式（高亮预览 + 点击放置）
 */
import { Application, Container, Graphics, Text } from 'pixi.js'
import gsap from 'gsap'
import type { BuildingInstance, Camera, CatInstance, FogRegion, TileData, TileSize } from '@/types'
import { prefersReducedMotion } from '@/hooks/useReducedMotion'
import {
  FOG_ALPHA,
  FOG_COLOR,
  PAN_PADDING,
  TILE_STROKE_ALPHA,
  TILE_STROKE_COLOR,
  TERRAIN_COLORS,
  ZOOM_MAX,
  ZOOM_MIN,
} from '@/types'
import { getBuildingType } from '@/game/data/buildings'
import { getRoadType, getRoadNeighbors } from '@/game/data/roads'
import { getCatType } from '@/game/data/cats'
import { getMapWorldBounds, gridToScreen, screenToGrid } from './iso'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 放置模式瓦片点击回调 */
export type TileClickCallback = (gx: number, gy: number) => void

/** 猫咪交互回调 */
export interface CatCallbacks {
  /** 点击猫咪 */
  onClick?: (catId: string) => void
  /** 移动动画完成 */
  onMoveComplete?: (catId: string) => void
  /** 互动结束（对话气泡消失） */
  onInteractComplete?: (catId: string) => void
}

export class MapEngine {
  private app: Application
  private worldContainer: Container
  private tileLayer: Container
  private buildingLayer: Container
  private catLayer: Container
  private fogLayer: Container
  private previewLayer: Container
  private tileGraphics: Map<string, Graphics> = new Map()
  private buildingGraphics: Map<string, Graphics> = new Map()
  private fogGraphics: Map<string, Graphics> = new Map()
  private catContainers: Map<string, Container> = new Map()
  private catDialogs: Map<string, Container> = new Map()
  private catCallbacks: CatCallbacks | null = null
  private previewGraphics: Graphics | null = null

  private container: HTMLElement
  private tiles: TileData[][]
  private buildings: BuildingInstance[] = []
  private gridWidth: number
  private gridHeight: number
  private tileSize: TileSize

  // 放置模式（建筑）
  private placementMode: string | null = null
  // 铺路模式（道路类型 ID）
  private pavingMode: string | null = null
  private onTileClick: TileClickCallback | null = null

  // 拖拽与缩放状态
  private pointers: Map<number, { x: number; y: number }> = new Map()
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private containerStartX = 0
  private containerStartY = 0
  private isPinching = false
  private pinchStartDistance = 0
  private pinchStartZoom = 1
  /** 拖拽距离（用于区分点击与拖拽） */
  private dragDistance = 0
  private readonly CLICK_THRESHOLD = 5

  private resizeObserver: ResizeObserver | null = null
  private initialized = false
  private destroyed = false

  /** 迷雾揭开动画进行中标记（阻止 renderFog 清除正在动画的遮罩） */
  private fogAnimationInProgress = false

  constructor(
    container: HTMLElement,
    tiles: TileData[][],
    gridWidth: number,
    gridHeight: number,
    tileSize: TileSize
  ) {
    this.container = container
    this.tiles = tiles
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight
    this.tileSize = tileSize

    this.app = new Application()
    this.worldContainer = new Container()
    this.tileLayer = new Container()
    this.buildingLayer = new Container()
    this.catLayer = new Container()
    this.fogLayer = new Container()
    this.previewLayer = new Container()
  }

  async init(): Promise<void> {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    await this.app.init({
      width: width || 800,
      height: height || 600,
      background: 0x0a0e1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    if (this.destroyed) {
      this.app.destroy(true)
      return
    }

    this.container.appendChild(this.app.canvas)
    this.app.canvas.style.touchAction = 'none'
    this.app.canvas.style.display = 'block'

    // 场景结构：stage → worldContainer → [tileLayer, buildingLayer, catLayer, fogLayer, previewLayer]
    this.app.stage.addChild(this.worldContainer)
    this.worldContainer.addChild(this.tileLayer)
    this.worldContainer.addChild(this.buildingLayer)
    this.worldContainer.addChild(this.catLayer)
    this.worldContainer.addChild(this.fogLayer)
    this.worldContainer.addChild(this.previewLayer)

    // 建筑层与猫咪层按 zIndex 排序（等距深度）
    this.buildingLayer.sortableChildren = true
    this.catLayer.sortableChildren = true

    this.centerCamera()
    this.createTiles()
    this.updateViewport()

    this.setupInteraction()
    this.setupResize()

    this.initialized = true
  }

  /** 将地图中心对齐到屏幕中心 */
  private centerCamera(): void {
    const bounds = getMapWorldBounds(this.gridWidth, this.gridHeight, this.tileSize)
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    this.worldContainer.x = this.app.screen.width / 2 - centerX
    this.worldContainer.y = this.app.screen.height / 2 - centerY
  }

  /** 创建所有地形瓦片（等距菱形纯色占位，道路叠加连接线） */
  private createTiles(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = this.tiles[y]?.[x]
        if (!tile) continue

        const g = new Graphics()
        this.drawTileGraphic(g, tile, x, y)

        this.tileLayer.addChild(g)
        this.tileGraphics.set(`${x},${y}`, g)
      }
    }
  }

  /**
   * 绘制单个瓦片图形：等距菱形底色 + 描边；
   * 若为道路，叠加4方向邻居连接线（直道/弯道/T字/十字形态）
   */
  private drawTileGraphic(g: Graphics, tile: TileData, x: number, y: number): void {
    const w = this.tileSize.w
    const h = this.tileSize.h
    const { sx, sy } = gridToScreen(x, y, this.tileSize)
    const color = this.getTileColor(tile)

    // 菱形底色
    g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
    g.fill({ color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })

    // 道路连接线（根据4方向邻居）
    if (tile.terrain === 'road') {
      this.drawRoadConnectors(g, x, y, sx, sy)
    }
  }

  /**
   * 绘制道路连接线：从瓦片中心向每个有道路邻居的方向画线到对应边中点。
   * 等距坐标下：北(y-1)→右上边、东(x+1)→右下边、南(y+1)→左下边、西(x-1)→左上边。
   * 用浅色半透明线表示路面走向，纯色占位阶段即可区分直道/弯道/十字形态。
   */
  private drawRoadConnectors(g: Graphics, x: number, y: number, sx: number, sy: number): void {
    const w = this.tileSize.w
    const h = this.tileSize.h
    const centerX = sx
    const centerY = sy + h / 2

    // 4方向对应菱形边中点
    const edgeMid = {
      n: { x: sx + w / 4, y: sy + h / 4 }, // 北 → 东北边中点
      e: { x: sx + w / 4, y: sy + (3 * h) / 4 }, // 东 → 东南边中点
      s: { x: sx - w / 4, y: sy + (3 * h) / 4 }, // 南 → 西南边中点
      w: { x: sx - w / 4, y: sy + h / 4 }, // 西 → 西北边中点
    }

    const neighbors = getRoadNeighbors(this.tiles, x, y, this.gridWidth, this.gridHeight)

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
  }

  /** 获取瓦片渲染颜色（道路使用 roadType 对应的颜色） */
  private getTileColor(tile: TileData): number {
    if (tile.terrain === 'road' && tile.roadType) {
      const roadType = getRoadType(tile.roadType)
      if (roadType) return roadType.color
    }
    return TERRAIN_COLORS[tile.terrain]
  }

  // ─── 建筑渲染 ──────────────────────────────────────────

  /** 更新建筑数据并重新渲染 */
  updateBuildings(buildings: BuildingInstance[]): void {
    this.buildings = buildings
    this.renderBuildings()
  }

  /** 渲染所有建筑（等距立方体占位，按 x+y 深度排序） */
  private renderBuildings(): void {
    // 清除旧建筑
    this.buildingLayer.removeChildren()
    this.buildingGraphics.clear()

    for (const building of this.buildings) {
      const buildingType = getBuildingType(building.typeId)
      if (!buildingType) continue

      const tile = this.tiles[building.y]?.[building.x]
      if (!tile) continue

      const { sx, sy } = gridToScreen(building.x, building.y, this.tileSize)
      const g = this.drawIsoBox(sx, sy, buildingType.color, buildingType.height)

      // 等距深度排序：x+y 越大越靠前
      g.zIndex = building.x + building.y
      this.buildingLayer.addChild(g)
      this.buildingGraphics.set(building.id, g)
    }

    this.updateViewport()
  }

  /**
   * 绘制等距立方体建筑
   * @param sx 瓦片顶部顶点 x
   * @param sy 瓦片顶部顶点 y
   * @param color 建筑颜色
   * @param height 建筑高度（像素）
   */
  private drawIsoBox(sx: number, sy: number, color: number, height: number): Graphics {
    const w = this.tileSize.w
    const h = this.tileSize.h
    const g = new Graphics()

    // 底部菱形四个点
    const right = { x: sx + w / 2, y: sy + h / 2 }
    const bottom = { x: sx, y: sy + h }
    const left = { x: sx - w / 2, y: sy + h / 2 }

    // 顶部菱形四个点（上移 height）
    const topTop = { x: sx, y: sy - height }
    const topRight = { x: sx + w / 2, y: sy + h / 2 - height }
    const topLeft = { x: sx - w / 2, y: sy + h / 2 - height }

    // 左墙面（较暗）
    const darkColor = this.darkenColor(color, 0.7)
    g.poly([left.x, left.y, bottom.x, bottom.y, sx, sy + h - height, topLeft.x, topLeft.y])
    g.fill({ color: darkColor })

    // 右墙面（中等亮度）
    const midColor = this.darkenColor(color, 0.85)
    g.poly([right.x, right.y, bottom.x, bottom.y, sx, sy + h - height, topRight.x, topRight.y])
    g.fill({ color: midColor })

    // 顶部菱形（最亮）
    g.poly([topTop.x, topTop.y, topRight.x, topRight.y, sx, sy + h - height, topLeft.x, topLeft.y])
    g.fill({ color })
    g.stroke({ color: TILE_STROKE_COLOR, width: 1, alpha: TILE_STROKE_ALPHA })

    return g
  }

  /** 颜色变暗工具 */
  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor)
    const g = Math.floor(((color >> 8) & 0xff) * factor)
    const b = Math.floor((color & 0xff) * factor)
    return (r << 16) | (g << 8) | b
  }

  // ─── 猫咪渲染 ──────────────────────────────────────────

  /**
   * 更新猫咪数据并渲染
   * 检测位置变化并触发 GSAP 移动动画
   */
  updateCats(cats: CatInstance[], callbacks?: CatCallbacks): void {
    if (callbacks) {
      this.catCallbacks = callbacks
    }

    const newCatIds = new Set(cats.map((c) => c.id))

    // 移除不存在的猫咪
    for (const [catId, container] of this.catContainers) {
      if (!newCatIds.has(catId)) {
        gsap.killTweensOf(container)
        this.removeCatDialog(catId)
        this.catLayer.removeChild(container)
        container.destroy({ children: true })
        this.catContainers.delete(catId)
      }
    }

    // 添加或更新猫咪
    for (const cat of cats) {
      const existing = this.catContainers.get(cat.id)
      const { sx, sy } = gridToScreen(cat.x, cat.y, this.tileSize)
      // 猫咪位于瓦片中心
      const targetX = sx
      const targetY = sy + this.tileSize.h / 2

      if (!existing) {
        // 新猫咪
        const container = this.drawCat(cat)
        container.x = targetX
        container.y = targetY
        container.zIndex = cat.x + cat.y
        this.catLayer.addChild(container)
        this.catContainers.set(cat.id, container)
      } else {
        // 已有猫咪 - 检查位置是否变化
        const dx = Math.abs(existing.x - targetX)
        const dy = Math.abs(existing.y - targetY)

        if (dx > 0.5 || dy > 0.5) {
          if (cat.state === 'walking') {
            // 移动动画（GSAP 屏幕坐标插值，500ms；减少动效时瞬移）
            const moveDuration = prefersReducedMotion() ? 0 : 0.5
            gsap.to(existing, {
              x: targetX,
              y: targetY,
              duration: moveDuration,
              ease: 'power2.inOut',
              onComplete: () => {
                this.catCallbacks?.onMoveComplete?.(cat.id)
              },
            })
          } else {
            // 非行走状态的位置变化（如存档恢复），直接跳转
            existing.x = targetX
            existing.y = targetY
          }
        }
        // 更新深度排序
        existing.zIndex = cat.x + cat.y
      }
    }

    this.updateViewport()
  }

  /**
   * 绘制猫咪（纯色圆形 + 猫耳三角形 + 眼睛）
   */
  private drawCat(cat: CatInstance): Container {
    const catType = getCatType(cat.typeId)
    const color = catType?.color ?? 0xffffff
    const container = new Container()

    const g = new Graphics()
    // 身体（圆形）
    g.circle(0, 0, 10)
    g.fill({ color })
    g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })

    // 左耳（三角形）
    g.poly([-9, -5, -5, -13, -2, -5])
    g.fill({ color })
    g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })

    // 右耳（三角形）
    g.poly([9, -5, 5, -13, 2, -5])
    g.fill({ color })
    g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })

    // 耳朵内侧（粉色）
    g.poly([-7, -6, -5, -10, -3, -6])
    g.fill({ color: 0xffcdd2 })
    g.poly([7, -6, 5, -10, 3, -6])
    g.fill({ color: 0xffcdd2 })

    // 眼睛（两个小黑圆）
    g.circle(-3, -1, 1.5)
    g.fill({ color: 0x1a1a2e })
    g.circle(3, -1, 1.5)
    g.fill({ color: 0x1a1a2e })

    // 鼻子（小粉色三角）
    g.poly([-1.5, 2, 1.5, 2, 0, 4])
    g.fill({ color: 0xff8a80 })

    container.addChild(g)
    return container
  }

  /**
   * 显示猫咪对话气泡
   * @param catId 猫咪 ID
   * @param text 对话文本
   */
  showCatDialog(catId: string, text: string): void {
    const catContainer = this.catContainers.get(catId)
    if (!catContainer) return

    // 移除已有对话
    this.removeCatDialog(catId)

    const dialogContainer = new Container()

    const textObj = new Text({
      text,
      style: {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: 13,
        fill: 0xf8f9fa,
        wordWrap: true,
        wordWrapWidth: 140,
        lineHeight: 18,
      },
    })

    const padding = 8
    const bgWidth = textObj.width + padding * 2
    const bgHeight = textObj.height + padding * 2
    const offsetY = -20 // 气泡在猫咪上方

    const bg = new Graphics()
    // 气泡背景（圆角矩形）
    bg.roundRect(-bgWidth / 2, offsetY - bgHeight, bgWidth, bgHeight, 8)
    bg.fill({ color: 0x1a1f2e, alpha: 0.95 })
    bg.stroke({ color: 0xc4b5fd, width: 1, alpha: 0.6 })
    // 气泡尾巴（向下三角）
    bg.poly([-5, offsetY, 5, offsetY, 0, offsetY + 6])
    bg.fill({ color: 0x1a1f2e, alpha: 0.95 })

    textObj.anchor.set(0.5, 0.5)
    textObj.x = 0
    textObj.y = offsetY - bgHeight / 2

    dialogContainer.addChild(bg)
    dialogContainer.addChild(textObj)
    dialogContainer.alpha = 0

    catContainer.addChild(dialogContainer)
    this.catDialogs.set(catId, dialogContainer)

    const reduced = prefersReducedMotion()
    // 淡入
    gsap.to(dialogContainer, {
      alpha: 1,
      duration: reduced ? 0.1 : 0.2,
      ease: 'power1.out',
    })

    // 2.2 秒后淡出，0.3 秒后移除（总 2.5 秒）
    gsap.to(dialogContainer, {
      alpha: 0,
      duration: reduced ? 0.1 : 0.3,
      delay: 2.2,
      ease: 'power1.in',
      onComplete: () => {
        this.removeCatDialog(catId)
        this.catCallbacks?.onInteractComplete?.(catId)
      },
    })
  }

  /** 移除猫咪对话气泡 */
  removeCatDialog(catId: string): void {
    const dialog = this.catDialogs.get(catId)
    if (dialog) {
      gsap.killTweensOf(dialog)
      dialog.parent?.removeChild(dialog)
      dialog.destroy({ children: true })
      this.catDialogs.delete(catId)
    }
  }

  // ─── 迷雾渲染 ──────────────────────────────────────────

  /** 更新迷雾数据并重新渲染 */
  updateFog(_fogRegions: FogRegion[]): void {
    this.renderFog()
  }

  /**
   * 迷雾揭开动画（GSAP 从中心向外扩散，800ms）
   * 对已存在的迷雾遮罩执行 alpha 渐变，从区域中心向外延迟扩散。
   * 动画期间设置 fogAnimationInProgress 标记，阻止 renderFog 清除遮罩。
   */
  animateFogReveal(regions: FogRegion[]): void {
    if (regions.length === 0 || this.destroyed) return

    this.fogAnimationInProgress = true

    const animations: Array<{ g: Graphics; key: string; delay: number }> = []

    for (const region of regions) {
      // 区域中心网格坐标
      const centerGx = region.x + (region.w - 1) / 2
      const centerGy = region.y + (region.h - 1) / 2
      const maxDist = Math.sqrt(((region.w - 1) / 2) ** 2 + ((region.h - 1) / 2) ** 2) || 1

      for (let y = region.y; y < region.y + region.h; y++) {
        for (let x = region.x; x < region.x + region.w; x++) {
          const key = `${x},${y}`
          const g = this.fogGraphics.get(key)
          if (!g) continue

          const dx = x - centerGx
          const dy = y - centerGy
          const dist = Math.sqrt(dx * dx + dy * dy)
          // 中心 delay=0，边缘 delay=0.5s，总动画 0.5+0.3=0.8s
          const delay = (dist / maxDist) * 0.5
          animations.push({ g, key, delay })
        }
      }
    }

    if (animations.length === 0) {
      this.fogAnimationInProgress = false
      this.renderFog()
      return
    }

    for (const { g, key, delay } of animations) {
      const reduced = prefersReducedMotion()
      gsap.to(g, {
        alpha: 0,
        duration: reduced ? 0.1 : 0.3,
        delay: reduced ? 0 : delay,
        ease: 'power1.out',
        onComplete: () => {
          this.fogLayer.removeChild(g)
          this.fogGraphics.delete(key)
          g.destroy()
        },
      })
    }

    // 所有动画结束后，清除标记并同步渲染
    gsap.delayedCall(0.85, () => {
      this.fogAnimationInProgress = false
      if (!this.destroyed) {
        this.renderFog()
      }
    })
  }

  /** 渲染迷雾遮罩（半透明覆盖未解锁瓦片） */
  private renderFog(): void {
    // 动画进行中时跳过，避免清除正在渐变的遮罩
    if (this.fogAnimationInProgress) return

    this.fogLayer.removeChildren()
    this.fogGraphics.clear()

    const w = this.tileSize.w
    const h = this.tileSize.h

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = this.tiles[y]?.[x]
        if (!tile || tile.unlocked) continue

        const { sx, sy } = gridToScreen(x, y, this.tileSize)
        const g = new Graphics()
        g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
        g.fill({ color: FOG_COLOR, alpha: FOG_ALPHA })
        this.fogLayer.addChild(g)
        this.fogGraphics.set(`${x},${y}`, g)
      }
    }

    this.updateViewport()
  }

  /** 更新瓦片数据（迷雾揭开后同步，铺路后道路形态变化也由此刷新） */
  updateTiles(tiles: TileData[][]): void {
    this.tiles = tiles
    // 重绘所有瓦片（道路连接线依赖邻居状态，需全量刷新）
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = tiles[y]?.[x]
        if (!tile) continue
        const g = this.tileGraphics.get(`${x},${y}`)
        if (g) {
          g.clear()
          this.drawTileGraphic(g, tile, x, y)
        }
      }
    }
    this.renderFog()
    this.renderBuildings()
  }

  // ─── 放置模式 ──────────────────────────────────────────

  /** 进入放置模式（建筑） */
  setPlacementMode(buildingTypeId: string | null, onTileClick?: TileClickCallback): void {
    this.placementMode = buildingTypeId
    this.onTileClick = onTileClick ?? null

    // 建筑放置与铺路互斥
    if (buildingTypeId) {
      this.pavingMode = null
    }

    if (!buildingTypeId) {
      // 退出放置模式，清除预览
      if (this.previewGraphics) {
        this.previewLayer.removeChildren()
        this.previewGraphics = null
      }
    }
  }

  /** 进入铺路模式（道路） */
  setPavingMode(roadTypeId: string | null, onTileClick?: TileClickCallback): void {
    this.pavingMode = roadTypeId
    this.onTileClick = onTileClick ?? null

    // 铺路与建筑放置互斥
    if (roadTypeId) {
      this.placementMode = null
    }

    if (!roadTypeId) {
      // 退出铺路模式，清除预览
      if (this.previewGraphics) {
        this.previewLayer.removeChildren()
        this.previewGraphics = null
      }
    }
  }

  /** 更新放置/铺路预览（跟随鼠标位置） */
  private updatePreview(canvasX: number, canvasY: number): void {
    if (!this.placementMode && !this.pavingMode) return

    // 屏幕坐标 → 世界坐标 → 网格坐标
    const zoom = this.worldContainer.scale.x
    const worldX = (canvasX - this.worldContainer.x) / zoom
    const worldY = (canvasY - this.worldContainer.y) / zoom
    const { gx, gy } = screenToGrid(worldX, worldY, this.tileSize)

    const tile = this.tiles[gy]?.[gx]

    // 根据模式判断可放置性
    let canPlace = false
    let previewColor = 0x6ee7b7 // 默认绿色（可放置）

    if (this.placementMode) {
      // 建筑放置：需解锁、无建筑
      const buildingType = getBuildingType(this.placementMode)
      if (!buildingType) return
      canPlace = !!tile && tile.unlocked && !tile.buildingId
    } else if (this.pavingMode) {
      // 铺路：需解锁、非水面（允许在已有道路上升级）
      const roadType = getRoadType(this.pavingMode)
      if (!roadType) return
      canPlace = !!tile && tile.unlocked && tile.terrain !== 'water'
      previewColor = roadType.color
    }

    // 清除旧预览
    this.previewLayer.removeChildren()

    const { sx, sy } = gridToScreen(gx, gy, this.tileSize)
    const w = this.tileSize.w
    const h = this.tileSize.h

    const g = new Graphics()
    const color = canPlace ? previewColor : 0xef5350
    const alpha = 0.4

    // 绘制高亮菱形
    g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
    g.fill({ color, alpha })
    g.stroke({ color, width: 2, alpha: 1 })

    // 建筑放置模式下，绘制建筑预览轮廓
    if (canPlace && this.placementMode) {
      const buildingType = getBuildingType(this.placementMode)
      if (buildingType && buildingType.height > 2) {
        g.poly([
          sx,
          sy - buildingType.height,
          sx + w / 2,
          sy + h / 2 - buildingType.height,
          sx,
          sy + h - buildingType.height,
          sx - w / 2,
          sy + h / 2 - buildingType.height,
        ])
        g.stroke({ color, width: 1, alpha: 0.6 })
      }
    }

    this.previewLayer.addChild(g)
    this.previewGraphics = g
  }

  /** 清除放置预览 */
  clearPreview(): void {
    this.previewLayer.removeChildren()
    this.previewGraphics = null
  }

  // ─── 交互事件 ──────────────────────────────────────────

  private setupInteraction(): void {
    const canvas = this.app.canvas
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
  }

  private getCanvasPoint(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const rect = this.app.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.app.canvas.setPointerCapture(e.pointerId)
    const pt = this.getCanvasPoint(e)
    this.pointers.set(e.pointerId, pt)
    this.dragDistance = 0

    if (this.pointers.size === 1) {
      this.isDragging = true
      this.dragStartX = pt.x
      this.dragStartY = pt.y
      this.containerStartX = this.worldContainer.x
      this.containerStartY = this.worldContainer.y
    } else if (this.pointers.size === 2) {
      this.isDragging = false
      this.isPinching = true
      const pts = [...this.pointers.values()]
      this.pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      this.pinchStartZoom = this.worldContainer.scale.x
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.pointers.has(e.pointerId)) {
      const pt = this.getCanvasPoint(e)
      this.pointers.set(e.pointerId, pt)
    }

    if (this.isPinching && this.pointers.size >= 2) {
      const pts = [...this.pointers.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (this.pinchStartDistance > 0) {
        const scale = dist / this.pinchStartDistance
        const newZoom = clamp(this.pinchStartZoom * scale, ZOOM_MIN, ZOOM_MAX)
        const centerX = (pts[0].x + pts[1].x) / 2
        const centerY = (pts[0].y + pts[1].y) / 2
        this.setZoom(newZoom, centerX, centerY)
      }
    } else if (this.isDragging) {
      const pt = this.getCanvasPoint(e)
      const dx = pt.x - this.dragStartX
      const dy = pt.y - this.dragStartY
      this.dragDistance = Math.hypot(dx, dy)

      this.worldContainer.x = this.containerStartX + dx
      this.worldContainer.y = this.containerStartY + dy
      this.clampCamera()
      this.updateViewport()
    }

    // 放置/铺路模式下更新预览
    if ((this.placementMode || this.pavingMode) && !this.isPinching) {
      const pt = this.getCanvasPoint(e)
      this.updatePreview(pt.x, pt.y)
    }
  }

  private onPointerUp = (e: PointerEvent): void => {
    const wasSinglePointer = this.pointers.size === 1
    this.pointers.delete(e.pointerId)

    // 判断是否为点击（拖拽距离小于阈值）
    if (wasSinglePointer && this.isDragging && this.dragDistance < this.CLICK_THRESHOLD) {
      const pt = this.getCanvasPoint(e)
      const zoom = this.worldContainer.scale.x
      const worldX = (pt.x - this.worldContainer.x) / zoom
      const worldY = (pt.y - this.worldContainer.y) / zoom

      if ((this.placementMode || this.pavingMode) && this.onTileClick) {
        const { gx, gy } = screenToGrid(worldX, worldY, this.tileSize)
        if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
          this.onTileClick(gx, gy)
        }
      } else if (!this.placementMode && !this.pavingMode) {
        // 非放置/铺路模式：检测猫咪点击
        this.handleCatClick(worldX, worldY)
      }
    }

    if (this.pointers.size < 2) {
      this.isPinching = false
    }

    if (this.pointers.size === 0) {
      this.isDragging = false
    } else if (this.pointers.size === 1) {
      const pt = [...this.pointers.values()][0]
      this.isDragging = true
      this.dragStartX = pt.x
      this.dragStartY = pt.y
      this.containerStartX = this.worldContainer.x
      this.containerStartY = this.worldContainer.y
    }
  }

  private onPointerLeave = (): void => {
    // 鼠标离开 canvas 时清除预览
    if (this.placementMode || this.pavingMode) {
      this.clearPreview()
    }
  }

  /** 检测点击是否命中猫咪（世界坐标） */
  private handleCatClick(worldX: number, worldY: number): void {
    if (!this.catCallbacks?.onClick) return

    // 猫咪点击半径（世界坐标）
    const hitRadius = 14
    const hitRadiusSq = hitRadius * hitRadius

    for (const [catId, container] of this.catContainers) {
      if (!container.visible) continue
      const dx = worldX - container.x
      const dy = worldY - container.y
      if (dx * dx + dy * dy <= hitRadiusSq) {
        this.catCallbacks.onClick(catId)
        return
      }
    }
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const pt = this.getCanvasPoint(e)
    const delta = -e.deltaY * 0.001
    const oldZoom = this.worldContainer.scale.x
    const newZoom = clamp(oldZoom * (1 + delta), ZOOM_MIN, ZOOM_MAX)
    this.setZoom(newZoom, pt.x, pt.y)
  }

  private setZoom(newZoom: number, centerX: number, centerY: number): void {
    const oldZoom = this.worldContainer.scale.x
    if (newZoom === oldZoom) return

    const worldX = (centerX - this.worldContainer.x) / oldZoom
    const worldY = (centerY - this.worldContainer.y) / oldZoom

    this.worldContainer.scale.set(newZoom)
    this.worldContainer.x = centerX - worldX * newZoom
    this.worldContainer.y = centerY - worldY * newZoom

    this.clampCamera()
    this.updateViewport()
  }

  private clampCamera(): void {
    const bounds = getMapWorldBounds(this.gridWidth, this.gridHeight, this.tileSize)
    const zoom = this.worldContainer.scale.x
    const screenW = this.app.screen.width
    const screenH = this.app.screen.height

    const worldCenterX = (screenW / 2 - this.worldContainer.x) / zoom
    const worldCenterY = (screenH / 2 - this.worldContainer.y) / zoom

    const clampedX = clamp(worldCenterX, bounds.minX - PAN_PADDING, bounds.maxX + PAN_PADDING)
    const clampedY = clamp(worldCenterY, bounds.minY - PAN_PADDING, bounds.maxY + PAN_PADDING)

    this.worldContainer.x = screenW / 2 - clampedX * zoom
    this.worldContainer.y = screenH / 2 - clampedY * zoom
  }

  private updateViewport(): void {
    const zoom = this.worldContainer.scale.x
    const screenW = this.app.screen.width
    const screenH = this.app.screen.height

    const corners = [
      { sx: 0, sy: 0 },
      { sx: screenW, sy: 0 },
      { sx: 0, sy: screenH },
      { sx: screenW, sy: screenH },
    ].map((p) => ({
      sx: (p.sx - this.worldContainer.x) / zoom,
      sy: (p.sy - this.worldContainer.y) / zoom,
    }))

    const gridCoords = corners.map((c) => screenToGrid(c.sx, c.sy, this.tileSize))

    const minGx = Math.max(0, Math.min(...gridCoords.map((g) => g.gx)) - 1)
    const maxGx = Math.min(this.gridWidth - 1, Math.max(...gridCoords.map((g) => g.gx)) + 1)
    const minGy = Math.max(0, Math.min(...gridCoords.map((g) => g.gy)) - 1)
    const maxGy = Math.min(this.gridHeight - 1, Math.max(...gridCoords.map((g) => g.gy)) + 1)

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const visible = x >= minGx && x <= maxGx && y >= minGy && y <= maxGy
        const tileG = this.tileGraphics.get(`${x},${y}`)
        if (tileG) tileG.visible = visible
        const fogG = this.fogGraphics.get(`${x},${y}`)
        if (fogG) fogG.visible = visible
      }
    }

    // 建筑视口剔除
    for (const [id, g] of this.buildingGraphics) {
      const building = this.buildings.find((b) => b.id === id)
      if (building) {
        g.visible =
          building.x >= minGx && building.x <= maxGx && building.y >= minGy && building.y <= maxGy
      }
    }

    // 猫咪视口剔除（基于世界坐标范围）
    const worldMinX = (0 - this.worldContainer.x) / zoom
    const worldMaxX = (screenW - this.worldContainer.x) / zoom
    const worldMinY = (0 - this.worldContainer.y) / zoom
    const worldMaxY = (screenH - this.worldContainer.y) / zoom
    const pad = 50
    for (const [, container] of this.catContainers) {
      container.visible =
        container.x >= worldMinX - pad &&
        container.x <= worldMaxX + pad &&
        container.y >= worldMinY - pad &&
        container.y <= worldMaxY + pad
    }
  }

  private setupResize(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.initialized || this.destroyed) return
      const width = this.container.clientWidth
      const height = this.container.clientHeight
      if (width > 0 && height > 0) {
        this.app.renderer.resize(width, height)
        this.clampCamera()
        this.updateViewport()
      }
    })
    this.resizeObserver.observe(this.container)
  }

  // ─── 公开接口 ──────────────────────────────────────────

  getCamera(): Camera {
    return {
      x: this.worldContainer.x,
      y: this.worldContainer.y,
      zoom: this.worldContainer.scale.x,
    }
  }

  setCamera(camera: Camera): void {
    const zoom = clamp(camera.zoom, ZOOM_MIN, ZOOM_MAX)
    this.worldContainer.scale.set(zoom)
    this.worldContainer.x = camera.x
    this.worldContainer.y = camera.y
    this.clampCamera()
    this.updateViewport()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    // 清理迷雾动画
    this.fogAnimationInProgress = false
    gsap.killTweensOf(this.fogGraphics.values())
    gsap.killTweensOf(this.fogLayer.children)

    // 清理猫咪动画与对话
    for (const [, container] of this.catContainers) {
      gsap.killTweensOf(container)
    }
    for (const [, dialog] of this.catDialogs) {
      gsap.killTweensOf(dialog)
    }
    this.catContainers.clear()
    this.catDialogs.clear()

    if (this.initialized) {
      const canvas = this.app.canvas
      canvas.removeEventListener('pointerdown', this.onPointerDown)
      canvas.removeEventListener('pointermove', this.onPointerMove)
      canvas.removeEventListener('pointerup', this.onPointerUp)
      canvas.removeEventListener('pointercancel', this.onPointerUp)
      canvas.removeEventListener('pointerleave', this.onPointerLeave)
      canvas.removeEventListener('wheel', this.onWheel)
    }

    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.tileGraphics.clear()
    this.buildingGraphics.clear()
    this.fogGraphics.clear()
    this.pointers.clear()

    if (this.initialized) {
      this.app.destroy(true)
    }
  }
}
