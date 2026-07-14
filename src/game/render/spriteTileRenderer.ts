import { Container, Sprite, Texture } from 'pixi.js'
import type { TileSize, Terrain } from '@/types'
import { assetManager } from '@/game/engine/AssetManager'
import type { RoadNeighbors } from '@/game/data/roads'

function getTerrainSpriteKey(terrain: Terrain, variant = 'base'): string {
  const map: Record<Terrain, string> = {
    grass: `tile_terrain_grass_${variant}`,
    dirt: 'tile_terrain_dirt',
    forest: `tile_terrain_grass_${variant}`,
    water: 'tile_terrain_water',
    road: 'tile_road_straight_h',
  }
  return map[terrain]
}

function getRoadSpriteKey(neighbors: RoadNeighbors): string {
  const count = Object.values(neighbors).filter(Boolean).length
  if (count === 4) return 'tile_road_cross'
  if (count === 2) {
    if (neighbors.n && neighbors.s) return 'tile_road_straight_v'
    if (neighbors.e && neighbors.w) return 'tile_road_straight_h'
    return 'tile_road_corner_ne'
  }
  if (count === 3 || count === 1) return 'tile_road_corner_ne'
  return 'tile_road_straight_h'
}

export function drawTerrainSprite(
  container: Container,
  terrain: Terrain,
  sx: number,
  sy: number,
  tileSize: TileSize,
  variant = 'base'
): boolean {
  const key = getTerrainSpriteKey(terrain, variant)
  if (!assetManager.hasTexture(key)) return false

  const texture = assetManager.getTexture(key)
  if (texture === Texture.EMPTY) return false

  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 0)
  sprite.x = sx
  sprite.y = sy
  sprite.width = tileSize.w
  sprite.height = tileSize.h
  container.addChild(sprite)
  return true
}

export function drawRoadSprite(
  container: Container,
  neighbors: RoadNeighbors,
  sx: number,
  sy: number,
  tileSize: TileSize
): boolean {
  const key = getRoadSpriteKey(neighbors)
  if (!assetManager.hasTexture(key)) return false

  const texture = assetManager.getTexture(key)
  if (texture === Texture.EMPTY) return false

  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 0)
  sprite.x = sx
  sprite.y = sy
  sprite.width = tileSize.w
  sprite.height = tileSize.h
  container.addChild(sprite)
  return true
}
