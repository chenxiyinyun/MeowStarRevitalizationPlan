/**
 * 地图视图组件
 * 依据：development-design.md 5.2.2 渲染方案、5.3 建筑系统、5.4 猫咪系统
 *
 * 通过 ref 将 PixiJS canvas 挂载到 React，状态通过 Zustand 共享。
 * 引擎内部直接操作 PixiJS Container 管理相机，避免拖拽时频繁触发 React 重渲染。
 * 定期同步相机快照到 store 供存档使用。
 */
import { useEffect, useRef } from 'react'
import { MapEngine } from '@/game/MapEngine'
import type { CatCallbacks } from '@/game/MapEngine'
import { useMapStore } from '@/store/mapStore'
import { useBuildingStore } from '@/store/buildingStore'
import { useCatStore } from '@/store/catStore'
import { useProgressStore } from '@/store/progressStore'
import type { FogRegion } from '@/types'

const CAMERA_SYNC_INTERVAL_MS = 2000
const CAT_TICK_INTERVAL_MS = 1000

interface MapViewProps {
  /** 当前选中的建筑类型 ID（放置模式），null 表示非放置模式 */
  placementBuildingType: string | null
  /** 当前选中的道路类型 ID（铺路模式），null 表示非铺路模式 */
  pavingRoadType?: string | null
  /** 放置结果回调（成功/失败时通知父组件） */
  onPlacementResult?: (success: boolean, reason?: string) => void
  /** 铺路结果回调（成功/失败时通知父组件） */
  onPaveResult?: (success: boolean, reason?: string) => void
}

