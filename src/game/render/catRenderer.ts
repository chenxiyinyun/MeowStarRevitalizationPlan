import { Container, Graphics } from 'pixi.js'
import type { CatType } from '@/types'

/**
 * 可爱像素猫咪 - 3/4 侧视风格（程序化绘制版）
 *
 * 用 Graphics 圆形+椭圆绘制，参考星露谷/动森的猫咪：
 * - 圆头侧视（带耳朵+眼睛+鼻+嘴）
 * - 短胖身体
 * - 弧形尾巴
 * - 配色温暖治愈
 *
 * 每只猫有独立的颜色和细节
 */

interface CatStyle {
  body: number      // 主色
  bodyDark: number  // 阴影
  bodyLight: number // 高光
  belly: number     // 肚皮
  earInner: number  // 内耳
  eye: number       // 眼睛
  hasStripes?: boolean
  hasSpots?: boolean
}

const CAT_STYLES: Record<string, CatStyle> = {
  cat_doudou: {
    body: 0x9e9e9e,
    bodyDark: 0x6b6b6b,
    bodyLight: 0xbdbdbd,
    belly: 0xe0e0e0,
    earInner: 0xf8bbd0,
    eye: 0x1a1a2e,
  },
  cat_xuebao: {
    body: 0xfafafa,
    bodyDark: 0xc8d4dc,
    bodyLight: 0xffffff,
    belly: 0xffffff,
    earInner: 0xf8bbd0,
    eye: 0x42a5f5,
  },
  cat_mimi: {
    body: 0xff8c42,
    bodyDark: 0xe65100,
    bodyLight: 0xffb74d,
    belly: 0xffe0b2,
    earInner: 0xf8bbd0,
    eye: 0x33691e,
    hasStripes: true,
  },
}

