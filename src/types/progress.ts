/**
 * 用户与进度数据模型
 * 依据：development-design.md 4.1 用户与进度、4.6 存档结构
 */

/** 用户档案（本地匿名用户） */
export interface UserProfile {
  userId: string // 本地生成的唯一 ID（uuid）
  nickname: string // 昵称，默认"喵星开拓者"
  createdAt: number // 创建时间戳
  lastActiveAt: number // 最近活跃时间戳
}

/** 进度状态 */
export interface ProgressState {
  level: number // 当前等级
  xp: number // 当前经验值
  fuel: number // 燃料（专注产出，用于建造）
  totalFocusMinutes: number // 累计专注分钟数
  totalPomodoros: number // 累计完成番茄钟数
  population: number // 当前居民数量
}

/** 用户设置 */
export interface UserSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  reducedMotion: boolean // 尊重 prefers-reduced-motion
  notificationEnabled: boolean // Web Notification 开关
  /** 番茄钟专注时长（分钟），默认 25 */
  pomodoroDurationMin: number
}

/**
 * 存档顶层结构
 */
export interface SaveData {
  version: string // 存档版本号，用于迁移
  profile: UserProfile
  progress: ProgressState
  /** 地图存档（M2 填充，首次进入为 null） */
  map: SaveDataMap | null
  /** 已放置的建筑实例列表（M3 填充） */
  buildings: import('./building').BuildingInstance[]
  /** 猫咪实例列表（M4 填充） */
  cats: import('./cat').CatInstance[]
  /** 当前运行中的番茄钟会话（刷新页面后可恢复） */
  currentPomodoro: import('./pomodoro').PomodoroSession | null
  pomodoroHistory: import('./pomodoro').PomodoroSession[]
  settings: UserSettings
  updatedAt: number
}

/** 地图存档数据 */
export interface SaveDataMap {
  gridWidth: number
  gridHeight: number
  tiles: import('./map').TileData[][]
  camera: import('./map').Camera
  fogRegions: import('./map').FogRegion[]
}

/** 当前存档版本 */
export const SAVE_VERSION = '0.1.0'

/** 初始进度状态 */
export const INITIAL_PROGRESS: ProgressState = {
  level: 1,
  xp: 0,
  fuel: 0,
  totalFocusMinutes: 0,
  totalPomodoros: 0,
  population: 0,
}

/** 默认用户设置 */
export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  musicEnabled: true,
  reducedMotion: false,
  notificationEnabled: true,
  pomodoroDurationMin: 25,
}
