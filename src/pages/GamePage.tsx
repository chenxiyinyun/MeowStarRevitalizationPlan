import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer'
import MapView from '@/components/map/MapView'
import BuildingPanel from '@/components/building/BuildingPanel'
import { useUserStore } from '@/store/userStore'
import { useProgressStore } from '@/store/progressStore'
import { useLevelUpUnlock } from '@/hooks/useLevelUpUnlock'
import { useSound } from '@/hooks/useSound'

const PLACEMENT_ERROR_MESSAGES: Record<string, string> = {
  locked: '🔒 该区域未解锁',
  occupied: '🏠 该位置已有建筑',
  no_fuel: '⛽ 燃料不足',
  locked_building: '🔒 建筑未解锁',
  out_of_bounds: '📍 位置超出地图范围',
  water: '💧 水面不可放置建筑',
}

const PAVE_ERROR_MESSAGES: Record<string, string> = {
  locked: '🔒 该区域未解锁',
  no_fuel: '⛽ 燃料不足',
  locked_road: '🔒 道路类型未解锁',
  out_of_bounds: '📍 位置超出地图范围',
  water: '💧 水面不可铺设道路',
}

const DEMOLISH_ERROR_MESSAGES: Record<string, string> = {
  no_building: '🏗️ 该位置没有建筑',
  out_of_bounds: '📍 位置超出地图范围',
}

const MOVE_ERROR_MESSAGES: Record<string, string> = {
  no_building: '🏗️ 该位置没有建筑',
  out_of_bounds: '📍 位置超出地图范围',
  locked: '🔒 目标区域未解锁',
  occupied: '🏠 目标位置已有建筑',
  water: '💧 水面不可放置建筑',
}

const FOG_REGION_NAMES: Record<string, string> = {
  east: '东区',
  west: '西区',
  north: '北区',
  south: '南区',
  corner_nw: '西北角',
  corner_ne: '东北角',
  corner_sw: '西南角',
  corner_se: '东南角',
}

