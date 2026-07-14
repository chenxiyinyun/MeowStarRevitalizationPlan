import { Container, Sprite, Texture } from 'pixi.js'
import type { BuildingType, TileSize } from '@/types'
import { assetManager } from '@/game/engine/AssetManager'
import { getBuildingSpriteKey, getBuildingSpriteInfo } from '@/game/data/spriteConfig'

export function drawBuildingSprite(
  container: Container,
  buildingType: BuildingType,
  sx: number,
  sy: number,
  tileSize: TileSize
): boolean {
  const key = getBuildingSpriteKey(buildingType.id)
  if (!key || !assetManager.hasTexture(key)) return false

  const texture = assetManager.getTexture(key)
  if (texture === Texture.EMPTY) return false

  const spriteInfo = getBuildingSpriteInfo(buildingType.id)
  const sprite = new Sprite(texture)

  sprite.anchor.set(0.5, 1)
  sprite.x = sx
  sprite.y = sy + tileSize.h / 2

  if (spriteInfo) {
    const targetW = tileSize.w * 0.9
    const scale = targetW / spriteInfo.width
    sprite.scale.set(scale)
  } else {
    sprite.width = tileSize.w * 0.9
    sprite.height = sprite.width * (texture.height / texture.width)
  }

  container.addChild(sprite)
  return true
}
