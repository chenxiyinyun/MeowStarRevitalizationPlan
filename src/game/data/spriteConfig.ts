import type { SpriteInfo, CatSpriteConfig } from '@/game/engine/AssetManager'
import type { BuildingCategory } from '@/types'

const SPRITES_BASE = '/src/assets/sprites'

export const TILE_SPRITES: SpriteInfo[] = [
  { key: 'tile_terrain_grass_base', path: `${SPRITES_BASE}/tiles/terrain/grass_base.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_terrain_grass_variant1', path: `${SPRITES_BASE}/tiles/terrain/grass_variant1.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_terrain_grass_variant2', path: `${SPRITES_BASE}/tiles/terrain/grass_variant2.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_terrain_dirt', path: `${SPRITES_BASE}/tiles/terrain/dirt.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_terrain_stone', path: `${SPRITES_BASE}/tiles/terrain/stone.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_terrain_water', path: `${SPRITES_BASE}/tiles/terrain/water.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_road_straight_h', path: `${SPRITES_BASE}/tiles/roads/road_straight_h.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_road_straight_v', path: `${SPRITES_BASE}/tiles/roads/road_straight_v.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_road_corner_ne', path: `${SPRITES_BASE}/tiles/roads/road_corner_ne.png`, category: 'tile', width: 64, height: 32 },
  { key: 'tile_road_cross', path: `${SPRITES_BASE}/tiles/roads/road_cross.png`, category: 'tile', width: 64, height: 32 },
]

export const BUILDING_SPRITE_MAP: Record<string, { category: BuildingCategory; sprite: string; width: number; height: number; anchorY: number }> = {
  tree_small: { category: 'nature', sprite: 'tree_small', width: 64, height: 80, anchorY: 0 },
  tree_big: { category: 'nature', sprite: 'tree_big', width: 80, height: 120, anchorY: 0 },
  bush: { category: 'nature', sprite: 'bush', width: 64, height: 40, anchorY: 0 },
  mushroom: { category: 'nature', sprite: 'mushroom', width: 64, height: 50, anchorY: 0 },
  pond: { category: 'nature', sprite: 'pond', width: 96, height: 48, anchorY: 0 },

  cat_house: { category: 'residence', sprite: 'cat_house', width: 64, height: 60, anchorY: 0 },
  wooden_house: { category: 'residence', sprite: 'wooden_house', width: 64, height: 80, anchorY: 0 },
  townhouse: { category: 'residence', sprite: 'town_house', width: 64, height: 100, anchorY: 0 },
  apartment: { category: 'residence', sprite: 'apartment', width: 80, height: 140, anchorY: 0 },
  residential: { category: 'residence', sprite: 'residential', width: 96, height: 160, anchorY: 0 },
  skyscraper: { category: 'residence', sprite: 'skyscraper', width: 80, height: 240, anchorY: 0 },

  kiosk: { category: 'commercial', sprite: 'kiosk', width: 64, height: 50, anchorY: 0 },
  convenience_store: { category: 'commercial', sprite: 'convenience', width: 64, height: 70, anchorY: 0 },
  supermarket: { category: 'commercial', sprite: 'supermarket', width: 96, height: 90, anchorY: 0 },
  office_building: { category: 'commercial', sprite: 'office', width: 80, height: 150, anchorY: 0 },
  shopping_mall: { category: 'commercial', sprite: 'mall', width: 128, height: 120, anchorY: 0 },

  lamp_old: { category: 'facility', sprite: 'lamp_old', width: 32, height: 80, anchorY: 0 },
  street_lamp: { category: 'facility', sprite: 'street_lamp', width: 32, height: 100, anchorY: 0 },
  traffic_light: { category: 'facility', sprite: 'traffic_light', width: 32, height: 80, anchorY: 0 },
  bus_stop: { category: 'facility', sprite: 'bus_stop', width: 64, height: 60, anchorY: 0 },
  subway: { category: 'facility', sprite: 'subway', width: 64, height: 50, anchorY: 0 },

  flower_bed: { category: 'decoration', sprite: 'flower_bed', width: 64, height: 30, anchorY: 0 },
  bench: { category: 'decoration', sprite: 'bench', width: 64, height: 30, anchorY: 0 },
  fountain: { category: 'decoration', sprite: 'fountain', width: 80, height: 80, anchorY: 0 },
  statue: { category: 'decoration', sprite: 'statue', width: 64, height: 100, anchorY: 0 },

  clock_tower: { category: 'landmark', sprite: 'clock_tower', width: 64, height: 160, anchorY: 0 },
  landmark_tower: { category: 'landmark', sprite: 'landmark_tower', width: 80, height: 280, anchorY: 0 },
}

export const BUILDING_SPRITES: SpriteInfo[] = Object.entries(BUILDING_SPRITE_MAP).map(([id, cfg]) => ({
  key: `building_${cfg.category}_${id}`,
  path: `${SPRITES_BASE}/buildings/${cfg.category}/${cfg.sprite}.png`,
  category: cfg.category,
  width: cfg.width,
  height: cfg.height,
  anchorY: cfg.anchorY,
}))

export const CAT_CONFIGS: CatSpriteConfig[] = [
  {
    id: 'mimi',
    name: '咪咪',
    frameWidth: 48,
    frameHeight: 44,
    frames: {
      idle: ['cat_mimi_idle_01', 'cat_mimi_idle_02'],
      walk: ['cat_mimi_walk_01', 'cat_mimi_walk_02', 'cat_mimi_walk_03', 'cat_mimi_walk_04'],
      sleep: ['cat_mimi_sleep_01', 'cat_mimi_sleep_02'],
    },
  },
  {
    id: 'doudou',
    name: '豆豆',
    frameWidth: 52,
    frameHeight: 44,
    frames: {
      idle: ['cat_doudou_idle_01', 'cat_doudou_idle_02'],
      walk: ['cat_doudou_walk_01', 'cat_doudou_walk_02', 'cat_doudou_walk_03', 'cat_doudou_walk_04'],
      sleep: ['cat_doudou_sleep_01', 'cat_doudou_sleep_02'],
    },
  },
  {
    id: 'xuebao',
    name: '雪宝',
    frameWidth: 44,
    frameHeight: 48,
    frames: {
      idle: ['cat_xuebao_idle_01', 'cat_xuebao_idle_02'],
      walk: ['cat_xuebao_walk_01', 'cat_xuebao_walk_02', 'cat_xuebao_walk_03', 'cat_xuebao_walk_04'],
      sleep: ['cat_xuebao_sleep_01', 'cat_xuebao_sleep_02'],
    },
  },
]

export const CAT_SPRITES: SpriteInfo[] = CAT_CONFIGS.flatMap((cat) => {
  const allFrames = [...cat.frames.idle, ...cat.frames.walk, ...cat.frames.sleep]
  return allFrames.map((frameKey, idx) => {
    const anim = idx < cat.frames.idle.length ? 'idle' : idx < cat.frames.idle.length + cat.frames.walk.length ? 'walk' : 'sleep'
    const frameNum = anim === 'idle' ? idx + 1 : anim === 'walk' ? idx - cat.frames.idle.length + 1 : idx - cat.frames.idle.length - cat.frames.walk.length + 1
    return {
      key: frameKey,
      path: `${SPRITES_BASE}/cats/${cat.id}_${anim}_${frameNum.toString().padStart(2, '0')}.png`,
      category: 'cat',
      width: cat.frameWidth,
      height: cat.frameHeight,
    }
  })
})

export const EFFECT_SPRITES: SpriteInfo[] = [
  { key: 'effect_particles', path: `${SPRITES_BASE}/effects/particles.png`, category: 'effect', width: 64, height: 64 },
  { key: 'effect_glow', path: `${SPRITES_BASE}/effects/glow.png`, category: 'effect', width: 128, height: 128 },
]

export const UI_SPRITES: SpriteInfo[] = [
  { key: 'ui_icons', path: `${SPRITES_BASE}/ui/icons.png`, category: 'ui', width: 256, height: 256 },
]

export const ALL_SPRITES: SpriteInfo[] = [
  ...TILE_SPRITES,
  ...BUILDING_SPRITES,
  ...CAT_SPRITES,
  ...EFFECT_SPRITES,
  ...UI_SPRITES,
]

export function getBuildingSpriteKey(buildingId: string): string | null {
  const cfg = BUILDING_SPRITE_MAP[buildingId]
  if (!cfg) return null
  return `building_${cfg.category}_${buildingId}`
}

export function getBuildingSpriteInfo(buildingId: string) {
  return BUILDING_SPRITE_MAP[buildingId] || null
}

export function getCatConfig(catId: string): CatSpriteConfig | undefined {
  return CAT_CONFIGS.find((c) => c.id === catId)
}
