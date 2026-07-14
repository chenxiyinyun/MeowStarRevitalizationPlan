import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SPRITES_DIR = join(__dirname, '../src/assets/sprites')

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createChunk(type, data) {
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeData), 0)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  return Buffer.concat([length, typeData, crc])
}

function createPNG(width, height, colorRGBA) {
  const [r, g, b, a = 255] = colorRGBA

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rawData = []
  for (let y = 0; y < height; y++) {
    rawData.push(0)
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b, a)
    }
  }
  const raw = Buffer.from(rawData)
  const compressed = zlib.deflateSync(raw)

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ])
}

function parseColor(hex) {
  if (hex.startsWith('#')) hex = hex.slice(1)
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
    255,
  ]
}

function savePNG(relativePath, width, height, color) {
  const fullPath = join(SPRITES_DIR, relativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  const buffer = createPNG(width, height, parseColor(color))
  writeFileSync(fullPath, buffer)
  console.log(`  ✓ ${relativePath} (${width}x${height})`)
}

console.log('🎨 生成像素美术占位文件...\n')

console.log('=== 地形瓦片 ===')
savePNG('tiles/terrain/grass_base.png', 64, 32, '#4caf50')
savePNG('tiles/terrain/grass_variant1.png', 64, 32, '#66bb6a')
savePNG('tiles/terrain/grass_variant2.png', 64, 32, '#388e3c')
savePNG('tiles/terrain/dirt.png', 64, 32, '#8d6e63')
savePNG('tiles/terrain/stone.png', 64, 32, '#9e9e9e')
savePNG('tiles/terrain/water.png', 64, 32, '#03a9f4')

console.log('\n=== 道路瓦片 ===')
savePNG('tiles/roads/road_straight_h.png', 64, 32, '#795548')
savePNG('tiles/roads/road_straight_v.png', 64, 32, '#6d4c41')
savePNG('tiles/roads/road_corner_ne.png', 64, 32, '#8d6e63')
savePNG('tiles/roads/road_cross.png', 64, 32, '#a1887f')

console.log('\n=== 自然类建筑 ===')
savePNG('buildings/nature/tree_small.png', 64, 80, '#2e7d32')
savePNG('buildings/nature/tree_big.png', 80, 120, '#388e3c')
savePNG('buildings/nature/bush.png', 64, 40, '#558b2f')
savePNG('buildings/nature/mushroom.png', 64, 50, '#e53935')
savePNG('buildings/nature/pond.png', 96, 48, '#0288d1')

console.log('\n=== 居住类建筑 ===')
savePNG('buildings/residence/cat_house.png', 64, 60, '#ffab91')
savePNG('buildings/residence/wooden_house.png', 64, 80, '#a1887f')
savePNG('buildings/residence/town_house.png', 64, 100, '#d7ccc8')
savePNG('buildings/residence/apartment.png', 80, 140, '#90caf9')
savePNG('buildings/residence/residential.png', 96, 160, '#64b5f6')
savePNG('buildings/residence/skyscraper.png', 80, 240, '#ce93d8')

console.log('\n=== 商业类建筑 ===')
savePNG('buildings/commercial/kiosk.png', 64, 50, '#ff8a65')
savePNG('buildings/commercial/convenience.png', 64, 70, '#4db6ac')
savePNG('buildings/commercial/supermarket.png', 96, 90, '#26a69a')
savePNG('buildings/commercial/office.png', 80, 150, '#78909c')
savePNG('buildings/commercial/mall.png', 128, 120, '#ffb74d')

console.log('\n=== 设施类建筑 ===')
savePNG('buildings/facility/lamp_old.png', 32, 80, '#ffd54f')
savePNG('buildings/facility/street_lamp.png', 32, 100, '#fff176')
savePNG('buildings/facility/traffic_light.png', 32, 80, '#f44336')
savePNG('buildings/facility/bus_stop.png', 64, 60, '#4fc3f7')
savePNG('buildings/facility/subway.png', 64, 50, '#7c4dff')

console.log('\n=== 装饰类建筑 ===')
savePNG('buildings/decoration/flower_bed.png', 64, 30, '#f06292')
savePNG('buildings/decoration/bench.png', 64, 30, '#8d6e63')
savePNG('buildings/decoration/fountain.png', 80, 80, '#4dd0e1')
savePNG('buildings/decoration/statue.png', 64, 100, '#bcaaa4')

console.log('\n=== 地标类建筑 ===')
savePNG('buildings/landmark/clock_tower.png', 64, 160, '#ffcc80')
savePNG('buildings/landmark/landmark_tower.png', 80, 280, '#ba68c8')

console.log('\n=== 猫咪（咪咪 - 橘猫）===')
savePNG('cats/mimi_idle_01.png', 48, 44, '#ff8a65')
savePNG('cats/mimi_idle_02.png', 48, 44, '#ff7043')
savePNG('cats/mimi_walk_01.png', 48, 44, '#ff8a65')
savePNG('cats/mimi_walk_02.png', 48, 44, '#ff7043')
savePNG('cats/mimi_walk_03.png', 48, 44, '#ff8a65')
savePNG('cats/mimi_walk_04.png', 48, 44, '#ff7043')
savePNG('cats/mimi_sleep_01.png', 48, 32, '#ffab91')
savePNG('cats/mimi_sleep_02.png', 48, 32, '#ffccbc')

console.log('\n=== 猫咪（豆豆 - 灰猫）===')
savePNG('cats/doudou_idle_01.png', 52, 44, '#9e9e9e')
savePNG('cats/doudou_idle_02.png', 52, 44, '#757575')
savePNG('cats/doudou_walk_01.png', 52, 44, '#9e9e9e')
savePNG('cats/doudou_walk_02.png', 52, 44, '#757575')
savePNG('cats/doudou_walk_03.png', 52, 44, '#9e9e9e')
savePNG('cats/doudou_walk_04.png', 52, 44, '#757575')
savePNG('cats/doudou_sleep_01.png', 52, 32, '#bdbdbd')
savePNG('cats/doudou_sleep_02.png', 52, 32, '#e0e0e0')

console.log('\n=== 猫咪（雪宝 - 白猫）===')
savePNG('cats/xuebao_idle_01.png', 44, 48, '#fafafa')
savePNG('cats/xuebao_idle_02.png', 44, 48, '#f5f5f5')
savePNG('cats/xuebao_walk_01.png', 44, 48, '#fafafa')
savePNG('cats/xuebao_walk_02.png', 44, 48, '#f5f5f5')
savePNG('cats/xuebao_walk_03.png', 44, 48, '#fafafa')
savePNG('cats/xuebao_walk_04.png', 44, 48, '#f5f5f5')
savePNG('cats/xuebao_sleep_01.png', 44, 36, '#eeeeee')
savePNG('cats/xuebao_sleep_02.png', 44, 36, '#e0e0e0')

console.log('\n=== 特效 ===')
savePNG('effects/particles.png', 64, 64, '#ffeb3b')
savePNG('effects/glow.png', 128, 128, '#ff6b35')

console.log('\n=== UI ===')
savePNG('ui/icons.png', 256, 256, '#c4b5fd')

console.log('\n✨ 所有占位文件生成完成！')
console.log(`📁 目录: ${SPRITES_DIR}`)
