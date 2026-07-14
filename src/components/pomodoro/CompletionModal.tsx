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

  useEffect(() => {
    if (lastReward && !prevRewardRef.current) {
      play('complete')
    }
    prevRewardRef.current = lastReward
  }, [lastReward, play])

  if (!lastReward) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={clearLastReward}
    >
      <div
        className="relative w-[90%] max-w-sm pixel-panel bg-gradient-to-br from-yellow-50 via-orange-50 to-green-50 p-6 text-center animate-bounce-soft"
        onClick={(e) => e.stopPropagation()}
        style={{ animationDuration: '0.5s', animationIterationCount: '1' }}
      >
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-accent-yellow border-3 border-wood-dark rotate-45 flex items-center justify-center" />
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-accent-mint border-3 border-wood-dark rotate-45 flex items-center justify-center" />

        <div className="mb-3 text-5xl animate-wiggle">🎉</div>
        <h2 className="font-display text-2xl text-accent-orange">专注完成！</h2>
        <p className="mt-1 text-sm text-text-secondary">喵星又长大了一点～</p>

        <div className="mt-5 flex justify-center gap-3">
          <div className="flex flex-col items-center pixel-panel bg-orange-50 px-4 py-3">
            <span className="text-2xl">⛽</span>
            <span className="mt-1 text-xl font-display text-accent-orange">+{lastReward.fuel}</span>
            <span className="text-[10px] text-text-dim">燃料</span>
          </div>
          <div className="flex flex-col items-center pixel-panel bg-purple-50 px-4 py-3">
            <span className="text-2xl">✨</span>
            <span className="mt-1 text-xl font-display text-accent-lavender">
              +{lastReward.xp + (lastReward.roadBonusXp ?? 0)}
            </span>
            <span className="text-[10px] text-text-dim">经验</span>
          </div>
        </div>

        {lastReward.roadBonusXp && lastReward.roadBonusXp > 0 && (
          <div className="mt-3 border-2 border-accent-mint bg-accent-mint/20 px-3 py-2">
            <p className="text-xs font-display text-accent-mint">
              🏙️ 邻路加成 · {lastReward.roadBonusBuildings}栋建筑 · XP +{lastReward.roadBonusXp}
            </p>
          </div>
        )}

        {lastLevelUp && (
          <div className="mt-3 border-2 border-accent-yellow bg-accent-yellow/20 px-3 py-2 animate-sparkle">
            <p className="font-display text-lg text-amber-700">
              ⬆️ 升级！Lv{lastLevelUp.from} → Lv{lastLevelUp.to}
            </p>
            <p className="mt-1 text-[10px] text-text-secondary">解锁新内容，快去建造吧！</p>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-4 text-[10px] text-text-dim font-display">
          <span>⛽{fuel}</span>
          <span>⭐Lv{level}</span>
          <span>✨{xp}XP</span>
        </div>

        <button
          onClick={clearLastReward}
          className="mt-5 w-full pixel-btn text-base"
        >
          太棒了！🌟
        </button>
      </div>
    </div>
  )
}
