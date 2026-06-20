/**
 * 存档管理器
 * 依据：development-design.md 4.6 存档结构、8.3 存档性能
 *
 * 职责：
 * - 应用启动时加载存档并 hydrate 各 store
 * - 订阅各 store 变化，自动节流写入
 * - 页面卸载/失焦时立即刷新挂起的写入
 */
import type { SaveData } from '@/types'
import { SAVE_VERSION, INITIAL_PROGRESS, DEFAULT_SETTINGS } from '@/types'
import { loadSave, writeSave, debouncedWriteSave, flushPendingSave } from '@/utils/storage'
import { useUserStore } from '@/store/userStore'
import { useProgressStore } from '@/store/progressStore'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { useMapStore } from '@/store/mapStore'
import { useBuildingStore } from '@/store/buildingStore'
import { useCatStore } from '@/store/catStore'

/** 从各 store 收集当前状态，组装成 SaveData */
export function collectSaveData(): SaveData {
  const userStore = useUserStore.getState()
  const progressStore = useProgressStore.getState()
  const pomodoroStore = usePomodoroStore.getState()
  const mapStore = useMapStore.getState()
  const buildingStore = useBuildingStore.getState()
  const catStore = useCatStore.getState()

  // 确保 profile 存在
  const profile = userStore.profile ?? userStore.initProfile()

  return {
    version: SAVE_VERSION,
    profile: { ...profile, lastActiveAt: Date.now() },
    progress: {
      level: progressStore.level,
      xp: progressStore.xp,
      fuel: progressStore.fuel,
      totalFocusMinutes: progressStore.totalFocusMinutes,
      totalPomodoros: progressStore.totalPomodoros,
    },
    map: mapStore.initialized
      ? {
          gridWidth: mapStore.gridWidth,
          gridHeight: mapStore.gridHeight,
          tiles: mapStore.tiles,
          camera: mapStore.cameraSnapshot,
          fogRegions: mapStore.fogRegions,
        }
      : null,
    buildings: buildingStore.buildings,
    cats: catStore.cats,
    currentPomodoro: pomodoroStore.current,
    pomodoroHistory: pomodoroStore.history,
    settings: userStore.settings,
    updatedAt: Date.now(),
  }
}

/** 创建初始存档（首次进入） */
function createInitialSave(): SaveData {
  const profile = useUserStore.getState().initProfile()
  return {
    version: SAVE_VERSION,
    profile: { ...profile, lastActiveAt: Date.now() },
    progress: { ...INITIAL_PROGRESS },
    map: null,
    buildings: [],
    cats: [],
    currentPomodoro: null,
    pomodoroHistory: [],
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now(),
  }
}

/**
 * 应用启动时初始化存档
 * @returns 是否为首次进入（新建存档）
 */
export function initSave(): boolean {
  const existing = loadSave()

  if (!existing) {
    // 首次进入，创建初始存档
    const initial = createInitialSave()
    writeSave(initial)
    useUserStore.getState().hydrate(initial.profile, initial.settings)
    useProgressStore.getState().setProgress(initial.progress)
    usePomodoroStore.getState().hydrate(null, initial.pomodoroHistory)
    return true
  }

  // 存在存档，hydrate 各 store（兼容旧存档可能缺少 currentPomodoro 字段）
  useUserStore.getState().hydrate(existing.profile, existing.settings)
  useProgressStore.getState().setProgress(existing.progress)
  usePomodoroStore.getState().hydrate(existing.currentPomodoro ?? null, existing.pomodoroHistory)

  // 恢复地图状态（兼容无地图数据的旧存档）
  if (existing.map && existing.map.tiles && existing.map.tiles.length > 0) {
    useMapStore.getState().hydrate({
      gridWidth: existing.map.gridWidth,
      gridHeight: existing.map.gridHeight,
      tiles: existing.map.tiles,
      camera: existing.map.camera,
      fogRegions: existing.map.fogRegions,
    })
  }

  // 恢复建筑状态（兼容旧存档）
  if (existing.buildings && Array.isArray(existing.buildings)) {
    useBuildingStore.getState().hydrate(existing.buildings)
  }

  // 恢复猫咪状态（兼容旧存档）
  if (existing.cats && Array.isArray(existing.cats)) {
    useCatStore.getState().hydrate(existing.cats)
  }
  return false
}

/** 节流写入当前状态到存档 */
export function saveCurrent(): void {
  debouncedWriteSave(collectSaveData())
}

/** 立即写入当前状态（绕过节流） */
export function saveCurrentImmediately(): void {
  writeSave(collectSaveData())
}

let autoSaveUnsubscribers: Array<() => void> = []
let autoSaveSetup = false

/**
 * 订阅各 store 变化，自动触发节流写入
 * 应在应用启动后调用一次
 */
export function setupAutoSave(): void {
  if (autoSaveSetup) return
  autoSaveSetup = true

  const { subscribe: subscribeUser } = useUserStore
  const { subscribe: subscribeProgress } = useProgressStore
  const { subscribe: subscribePomodoro } = usePomodoroStore
  const { subscribe: subscribeMap } = useMapStore
  const { subscribe: subscribeBuilding } = useBuildingStore
  const { subscribe: subscribeCat } = useCatStore

  autoSaveUnsubscribers = [
    subscribeUser(saveCurrent),
    subscribeProgress(saveCurrent),
    subscribePomodoro(saveCurrent),
    subscribeMap(saveCurrent),
    subscribeBuilding(saveCurrent),
    subscribeCat(saveCurrent),
  ]

  // 页面卸载前立即刷新
  window.addEventListener('beforeunload', handleBeforeUnload)
  // 页面失焦时也刷新（移动端切换应用场景）
  window.addEventListener('pagehide', handleBeforeUnload)
}

/** 卸载自动保存订阅（测试用） */
export function teardownAutoSave(): void {
  autoSaveUnsubscribers.forEach((unsub) => unsub())
  autoSaveUnsubscribers = []
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handleBeforeUnload)
  autoSaveSetup = false
}

function handleBeforeUnload(): void {
  flushPendingSave()
  saveCurrentImmediately()
}
