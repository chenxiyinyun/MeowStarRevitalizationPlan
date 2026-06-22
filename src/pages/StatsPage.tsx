/**
 * 专注统计页
 * 展示玩家专注与建造的综合数据：
 * - 核心指标卡片（累计专注时长、番茄钟数、建筑数、等级）
 * - 近 7 天专注趋势（柱状图）
 * - 番茄钟时长分布（饼图）
 * - 建筑类别分布（条形图）
 * - 成就里程碑
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProgressStore } from '@/store/progressStore'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { useBuildingStore } from '@/store/buildingStore'
import { useUserStore } from '@/store/userStore'
import { getBuildingType } from '@/game/data/buildings'
import { BUILDING_CATEGORIES } from '@/types'
import type { PomodoroSession, BuildingCategory } from '@/types'

/** 将毫秒格式化为 "Xh Ym" 或 "Ym" */
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** 获取某一天的日期 key（YYYY-MM-DD） */
function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/** 近 N 天的日期 key 列表（含今天） */
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

/** 短日期标签（M/D） */
function shortDayLabel(key: string): string {
  const [, m, d] = key.split('-')
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}

/** 柱状图最大值归一化 */
function normalizeHeights(values: number[], max: number): number[] {
  if (max <= 0) return values.map(() => 0)
  return values.map((v) => Math.max(v / max, 0.02)) // 最小 2% 保证可见
}

