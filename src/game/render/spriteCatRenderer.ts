import { Container, Sprite, Texture } from 'pixi.js'
import { assetManager } from '@/game/engine/AssetManager'
import { getCatConfig } from '@/game/data/spriteConfig'

export type CatAnimationState = 'idle' | 'walk' | 'sleep'

export interface CatSpriteOptions {
  catId: string
  state: CatAnimationState
  frame?: number
}

export function drawCatSprite(container: Container, options: CatSpriteOptions): boolean {
  const { catId, state, frame = 0 } = options
  const config = getCatConfig(catId)
  if (!config) return false

  const frames = config.frames[state]
  if (!frames || frames.length === 0) return false

  const frameKey = frames[frame % frames.length]
  if (!assetManager.hasTexture(frameKey)) return false

  const texture = assetManager.getTexture(frameKey)
  if (texture === Texture.EMPTY) return false

  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 1)
  container.addChild(sprite)

  return true
}

export function getCatFrameCount(catId: string, state: CatAnimationState): number {
  const config = getCatConfig(catId)
  if (!config) return 0
  return config.frames[state]?.length || 0
}