export default function MapView({
  placementBuildingType,
  pavingRoadType,
  onPlacementResult,
  onPaveResult,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<MapEngine | null>(null)
  /** 追踪上一次的迷雾区域状态，用于检测新揭开的区域并触发动画 */
  const prevFogRegionsRef = useRef<FogRegion[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const store = useMapStore.getState()
    if (!store.initialized) {
      store.initMap()
    }

    const state = useMapStore.getState()
    const engine = new MapEngine(
      container,
      state.tiles,
      state.gridWidth,
      state.gridHeight,
      state.tileSize
    )

    let cancelled = false

    engine.init().then(() => {
      if (cancelled) {
        engine.destroy()
        return
      }
      // 恢复相机状态：如果存档中的相机是默认值（未交互过），则使用引擎居中
      const cam = state.cameraSnapshot
      const isDefaultCamera = cam.x === 0 && cam.y === 0 && cam.zoom === 1
      if (!isDefaultCamera) {
        engine.setCamera(cam)
      }
      engine.updateBuildings(useBuildingStore.getState().buildings)
      engine.updateFog(state.fogRegions)
      // 初始化迷雾区域追踪
      prevFogRegionsRef.current = state.fogRegions

      // 初始化猫咪系统
      const progress = useProgressStore.getState()
      useCatStore.getState().spawnCats(progress.level, progress.totalPomodoros)
      engine.updateCats(useCatStore.getState().cats, catCallbacks)
      // 同步居中后的相机到 store
      useMapStore.getState().setCamera(engine.getCamera())
      engineRef.current = engine
    })

    // 猫咪交互回调
    const catCallbacks: CatCallbacks = {
      onClick: (catId: string) => {
        const text = useCatStore.getState().interactCat(catId)
        if (text && engineRef.current) {
          engineRef.current.showCatDialog(catId, text)
        }
      },
      onMoveComplete: (catId: string) => {
        useCatStore.getState().finishMove(catId)
      },
      onInteractComplete: (catId: string) => {
        useCatStore.getState().finishInteract(catId)
      },
    }

    // 定期同步相机状态到 store（供存档使用）
    const syncInterval = setInterval(() => {
      if (engineRef.current) {
        const cam = engineRef.current.getCamera()
        const snapshot = useMapStore.getState().cameraSnapshot
        if (cam.x !== snapshot.x || cam.y !== snapshot.y || cam.zoom !== snapshot.zoom) {
          useMapStore.getState().setCamera(cam)
        }
      }
    }, CAMERA_SYNC_INTERVAL_MS)

    // 猫咪定时移动 tick
    const catTickInterval = setInterval(() => {
      useCatStore.getState().tickCats()
    }, CAT_TICK_INTERVAL_MS)

    const handleBeforeUnload = () => {
      if (engineRef.current) {
        useMapStore.getState().setCamera(engineRef.current.getCamera())
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      cancelled = true
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      clearInterval(syncInterval)
      clearInterval(catTickInterval)

      if (engineRef.current) {
        useMapStore.getState().setCamera(engineRef.current.getCamera())
        engineRef.current.destroy()
        engineRef.current = null
      } else {
        engine.destroy()
      }
    }
  }, [])

  // 放置模式变化时，更新引擎
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    if (placementBuildingType) {
      engine.setPlacementMode(placementBuildingType, (gx, gy) => {
        const result = useBuildingStore.getState().placeBuilding(placementBuildingType, gx, gy)
        if (result.ok) {
          // 更新引擎建筑渲染
          engine.updateBuildings(useBuildingStore.getState().buildings)
          onPlacementResult?.(true)
        } else {
          onPlacementResult?.(false, result.reason)
        }
      })
    } else {
      engine.setPlacementMode(null)
      engine.clearPreview()
    }
  }, [placementBuildingType, onPlacementResult])

  // 铺路模式变化时，更新引擎
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    if (pavingRoadType) {
      engine.setPavingMode(pavingRoadType, (gx, gy) => {
        const result = useMapStore.getState().paveRoad(gx, gy, pavingRoadType)
        if (result.ok) {
          // tiles 变化通过 mapStore 订阅自动触发 engine.updateTiles
          onPaveResult?.(true)
        } else {
          onPaveResult?.(false, result.reason)
        }
      })
    } else {
      engine.setPavingMode(null)
      engine.clearPreview()
    }
  }, [pavingRoadType, onPaveResult])

  // 订阅 buildingStore 变化，更新引擎建筑渲染
  useEffect(() => {
    const unsubscribe = useBuildingStore.subscribe((state) => {
      if (engineRef.current) {
        engineRef.current.updateBuildings(state.buildings)
      }
    })
    return unsubscribe
  }, [])

  // 订阅 mapStore tiles 变化，更新引擎瓦片/迷雾渲染
  useEffect(() => {
    const unsubscribe = useMapStore.subscribe((state) => {
      const engine = engineRef.current
      if (!engine) return

      // 检测新揭开的迷雾区域
      const prevRegions = prevFogRegionsRef.current
      const newlyRevealed = state.fogRegions.filter(
        (r) => r.revealed && !prevRegions.find((pr) => pr.id === r.id)?.revealed
      )

      if (newlyRevealed.length > 0) {
        // 先触发揭开动画（动画期间 renderFog 自动跳过）
        engine.animateFogReveal(newlyRevealed)
      }

      engine.updateTiles(state.tiles)
      engine.updateFog(state.fogRegions)
      prevFogRegionsRef.current = state.fogRegions
    })
    return unsubscribe
  }, [])

  // 订阅 catStore 变化，更新引擎猫咪渲染
  useEffect(() => {
    const unsubscribe = useCatStore.subscribe((state) => {
      if (engineRef.current) {
        engineRef.current.updateCats(state.cats)
      }
    })
    return unsubscribe
  }, [])

  // 订阅 progressStore 变化，生成满足条件的新猫咪
  useEffect(() => {
    let prevLevel = useProgressStore.getState().level
    let prevPomodoros = useProgressStore.getState().totalPomodoros

    const unsubscribe = useProgressStore.subscribe((state) => {
      const levelChanged = state.level !== prevLevel
      const pomodorosChanged = state.totalPomodoros !== prevPomodoros

      if (levelChanged || pomodorosChanged) {
        useCatStore.getState().spawnCats(state.level, state.totalPomodoros)
      }

      prevLevel = state.level
      prevPomodoros = state.totalPomodoros
    })
    return unsubscribe
  }, [])

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />
}
