/**
 * 素材规范化处理脚本（规范画布方案）
 * 依据：docs/art-assets-requirements.md 第九节
 *
 * 解决问题：旧版"裁剪到内容边界框"策略导致每张图尺寸比例各不相同，
 * 运行时缩放变形、瓦片无法对齐。新版改为把内容等比缩放后放置到
 * 固定尺寸/比例的"规范画布"，保证所有素材比例恒定。
 *
 * 流程：去白背景 → 检测内容边界框 → 等比缩放 → 放置到规范画布 → 校验
 *
 * 用法：
 *   node scripts/process-tile-images.mjs            # 处理所有配置目录
 *   node scripts/process-tile-images.mjs --check    # 仅校验尺寸是否符合规范画布，不修改
 */
import sharp from 'sharp'
import { readdir, stat, rename, unlink } from 'fs/promises'
import { join, extname, dirname, basename } from 'path'

// 白色背景阈值：RGB 都大于此值视为背景
const BG_THRESHOLD = 250
// 与纯白的容差：差异小于此值也视为背景
const BG_TOLERANCE = 5

/**
 * 规范画布配置表
 * align 说明：
 *   - stretch：内容直接拉伸到画布尺寸（瓦片，需菱形顶点触边铺满，纠正 AI 不完美比例）
 *   - center：内容等比缩放后水平+垂直居中（UI 图标）
 *   - bottom：内容等比缩放后水平居中、底边贴画布底（建筑、猫咪）
 *   - cover ：内容等比铺满画布并裁掉超出部分（背景插画）
 */
const ASSET_SPECS = [
  { dir: 'src/assets/sprites/tiles/terrain', canvas: [1024, 512], align: 'stretch' },
  { dir: 'src/assets/sprites/tiles/roads', canvas: [1024, 512], align: 'stretch' },
  { dir: 'src/assets/sprites/buildings/nature', canvas: [1024, 1024], align: 'bottom' },
  { dir: 'src/assets/sprites/buildings/residence', canvas: [1024, 1024], align: 'bottom' },
  { dir: 'src/assets/sprites/buildings/commercial', canvas: [1024, 1536], align: 'bottom' },
  { dir: 'src/assets/sprites/buildings/facility', canvas: [1024, 1024], align: 'bottom' },
  { dir: 'src/assets/sprites/buildings/decoration', canvas: [1024, 1024], align: 'bottom' },
  { dir: 'src/assets/sprites/buildings/landmark', canvas: [1024, 2048], align: 'bottom' },
  { dir: 'src/assets/sprites/cats', canvas: [512, 512], align: 'bottom' },
  { dir: 'src/assets/sprites/ui', canvas: [512, 512], align: 'center' },
  { dir: 'src/assets/sprites/backgrounds', canvas: [1920, 1080], align: 'cover' },
]

/**
 * 第一步：去除纯白背景，返回处理后的 raw 像素 buffer
 */
async function removeWhiteBackground(inputPath) {
  const image = sharp(inputPath)
  const { width, height } = await image.metadata()
  if (!width || !height) {
    throw new Error(`无法读取图片元数据: ${inputPath}`)
  }

  const raw = await image.ensureAlpha().raw().toBuffer()

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i]
    const g = raw[i + 1]
    const b = raw[i + 2]
    const a = raw[i + 3]

    if (a === 0) continue

    const isWhite = r >= BG_THRESHOLD && g >= BG_THRESHOLD && b >= BG_THRESHOLD
    const nearWhite =
      Math.abs(r - 255) <= BG_TOLERANCE &&
      Math.abs(g - 255) <= BG_TOLERANCE &&
      Math.abs(b - 255) <= BG_TOLERANCE

    if (isWhite || nearWhite) {
      raw[i + 3] = 0
    }
  }

  return { raw, width, height }
}

/**
 * 第二步：检测非透明内容边界框
 */
