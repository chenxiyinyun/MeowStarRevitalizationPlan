import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * 自定义光标：橙色圆点 + 外环。
 * hover 可交互元素（a, button, [data-cursor="hover"]）时外环放大。
 * 移动端 / 触摸设备自动关闭。
 * prefers-reduced-motion 时关闭跟随动画的缓动，直接贴附。
 */
export default function CustomCursor() {
  const reduced = useReducedMotion()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    // 触摸设备 / 小屏不启用
    return !window.matchMedia('(hover: none), (max-width: 768px)').matches
  })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let rafId = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`
      // 检测是否 hover 可交互元素
      const target = e.target as HTMLElement | null
      const interactive = !!target?.closest(
        'a, button, [data-cursor="hover"], input, select, textarea'
      )
      setHovering(interactive)
    }

    const render = () => {
      if (reduced) {
        ringX = mouseX
        ringY = mouseY
      } else {
        ringX += (mouseX - ringX) * 0.18
        ringY += (mouseY - ringY) * 0.18
      }
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`
      rafId = requestAnimationFrame(render)
    }

    window.addEventListener('mousemove', onMove)
    rafId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [enabled, reduced])

  if (!enabled) return null

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -ml-1 h-2 w-2 rounded-full bg-accent-orange"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-accent-orange/60 transition-[width,height,margin,opacity] duration-200 ${
          hovering ? '-ml-4 -mt-4 h-8 w-8 opacity-100' : '-ml-2 -mt-2 h-4 w-4 opacity-70'
        }`}
        style={{ willChange: 'transform' }}
      />
    </>
  )
}
