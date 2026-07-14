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
import { FOG_ALPHA, FOG_COLOR, PAN_PADDING, ZOOM_MAX, ZOOM_MIN } from '@/types'
import { getBuildingType } from '@/game/data/buildings'
import { getRoadType, getRoadNeighbors } from '@/game/data/roads'
import { getCatType } from '@/game/data/cats'
import { getMapWorldBounds, gridToScreen, screenToGrid } from './iso'
import { drawTerrain, drawRoad } from '@/game/render/tileRenderer'
import { drawBuilding } from '@/game/render/buildingRenderer'
import { drawCat as drawCatProcedural } from '@/game/render/catRenderer'
import { drawTerrainSprite, drawRoadSprite } from '@/game/render/spriteTileRenderer'
import { drawBuildingSprite } from '@/game/render/spriteBuildingRenderer'
import { drawCatSprite } from '@/game/render/spriteCatRenderer'
import { assetManager } from '@/game/engine/AssetManager'
import { ALL_SPRITES } from '@/game/data/spriteConfig'

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
  private tileContainers: Map<string, Container> = new Map()
  private buildingGraphics: Map<string, Container> = new Map()
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
  // 拆除模式（布尔，与其他模式互斥）
  private demolishMode: boolean = false
  // 移动模式（布尔，与其他模式互斥）
  private moveMode: boolean = false
  // 移动模式选中的建筑（第一步选中，第二步选目标位置）
  private moveSelectedBuilding: { x: number; y: number; buildingId: string } | null = null
  // 移动完成回调
  private onMoveComplete:
    | ((fromX: number, fromY: number, toX: number, toY: number) => void)
    | null = null
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
  private useSpriteRendering = false

  /** 迷雾揭开动画进行中标记（阻止 renderFog 清除正在动画的遮罩） */
  private fogAnimationInProgress = false

  constructor(
    container: HTMLElement,
    tiles: TileData[][],
    gridWidth: number,
    gridHeight: number,
    tileSize: TileSize,
    options?: { useSpriteRendering?: boolean }
  ) {
    this.container = container
    this.tiles = tiles
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight
    this.tileSize = tileSize
    this.useSpriteRendering = options?.useSpriteRendering ?? false

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

    // 加载精灵资源（如果启用精灵渲染）
    if (this.useSpriteRendering) {
      try {
        await assetManager.loadAll(ALL_SPRITES)
      } catch (e) {
        console.warn('[MapEngine] 精灵资源加载失败，回退到程序化渲染:', e)
        this.useSpriteRendering = false
      }
    }

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

  /** 创建所有地形瓦片（真实图片或纯色占位，道路叠加连接线） */
  private createTiles(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = this.tiles[y]?.[x]
        if (!tile) continue

        const container = new Container()
        this.drawTileGraphic(container, tile, x, y)

        this.tileLayer.addChild(container)
        this.tileContainers.set(`${x},${y}`, container)
      }
    }
  }

  private drawTileGraphic(container: Container, tile: TileData, x: number, y: number): void {
    container.removeChildren()
    const { sx, sy } = gridToScreen(x, y, this.tileSize)

    if (tile.terrain === 'road') {
      const neighbors = getRoadNeighbors(this.tiles, x, y, this.gridWidth, this.gridHeight)
      const spriteOk = this.useSpriteRendering && drawRoadSprite(container, neighbors, sx, sy, this.tileSize)
      if (!spriteOk) {
        drawRoad(container, neighbors, tile.roadType, sx, sy, this.tileSize)
      }
    } else {
      const variant = (x + y) % 3 === 0 ? 'variant1' : (x + y) % 3 === 1 ? 'variant2' : 'base'
      const spriteOk = this.useSpriteRendering && drawTerrainSprite(container, tile.terrain, sx, sy, this.tileSize, variant)
      if (!spriteOk) {
        drawTerrain(container, tile.terrain, sx, sy, this.tileSize)
      }
    }
  }

  // ─── 建筑渲染 ──────────────────────────────────────────

  /** 更新建筑数据并重新渲染 */
  updateBuildings(buildings: BuildingInstance[]): void {
    this.buildings = buildings
    this.renderBuildings()
  }

  /** 渲染所有建筑（按 category 分发渲染器，按 x+y 深度排序） */
  private renderBuildings(): void {
    this.buildingLayer.removeChildren()
    this.buildingGraphics.clear()

    for (const building of this.buildings) {
      const buildingType = getBuildingType(building.typeId)
      if (!buildingType) continue

      const tile = this.tiles[building.y]?.[building.x]
      if (!tile) continue

      const { sx, sy } = gridToScreen(building.x, building.y, this.tileSize)
      const container = new Container()
      const spriteOk = this.useSpriteRendering && drawBuildingSprite(container, buildingType, sx, sy, this.tileSize)
      if (!spriteOk) {
        drawBuilding(container, buildingType, sx, sy, this.tileSize)
      }
      container.zIndex = building.x + building.y
      this.buildingLayer.addChild(container)
      this.buildingGraphics.set(building.id, container)
    }

    this.updateViewport()
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
   * 绘制猫咪（优先精灵渲染，失败回退到程序化渲染）
   */
  private drawCat(cat: CatInstance): Container {
    const catType = getCatType(cat.typeId)
    const state: 'idle' | 'walk' | 'sleep' =
      cat.state === 'walking' ? 'walk' : cat.state === 'sleeping' ? 'sleep' : 'idle'

    const container = new Container()

    if (catType && this.useSpriteRendering) {
      const shortId = catType.id.replace('cat_', '')
      const spriteOk = drawCatSprite(container, { catId: shortId, state, frame: 0 })
      if (spriteOk) return container
    }

    return drawCatProcedural(
      catType ?? {
        id: '',
        name: '',
        personality: 'playful',
        dialogPool: [],
        moveIntervalMs: 0,
        color: 0xffffff,
        unlockCondition: { type: 'initial' },
      },
      state === 'sleep' ? 'idle' : state
    )
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
        const container = this.tileContainers.get(`${x},${y}`)
        if (container) {
          this.drawTileGraphic(container, tile, x, y)
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

    // 建筑放置与铺路/拆除互斥
    if (buildingTypeId) {
      this.pavingMode = null
      this.demolishMode = false
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

    // 铺路与建筑放置/拆除互斥
    if (roadTypeId) {
      this.placementMode = null
      this.demolishMode = false
    }

    if (!roadTypeId) {
      // 退出铺路模式，清除预览
      if (this.previewGraphics) {
        this.previewLayer.removeChildren()
        this.previewGraphics = null
      }
    }
  }

  /** 进入/退出拆除模式 */
  setDemolishMode(enabled: boolean, onTileClick?: TileClickCallback): void {
    this.demolishMode = enabled
    this.onTileClick = onTileClick ?? null

    // 拆除与建筑放置/铺路/移动互斥
    if (enabled) {
      this.placementMode = null
      this.pavingMode = null
      this.moveMode = false
      this.moveSelectedBuilding = null
    }

    if (!enabled) {
      // 退出拆除模式，清除预览
      if (this.previewGraphics) {
        this.previewLayer.removeChildren()
        this.previewGraphics = null
      }
    }
  }

  /** 进入/退出移动模式 */
  setMoveMode(
    enabled: boolean,
    onMoveComplete?: (fromX: number, fromY: number, toX: number, toY: number) => void
  ): void {
    this.moveMode = enabled
    this.onMoveComplete = onMoveComplete ?? null
    this.moveSelectedBuilding = null

    // 移动与建筑放置/铺路/拆除互斥
    if (enabled) {
      this.placementMode = null
      this.pavingMode = null
      this.demolishMode = false
    }

    if (!enabled) {
      // 退出移动模式，清除预览
      if (this.previewGraphics) {
        this.previewLayer.removeChildren()
        this.previewGraphics = null
      }
    }
  }

  /** 移动模式点击处理（两步交互：选中建筑 → 选目标位置） */
  private handleMoveClick(gx: number, gy: number): void {
    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) return

    const tile = this.tiles[gy]?.[gx]
    if (!tile) return

    if (!this.moveSelectedBuilding) {
      // 第一步：选中建筑（需有建筑且已解锁）
      if (tile.buildingId && tile.unlocked) {
        this.moveSelectedBuilding = { x: gx, y: gy, buildingId: tile.buildingId }
      }
    } else {
      const fromX = this.moveSelectedBuilding.x
      const fromY = this.moveSelectedBuilding.y

      // 点击同一位置：取消选中
      if (gx === fromX && gy === fromY) {
        this.moveSelectedBuilding = null
        this.clearPreview()
        return
      }

      // 点击其他建筑：切换选中
      if (tile.buildingId && tile.unlocked) {
        this.moveSelectedBuilding = { x: gx, y: gy, buildingId: tile.buildingId }
        return
      }

      // 点击空地：尝试移动
      this.onMoveComplete?.(fromX, fromY, gx, gy)
      // 移动后清除选中（外部通过 updateBuildings 刷新渲染）
      this.moveSelectedBuilding = null
      this.clearPreview()
    }
  }

  /** 更新放置/铺路/拆除/移动预览（跟随鼠标位置） */
  private updatePreview(canvasX: number, canvasY: number): void {
    if (!this.placementMode && !this.pavingMode && !this.demolishMode && !this.moveMode) return

    // 屏幕坐标 → 世界坐标 → 网格坐标
    const zoom = this.worldContainer.scale.x
    const worldX = (canvasX - this.worldContainer.x) / zoom
    const worldY = (canvasY - this.worldContainer.y) / zoom
    const { gx, gy } = screenToGrid(worldX, worldY, this.tileSize)

    const tile = this.tiles[gy]?.[gx]

    // 根据模式判断可操作性
    let canAct = false
    let previewColor = 0x6ee7b7 // 默认绿色（可放置/可拆除）

    if (this.placementMode) {
      // 建筑放置：需解锁、无建筑
      const buildingType = getBuildingType(this.placementMode)
      if (!buildingType) return
      canAct = !!tile && tile.unlocked && !tile.buildingId
    } else if (this.pavingMode) {
      // 铺路：需解锁、非水面（允许在已有道路上升级）
      const roadType = getRoadType(this.pavingMode)
      if (!roadType) return
      canAct = !!tile && tile.unlocked && tile.terrain !== 'water'
      previewColor = roadType.color
    } else if (this.demolishMode) {
      // 拆除：需有建筑才能拆除（红色表示不可拆，绿色表示可拆）
      canAct = !!tile && !!tile.buildingId
      previewColor = 0xef5350 // 拆除模式用红色高亮
    } else if (this.moveMode) {
      // 移动模式
      if (!this.moveSelectedBuilding) {
        // 第一步：选中建筑（需有建筑且已解锁）
        canAct = !!tile && !!tile.buildingId && tile.unlocked
        previewColor = 0x60a5fa // 蓝色表示可选中
      } else {
        // 第二步：选择目标位置
        const isSamePos = gx === this.moveSelectedBuilding.x && gy === this.moveSelectedBuilding.y
        canAct =
          !!tile && tile.unlocked && !tile.buildingId && tile.terrain !== 'water' && !isSamePos
        previewColor = canAct ? 0x6ee7b7 : 0xef5350
      }
    }

    // 清除旧预览
    this.previewLayer.removeChildren()

    const { sx, sy } = gridToScreen(gx, gy, this.tileSize)
    const w = this.tileSize.w
    const h = this.tileSize.h

    const g = new Graphics()
    // 拆除模式：可拆用红色实心高亮，不可拆用半透明灰
    // 移动模式（未选中）：可选中用蓝色，不可选中用半透明灰
    // 移动模式（已选中）：可移动用绿色，不可移动用红色
    // 其他模式：可操作用对应颜色，不可操作用红色
    const color = this.demolishMode
      ? canAct
        ? 0xef5350
        : 0x6b7280
      : this.moveMode && !this.moveSelectedBuilding
        ? canAct
          ? 0x60a5fa
          : 0x6b7280
        : canAct
          ? previewColor
          : 0xef5350
    const alpha = 0.4

    // 绘制高亮菱形
    g.poly([sx, sy, sx + w / 2, sy + h / 2, sx, sy + h, sx - w / 2, sy + h / 2])
    g.fill({ color, alpha })
    g.stroke({ color, width: 2, alpha: 1 })

    // 建筑放置模式下，绘制建筑预览轮廓
    if (canAct && this.placementMode) {
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

    // 拆除模式下，绘制 X 标记
    if (this.demolishMode && canAct) {
      const centerX = sx
      const centerY = sy + h / 2
      const size = Math.min(w, h) * 0.2
      g.moveTo(centerX - size, centerY - size)
      g.lineTo(centerX + size, centerY + size)
      g.moveTo(centerX + size, centerY - size)
      g.lineTo(centerX - size, centerY + size)
      g.stroke({ color: 0xffffff, width: 2, alpha: 0.9 })
    }

    // 移动模式下，绘制选中建筑的高亮标记和移动指示
    if (this.moveMode && this.moveSelectedBuilding) {
      const { sx: selSx, sy: selSy } = gridToScreen(
        this.moveSelectedBuilding.x,
        this.moveSelectedBuilding.y,
        this.tileSize
      )
      // 选中建筑的蓝色脉冲边框
      g.poly([
        selSx,
        selSy,
        selSx + w / 2,
        selSy + h / 2,
        selSx,
        selSy + h,
        selSx - w / 2,
        selSy + h / 2,
      ])
      g.stroke({ color: 0x60a5fa, width: 3, alpha: 1 })

      // 如果目标位置有效，绘制从源到目标的连线
      if (canAct) {
        const fromCenterX = selSx
        const fromCenterY = selSy + h / 2
        const toCenterX = sx
        const toCenterY = sy + h / 2
        g.moveTo(fromCenterX, fromCenterY)
        g.lineTo(toCenterX, toCenterY)
        g.stroke({ color: 0x6ee7b7, width: 2, alpha: 0.6 })
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

    // 放置/铺路/拆除/移动模式下更新预览
    if (
      (this.placementMode || this.pavingMode || this.demolishMode || this.moveMode) &&
      !this.isPinching
    ) {
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
      const { gx, gy } = screenToGrid(worldX, worldY, this.tileSize)

      if (this.moveMode) {
        // 移动模式：两步交互（选中建筑 → 选目标位置）
        this.handleMoveClick(gx, gy)
      } else if ((this.placementMode || this.pavingMode || this.demolishMode) && this.onTileClick) {
        if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
          this.onTileClick(gx, gy)
        }
      } else if (!this.placementMode && !this.pavingMode && !this.demolishMode) {
        // 非放置/铺路/拆除模式：检测猫咪点击
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
    if (this.placementMode || this.pavingMode || this.demolishMode || this.moveMode) {
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
        const tileContainer = this.tileContainers.get(`${x},${y}`)
        if (tileContainer) tileContainer.visible = visible
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
    this.tileContainers.clear()
    this.buildingGraphics.clear()
    this.fogGraphics.clear()
    this.pointers.clear()

    if (this.initialized) {
      this.app.destroy(true)
    }
  }
}
