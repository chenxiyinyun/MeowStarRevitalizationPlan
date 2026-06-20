import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer'
import MapView from '@/components/map/MapView'
import BuildingPanel from '@/components/building/BuildingPanel'
import { useUserStore } from '@/store/userStore'
import { useProgressStore } from '@/store/progressStore'
import { useLevelUpUnlock } from '@/hooks/useLevelUpUnlock'
import { useSound } from '@/hooks/useSound'

/** 放置错误提示文案 */
const PLACEMENT_ERROR_MESSAGES: Record<string, string> = {
  locked: '该区域未解锁',
  occupied: '该位置已有建筑',
  no_fuel: '燃料不足',
  locked_building: '建筑未解锁',
  out_of_bounds: '位置超出地图范围',
  water: '水面不可放置建筑',
}

/** 铺路错误提示文案 */
const PAVE_ERROR_MESSAGES: Record<string, string> = {
  locked: '该区域未解锁',
  no_fuel: '燃料不足',
  locked_road: '道路类型未解锁',
  out_of_bounds: '位置超出地图范围',
  water: '水面不可铺设道路',
}

/** 拆除错误提示文案 */
const DEMOLISH_ERROR_MESSAGES: Record<string, string> = {
  no_building: '该位置没有建筑',
  out_of_bounds: '位置超出地图范围',
}

/** 移动错误提示文案 */
const MOVE_ERROR_MESSAGES: Record<string, string> = {
  no_building: '该位置没有建筑',
  out_of_bounds: '位置超出地图范围',
  locked: '目标区域未解锁',
  occupied: '目标位置已有建筑',
  water: '水面不可放置建筑',
}