function drawCatGfx(g: Graphics, style: CatStyle, frame: 'idle' | 'walk' | 'sit', facing: 'left' | 'right') {
  const flip = facing === 'left' ? -1 : 1
  // 整体位置参数
  const bodyY = frame === 'sit' ? -2 : 0
  const headY = bodyY - 8

  // 身体（圆胖形）
  g.ellipse(0 * flip, bodyY + 4, 11, 9)
  g.fill({ color: style.body })
  g.stroke({ color: style.bodyDark, width: 0.6, alpha: 0.5 })

  // 肚皮浅色
  g.ellipse(2 * flip, bodyY + 7, 7, 5)
  g.fill({ color: style.belly, alpha: 0.7 })

  // 橘猫条纹
  if (style.hasStripes) {
    g.ellipse(-2 * flip, bodyY + 1, 1.5, 4)
    g.fill({ color: style.bodyDark, alpha: 0.6 })
    g.ellipse(4 * flip, bodyY + 0, 1.2, 3)
    g.fill({ color: style.bodyDark, alpha: 0.6 })
  }

  // 四肢（前爪 - 2只）
  if (frame === 'walk') {
    // 走路：前后爪交替
    g.ellipse(-6 * flip, bodyY + 11, 3, 2.5)
    g.fill({ color: style.body })
    g.ellipse(6 * flip, bodyY + 12, 3, 2.5)
    g.fill({ color: style.body })
  } else if (frame === 'sit') {
    // 坐姿：前爪并拢
    g.ellipse(-3 * flip, bodyY + 10, 3, 2)
    g.fill({ color: style.body })
    g.ellipse(3 * flip, bodyY + 10, 3, 2)
    g.fill({ color: style.body })
  } else {
    g.ellipse(-6 * flip, bodyY + 11, 3, 2.5)
    g.fill({ color: style.body })
    g.ellipse(6 * flip, bodyY + 11, 3, 2.5)
    g.fill({ color: style.body })
  }

  // 尾巴（弧形）- 走路时抬起
  if (frame === 'walk') {
    g.moveTo(10 * flip, bodyY + 3)
    g.bezierCurveTo(
      16 * flip, bodyY - 4,
      18 * flip, bodyY - 8,
      14 * flip, bodyY - 10
    )
    g.stroke({ color: style.body, width: 3.5, cap: 'round' })
  } else if (frame === 'sit') {
    // 坐姿：尾巴绕到身体前
    g.moveTo(8 * flip, bodyY + 4)
    g.bezierCurveTo(
      12 * flip, bodyY + 8,
      10 * flip, bodyY + 12,
      4 * flip, bodyY + 11
    )
    g.stroke({ color: style.body, width: 3.5, cap: 'round' })
  } else {
    g.moveTo(10 * flip, bodyY + 3)
    g.bezierCurveTo(
      15 * flip, bodyY - 2,
      17 * flip, bodyY - 6,
      13 * flip, bodyY - 8
    )
    g.stroke({ color: style.body, width: 3.5, cap: 'round' })
    // 尾巴尖浅色
    g.circle(13 * flip, bodyY - 8, 1.8)
    g.fill({ color: style.bodyLight })
  }

  // 头（圆形）
  g.circle(0, headY, 9)
  g.fill({ color: style.body })
  g.stroke({ color: style.bodyDark, width: 0.6, alpha: 0.5 })

  // 耳朵（两个三角形）
  // 左耳
  g.moveTo(-6, headY - 6)
  g.lineTo(-9, headY - 13)
  g.lineTo(-3, headY - 9)
  g.closePath()
  g.fill({ color: style.body })
  g.stroke({ color: style.bodyDark, width: 0.5, alpha: 0.5 })
  // 内耳
  g.moveTo(-5.5, headY - 7)
  g.lineTo(-7.5, headY - 11)
  g.lineTo(-3.5, headY - 9)
  g.closePath()
  g.fill({ color: style.earInner })

  // 右耳
  g.moveTo(6, headY - 6)
  g.lineTo(9, headY - 13)
  g.lineTo(3, headY - 9)
  g.closePath()
  g.fill({ color: style.body })
  g.stroke({ color: style.bodyDark, width: 0.5, alpha: 0.5 })
  // 内耳
  g.moveTo(5.5, headY - 7)
  g.lineTo(7.5, headY - 11)
  g.lineTo(3.5, headY - 9)
  g.closePath()
  g.fill({ color: style.earInner })

  // 眼睛（圆大眼）
  const eyeY = headY - 1
  const eyeOffset = 3.5
  // 左眼
  g.circle(-eyeOffset, eyeY, 1.8)
  g.fill({ color: 0xffffff })
  g.circle(-eyeOffset, eyeY, 1.3)
  g.fill({ color: style.eye })
  g.circle(-eyeOffset - 0.4, eyeY - 0.5, 0.4)
  g.fill({ color: 0xffffff })
  // 右眼
  g.circle(eyeOffset, eyeY, 1.8)
  g.fill({ color: 0xffffff })
  g.circle(eyeOffset, eyeY, 1.3)
  g.fill({ color: style.eye })
  g.circle(eyeOffset - 0.4, eyeY - 0.5, 0.4)
  g.fill({ color: 0xffffff })

  // 鼻子（粉红三角）
  g.moveTo(-1, headY + 2)
  g.lineTo(1, headY + 2)
  g.lineTo(0, headY + 3.5)
  g.closePath()
  g.fill({ color: 0xf48fb1 })

  // 嘴（笑）
  g.moveTo(0, headY + 3.5)
  g.lineTo(0, headY + 5)
  g.moveTo(0, headY + 5)
  g.quadraticCurveTo(-2, headY + 6, -3, headY + 5)
  g.moveTo(0, headY + 5)
  g.quadraticCurveTo(2, headY + 6, 3, headY + 5)
  g.stroke({ color: 0x5d4037, width: 0.7, cap: 'round' })

  // 腮红
  g.circle(-6, headY + 2.5, 1.3)
  g.fill({ color: 0xffa7b6, alpha: 0.55 })
  g.circle(6, headY + 2.5, 1.3)
  g.fill({ color: 0xffa7b6, alpha: 0.55 })

  // 胡须
  g.moveTo(-7, headY + 2.5)
  g.lineTo(-12, headY + 2)
  g.moveTo(-7, headY + 4)
  g.lineTo(-12, headY + 4.5)
  g.moveTo(7, headY + 2.5)
  g.lineTo(12, headY + 2)
  g.moveTo(7, headY + 4)
  g.lineTo(12, headY + 4.5)
  g.stroke({ color: 0x9e9e9e, width: 0.4, alpha: 0.7 })

  // 头身分割阴影
  g.ellipse(0, headY + 8, 7, 2)
  g.fill({ color: style.bodyDark, alpha: 0.2 })

  // 项圈
  if (style === CAT_STYLES.cat_doudou) {
    // 豆豆的红色项圈
    g.rect(-5, headY + 7, 10, 1.2)
    g.fill({ color: 0xe53935 })
    g.circle(0, headY + 8, 0.8)
    g.fill({ color: 0xffd54f })
  }
}

export function drawCat(
  cat: CatType,
  state: 'idle' | 'walk' | 'sit' = 'idle',
  facing: 'left' | 'right' = 'right'
): Container {
  const container = new Container()
  const style = CAT_STYLES[cat.id] ?? CAT_STYLES.cat_mimi

  // 地面阴影
  const shadow = new Graphics()
  shadow.ellipse(0, 14, 14, 3.5)
  shadow.fill({ color: 0x000000, alpha: 0.2 })
  container.addChild(shadow)

  // 猫咪图形
  const g = new Graphics()
  drawCatGfx(g, style, state, facing)
  container.addChild(g)

  return container
}
