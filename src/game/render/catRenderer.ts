import { Container, Graphics } from 'pixi.js'
import type { CatType } from '@/types'

/**
 * 绘制猫咪：3 只差异化 + idle/walk 两帧几何姿态
 * 左方向通过 scale.x = -1 翻转
 */
export function drawCat(cat: CatType, state: 'idle' | 'walk'): Container {
  const container = new Container()
  const g = new Graphics()
  const color = cat.color
  const earColor = color
  const innerEar = 0xffcdd2

  if (cat.id === 'cat_doudou') {
    // 豆豆：圆胖，趴姿/慢走
    if (state === 'idle') {
      // 趴姿：扁椭圆
      g.ellipse(0, 0, 12, 7)
      g.fill({ color })
      g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
      // 眯眼
      g.rect(-5, -2, 3, 1)
      g.fill({ color: 0x1a1a2e })
      g.rect(2, -2, 3, 1)
      g.fill({ color: 0x1a1a2e })
    } else {
      // 慢走：椭圆+微抬爪
      g.ellipse(0, -2, 11, 8)
      g.fill({ color })
      g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
      drawCatEars(g, earColor, innerEar, -2)
      drawCatEyes(g, cat.id)
    }
  } else if (cat.id === 'cat_xuebao') {
    // 雪宝：白色+蓝眼+竖耳，站姿/欢快走
    if (state === 'idle') {
      g.ellipse(0, -2, 9, 10)
      g.fill({ color })
      g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
      drawCatEars(g, earColor, innerEar, -2)
      // 蓝眼
      g.circle(-3, -3, 1.8)
      g.fill({ color: 0x42a5f5 })
      g.circle(3, -3, 1.8)
      g.fill({ color: 0x42a5f5 })
    } else {
      g.ellipse(0, -3, 9, 9)
      g.fill({ color })
      g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
      drawCatEars(g, earColor, innerEar, -3)
      g.circle(-3, -4, 1.8)
      g.fill({ color: 0x42a5f5 })
      g.circle(3, -4, 1.8)
      g.fill({ color: 0x42a5f5 })
    }
  } else {
    // 咪咪：橘猫+条纹，坐姿/站姿
    if (state === 'idle') {
      // 坐姿：圆身
      g.circle(0, -2, 10)
      g.fill({ color })
      g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
      drawCatEars(g, earColor, innerEar, -2)
      // 背部条纹
      g.moveTo(-4, -8)
      g.lineTo(4, -8)
      g.stroke({ color: darkenStripe(color), width: 2, alpha: 0.6 })
      g.moveTo(-5, -5)
      g.lineTo(5, -5)
      g.stroke({ color: darkenStripe(color), width: 2, alpha: 0.6 })
      drawCatEyes(g, cat.id)
      // 翘尾
      g.poly([9, 0, 13, -4, 11, 2])
      g.fill({ color })
    } else {
      // 站姿：椭圆+抬前爪
      g.ellipse(0, -3, 10, 9)
      g.fill({ color })
      g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
      drawCatEars(g, earColor, innerEar, -3)
      g.moveTo(-4, -8)
      g.lineTo(4, -8)
      g.stroke({ color: darkenStripe(color), width: 2, alpha: 0.6 })
      drawCatEyes(g, cat.id)
    }
  }

  container.addChild(g)
  return container
}

function drawCatEars(g: Graphics, color: number, inner: number, offsetY: number): void {
  g.poly([-9, -3 + offsetY, -5, -11 + offsetY, -2, -3 + offsetY])
  g.fill({ color })
  g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
  g.poly([9, -3 + offsetY, 5, -11 + offsetY, 2, -3 + offsetY])
  g.fill({ color })
  g.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
  g.poly([-7, -4 + offsetY, -5, -8 + offsetY, -3, -4 + offsetY])
  g.fill({ color: inner })
  g.poly([7, -4 + offsetY, 5, -8 + offsetY, 3, -4 + offsetY])
  g.fill({ color: inner })
}

function drawCatEyes(g: Graphics, _catId: string): void {
  const eyeColor = 0x1a1a2e
  g.circle(-3, -1, 1.5)
  g.fill({ color: eyeColor })
  g.circle(3, -1, 1.5)
  g.fill({ color: eyeColor })
}

function darkenStripe(color: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * 0.6)
  const g = Math.floor(((color >> 8) & 0xff) * 0.6)
  const b = Math.floor((color & 0xff) * 0.6)
  return (r << 16) | (g << 8) | b
}