/** 成就里程碑定义 */
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

  // 近 7 天专注时长（分钟）
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

  // 番茄钟时长分布
  const durationDistribution = useMemo(() => {
    const buckets = new Map<number, number>() // key: 分钟, value: 次数
    pomodoroHistory.forEach((session: PomodoroSession) => {
      if (session.status !== 'completed') return
      const minutes = Math.round(session.durationMs / 60000)
      buckets.set(minutes, (buckets.get(minutes) ?? 0) + 1)
    })
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([min, count]) => ({ minutes: min, count }))
  }, [pomodoroHistory])

  // 建筑类别分布
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

  // 成就里程碑
  const milestones: Milestone[] = useMemo(() => {
    const totalFocusMin = progress.totalFocusMinutes
    const totalPomodoros = progress.totalPomodoros
    const buildingCount = buildings.length
    const level = progress.level

    return [
      {
        id: 'focus-60',
        icon: '⏱️',
        title: '初入专注',
        desc: '累计专注 60 分钟',
        threshold: 60,
        current: totalFocusMin,
        unit: '分钟',
      },
      {
        id: 'focus-600',
        icon: '🎯',
        title: '专注达人',
        desc: '累计专注 10 小时',
        threshold: 600,
        current: totalFocusMin,
        unit: '分钟',
      },
      {
        id: 'pomo-10',
        icon: '🍅',
        title: '番茄新手',
        desc: '完成 10 个番茄钟',
        threshold: 10,
        current: totalPomodoros,
        unit: '个',
      },
      {
        id: 'pomo-100',
        icon: '🏆',
        title: '番茄大师',
        desc: '完成 100 个番茄钟',
        threshold: 100,
        current: totalPomodoros,
        unit: '个',
      },
      {
        id: 'building-10',
        icon: '🏗️',
        title: '建筑工',
        desc: '放置 10 个建筑',
        threshold: 10,
        current: buildingCount,
        unit: '个',
      },
      {
        id: 'building-50',
        icon: '🏙️',
        title: '城市规划师',
        desc: '放置 50 个建筑',
        threshold: 50,
        current: buildingCount,
        unit: '个',
      },
      {
        id: 'level-5',
        icon: '⭐',
        title: '小有成就',
        desc: '达到 5 级',
        threshold: 5,
        current: level,
        unit: '级',
      },
      {
        id: 'level-10',
        icon: '🌟',
        title: '城市之光',
        desc: '达到 10 级',
        threshold: 10,
        current: level,
        unit: '级',
      },
    ]
  }, [progress, buildings])

  // 柱状图数据
  const maxDayMinutes = Math.max(...last7Days.values, 1)
  const barHeights = normalizeHeights(last7Days.values, maxDayMinutes)

  // 饼图数据（时长分布）
  const totalDurationCount = durationDistribution.reduce((sum, d) => sum + d.count, 0)

  // 注册天数
  const registeredDays = useMemo(() => {
    if (!createdAt) return 0
    return Math.max(1, Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000)) + 1)
  }, [createdAt])

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-deep/80 px-4 py-3 backdrop-blur-md md:px-6">
        <Link
          to="/game"
          className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          ← 返回游戏
        </Link>
        <h1 className="font-display text-base text-accent-orange md:text-xl">专注统计</h1>
        <span className="text-sm text-text-secondary">{nickname}</span>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {/* 核心指标卡片 */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard
            icon="⏱️"
            label="累计专注"
            value={formatDuration(progress.totalFocusMinutes * 60000)}
            accent="text-accent-orange"
            bg="bg-accent-orange/10"
          />
          <MetricCard
            icon="🍅"
            label="番茄钟数"
            value={String(progress.totalPomodoros)}
            accent="text-accent-mint"
            bg="bg-accent-mint/10"
          />
          <MetricCard
            icon="🏗️"
            label="建筑数量"
            value={String(buildings.length)}
            accent="text-accent-lavender"
            bg="bg-accent-lavender/10"
          />
          <MetricCard
            icon="⭐"
            label="当前等级"
            value={`Lv${progress.level}`}
            accent="text-accent-pink"
            bg="bg-accent-pink/10"
          />
        </section>

        {/* 近 7 天专注趋势 */}
        <section className="mt-6 rounded-2xl border border-border-subtle bg-bg-card p-5 md:mt-8 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-text-primary">近 7 天专注趋势</h2>
            <span className="text-xs text-text-dim">单位：分钟</span>
          </div>
          <div className="flex h-40 items-end justify-between gap-2 md:gap-3">
            {last7Days.keys.map((key, i) => (
              <div key={key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-accent-orange/60 to-accent-orange transition-all duration-500"
                    style={{ height: `${barHeights[i] * 100}%` }}
                    title={`${last7Days.values[i]} 分钟`}
                  />
                </div>
                <span className="text-xs text-text-dim">{shortDayLabel(key)}</span>
                <span className="text-xs font-medium text-text-secondary">
                  {last7Days.values[i]}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-2">
          {/* 番茄钟时长分布 */}
          <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 md:p-6">
            <h2 className="mb-4 font-display text-lg text-text-primary">番茄钟时长分布</h2>
            {totalDurationCount === 0 ? (
              <p className="py-8 text-center text-sm text-text-dim">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {durationDistribution.map((d) => {
                  const percent = (d.count / totalDurationCount) * 100
                  return (
                    <div key={d.minutes} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-sm text-text-secondary">
                        {d.minutes} 分钟
                      </span>
                      <div className="h-6 flex-1 overflow-hidden rounded-full bg-bg-deep">
                        <div
                          className="h-full rounded-full bg-accent-mint transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs text-text-dim">
                        {d.count} 次
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 建筑类别分布 */}
          <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 md:p-6">
            <h2 className="mb-4 font-display text-lg text-text-primary">建筑类别分布</h2>
            {buildingCategoryCount.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-dim">暂无建筑</p>
            ) : (
              <div className="space-y-3">
                {buildingCategoryCount.map((item) => {
                  const total = buildings.length
                  const percent = (item.count / total) * 100
                  return (
                    <div key={item.category.key} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm text-text-secondary">
                        {item.category.icon} {item.category.label}
                      </span>
                      <div className="h-6 flex-1 overflow-hidden rounded-full bg-bg-deep">
                        <div
                          className="h-full rounded-full bg-accent-lavender transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs text-text-dim">
                        {item.count} 个
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* 成就里程碑 */}
        <section className="mt-6 rounded-2xl border border-border-subtle bg-bg-card p-5 md:mt-8 md:p-6">
          <h2 className="mb-4 font-display text-lg text-text-primary">成就里程碑</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => {
              const achieved = m.current >= m.threshold
              const percent = Math.min((m.current / m.threshold) * 100, 100)
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-4 transition-all ${
                    achieved
                      ? 'border-accent-mint/40 bg-accent-mint/5'
                      : 'border-border-subtle bg-bg-deep/50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-2xl ${achieved ? '' : 'opacity-40 grayscale'}`}>
                      {m.icon}
                    </span>
                    {achieved && (
                      <span className="rounded-full bg-accent-mint/20 px-2 py-0.5 text-[10px] font-medium text-accent-mint">
                        已达成
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-text-primary">{m.title}</h3>
                  <p className="mb-2 text-xs text-text-dim">{m.desc}</p>
                  <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-bg-deep">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        achieved ? 'bg-accent-mint' : 'bg-accent-orange/60'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-dim">
                    <span>
                      {m.current} / {m.threshold} {m.unit}
                    </span>
                    <span>{Math.round(percent)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 概览信息 */}
        <section className="mt-6 rounded-2xl border border-border-subtle bg-bg-card p-5 md:mt-8 md:p-6">
          <h2 className="mb-4 font-display text-lg text-text-primary">账号概览</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-xs text-text-dim">昵称</div>
              <div className="mt-1 font-medium text-text-primary">{nickname}</div>
            </div>
            <div>
              <div className="text-xs text-text-dim">注册天数</div>
              <div className="mt-1 font-medium text-text-primary">{registeredDays} 天</div>
            </div>
            <div>
              <div className="text-xs text-text-dim">日均番茄钟</div>
              <div className="mt-1 font-medium text-text-primary">
                {registeredDays > 0 ? (progress.totalPomodoros / registeredDays).toFixed(1) : '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-dim">日均专注</div>
              <div className="mt-1 font-medium text-text-primary">
                {registeredDays > 0
                  ? formatDuration((progress.totalFocusMinutes / registeredDays) * 60000)
                  : '0m'}
              </div>
            </div>
          </div>
        </section>

        {/* 底部返回 */}
        <div className="mt-8 text-center">
          <Link
            to="/game"
            className="inline-block rounded-xl bg-accent-orange px-8 py-3 font-medium text-white shadow-lg shadow-accent-orange/30 transition-all hover:scale-105 hover:bg-accent-coral"
          >
            返回游戏
          </Link>
        </div>
      </div>
    </div>
  )
}

/** 核心指标卡片 */
function MetricCard({
  icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: string
  label: string
  value: string
  accent: string
  bg: string
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 transition-all hover:border-border-subtle/80 md:p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg} text-xl`}>
        {icon}
      </div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className={`mt-1 font-display text-2xl ${accent}`}>{value}</div>
    </div>
  )
}

export default StatsPage
