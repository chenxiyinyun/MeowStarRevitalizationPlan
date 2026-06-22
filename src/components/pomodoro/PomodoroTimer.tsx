/**
 * 番茄钟主组件
 * 依据：development-design.md 5.1 番茄钟系统、6.2 番茄钟完整流程
 *
 * 集成：
 * - 环形进度 + 剩余时间显示（M1-3）
 * - 开始/暂停/恢复/重置控制（M1-3）
 * - 完成弹窗（M1-6，通过 CompletionModal）
 * - Web Notification（M1-6，通过 usePomodoroCompletionNotification）
 * - 后台计时校准（M1-7，通过 useVisibilityCalibration）
 * - 状态栏显示燃料/XP/等级（M1-4 奖励反馈）
 */
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

  // 用户设置中的番茄钟时长
  const pomodoroDurationMin = useUserStore((s) => s.settings.pomodoroDurationMin)
  const updateSettings = useUserStore((s) => s.updateSettings)

  // 状态栏数据
  const fuel = useProgressStore((s) => s.fuel)
  const xp = useProgressStore((s) => s.xp)
  const level = useProgressStore((s) => s.level)
  const totalPomodoros = useProgressStore((s) => s.totalPomodoros)
  const levelProgress = getLevelProgress(xp)

  // 启用后台校准与完成通知
  useVisibilityCalibration()
  usePomodoroCompletionNotification()

  const isRunning = phase === 'running'
  const isPaused = phase === 'paused'
  const isActive = isRunning || isPaused

  return (
    <div className="flex h-full flex-col">
      {/* 状态栏 */}
      <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⛽</span>
          <div className="flex flex-col">
            <span className="text-xs text-text-dim">燃料</span>
            <span className="font-bold text-accent-orange">{fuel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <div className="flex flex-col">
            <span className="text-xs text-text-dim">等级</span>
            <span className="font-bold text-accent-lavender">Lv{level}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🍅</span>
          <div className="flex flex-col">
            <span className="text-xs text-text-dim">已完成</span>
            <span className="font-bold text-accent-mint">{totalPomodoros}</span>
          </div>
        </div>
      </div>

      {/* 等级进度条 */}
      <div className="mt-2 px-1">
        <div className="flex justify-between text-xs text-text-dim">
          <span>Lv{levelProgress.level}</span>
          <span>
            {xp - levelProgress.currentLevelXp} /{' '}
            {levelProgress.nextLevelXp - levelProgress.currentLevelXp} XP
          </span>
          <span>Lv{levelProgress.level + 1}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-card">
          <div
            className="h-full rounded-full bg-accent-lavender transition-all duration-500"
            style={{ width: `${levelProgress.progress * 100}%` }}
          />
        </div>
      </div>

      {/* 番茄钟主体 */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <CircularProgress
          progress={progress}
          label={formatMsToMMSS(remainingMs)}
          sublabel={
            phase === 'idle'
              ? '准备开始专注'
              : phase === 'running'
                ? '专注中…'
                : phase === 'paused'
                  ? '已暂停'
                  : '已完成'
          }
          dimmed={isPaused}
        />

        {/* 时长选择（仅 idle 阶段显示） */}
        {phase === 'idle' && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-xs text-text-dim">专注时长</span>
            <div className="flex gap-2">
              {POMODORO_DURATION_PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    play('click')
                    updateSettings({ pomodoroDurationMin: min })
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    pomodoroDurationMin === min
                      ? 'bg-accent-orange text-white'
                      : 'border border-border-subtle bg-bg-card text-text-secondary hover:border-accent-orange/50 hover:text-text-primary'
                  }`}
                >
                  {min} 分钟
                </button>
              ))}
              <label
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  !POMODORO_DURATION_PRESETS.includes(pomodoroDurationMin as 15 | 25 | 45)
                    ? 'bg-accent-orange text-white'
                    : 'border border-border-subtle bg-bg-card text-text-secondary hover:border-accent-orange/50 hover:text-text-primary'
                }`}
                title={`自定义 ${POMODORO_DURATION_MIN}-${POMODORO_DURATION_MAX} 分钟`}
              >
                <span>自定义</span>
                <input
                  type="number"
                  min={POMODORO_DURATION_MIN}
                  max={POMODORO_DURATION_MAX}
                  value={pomodoroDurationMin}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (Number.isFinite(v)) {
                      const clamped = Math.min(
                        Math.max(v, POMODORO_DURATION_MIN),
                        POMODORO_DURATION_MAX
                      )
                      updateSettings({ pomodoroDurationMin: clamped })
                    }
                  }}
                  className="w-12 bg-transparent text-center outline-none"
                  style={{ color: 'inherit' }}
                />
                <span className="text-xs">分</span>
              </label>
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="mt-8 flex gap-3">
          {phase === 'idle' && (
            <button
              onClick={() => {
                play('click')
                start()
              }}
              className="rounded-xl bg-accent-orange px-10 py-3 text-lg font-medium text-white transition-all hover:scale-105 hover:bg-accent-coral"
              style={{ boxShadow: '0 0 20px var(--glow-orange)' }}
            >
              开始专注
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={() => {
                  play('click')
                  pause()
                }}
                className="rounded-xl bg-bg-card px-8 py-3 font-medium text-text-primary transition-colors hover:bg-bg-card-hover"
              >
                暂停
              </button>
              <button
                onClick={() => {
                  play('click')
                  reset()
                }}
                className="rounded-xl border border-border-subtle px-6 py-3 font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                重置
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
                className="rounded-xl bg-accent-orange px-8 py-3 font-medium text-white transition-all hover:scale-105 hover:bg-accent-coral"
                style={{ boxShadow: '0 0 20px var(--glow-orange)' }}
              >
                恢复
              </button>
              <button
                onClick={() => {
                  play('click')
                  reset()
                }}
                className="rounded-xl border border-border-subtle px-6 py-3 font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                重置
              </button>
            </>
          )}
        </div>

        {/* 提示文案 */}
        {phase === 'idle' && (
          <p className="mt-4 text-sm text-text-dim">
            完成 {pomodoroDurationMin} 分钟专注，获得 3 燃料与 50 经验值
          </p>
        )}
        {isActive && (
          <p className="mt-4 text-sm text-text-dim">切到其他标签页也不影响计时，回来会自动校准</p>
        )}
      </div>

      {/* 完成弹窗 */}
      <CompletionModal />
    </div>
  )
}
