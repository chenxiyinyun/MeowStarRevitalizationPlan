import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProgressStore } from '@/store/progressStore'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { useBuildingStore } from '@/store/buildingStore'
import { useUserStore } from '@/store/userStore'
import { getBuildingType } from '@/game/data/buildings'
import { BUILDING_CATEGORIES } from '@/types'
import type { PomodoroSession, BuildingCategory } from '@/types'

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function recentDayKeys(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    keys.push(dayKey(d.getTime()))
  }
  return keys
}

function shortDayLabel(key: string): string {
  const [, m, d] = key.split('-')
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}

function normalizeHeights(values: number[], max: number): number[] {
  if (max <= 0) return values.map(() => 0)
  return values.map((v) => Math.max(v / max, 0.02))
}

interface Milestone {
  id: string
  icon: string
  title: string
  desc: string
  threshold: number
  current: number
  unit: string
}

function StatsPage() {
  const progress = useProgressStore()
  const pomodoroHistory = usePomodoroStore((s) => s.history)
  const buildings = useBuildingStore((s) => s.buildings)
  const nickname = useUserStore((s) => s.profile?.nickname ?? '喵星开拓者')
  const createdAt = useUserStore((s) => s.profile?.createdAt)

  const last7Days = useMemo(() => {
    const keys = recentDayKeys(7)
    const map = new Map<string, number>()
    keys.forEach((k) => map.set(k, 0))
    pomodoroHistory.forEach((session: PomodoroSession) => {
      if (session.status !== 'completed' || !session.completedAt) return
      const key = dayKey(session.completedAt)
      if (map.has(key)) {
        const minutes = session.durationMs / 60000
        map.set(key, (map.get(key) ?? 0) + minutes)
      }
    })
    return {
      keys,
      values: keys.map((k) => Math.round(map.get(k) ?? 0)),
    }
  }, [pomodoroHistory])

  const durationDistribution = useMemo(() => {
    const buckets = new Map<number, number>()
    pomodoroHistory.forEach((session: PomodoroSession) => {
      if (session.status !== 'completed') return
      const minutes = Math.round(session.durationMs / 60000)
      buckets.set(minutes, (buckets.get(minutes) ?? 0) + 1)
    })
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([min, count]) => ({ minutes: min, count }))
  }, [pomodoroHistory])

  const buildingCategoryCount = useMemo(() => {
    const counts = new Map<BuildingCategory, number>()
    buildings.forEach((b) => {
      const type = getBuildingType(b.typeId)
      if (!type) return
      counts.set(type.category, (counts.get(type.category) ?? 0) + 1)
    })
    return BUILDING_CATEGORIES.map((cat) => ({
      category: cat,
      count: counts.get(cat.key) ?? 0,
    })).filter((item) => item.count > 0)
  }, [buildings])

  const milestones: Milestone[] = useMemo(() => {
    const totalFocusMin = progress.totalFocusMinutes
    const totalPomodoros = progress.totalPomodoros
    const buildingCount = buildings.length
    const level = progress.level
    return [
      { id: 'focus-60', icon: '⏱️', title: '初入专注', desc: '累计专注60分钟', threshold: 60, current: totalFocusMin, unit: '分钟' },
      { id: 'focus-600', icon: '🎯', title: '专注达人', desc: '累计专注10小时', threshold: 600, current: totalFocusMin, unit: '分钟' },
      { id: 'pomo-10', icon: '🍅', title: '番茄新手', desc: '完成10个番茄钟', threshold: 10, current: totalPomodoros, unit: '个' },
      { id: 'pomo-100', icon: '🏆', title: '番茄大师', desc: '完成100个番茄钟', threshold: 100, current: totalPomodoros, unit: '个' },
      { id: 'building-10', icon: '🏗️', title: '建筑工', desc: '放置10个建筑', threshold: 10, current: buildingCount, unit: '个' },
      { id: 'building-50', icon: '🏙️', title: '城市规划师', desc: '放置50个建筑', threshold: 50, current: buildingCount, unit: '个' },
      { id: 'level-5', icon: '⭐', title: '小有成就', desc: '达到5级', threshold: 5, current: level, unit: '级' },
      { id: 'level-10', icon: '🌟', title: '城市之光', desc: '达到10级', threshold: 10, current: level, unit: '级' },
    ]
  }, [progress, buildings])

  const maxDayMinutes = Math.max(...last7Days.values, 1)
  const barHeights = normalizeHeights(last7Days.values, maxDayMinutes)
  const totalDurationCount = durationDistribution.reduce((sum, d) => sum + d.count, 0)

  const registeredDays = useMemo(() => {
    if (!createdAt) return 0
    return Math.max(1, Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000)) + 1)
  }, [createdAt])

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-gradient-to-b from-bg-cream to-bg-paper">
      <header className="wood-texture sticky top-0 z-10 flex items-center justify-between border-b-4 border-wood-dark px-4 py-3">
        <Link to="/game" className="pixel-btn-secondary text-xs px-3 py-1.5">
          ← 返回
        </Link>
        <h1 className="font-display text-lg text-cream">📊 专注统计</h1>
        <span className="text-sm font-display text-cream/80">{nickname}</span>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard icon="⏱️" label="累计专注" value={formatDuration(progress.totalFocusMinutes * 60000)} color="accent-orange" />
          <MetricCard icon="🍅" label="番茄钟数" value={String(progress.totalPomodoros)} color="accent-mint" />
          <MetricCard icon="🏗️" label="建筑数量" value={String(buildings.length)} color="accent-lavender" />
          <MetricCard icon="⭐" label="当前等级" value={`Lv${progress.level}`} color="accent-yellow" />
        </section>

        <section className="mt-6 pixel-panel p-4 md:mt-8 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-brown-dark">📈 近7天专注趋势</h2>
            <span className="text-xs text-text-dim font-display">单位：分钟</span>
          </div>
          <div className="flex h-36 items-end justify-between gap-2 md:gap-3 border-b-4 border-wood-dark pb-2">
            {last7Days.keys.map((key, i) => (
              <div key={key} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-4/5 border-2 border-wood-dark bg-gradient-to-t from-accent-orange to-accent-peach transition-all duration-500"
                    style={{ height: `${barHeights[i] * 100}%` }}
                    title={`${last7Days.values[i]} 分钟`}
                  />
                </div>
                <span className="text-[10px] font-display text-text-dim">{shortDayLabel(key)}</span>
                <span className="text-xs font-display font-bold text-accent-orange">{last7Days.values[i]}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2">
          <section className="pixel-panel p-4 md:p-6">
            <h2 className="mb-4 font-display text-lg text-brown-dark">🍅 时长分布</h2>
            {totalDurationCount === 0 ? (
              <p className="py-8 text-center text-sm text-text-dim font-display">还没有番茄钟记录哦</p>
            ) : (
              <div className="space-y-3">
                {durationDistribution.map((d) => {
                  const percent = (d.count / totalDurationCount) * 100
                  return (
                    <div key={d.minutes} className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-xs font-display text-text-secondary">{d.minutes}分钟</span>
                      <div className="h-5 flex-1 border-2 border-wood-dark bg-bg-cream">
                        <div className="h-full bg-gradient-to-r from-accent-mint to-green-400 transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right text-[10px] font-display text-text-dim">{d.count}次</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="pixel-panel p-4 md:p-6">
            <h2 className="mb-4 font-display text-lg text-brown-dark">🏘️ 建筑分布</h2>
            {buildingCategoryCount.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-dim font-display">还没有建筑哦</p>
            ) : (
              <div className="space-y-3">
                {buildingCategoryCount.map((item) => {
                  const total = buildings.length
                  const percent = (item.count / total) * 100
                  return (
                    <div key={item.category.key} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs font-display text-text-secondary">{item.category.icon} {item.category.label}</span>
                      <div className="h-5 flex-1 border-2 border-wood-dark bg-bg-cream">
                        <div className="h-full bg-gradient-to-r from-accent-lavender to-purple-400 transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right text-[10px] font-display text-text-dim">{item.count}个</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 pixel-panel p-4 md:mt-8 md:p-6">
          <h2 className="mb-4 font-display text-lg text-brown-dark">🏆 成就里程碑</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {milestones.map((m) => {
              const achieved = m.current >= m.threshold
              const percent = Math.min((m.current / m.threshold) * 100, 100)
              return (
                <div key={m.id} className={`p-3 border-3 transition-all ${achieved ? 'border-accent-mint bg-green-50' : 'border-wood-light bg-bg-cream'}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xl ${achieved ? '' : 'opacity-40 grayscale'}`}>{m.icon}</span>
                    {achieved && <span className="text-xs font-display bg-accent-mint text-white px-1.5 py-0.5">✓</span>}
                  </div>
                  <h3 className="mb-0.5 text-xs font-display font-bold text-brown-dark">{m.title}</h3>
                  <p className="mb-2 text-[10px] text-text-dim">{m.desc}</p>
                  <div className="h-2 border-2 border-wood-dark bg-bg-cream">
                    <div className={`h-full transition-all duration-500 ${achieved ? 'bg-accent-mint' : 'bg-accent-orange'}`} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] font-display text-text-dim">
                    <span>{Math.min(m.current, m.threshold)}/{m.threshold}{m.unit.slice(0,1)}</span>
                    <span>{Math.round(percent)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-6 pixel-panel p-4 md:mt-8 md:p-6">
          <h2 className="mb-4 font-display text-lg text-brown-dark">📋 账号概览</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-[10px] text-text-dim font-display">昵称</div>
              <div className="mt-1 font-display text-brown-dark">{nickname}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-dim font-display">注册天数</div>
              <div className="mt-1 font-display text-brown-dark">{registeredDays}天</div>
            </div>
            <div>
              <div className="text-[10px] text-text-dim font-display">日均番茄</div>
              <div className="mt-1 font-display text-brown-dark">{registeredDays > 0 ? (progress.totalPomodoros / registeredDays).toFixed(1) : '0'}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-dim font-display">日均专注</div>
              <div className="mt-1 font-display text-brown-dark">{registeredDays > 0 ? formatDuration((progress.totalFocusMinutes / registeredDays) * 60000) : '0m'}</div>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center pb-8">
          <Link to="/game" className="pixel-btn inline-block">🏠 返回游戏</Link>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="pixel-card p-3 text-center md:p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-[10px] text-text-dim font-display">{label}</div>
      <div className={`mt-1 font-display text-xl md:text-2xl text-${color}`}>{value}</div>
    </div>
  )
}

export default StatsPage