/** 迷雾区域名称 */
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

  // 等级提升音效
  const prevLevelRef = useRef(level)
  useEffect(() => {
    if (level > prevLevelRef.current) {
      play('levelup')
    }
    prevLevelRef.current = level
  }, [level, play])

  // ESC 键取消放置/铺路/拆除/移动模式
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

  // 放置结果回调
  const onPlacementResult = useCallback(
    (success: boolean, reason?: string, bonusXp?: number, adjacentToRoad?: boolean) => {
      if (success) {
        play('place')
        const baseXp = 10
        const totalXp = baseXp + (bonusXp ?? 0)
        const msg = adjacentToRoad
          ? `建筑放置成功！XP +${totalXp}（邻路加成 +${bonusXp}）`
          : `建筑放置成功！XP +${totalXp}`
        setToast({ message: msg, type: 'success' })
      } else {
        const msg = reason ? (PLACEMENT_ERROR_MESSAGES[reason] ?? '放置失败') : '放置失败'
        setToast({ message: msg, type: 'error' })
      }
      setTimeout(() => setToast(null), 2500)
    },
    [play]
  )

  // 铺路结果回调
  const onPaveResult = useCallback(
    (success: boolean, reason?: string) => {
      if (success) {
        play('place')
        setToast({ message: '道路铺设成功！XP +5', type: 'success' })
      } else {
        const msg = reason ? (PAVE_ERROR_MESSAGES[reason] ?? '铺设失败') : '铺设失败'
        setToast({ message: msg, type: 'error' })
      }
      setTimeout(() => setToast(null), 2500)
    },
    [play]
  )

  // 拆除结果回调
  const onDemolishResult = useCallback(
    (success: boolean, reason?: string, refundedFuel?: number, buildingName?: string) => {
      if (success) {
        play('place')
        const fuelMsg = refundedFuel && refundedFuel > 0 ? ` · 返还 ⛽${refundedFuel}` : ''
        setToast({
          message: `已拆除${buildingName ? ' ' + buildingName : ''}${fuelMsg}`,
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

  // 移动结果回调
  const onMoveResult = useCallback(
    (success: boolean, reason?: string, buildingName?: string) => {
      if (success) {
        play('place')
        setToast({
          message: `已移动${buildingName ? ' ' + buildingName : ''}到新位置`,
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

  // 解锁通知
  let unlockToast: { message: string; type: 'info' } | null = null
  if (notification) {
    const parts: string[] = []
    if (notification.buildingNames && notification.buildingNames.length > 0) {
      parts.push(`解锁新建筑：${notification.buildingNames.join('、')}`)
    }
    if (notification.fogRegionIds && notification.fogRegionIds.length > 0) {
      const names = notification.fogRegionIds.map((id) => FOG_REGION_NAMES[id] ?? id)
      parts.push(`揭开新区域：${names.join('、')}`)
    }
    unlockToast = { message: parts.join(' · '), type: 'info' }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2 md:px-6 md:py-3">
        <Link
          to="/"
          className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          ← 首页
        </Link>
        <h1 className="font-display text-base text-accent-orange md:text-xl">喵星复兴计划</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/stats"
            className="rounded-lg border border-border-subtle px-2 py-1 text-xs text-text-secondary transition-colors hover:text-accent-lavender"
            title="专注统计"
          >
            📊 统计
          </Link>
          <button
            onClick={toggleMute}
            className="rounded-lg border border-border-subtle px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
            title={muted ? '开启音效' : '静音'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <span className="hidden text-sm text-text-secondary md:inline">{nickname}</span>
        </div>
      </header>

      {/* 主体：桌面三栏 / 移动端全屏地图 + 抽屉 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧番茄钟面板 —— 桌面端 */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-border-subtle p-6 scrollbar-thin md:block">
          <PomodoroTimer />
        </aside>

        {/* 中间地图区域 */}
        <main className="relative flex-1">
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

          {/* 放置/铺路/拆除/移动模式提示 */}
          {(selectedBuildingType || selectedRoadType || demolishMode || moveMode) && (
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-bg-deep/80 px-4 py-2 backdrop-blur-sm">
              <p
                className={`text-sm ${
                  demolishMode
                    ? 'text-red-400'
                    : moveMode
                      ? 'text-blue-400'
                      : 'text-accent-mint'
                }`}
              >
                {demolishMode
                  ? '点击建筑拆除 · ESC 取消'
                  : moveMode
                    ? '点击建筑选中 → 点击空地移动 · ESC 取消'
                    : selectedRoadType
                      ? '点击地图铺设道路 · ESC 取消'
                      : '点击地图放置 · ESC 取消'}
              </p>
            </div>
          )}

          {/* 操作 Toast */}
          {toast && (
            <div
              className={`pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 backdrop-blur-sm md:bottom-4 ${
                toast.type === 'success'
                  ? 'bg-accent-mint/20 text-accent-mint'
                  : toast.type === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-accent-lavender/20 text-accent-lavender'
              }`}
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          )}

          {/* 解锁通知 */}
          {unlockToast && (
            <div className="absolute top-4 right-4 max-w-xs rounded-xl border border-accent-lavender/30 bg-bg-deep/90 p-4 backdrop-blur-md">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <span className="font-display text-sm text-accent-lavender">新解锁！</span>
              </div>
              <p className="text-xs text-text-primary">{unlockToast.message}</p>
              <button
                onClick={dismissNotification}
                className="mt-2 text-xs text-text-secondary hover:text-text-primary"
              >
                知道了
              </button>
            </div>
          )}

          {/* 移动端浮动按钮组 */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 md:hidden">
            <button
              onClick={() => {
                setMobilePomodoroOpen((v) => !v)
                setMobilePanelOpen(false)
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-orange text-xl shadow-lg shadow-accent-orange/30"
              title="番茄钟"
            >
              🍅
            </button>
            <button
              onClick={() => {
                setMobilePanelOpen((v) => !v)
                setMobilePomodoroOpen(false)
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-card text-xl shadow-lg backdrop-blur-md"
              title="建筑面板"
            >
              🏗️
            </button>
          </div>
        </main>

        {/* 右侧建筑面板 —— 桌面端 */}
        <aside className="hidden w-72 shrink-0 border-l border-border-subtle bg-bg-card/30 md:block">
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

      {/* 移动端番茄钟抽屉 */}
      {mobilePomodoroOpen && (
        <div
          className="absolute inset-0 z-40 md:hidden"
          onClick={() => setMobilePomodoroOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute top-16 left-3 right-3 max-h-[70vh] overflow-y-auto rounded-2xl border border-border-subtle bg-bg-deep p-4 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <PomodoroTimer />
          </div>
        </div>
      )}

      {/* 移动端建筑面板抽屉 */}
      {mobilePanelOpen && (
        <div className="absolute inset-0 z-40 md:hidden" onClick={() => setMobilePanelOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-border-subtle bg-bg-deep scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-center bg-bg-deep py-2">
              <div className="h-1 w-10 rounded-full bg-text-dim" />
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
