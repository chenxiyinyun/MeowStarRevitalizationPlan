/**
 * 背景渲染器：CSS 渐变 + DOM 粒子（不走 PixiJS，更轻量）
 * createBackground 返回一个 div，插入到目标容器即可
 */
export function createBackground(kind: 'hero' | 'game'): HTMLDivElement {
  const div = document.createElement('div')
  div.style.position = 'absolute'
  div.style.inset = '0'
  div.style.overflow = 'hidden'
  div.style.pointerEvents = 'none'

  if (kind === 'hero') {
    // 深蓝→紫渐变 + 浮动光点
    div.style.background = 'radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0a0e1a 70%)'
    for (let i = 0; i < 30; i++) {
      const dot = document.createElement('div')
      dot.style.position = 'absolute'
      dot.style.width = `${2 + Math.random() * 4}px`
      dot.style.height = dot.style.width
      dot.style.borderRadius = '50%'
      dot.style.background = `rgba(255,220,150,${0.2 + Math.random() * 0.4})`
      dot.style.left = `${Math.random() * 100}%`
      dot.style.top = `${Math.random() * 100}%`
      dot.style.animation = `floatUp ${10 + Math.random() * 15}s linear infinite`
      dot.style.animationDelay = `${-Math.random() * 15}s`
      div.appendChild(dot)
    }
  } else {
    // game_bg：纯深蓝渐变 + 微弱光晕
    div.style.background = 'radial-gradient(ellipse at 50% 60%, #0f1424 0%, #0a0e1a 80%)'
  }

  return div
}
