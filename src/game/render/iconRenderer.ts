import { Graphics } from 'pixi.js'

/**
 * 绘制 UI 图标（几何造型），运行时缩放到 32/48px
 * 返回以 0,0 为中心绘制的 Graphics，调用方定位即可
 */
export function drawIcon(name: string, size = 48): Graphics {
  const g = new Graphics()
  const s = size / 48 // 基准 48 缩放因子

  switch (name) {
    case 'fuel':
      // 橙色水滴
      g.poly([0, -20 * s, 10 * s, 5 * s, 0, 20 * s, -10 * s, 5 * s])
      g.fill({ color: 0xff9800 })
      break
    case 'xp':
      // 紫色五角星
      drawStar(g, 0, 0, 5, 18 * s, 8 * s, 0xab47bc)
      break
    case 'level':
      // 金色盾牌+星
      g.poly([
        0,
        -20 * s,
        16 * s,
        -10 * s,
        12 * s,
        14 * s,
        0,
        20 * s,
        -12 * s,
        14 * s,
        -16 * s,
        -10 * s,
      ])
      g.fill({ color: 0xffb300 })
      drawStar(g, 0, 0, 5, 8 * s, 4 * s, 0xffffff)
      break
    case 'pomodoro':
      // 红番茄+绿叶
      g.circle(0, 2 * s, 16 * s)
      g.fill({ color: 0xe53935 })
      g.poly([-6 * s, -14 * s, 6 * s, -14 * s, 0, -20 * s])
      g.fill({ color: 0x4caf50 })
      break
    case 'settings':
      // 橙齿轮
      drawGear(g, 0, 0, 10 * s, 8, 0xff9800)
      break
    case 'sound_on':
      // 喇叭+声波弧
      g.poly([
        -12 * s,
        -6 * s,
        -4 * s,
        -6 * s,
        4 * s,
        -14 * s,
        4 * s,
        14 * s,
        -4 * s,
        6 * s,
        -12 * s,
        6 * s,
      ])
      g.fill({ color: 0xff9800 })
      g.arc(8 * s, 0, 8 * s, -Math.PI / 3, Math.PI / 3)
      g.stroke({ color: 0xff9800, width: 2 * s })
      break
    case 'sound_off':
      // 喇叭+叉
      g.poly([
        -12 * s,
        -6 * s,
        -4 * s,
        -6 * s,
        4 * s,
        -14 * s,
        4 * s,
        14 * s,
        -4 * s,
        6 * s,
        -12 * s,
        6 * s,
      ])
      g.fill({ color: 0xff9800 })
      g.moveTo(8 * s, -8 * s)
      g.lineTo(16 * s, 8 * s)
      g.moveTo(16 * s, -8 * s)
      g.lineTo(8 * s, 8 * s)
      g.stroke({ color: 0xef5350, width: 2 * s })
      break
    case 'cat_paw':
      // 粉色爪印
      g.circle(0, 4 * s, 10 * s)
      g.fill({ color: 0xf48fb1 })
      g.circle(-8 * s, -8 * s, 4 * s)
      g.fill({ color: 0xf48fb1 })
      g.circle(0, -12 * s, 4 * s)
      g.fill({ color: 0xf48fb1 })
      g.circle(8 * s, -8 * s, 4 * s)
      g.fill({ color: 0xf48fb1 })
      break
  }

  return g
}

function drawStar(
  g: Graphics,
  cx: number,
  cy: number,
  points: number,
  outer: number,
  inner: number,
  color: number
): void {
  const path: number[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / points - Math.PI / 2
    path.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  g.poly(path)
  g.fill({ color })
}

function drawGear(
  g: Graphics,
  cx: number,
  cy: number,
  inner: number,
  teeth: number,
  color: number
): void {
  g.circle(cx, cy, inner)
  g.fill({ color })
  for (let i = 0; i < teeth; i++) {
    const a = (Math.PI * 2 * i) / teeth
    const x = cx + Math.cos(a) * (inner + 2)
    const y = cy + Math.sin(a) * (inner + 2)
    g.rect(x - 2, y - 4, 4, 8)
    g.fill({ color })
  }
  g.circle(cx, cy, inner * 0.4)
  g.fill({ color: 0xffffff })
}
