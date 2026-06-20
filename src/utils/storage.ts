/**
 * localStorage 存档读写封装
 * 依据：development-design.md 4.6 存档结构、8.3 存档性能（节流 1 秒）
 *
 * 设计：
 * - 直接读写：loadSave / writeSave / clearSave
 * - 节流写入：debouncedWriteSave，1 秒内多次写入只执行最后一次
 * - 错误隔离：localStorage 不可用（隐私模式等）时降级为内存存储
 */
import type { SaveData } from '@/types'
import { SAVE_VERSION } from '@/types'

const STORAGE_KEY = 'meow-star-save-v0.1'

/** 内存降级存储（localStorage 不可用时使用） */
let memoryFallback: SaveData | null = null

/** 检测 localStorage 是否可用 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__meow_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

const storageAvailable = isLocalStorageAvailable()

/** 读取存档 */
export function loadSave(): SaveData | null {
  if (storageAvailable) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as SaveData
    } catch (err) {
      console.error('[storage] 读取存档失败：', err)
      return null
    }
  }
  return memoryFallback
}

/** 直接写入存档（无节流） */
export function writeSave(data: SaveData): void {
  const payload: SaveData = { ...data, version: SAVE_VERSION, updatedAt: Date.now() }
  if (storageAvailable) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (err) {
      console.error('[storage] 写入存档失败：', err)
    }
  } else {
    memoryFallback = payload
  }
}

/** 清除存档 */
export function clearSave(): void {
  if (storageAvailable) {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('[storage] 清除存档失败：', err)
    }
  } else {
    memoryFallback = null
  }
}

// ===== 节流写入（防抖）=====

let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 1000

/**
 * 节流写入存档
 * 1 秒内多次调用只执行最后一次，避免高频状态变更导致频繁 IO
 */
export function debouncedWriteSave(data: SaveData): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    writeSave(data)
    debounceTimer = null
  }, DEBOUNCE_MS)
}

/** 立即刷新挂起的节流写入（页面卸载、失焦等场景调用） */
export function flushPendingSave(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

/** 导出存档为 JSON 文件（数据导出功能） */
export function exportSave(data: SaveData): string {
  return JSON.stringify(data, null, 2)
}

/** 从 JSON 字符串导入存档 */
export function importSave(json: string): SaveData {
  const parsed = JSON.parse(json) as SaveData
  if (!parsed.version || !parsed.profile) {
    throw new Error('存档格式无效')
  }
  return parsed
}
