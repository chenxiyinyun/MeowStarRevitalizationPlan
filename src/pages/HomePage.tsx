import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSound } from '@/hooks/useSound'

gsap.registerPlugin(ScrollTrigger)

/** 特性卡片数据 */
const FEATURES = [
  {
    icon: '🍅',
    title: '番茄专注',
    desc: '25 分钟沉浸专注，收获燃料与经验。后台计时校准，切标签页也不丢进度。',
    iconBg: 'bg-accent-orange/15',
    titleColor: 'text-accent-orange',
  },
  {
    icon: '🏙️',
    title: '等距都市',
    desc: '在 20×20 等距地图上建造你的喵星城，5 阶段天际线从荒野生长到繁华都市。',
    iconBg: 'bg-accent-mint/15',
    titleColor: 'text-accent-mint',
  },
  {
    icon: '🐱',
    title: '猫咪陪伴',
    desc: '三只性格各异的猫咪在街巷漫步，点击它们听一句俏皮话，治愈你的专注时光。',
    iconBg: 'bg-accent-lavender/15',
    titleColor: 'text-accent-lavender',
  },
  {
    icon: '🌫️',
    title: '迷雾探索',
    desc: '等级提升揭开九大区域迷雾，解锁 26 种建筑，看着城市一点点长大。',
    iconBg: 'bg-accent-pink/15',
    titleColor: 'text-accent-pink',
  },
] as const

/** 成长阶段数据 */
const STAGES = [
  { level: 'Lv1', name: '荒野', desc: '草地、泥路、零星树木', color: '#4a9d5e' },
  { level: 'Lv2-3', name: '村落', desc: '木屋、猫窝、碎石路', color: '#bcaaa4' },
  { level: 'Lv4-6', name: '小镇', desc: '联排房屋、便利店、街灯', color: '#ffd54f' },
  { level: 'Lv7-10', name: '城市', desc: '公寓楼、办公楼、商场', color: '#90caf9' },
  { level: 'Lv11+', name: '都市', desc: '摩天大楼、地标塔、霓虹夜景', color: '#ce93d8' },
] as const

function HomePage() {
  const reduced = useReducedMotion()
  const { play } = useSound()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      if (reduced) {
        // 减少动效：仅淡入淡出
        gsap.set('[data-animate]', { opacity: 0 })
        gsap.to('[data-animate]', {
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          scrollTrigger: { trigger: '[data-animate]', start: 'top 90%' },
        })
        return
      }

      // Hero 入场
      gsap.from('[data-hero]', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      })

      // 特性卡片：滚动触发 stagger 上浮
      gsap.from('[data-feature]', {
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-features]', start: 'top 75%' },
      })

      // 阶段卡片：横向揭示
      gsap.from('[data-stage]', {
        x: -40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-stages]', start: 'top 75%' },
      })

      // 最终 CTA
      gsap.from('[data-cta]', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-cta-section]', start: 'top 80%' },
      })
    }, rootRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div ref={rootRef} className="h-full overflow-y-auto">
      {/* 背景光晕 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
          style={{ background: 'var(--glow-orange)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full opacity-25 blur-[100px]"
          style={{ background: 'var(--glow-lavender)' }}
        />
      </div>

      {/* 导航栏 */}
      <nav className="sticky top-0 z-20 border-b border-border-subtle bg-bg-deep/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl text-accent-orange">喵星复兴计划</span>
          <Link
            to="/game"
            onMouseEnter={() => play('click')}
            className="rounded-lg border border-accent-orange/40 px-4 py-1.5 text-sm text-accent-orange transition-colors hover:bg-accent-orange/10"
          >
            进入游戏
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <span
          data-hero
          className="mb-6 rounded-full border border-accent-lavender/30 bg-accent-lavender/10 px-4 py-1 text-xs text-accent-lavender"
        >
          治愈系等距都市 · 专注成长游戏
        </span>
        <h1 data-hero className="font-display text-6xl text-text-primary md:text-8xl">
          喵星<span className="text-accent-orange">复兴</span>计划
        </h1>
        <p data-hero className="mt-6 max-w-2xl text-lg text-text-secondary md:text-xl">
          用专注，建一座喵星都市。每一次番茄钟，都是城市生长的一块砖。
        </p>
        <div data-hero className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/game"
            onMouseEnter={() => play('click')}
            className="rounded-xl bg-accent-orange px-8 py-3 font-medium text-white shadow-lg shadow-accent-orange/30 transition-all hover:scale-105 hover:bg-accent-coral"
          >
            开始专注
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-border-subtle px-8 py-3 font-medium text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
          >
            了解更多
          </a>
        </div>
        <div data-hero className="mt-16 animate-bounce text-text-dim">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* 特性 */}
      <section id="features" data-features className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 data-feature className="mb-4 text-center font-display text-4xl text-text-primary">
          四大核心玩法
        </h2>
        <p data-feature className="mb-12 text-center text-text-secondary">
          专注不是苦行，而是一场温柔的城市建造
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-feature
              className="group rounded-2xl border border-border-subtle bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-orange/30 hover:bg-bg-card-hover"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg} text-2xl`}
              >
                {f.icon}
              </div>
              <h3 className={`mb-2 font-display text-xl ${f.titleColor}`}>{f.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 成长阶段 */}
      <section data-stages className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 data-stage className="mb-4 text-center font-display text-4xl text-text-primary">
          从荒野到都市
        </h2>
        <p data-stage className="mb-12 text-center text-text-secondary">
          肉眼可见的城市演化，每一级都有新的天际线
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((s, i) => (
            <div
              key={s.name}
              data-stage
              className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-6"
            >
              <div
                className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: s.color }}
              />
              <div className="relative">
                <div className="mb-3 text-xs text-text-dim">{s.level}</div>
                <div className="mb-2 font-display text-2xl" style={{ color: s.color }}>
                  {s.name}
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">{s.desc}</p>
                {i < STAGES.length - 1 && (
                  <div className="mt-4 hidden text-text-dim lg:block">→</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 最终 CTA */}
      <section data-cta-section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <div
          data-cta
          className="rounded-3xl border border-accent-orange/20 bg-gradient-to-br from-accent-orange/10 to-accent-lavender/10 p-12"
        >
          <h2 className="mb-4 font-display text-4xl text-text-primary">准备好建设你的喵星了吗？</h2>
          <p className="mb-8 text-text-secondary">无需注册，进度自动保存。现在开始第一个番茄钟。</p>
          <Link
            to="/game"
            onMouseEnter={() => play('click')}
            className="inline-block rounded-xl bg-accent-orange px-10 py-4 font-display text-lg text-white shadow-lg shadow-accent-orange/30 transition-all hover:scale-105 hover:bg-accent-coral"
          >
            进入喵星
          </Link>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="relative z-10 border-t border-border-subtle px-6 py-8 text-center text-xs text-text-dim">
        <p>喵星复兴计划 · MVP · 用专注浇灌城市</p>
      </footer>
    </div>
  )
}

export default HomePage
