import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSound } from '@/hooks/useSound'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    icon: '🍅',
    title: '番茄专注',
    desc: '25分钟沉浸专注，收获燃料与经验，陪伴你的专注时光',
    color: 'accent-orange',
    bgColor: 'from-orange-100 to-orange-50',
  },
  {
    icon: '🏠',
    title: '城市建造',
    desc: '规划区域自动生长建筑，亲手打造专属喵星城镇',
    color: 'accent-mint',
    bgColor: 'from-green-100 to-green-50',
  },
  {
    icon: '🐱',
    title: '猫咪陪伴',
    desc: '三只可爱猫咪在城市漫步，治愈每一个专注瞬间',
    color: 'accent-lavender',
    bgColor: 'from-purple-100 to-purple-50',
  },
  {
    icon: '✨',
    title: '成长进化',
    desc: '从荒野到繁华都市，5个阶段见证城市的成长',
    color: 'accent-yellow',
    bgColor: 'from-yellow-100 to-yellow-50',
  },
] as const

const STAGES = [
  { level: 'Lv1', name: '荒野', desc: '草地小路，树木零星', emoji: '🌿', bgClass: 'from-green-200 to-green-100' },
  { level: 'Lv2-3', name: '村落', desc: '木屋猫窝，温馨可爱', emoji: '🏡', bgClass: 'from-amber-200 to-amber-100' },
  { level: 'Lv4-6', name: '小镇', desc: '街灯商店，热闹初现', emoji: '🏘️', bgClass: 'from-yellow-200 to-yellow-100' },
  { level: 'Lv7-10', name: '城市', desc: '公寓商场，生机勃勃', emoji: '🏙️', bgClass: 'from-blue-200 to-blue-100' },
  { level: 'Lv11+', name: '都市', desc: '摩天大楼，霓虹璀璨', emoji: '🌆', bgClass: 'from-purple-200 to-purple-100' },
] as const

function HomePage() {
  const reduced = useReducedMotion()
  const { play } = useSound()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('[data-animate]', { opacity: 1 })
        return
      }

      gsap.from('[data-hero]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'back.out(1.2)',
      })

      gsap.from('[data-feature]', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-features]', start: 'top 80%' },
      })

      gsap.from('[data-stage]', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: '[data-stages]', start: 'top 80%' },
      })

      gsap.from('[data-cta]', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-cta-section]', start: 'top 85%' },
      })
    }, rootRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div ref={rootRef} className="h-full overflow-y-auto">
      <nav className="sticky top-0 z-30 border-b-4 border-wood-dark bg-bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            <span className="font-display text-xl text-accent-orange md:text-2xl">喵星复兴计划</span>
          </div>
          <Link
            to="/game"
            onMouseEnter={() => play('click')}
            className="pixel-btn text-sm md:text-base"
          >
            进入游戏
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col items-center justify-center px-4 py-12 text-center md:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-5xl opacity-20 animate-bounce-soft">☁️</div>
          <div className="absolute top-20 right-20 text-4xl opacity-15 animate-bounce-soft" style={{ animationDelay: '0.5s' }}>☁️</div>
          <div className="absolute bottom-32 left-16 text-3xl opacity-30 animate-wiggle">🌸</div>
          <div className="absolute bottom-40 right-12 text-4xl opacity-25 animate-bounce-soft" style={{ animationDelay: '1s' }}>🌳</div>
          <div className="absolute top-1/3 right-1/4 text-2xl opacity-20 animate-sparkle">✨</div>
        </div>

        <div data-hero className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-3 border-wood-dark bg-accent-peach px-4 py-2 font-display text-sm text-brown-dark shadow-[0_3px_0_var(--wood-dark)]">
            <span className="animate-wiggle">🏗️</span>
            <span>治愈系城市建造 · 专注成长游戏</span>
          </div>
        </div>

        <h1 data-hero className="relative z-10 font-display text-5xl leading-tight text-brown-dark md:text-7xl">
          喵星
          <span className="text-accent-orange drop-shadow-[2px_2px_0_var(--wood-dark)]">复兴</span>
          计划
        </h1>

        <p data-hero className="relative z-10 mt-6 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
          用专注，建一座喵星都市<br />
          每一次番茄钟，都是城市生长的一块砖 🧱
        </p>

        <div data-hero className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/game"
            onMouseEnter={() => play('click')}
            className="pixel-btn text-lg md:text-xl"
          >
            🌟 开始建造
          </Link>
          <a
            href="#features"
            className="pixel-btn-secondary text-base"
          >
            了解更多
          </a>
        </div>

        <div data-hero className="relative z-10 mt-12 animate-bounce-soft text-3xl">
          👇
        </div>
      </section>

      <section id="features" data-features className="relative z-10 mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 text-center">
          <h2 data-feature className="font-display text-3xl text-brown-dark md:text-4xl">
            🌟 四大核心玩法
          </h2>
          <p data-feature className="mt-3 text-text-secondary">
            专注不是苦行，而是一场温柔的城市建造
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-feature
              className={`pixel-card bg-gradient-to-br ${f.bgColor} p-5 text-center`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-3 text-4xl animate-bounce-soft" style={{ animationDelay: `${i * 0.2}s` }}>
                {f.icon}
              </div>
              <h3 className={`mb-2 font-display text-xl text-${f.color}`}>{f.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section data-stages className="relative z-10 mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 text-center">
          <h2 data-stage className="font-display text-3xl text-brown-dark md:text-4xl">
            🗺️ 从荒野到都市
          </h2>
          <p data-stage className="mt-3 text-text-secondary">
            肉眼可见的城市演化，每一级都有新的天际线
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STAGES.map((s, i) => (
            <div
              key={s.name}
              data-stage
              className={`pixel-card bg-gradient-to-b ${s.bgClass} p-4 text-center`}
            >
              <div className="mb-2 text-4xl">{s.emoji}</div>
              <div className="text-xs text-text-dim font-display">{s.level}</div>
              <div className="mt-1 font-display text-xl text-brown-dark">{s.name}</div>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{s.desc}</p>
              {i < STAGES.length - 1 && (
                <div className="mt-3 text-xl text-brown-light hidden lg:block">⬇️</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-cta-section className="relative z-10 mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-24">
        <div
          data-cta
          className="pixel-panel bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-8 md:p-12"
        >
          <div className="text-5xl mb-4">🏠✨🐱</div>
          <h2 className="font-display text-2xl text-brown-dark md:text-3xl">
            准备好建设你的喵星了吗？
          </h2>
          <p className="mt-4 text-text-secondary">
            无需注册，进度自动保存<br />
            现在开始第一个番茄钟吧 🍅
          </p>
          <div className="mt-8">
            <Link
              to="/game"
              onMouseEnter={() => play('click')}
              className="pixel-btn inline-block text-lg md:text-xl"
            >
              🚀 进入喵星
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t-4 border-wood-dark bg-bg-paper px-6 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🐱</span>
          <span className="font-display text-brown-medium">喵星复兴计划</span>
          <span>·</span>
          <span className="text-sm text-text-dim">用专注浇灌城市</span>
        </div>
        <p className="text-xs text-text-dim">Made with ❤️ · 治愈系像素风游戏</p>
      </footer>
    </div>
  )
}

export default HomePage
