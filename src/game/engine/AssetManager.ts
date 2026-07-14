import { Texture, Assets } from 'pixi.js'
import type { BuildingCategory } from '@/types'

export interface SpriteInfo {
  key: string
  path: string
  category: string
  width: number
  height: number
  /** 精灵底部相对于图片底部的偏移（用于等距定位） */
  anchorY?: number
}

export interface CatAnimationFrames {
  idle: string[]
  walk: string[]
  sleep: string[]
}

export interface CatSpriteConfig {
  id: string
  name: string
  frames: CatAnimationFrames
  frameWidth: number
  frameHeight: number
}

class AssetManager {
  private textures = new Map<string, Texture>()
  private loaded = false
  private loadingPromise: Promise<void> | null = null

  get isLoaded(): boolean {
    return this.loaded
  }

  async loadAll(sprites: SpriteInfo[]): Promise<void> {
    if (this.loaded) return
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = this.doLoad(sprites)
    return this.loadingPromise
  }

  private async doLoad(sprites: SpriteInfo[]): Promise<void> {
    const manifest = {
      bundles: [
        {
          name: 'sprites',
          assets: sprites.map((s) => ({
            alias: s.key,
            src: s.path,
          })),
        },
      ],
    }

    await Assets.init({ manifest })
    await Assets.loadBundle('sprites')

    for (const s of sprites) {
      const texture = Texture.from(s.path)
      this.textures.set(s.key, texture)
    }

    this.loaded = true
    this.loadingPromise = null
  }

  getTexture(key: string): Texture {
    const tex = this.textures.get(key)
    if (!tex) {
      console.warn(`[AssetManager] 未找到纹理: ${key}`)
      return Texture.EMPTY
    }
    return tex
  }

  hasTexture(key: string): boolean {
    return this.textures.has(key)
  }
}

export const assetManager = new AssetManager()

export function buildingSpriteKey(category: BuildingCategory, buildingId: string): string {
  return `building_${category}_${buildingId}`
}

export function tileSpriteKey(type: string, variant: string): string {
  return `tile_${type}_${variant}`
}

export function catSpriteKey(catId: string, animation: string, frame: number): string {
  return `cat_${catId}_${animation}_${frame.toString().padStart(2, '0')}`
}
