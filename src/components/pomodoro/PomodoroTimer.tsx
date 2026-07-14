import { usePomodoroStore } from '@/store/pomodoroStore'
import { useProgressStore } from '@/store/progressStore'
import { useUserStore } from '@/store/userStore'
import { usePomodoroTick } from '@/hooks/usePomodoroTick'
import { useVisibilityCalibration } from '@/hooks/useVisibilityCalibration'
import { usePomodoroCompletionNotification } from '@/hooks/useNotification'
import { useSound } from '@/hooks/useSound'
import { formatMsToMMSS } from '@/utils/time'
import { getLevelProgress } from '@/utils/level'
import { POMODORO_DURATION_PRESETS, POMODORO_DURATION_MIN, POMODORO_DURATION_MAX } from '@/types'
import CircularProgress from './CircularProgress'
import CompletionModal from './CompletionModal'

export default function PomodoroTimer() {
  const { phase, remainingMs, progress } = usePomodoroTick()
  const start = usePomodoroStore((s) => s.start)
  const pause = usePomodoroStore((s) => s.pause)
  const resume = usePomodoroStore((s) => s.resume)
  const reset = usePomodoroStore((s) => s.reset)
  const { play } = useSound()

  const pomodoroDurationMin = useUserStore((s) => s.settings.pomodoroDurationMin)
  const updateSettings = useUserStore((s) => s.updateSettings)

  const fuel = useProgressStore((s) => s.fuel)
  const xp = useProgressStore((s) => s.xp)
  const level = useProgressStore((s) => s.level)
  const totalPomodoros = useProgressStore((s) => s.totalPomodoros)
  const levelProgress = getLevelProgress(xp)

  useVisibilityCalibration()
  usePomodoroCompletionNotification()

  const isRunning = phase === 'running'
  const isPaused = phase === 'paused'
  const isActive = isRunning || isPaused

  return (
    <div className="flex h-full flex-col">
      <div className="wood-texture border-b-4 border-wood-dark px-3 py-2 mb-3">
        <h2 className="font-display text-lg text-cream text-center">🍅 专注番茄钟</h2>
      </div>

      <div className="pixel-panel p-3 mb-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl">⛽</div>
            <div className="text-[10px] text-text-dim">燃料</div>
            <div className="font-display text-lg text-accent-orange">{fuel}</div>
          </div>
          <div className="border-x-2 border-wood-light">
            <div className="text-xl">⭐</div>
            <div className="text-[10px] text-text-dim">等级</div>
            <div className="font-display text-lg text-accent-lavender">Lv.{level}</div>
          </div>
          <div>
            <div className="text-xl">🍅</div>
            <div className="text-[10px] text-text-dim">完成</div>
            <div className="font-display text-lg text-accent-mint">{totalPomodoros}</div>
          </div>
        </div>
      </div>

      <div className="px-1 mb-4">
        <div className="flex justify-between text-[10px] font-display text-text-dim">
          <span>Lv.{levelProgress.level}</span>
          <span>{xp - levelProgress.currentLevelXp}/{levelProgress.nextLevelXp - levelProgress.currentLevelXp}</span>
          <span>Lv.{levelProgress.level + 1}</span>
        </div>
        <div className="mt-1 h-3 border-2 border-wood-dark bg-bg-cream">
          <div
            className="h-full bg-gradient-to-r from-accent-mint to-accent-sky transition-all duration-500"
            style={{ width: `${levelProgress.progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <CircularProgress
          progress={progress}
          label={formatMsToMMSS(remainingMs)}
          sublabel={
            phase === 'idle'
              ? '准备开始'
              : phase === 'running'
                ? '专注中…'
                : phase === 'paused'
                  ? '已暂停'
                  : '已完成'
          }
          dimmed={isPaused}
        />

        {phase === 'idle' && (
          <div className="mt-5 flex flex-col items-center gap-2 w-full px-2">
            <span className="text-xs font-display text-text-dim">⏱️ 选择专注时长</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {POMODORO_DURATION_PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    play('click')
                    updateSettings({ pomodoroDurationMin: min })
                  }}
                  className={`px-2.5 py-1.5 text-xs font-display border-2 border-wood-dark transition-all ${
                    pomodoroDurationMin === min
                      ? 'bg-accent-orange text-white shadow-button-pressed translate-y-0.5'
                      : 'bg-bg-card text-text-secondary shadow-button hover:bg-accent-peach'
                  }`}
                >
                  {min}分
                </button>
              ))}
              <div
                className={`flex items-center gap-0.5 px-2 py-1.5 text-xs font-display border-2 border-wood-dark transition-all ${
                  !POMODORO_DURATION_PRESETS.includes(pomodoroDurationMin as 15 | 25 | 45)
                    ? 'bg-accent-orange text-white shadow-button-pressed translate-y-0.5'
                    : 'bg-bg-card text-text-secondary shadow-button hover:bg-accent-peach'
                }`}
              >
                <input
                  type="number"
                  min={POMODORO_DURATION_MIN}
                  max={POMODORO_DURATION_MAX}
                  value={pomodoroDurationMin}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (Number.isFinite(v)) {
                      const clamped = Math.min(Math.max(v, POMODORO_DURATION_MIN), POMODORO_DURATION_MAX)
                      updateSettings({ pomodoroDurationMin: clamped })
                    }
                  }}
                  className="w-8 bg-transparent text-center outline-none font-display"
                  style={{ color: 'inherit' }}
                />
                <span>分</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {phase === 'idle' && (
            <button
              onClick={() => {
                play('click')
                start()
              }}
              className="pixel-btn text-base px-8 py-2.5"
            >
              🍅 开始专注
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={() => {
                  play('click')
                  pause()
                }}
                className="pixel-btn-yellow text-sm px-6 py-2.5"
              >
                ⏸️ 暂停
              </button>
              <button
                onClick={() => {
                  play('click')
                  reset()
                }}
                className="pixel-btn-secondary text-sm px-5 py-2.5"
              >
                ↺ 重置
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={() => {
                  play('click')
                  resume()
                }}
                className="pixel-btn-mint text-sm px-6 py-2.5"
              >
                ▶️ 继续
              </button>
              <button
                onClick={() => {
                  play('click')
                  reset()
                }}
                className="pixel-btn-secondary text-sm px-5 py-2.5"
              >
                ↺ 重置
              </button>
            </>
          )}
        </div>

        {phase === 'idle' && (
          <p className="mt-4 text-[11px] text-text-dim text-center px-2">
            ✨ 完成专注获得 3 燃料 + 50 经验
          </p>
        )}
        {isActive && (
          <p className="mt-4 text-[11px] text-text-dim text-center px-2">
            💡 后台计时自动校准，切标签也不丢进度
          </p>
        )}
      </div>

      <CompletionModal />
    </div>
  )
}
