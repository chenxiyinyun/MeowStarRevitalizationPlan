/**
 * 番茄钟完成弹窗
 * 依据：development-design.md 5.1.2 页面内弹窗、6.2 番茄钟完整流程
 *
 * 显示内容：
 * - 完成祝贺
 * - 奖励（燃料 +3，XP +50）
 * - 升级提示（若有）
 * - [继续] 按钮关闭弹窗
 */
import { useEffect, useRef } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { useProgressStore } from '@/store/progressStore'
import { useSound } from '@/hooks/useSound'

export default function CompletionModal() {
  const lastReward = usePomodoroStore((s) => s.lastReward)
  const lastLevelUp = usePomodoroStore((s) => s.lastLevelUp)
  const clearLastReward = usePomodoroStore((s) => s.clearLastReward)
  const fuel = useProgressStore((s) => s.fuel)
  const xp = useProgressStore((s) => s.xp)
  const level = useProgressStore((s) => s.level)
  const { play } = useSound()
  const prevRewardRef = useRef(lastReward)

  // 弹窗出现时播放完成音效
  useEffect(() => {
    if (lastReward && !prevRewardRef.current) {
      play('complete')
    }
    prevRewardRef.current = lastReward
  }, [lastReward, play])

  if (!lastReward) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={clearLastReward}
    >
      <div
        className="relative w-[90%] max-w-md rounded-2xl border border-border-subtle bg-bg-deep/95 p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 40px var(--glow-orange)' }}
      >
        {/* 装饰光晕 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--glow-orange), transparent 70%)',
          }}
        />

        <div className="relative">
          <div className="mb-2 text-6xl">🎉</div>
          <h2 className="font-display text-3xl text-accent-orange">专注完成！</h2>
          <p className="mt-2 text-text-secondary">喵星又向前迈进了一步～</p>

          {/* 奖励展示 */}
          <div className="mt-6 flex justify-center gap-4">
            <div className="flex flex-col items-center rounded-xl bg-bg-card px-6 py-4">
              <span className="text-3xl">⛽</span>
              <span className="mt-1 text-2xl font-bold text-accent-orange">+{lastReward.fuel}</span>
              <span className="text-xs text-text-secondary">燃料</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-bg-card px-6 py-4">
              <span className="text-3xl">✨</span>
              <span className="mt-1 text-2xl font-bold text-accent-lavender">+{lastReward.xp}</span>
              <span className="text-xs text-text-secondary">经验值</span>
            </div>
          </div>

          {/* 升级提示 */}
          {lastLevelUp && (
            <div className="mt-4 rounded-xl border border-accent-mint/30 bg-accent-mint/10 px-4 py-3">
              <p className="font-display text-lg text-accent-mint">
                升级！Lv{lastLevelUp.from} → Lv{lastLevelUp.to}
              </p>
              <p className="mt-1 text-xs text-text-secondary">解锁了新内容，去地图看看吧～</p>
            </div>
          )}

          {/* 当前状态 */}
          <div className="mt-4 flex justify-center gap-6 text-sm text-text-dim">
            <span>当前燃料：{fuel}</span>
            <span>当前经验：{xp}</span>
            <span>等级：Lv{level}</span>
          </div>

          <button
            onClick={clearLastReward}
            className="mt-6 w-full rounded-xl bg-accent-orange px-6 py-3 font-medium text-white transition-colors hover:bg-accent-coral"
          >
            继续
          </button>
        </div>
      </div>
    </div>
  )
}