function GamePage() {
  const nickname = useUserStore((s) => s.profile?.nickname ?? '喵星开拓者')
  const level = useProgressStore((s) => s.level)
  const fuel = useProgressStore((s) => s.fuel)
  const population = useProgressStore((s) => s.population)
  const { play, muted, toggleMute } = useSound()
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null)
  const [selectedRoadType, setSelectedRoadType] = useState<string | null>(null)
  const [demolishMode, setDemolishMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [mobilePomodoroOpen, setMobilePomodoroOpen] = useState(false)

  const { notification, dismissNotification } = useLevelUpUnlock()

  const prevLevelRef = useRef(level)
  useEffect(() => {
    if (level > prevLevelRef.current) {
      play('levelup')
    }
    prevLevelRef.current = level
  }, [level, play])

  useEffect(() => {
    if (!selectedBuildingType && !selectedRoadType && !demolishMode && !moveMode) return
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBuildingType(null)
        setSelectedRoadType(null)
        setDemolishMode(false)
        setMoveMode(false)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [selectedBuildingType, selectedRoadType, demolishMode, moveMode])

  const onPlacementResult = useCallback(
    (success: boolean, reason?: string, bonusXp?: number, adjacentToRoad?: boolean) => {
      if (success) {
        play('place')
        const baseXp = 10
        const totalXp = baseXp + (bonusXp ?? 0)
        const msg = adjacentToRoad
          ? `✨ 放置成功！XP +${totalXp}（邻路加成 +${bonusXp}）`
          : `✨ 放置成功！XP +${totalXp}`
        setToast({ message: msg, type: 'success' })
      } else {
        const msg = reason ? (PLACEMENT_ERROR_MESSAGES[reason] ?? '放置失败') : '放置失败'
        setToast({ message: msg, type: 'error' })
      }
      setTimeout(() => setToast(null), 2500)
    },
    [play]
  )

  const onPaveResult = useCallback(
    (success: boolean, reason?: string) => {
      if (success) {
        play('place')
        setToast({ message: '🛤️ 道路铺设成功！XP +5', type: 'success' })
      } else {
        const msg = reason ? (PAVE_ERROR_MESSAGES[reason] ?? '铺设失败') : '铺设失败'
        setToast({ message: msg, type: 'error' })
      }
      setTimeout(() => setToast(null), 2500)
    },
    [play]
  )

  const onDemolishResult = useCallback(
    (success: boolean, reason?: string, refundedFuel?: number, buildingName?: string) => {
      if (success) {
        play('place')
        const fuelMsg = refundedFuel && refundedFuel > 0 ? ` · 返还 ⛽${refundedFuel}` : ''
        setToast({
          message: `🔨 已拆除${buildingName ? ' ' + buildingName : ''}${fuelMsg}`,
          type: 'success',
        })
      } else {
        const msg = reason ? (DEMOLISH_ERROR_MESSAGES[reason] ?? '拆除失败') : '拆除失败'
        setToast({ message: msg, type: 'error' })
      }
      setTimeout(() => setToast(null), 2500)
    },
    [play]
  )

  const onMoveResult = useCallback(
    (success: boolean, reason?: string, buildingName?: string) => {
      if (success) {
        play('place')
        setToast({
          message: `📦 已移动${buildingName ? ' ' + buildingName : ''}到新位置`,
          type: 'success',
        })
      } else {
        const msg = reason ? (MOVE_ERROR_MESSAGES[reason] ?? '移动失败') : '移动失败'
        setToast({ message: msg, type: 'error' })
      }
      setTimeout(() => setToast(null), 2500)
    },
    [play]
  )

  let unlockToast: { message: string; type: 'info' } | null = null
  if (notification) {
    const parts: string[] = []
    if (notification.buildingNames && notification.buildingNames.length > 0) {
      parts.push(`🏗️ ${notification.buildingNames.join('、')}`)
    }
    if (notification.fogRegionIds && notification.fogRegionIds.length > 0) {
      const names = notification.fogRegionIds.map((id) => FOG_REGION_NAMES[id] ?? id)
      parts.push(`🗺️ ${names.join('、')}`)
    }
    unlockToast = { message: parts.join(' · '), type: 'info' }
  }

  const currentMode = demolishMode
    ? { text: '🔨 拆除模式 - 点击建筑拆除', color: 'bg-red-100 border-red-400 text-red-700' }
    : moveMode
      ? { text: '📦 移动模式 - 点击建筑→点击空地', color: 'bg-blue-100 border-blue-400 text-blue-700' }
      : selectedRoadType
        ? { text: '🛤️ 铺路模式 - 点击地图铺设道路', color: 'bg-amber-100 border-amber-400 text-amber-700' }
        : selectedBuildingType
          ? { text: '🏗️ 建造模式 - 点击地图放置建筑', color: 'bg-green-100 border-green-400 text-green-700' }
          : null

  return (
    <div className="flex h-full flex-col bg-bg-warm">
      <header className="wood-texture border-b-4 border-wood-dark px-3 py-2 md:px-4 md:py-2">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="pixel-btn-secondary text-xs px-3 py-1.5 md:text-sm md:px-4 md:py-2"
          >
            ← 首页
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            <div className="stat-badge flex items-center gap-1 text-xs md:text-sm">
              <span>⭐</span>
              <span>Lv.{level}</span>
            </div>
            <div className="stat-badge flex items-center gap-1 text-xs md:text-sm" style={{ background: 'linear-gradient(180deg, #81c784 0%, #66bb6a 100%)' }}>
              <span>👥</span>
              <span>{population}</span>
            </div>
            <div className="stat-badge flex items-center gap-1 text-xs md:text-sm" style={{ background: 'linear-gradient(180deg, #ffb74d 0%, #ff9800 100%)' }}>
              <span>⛽</span>
              <span>{fuel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Link
              to="/stats"
              className="pixel-btn-secondary text-xs px-2 py-1.5 md:text-sm md:px-3 md:py-2"
              title="专注统计"
            >
              📊
            </Link>
            <button
              onClick={toggleMute}
              className="pixel-btn-secondary text-xs px-2 py-1.5 md:text-sm md:px-3 md:py-2"
              title={muted ? '开启音效' : '静音'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <span className="hidden font-display text-sm text-cream md:inline">{nickname}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r-4 border-wood-dark bg-bg-paper p-4 scrollbar-thin lg:block">
          <PomodoroTimer />
        </aside>

        <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-green-100">
          <MapView
            placementBuildingType={selectedBuildingType}
            pavingRoadType={selectedRoadType}
            demolishMode={demolishMode}
            moveMode={moveMode}
            onPlacementResult={onPlacementResult}
            onPaveResult={onPaveResult}
            onDemolishResult={onDemolishResult}
            onMoveResult={onMoveResult}
          />

          {currentMode && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20">
              <div className={`border-3 px-4 py-2 font-display text-sm shadow-[0_3px_0_rgba(93,64,55,0.3)] ${currentMode.color}`}>
                {currentMode.text}
                <span className="ml-2 text-xs opacity-70">按 ESC 取消</span>
              </div>
            </div>
          )}

          {toast && (
            <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-20 md:bottom-4">
              <div
                className={`border-3 px-4 py-2 font-display text-sm shadow-[0_3px_0_rgba(93,64,55,0.3)] ${
                  toast.type === 'success'
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : toast.type === 'error'
                      ? 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-purple-100 border-purple-500 text-purple-800'
                }`}
              >
                {toast.message}
              </div>
            </div>
          )}

          {unlockToast && (
            <div className="absolute top-3 right-3 z-30 max-w-[280px]">
              <div className="pixel-panel bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl animate-bounce-soft">🎉</span>
                  <span className="font-display text-lg text-accent-orange">新解锁！</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{unlockToast.message}</p>
                <button
                  onClick={dismissNotification}
                  className="pixel-btn-yellow w-full text-sm"
                >
                  知道了 ✨
                </button>
              </div>
            </div>
          )}

          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 lg:hidden">
            <button
              onClick={() => {
                setMobilePomodoroOpen((v) => !v)
                setMobilePanelOpen(false)
              }}
              className="pixel-btn h-12 w-12 p-0 text-xl"
              title="番茄钟"
            >
              🍅
            </button>
            <button
              onClick={() => {
                setMobilePanelOpen((v) => !v)
                setMobilePomodoroOpen(false)
              }}
              className="pixel-btn-secondary h-12 w-12 p-0 text-xl"
              title="建筑面板"
            >
              🏗️
            </button>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 border-l-4 border-wood-dark bg-bg-paper lg:block">
          <BuildingPanel
            selectedBuildingType={selectedBuildingType}
            onSelect={setSelectedBuildingType}
            selectedRoadType={selectedRoadType}
            onPaveSelect={setSelectedRoadType}
            demolishMode={demolishMode}
            onDemolishToggle={setDemolishMode}
            moveMode={moveMode}
            onMoveToggle={setMoveMode}
          />
        </aside>
      </div>

      {mobilePomodoroOpen && (
        <div
          className="absolute inset-0 z-40 lg:hidden"
          onClick={() => setMobilePomodoroOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-16 left-3 right-3 max-h-[70vh] overflow-y-auto pixel-panel p-4 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <PomodoroTimer />
          </div>
        </div>
      )}

      {mobilePanelOpen && (
        <div className="absolute inset-0 z-40 lg:hidden" onClick={() => setMobilePanelOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto pixel-panel rounded-b-none scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-center bg-bg-card py-3">
              <div className="h-2 w-12 rounded-full bg-wood-light" />
            </div>
            <BuildingPanel
              selectedBuildingType={selectedBuildingType}
              onSelect={(t) => {
                setSelectedBuildingType(t)
                setMobilePanelOpen(false)
              }}
              selectedRoadType={selectedRoadType}
              onPaveSelect={(r) => {
                setSelectedRoadType(r)
                setMobilePanelOpen(false)
              }}
              demolishMode={demolishMode}
              onDemolishToggle={(enabled) => {
                setDemolishMode(enabled)
                setMobilePanelOpen(false)
              }}
              moveMode={moveMode}
              onMoveToggle={(enabled) => {
                setMoveMode(enabled)
                setMobilePanelOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default GamePage