function detectContentBounds(raw, width, height) {
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (raw[idx + 3] > 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (minX > maxX || minY > maxY) return null
  return {
    minX,
    minY,
    cw: maxX - minX + 1,
    ch: maxY - minY + 1,
  }
}

/**
 * 第三步 + 第四步：等比缩放并放置到规范画布，返回 sharp pipeline
 */
async function normalizeToCanvas(raw, width, height, bounds, canvasW, canvasH, align) {
  const { minX, minY, cw, ch } = bounds

  // 裁出内容区域
  const contentRegion = sharp(raw, {
    raw: { width, height, channels: 4 },
  }).extract({ left: minX, top: minY, width: cw, height: ch })

  if (align === 'stretch') {
    // 瓦片：只裁上下透明边，保持原始宽度不变，拉伸到画布尺寸
    // 不裁左右边界——菱形左右顶点处像素少，容易被 JPEG 噪声/去背景丢失，
    // 裁左右会导致顶点位置错误。保持宽度让顶点保持原始 x 坐标，
    // 拉伸后上下顶点触边，左右由运行时纯色菱形底兜底填缝。
    return sharp(raw, {
      raw: { width, height, channels: 4 },
    })
      .extract({ left: 0, top: bounds.minY, width, height: bounds.ch })
      .resize(canvasW, canvasH, { fit: 'fill' })
      .png()
  }

  if (align === 'cover') {
    // 背景插画：等比铺满（取 max scale），裁掉超出画布的部分
    const scale = Math.max(canvasW / cw, canvasH / ch)
    const scaledW = Math.round(cw * scale)
    const scaledH = Math.round(ch * scale)
    // 输出 PNG（带格式头），便于后续 composite 识别
    const scaled = await contentRegion
      .resize(scaledW, scaledH, { fit: 'fill' })
      .png()
      .toBuffer()
    const left = Math.floor((scaledW - canvasW) / 2)
    const top = Math.floor((scaledH - canvasH) / 2)
    return sharp(scaled)
      .extract({
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: canvasW,
        height: canvasH,
      })
      .png()
  }

  // center / bottom：等比缩放（取 min scale）保证内容完整放入画布
  const scale = Math.min(canvasW / cw, canvasH / ch)
  const scaledW = Math.max(1, Math.round(cw * scale))
  const scaledH = Math.max(1, Math.round(ch * scale))

  // 输出 PNG（带格式头），避免 composite 时因 raw buffer 无文件头报错
  const contentBuf = await contentRegion
    .resize(scaledW, scaledH, { fit: 'fill' })
    .png()
    .toBuffer()

  // 计算放置偏移：水平居中；垂直按 align
  const offsetX = Math.floor((canvasW - scaledW) / 2)
  const offsetY =
    align === 'bottom' ? canvasH - scaledH : Math.floor((canvasH - scaledH) / 2)

  // 创建透明规范画布并合成内容
  return sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: contentBuf, left: offsetX, top: offsetY }])
    .png()
}

/**
 * 处理单张图片
 */
async function processImage(inputPath, spec, checkOnly) {
  const [canvasW, canvasH] = spec.canvas
  const meta = await sharp(inputPath).metadata()

  // 校验模式：只检查尺寸是否符合规范画布
  if (checkOnly) {
    if (meta.width !== canvasW || meta.height !== canvasH) {
      console.warn(
        `[不合格] ${inputPath}: ${meta.width}x${meta.height} ≠ 规范画布 ${canvasW}x${canvasH}`
      )
      return false
    }
    return true
  }

  const { raw, width, height } = await removeWhiteBackground(inputPath)
  const bounds = detectContentBounds(raw, width, height)
  if (!bounds) {
    console.warn(`[跳过] 未检测到内容: ${inputPath}`)
    return false
  }

  const pipeline = await normalizeToCanvas(
    raw,
    width,
    height,
    bounds,
    canvasW,
    canvasH,
    spec.align
  )

  // 写到临时文件再重命名覆盖（避免 Windows 下写入冲突）
  const tempPath = join(dirname(inputPath), `.tmp-${basename(inputPath)}`)
  await pipeline.toFile(tempPath)
  await unlink(inputPath)
  await rename(tempPath, inputPath)

  console.log(
    `[已处理] ${inputPath} (${width}x${height} → ${canvasW}x${canvasH}, ${spec.align})`
  )
  return true
}

/**
 * 处理单个目录
 */
async function processDir(spec, checkOnly) {
  let ok = 0
  let fail = 0
  let count = 0
  const entries = await readdir(spec.dir)
  for (const entry of entries) {
    if (extname(entry).toLowerCase() !== '.png') continue
    const fullPath = join(spec.dir, entry)
    const s = await stat(fullPath)
    if (!s.isFile()) continue
    count++
    try {
      const success = await processImage(fullPath, spec, checkOnly)
      success ? ok++ : fail++
    } catch (e) {
      console.error(`[错误] ${fullPath}: ${e.message}`)
      fail++
    }
  }
  return { ok, fail, count }
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  console.log(checkOnly ? '== 校验模式（不修改文件） ==' : '== 处理模式 ==')

  let totalOk = 0
  let totalFail = 0
  let totalFiles = 0

  for (const spec of ASSET_SPECS) {
    // 目录不存在则跳过
    try {
      const st = await stat(spec.dir)
      if (!st.isDirectory()) continue
    } catch {
      continue
    }

    console.log(
      `\n--- ${spec.dir} (画布 ${spec.canvas[0]}x${spec.canvas[1]}, ${spec.align}) ---`
    )
    const { ok, fail, count } = await processDir(spec, checkOnly)
    totalOk += ok
    totalFail += fail
    totalFiles += count
  }

  console.log(`\n完成: 共 ${totalFiles} 张, 成功 ${totalOk}, 失败 ${totalFail}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
