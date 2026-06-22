# 喵星复兴计划 · 开发设计文档

> 本文档基于 [design-draft.md](./design-draft.md) 的产品创意，补充技术实现所需的架构、模块、数据模型与交互细节，作为开发阶段的指导文档。
>
> **文档版本：** v2.0
> **最后更新：** 2026-06-22

---

## 一、文档说明

### 1.1 文档目标
将参赛创意稿转化为可执行的开发设计，明确：
- 技术选型与整体架构
- 功能模块拆解与 MVP 范围
- 核心数据模型
- 各子系统的详细规则
- 关键交互流程
- 视觉与交互规范
- 开发里程碑

### 1.2 与设计稿的关系
设计稿定义了「做什么」和「为什么」，本文档定义「怎么做」。当两者冲突时，以本文档为准；本文档未覆盖的部分，回归设计稿的产品方向。

---

## 二、技术架构与选型

### 2.1 整体架构

```
┌─────────────────────────────────────────────┐
│                  浏览器端                     │
│  ┌───────────┐  ┌───────────┐  ┌─────────┐  │
│  │  React UI │  │  地图渲染  │  │  动画层  │  │
│  │ (页面/面板)│  │ (PixiJS)  │  │ (GSAP)  │  │
│  └─────┬─────┘  └─────┬─────┘  └────┬────┘  │
│        └──────────┬───┴──────────────┘       │
│              ┌────▼─────┐                    │
│              │  状态层   │ Zustand            │
│              │  Store   │                    │
│              └────┬─────┘                    │
│              ┌────▼─────────┐                │
│              │ 持久化适配层  │                │
│              └────┬─────────┘                │
│        ┌─────────┴──────────┐                │
│   ┌────▼─────┐        ┌─────▼─────┐          │
│   │localStorage│       │  后端 API  │（后续）  │
│   │  (MVP)    │        │  (迭代2)  │          │
│   └───────────┘        └───────────┘          │
└─────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 选型 | 理由 |
| --- | --- | --- |
| 构建工具 | Vite 8 | 启动快、HMR 好、生态成熟 |
| 前端框架 | React 19 + TypeScript 6 | 组件生态丰富、类型安全 |
| 状态管理 | Zustand 5 | 轻量、无样板代码、适合中等复杂度 |
| 等距地图渲染 | PixiJS 8 | WebGL 渲染性能好，适合瓦片地图与大量精灵 |
| 动画 | GSAP 3 + ScrollTrigger | 设计稿已指定，UI 过渡与滚动动画 |
| 样式方案 | Tailwind CSS 3 + CSS Variables | 快速布局 + 主题色统一管理 |
| 路由 | React Router 7 | 单页应用路由 |
| 持久化（MVP） | localStorage | 无需后端，本地存储用户进度 |
| 后端（迭代2） | Node.js + Express + SQLite/PostgreSQL | 账号体系与跨端同步 |
| 包管理 | pnpm | 节省磁盘、速度快 |
| 代码规范 | ESLint 8 + Prettier + Stylelint | 统一代码风格 |

### 2.3 目录结构（建议）

```
src/
├── main.tsx                      # 应用入口
├── App.tsx                       # 根组件 + 路由
├── pages/                        # 页面级组件
│   ├── HomePage.tsx              # 首页/落地页
│   ├── GamePage.tsx              # 主游戏页（地图+番茄钟）
│   └── StatsPage.tsx             # 统计页（迭代2）
├── components/                   # 通用组件
│   ├── ui/                       # 基础 UI（按钮、弹窗、进度条）
│   ├── pomodoro/                 # 番茄钟相关组件
│   ├── map/                      # 地图相关组件
│   ├── building/                 # 建筑相关组件
│   └── cat/                      # 猫咪相关组件
├── game/                         # 游戏核心逻辑（与渲染解耦）
│   ├── engine/                   # 地图引擎、渲染循环
│   ├── systems/                  # 番茄钟、建筑、猫咪、迷雾系统
│   └── data/                     # 静态数据（建筑配置、猫咪配置、对话池）
├── store/                        # Zustand stores
│   ├── userStore.ts
│   ├── progressStore.ts
│   ├── mapStore.ts
│   └── pomodoroStore.ts
├── types/                        # TypeScript 类型定义
├── hooks/                        # 自定义 hooks
├── utils/                        # 工具函数（坐标转换、存档等）
├── styles/                       # 全局样式与主题变量
└── assets/                       # 静态资源（图标、音效、精灵图）
```

---

## 三、功能模块清单与 MVP 范围

### 3.1 功能模块清单

| 模块 | 子功能 | 阶段 | 状态 |
| --- | --- | --- | --- |
| **番茄钟** | 基础倒计时（开始/暂停/重置） | MVP | ✅ |
| | 完成奖励（燃料+XP） | MVP | ✅ |
| | 后台运行与通知 | MVP | ✅ |
| | 音效（Web Audio API 合成） | MVP | ✅ |
| | 时长自定义 | 迭代2 | ⬜ |
| | 专注统计 | 迭代2 | ⬜ |
| **等距地图** | 网格渲染与坐标转换 | MVP | ✅ |
| | 拖拽平移与缩放 | MVP | ✅ |
| | 迷雾覆盖与揭开 | MVP | ✅ |
| | 等级解锁新区域 | MVP | ✅ |
| **建筑系统** | 建筑配置数据（26 种 / 5 阶段递进） | MVP | ✅ |
| | 解锁与放置 | MVP | ✅ |
| | 建筑升级 | 迭代2 | ⬜ |
| | 建筑拆除/移动 | 迭代2 | ⬜ |
| **猫咪系统** | 猫咪生成与移动 | MVP | ✅ |
| | 点击互动与对话气泡 | MVP | ✅ |
| | 猫咪收集图鉴 | 迭代3 | ⬜ |
| | 猫咪皮肤 | 迭代3 | ⬜ |
| **等级与进度** | XP 累积与等级提升 | MVP | ✅ |
| | 等级奖励解锁 | MVP | ✅ |
| | 成就系统 | 迭代2 | ⬜ |
| **用户体系** | 本地匿名用户 | MVP | ✅ |
| | 账号注册登录 | 迭代2 | ⬜ |
| | 跨端同步 | 迭代2 | ⬜ |
| **其他** | 数据导出/导入 | MVP | ✅ |
| | 社交分享 | 迭代3 | ⬜ |
| | 主题皮肤 | 迭代3 | ⬜ |

### 3.2 MVP 范围定义

MVP 聚焦核心闭环：**专注 → 获得燃料 → 升级 → 解锁建筑与区域 → 看到城市成长**。

MVP 必须包含：
1. 番茄钟（25 分钟固定，开始/暂停/重置，完成发奖）
2. 等距地图（20×20 网格，拖拽缩放，迷雾揭开）
3. 建筑系统（6-8 种基础建筑，XP 解锁，点击放置）
4. 猫咪系统（2-3 只猫，随机出现，点击对话）
5. 等级系统（XP 累积，等级提升解锁内容）
6. 本地存档（localStorage 自动保存）
7. 响应式布局（PC + 移动端）

MVP 不包含：账号体系、社交分享、建筑升级、猫咪图鉴、自定义时长、成就系统。

---

## 四、核心数据模型

> 使用 TypeScript 接口描述。MVP 阶段所有数据存储于 localStorage，结构需保证可序列化。

### 4.1 用户与进度

```typescript
interface UserProfile {
  userId: string;            // 本地生成的唯一 ID（uuid）
  nickname: string;          // 昵称，默认"喵星开拓者"
  createdAt: number;         // 创建时间戳
  lastActiveAt: number;      // 最近活跃时间戳
}

interface ProgressState {
  level: number;             // 当前等级
  xp: number;                // 当前经验值
  fuel: number;              // 燃料（专注产出，用于建造）
  totalFocusMinutes: number; // 累计专注分钟数
  totalPomodoros: number;    // 累计完成番茄钟数
}
```

### 4.2 番茄钟

```typescript
interface PomodoroSession {
  id: string;
  startedAt: number;         // 开始时间戳
  durationMs: number;        // 设定时长（MVP 固定 25*60*1000）
  status: 'running' | 'paused' | 'completed' | 'abandoned';
  pausedAt?: number;         // 暂停时间戳
  accumulatedPausedMs: number; // 累计暂停时长
  completedAt?: number;      // 完成时间戳
  reward?: { fuel: number; xp: number };
}
```

### 4.3 地图与建筑

```typescript
interface MapState {
  gridWidth: number;         // 网格宽度（瓦片数）
  gridHeight: number;        // 网格高度
  tileSize: { w: number; h: number }; // 瓦片像素尺寸，默认 {64, 32}
  camera: { x: number; y: number; zoom: number }; // 相机位置与缩放
  tiles: TileData[][];       // 二维瓦片数组 [y][x]
  buildings: BuildingInstance[]; // 已放置建筑
  fog: FogState;             // 迷雾状态
}

interface TileData {
  x: number;                 // 网格坐标 x
  y: number;                 // 网格坐标 y
  terrain: 'grass' | 'dirt' | 'forest' | 'water' | 'road'; // 地形类型（含道路）
  unlocked: boolean;         // 是否已解锁（非迷雾）
  buildingId?: string;       // 占据该瓦片的建筑实例 ID
}

interface BuildingInstance {
  id: string;
  typeId: string;            // 对应 BuildingType.id
  x: number;                 // 所在网格坐标 x
  y: number;                 // 所在网格坐标 y
  placedAt: number;          // 放置时间戳
}

interface BuildingType {
  id: string;
  name: string;              // 显示名称
  description: string;
  category: 'nature' | 'road' | 'residence' | 'commercial' | 'facility' | 'decoration' | 'landmark';
  cost: { fuel: number };    // 建造消耗
  unlockLevel: number;       // 解锁所需等级
  footprint: { w: number; h: number }; // 占地大小（瓦片数）
  sprite: string;            // 精灵图资源 key
}
```

### 4.4 猫咪

```typescript
interface CatInstance {
  id: string;
  typeId: string;            // 对应 CatType.id
  name: string;
  x: number;                 // 当前所在网格坐标 x
  y: number;                 // 当前所在网格坐标 y
  state: 'idle' | 'walking' | 'sleeping' | 'interacting';
  lastMovedAt: number;       // 上次移动时间戳
  dialogCooldownUntil: number; // 对话冷却到期时间
}

interface CatType {
  id: string;
  name: string;
  sprite: string;            // 精灵图资源 key
  personality: 'lazy' | 'playful' | 'curious' | 'shy';
  dialogPool: string[];      // 对话文案池
  moveIntervalMs: number;    // 移动间隔
}
```

### 4.5 迷雾

```typescript
interface FogState {
  // 以区域（矩形）为单位管理迷雾，便于批量揭开
  regions: FogRegion[];
}

interface FogRegion {
  id: string;
  x: number; y: number;      // 区域左上角网格坐标
  w: number; h: number;      // 区域宽高（瓦片数）
  revealed: boolean;
  revealCondition:
    | { type: 'level'; level: number }
    | { type: 'pomodoroCount'; count: number };
}
```

### 4.6 存档结构（顶层）

```typescript
interface SaveData {
  version: string;           // 存档版本号，用于迁移
  profile: UserProfile;
  progress: ProgressState;
  map: MapState;
  cats: CatInstance[];
  pomodoroHistory: PomodoroSession[]; // 保留最近 N 条
  settings: UserSettings;
  updatedAt: number;
}

interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;    // 尊重 prefers-reduced-motion
}
```

---

## 五、系统详细设计

### 5.1 番茄钟系统

#### 5.1.1 核心规则

| 规则 | 说明 |
| --- | --- |
| 默认时长 | 25 分钟（1500 秒），MVP 不可配置 |
| 倒计时方式 | 记录 `startedAt` 时间戳，剩余时间 = 时长 - (now - startedAt - accumulatedPausedMs) |
| 暂停 | 记录 `pausedAt`，恢复时累加暂停时长；暂停期间不计时 |
| 重置 | 回到初始状态，不发放奖励，本次会话标记为 `abandoned` |
| 完成 | 状态置 `completed`，发放奖励 |
| 后台运行 | 依赖时间戳计算，切回标签页自动校准；不依赖 setInterval 精确性 |
| 完成奖励 | 燃料 +3，XP +50（可后续平衡调整） |

#### 5.1.2 通知机制

- 专注完成时：播放音效 + Web Notification（需用户授权）+ 页面内弹窗
- 标签页失焦时仍可触发通知

#### 5.1.3 状态机

```
idle ──start──▶ running ──pause──▶ paused ──resume──▶ running
                    │                                   │
                    ├──complete──▶ completed
                    └──reset────▶ idle
```

### 5.2 等距地图系统

#### 5.2.1 坐标系与转换

采用标准 2:1 等距投影，瓦片尺寸 `64×32`。

```typescript
// 网格坐标 → 屏幕坐标（瓦片左上角）
function gridToScreen(gx: number, gy: number, tileSize = { w: 64, h: 32 }) {
  return {
    sx: (gx - gy) * tileSize.w / 2,
    sy: (gx + gy) * tileSize.h / 2,
  };
}

// 屏幕坐标 → 网格坐标
function screenToGrid(sx: number, sy: number, tileSize = { w: 64, h: 32 }) {
  return {
    gx: Math.floor((sx / (tileSize.w / 2) + sy / (tileSize.h / 2)) / 2),
    gy: Math.floor((sy / (tileSize.h / 2) - sx / (tileSize.w / 2)) / 2),
  };
}
```

#### 5.2.2 渲染方案

- 使用 PixiJS 的 `Application` + `Container` 管理场景
- 地形瓦片：`Sprite` 批量渲染，按等距深度排序（y 越大越靠前）
- 建筑：作为 `Sprite` 叠加在瓦片之上，按 `(x+y)` 排序
- 迷雾：半透明黑色遮罩 `Graphics`，边缘渐变柔化
- 猫咪：独立 `Sprite`，z-index 高于建筑

#### 5.2.3 交互

| 操作 | PC | 移动端 |
| --- | --- | --- |
| 平移 | 鼠标拖拽 | 单指拖拽 |
| 缩放 | 滚轮 | 双指捏合 |
| 选中瓦片/建筑 | 单击 | 单击 |
| 放置建筑 | 选中建筑后单击空地 | 同左 |

缩放范围限制 `zoom ∈ [0.5, 2.0]`，平移范围限制在地图边界外扩一定 padding。

#### 5.2.4 性能策略

- 视口剔除：只渲染可见区域内的瓦片与建筑
- 瓦片合并：静态地形预渲染到离屏纹理
- 精灵图集：使用 TexturePacker 打包，减少 draw call
- 移动端降级：降低缩放上限、关闭部分光效

#### 5.2.5 道路网与分区（天际线核心体验）

借鉴《城市天际线》，道路是城市骨架，建筑沿路生长，赋予玩家"规划城市"的参与感。

**道路系统：**
- 道路作为特殊瓦片地形（`terrain: 'road'`）铺设，不影响建筑放置但构成路网骨架
- 道路瓦片按形态分：直道、弯道、三岔口、十字路口、尽头
- 铺设时根据相邻道路自动选择对应形态的贴图（类似天际线的道路自动连接）
- MVP 阶段道路仅提供视觉与规划引导；迭代2 引入"邻路加成"（建筑邻路时 XP 产出 +20%）

**分区概念（视觉分组，非强模拟）：**
- 地图按区域天然划分为若干"街区"，每个街区有建议主题（住宅区/商业区/公园区）
- 玩家可自由放置，不强制分区；但同主题建筑聚集时触发"街区点亮"视觉奖励（迭代2）
- MVP 不显示分区边界线，仅靠建筑风格差异与道路分隔自然体现分区感

**城市密度与天际线感：**
- 建筑密度与高度随等级递进：村落阶段稀疏低矮、都市阶段密集高耸
- 高级建筑体积更大、层数更高，从等距俯视角度形成"天际线"轮廓
- 夜景模式（迭代2）：都市阶段解锁昼夜切换，高层建筑窗户亮灯，强化天际线观感

### 5.3 建筑系统

#### 5.3.1 建筑体系（递进式都市成长）

建筑按成长阶段分层解锁，从自然地貌到繁华都市，体现天际线式的城市演化。每个阶段视觉风格递进，玩家能直观感受城市"长大"。

**阶段一 · 荒野（Lv1）**

| ID | 名称 | 类别 | 燃料 | 占地 |
| --- | --- | --- | --- | --- |
| grass_tile | 草地 | nature | 0 | 1×1 |
| dirt_path | 泥土小路 | road | 1 | 1×1 |
| tree_small | 小树 | nature | 2 | 1×1 |
| bush | 灌木丛 | nature | 2 | 1×1 |

**阶段二 · 村落（Lv2-3）**

| ID | 名称 | 类别 | 燃料 | 占地 |
| --- | --- | --- | --- | --- |
| gravel_path | 碎石路 | road | 2 | 1×1 |
| wooden_house | 木屋 | residence | 6 | 1×1 |
| cat_house | 猫窝 | residence | 5 | 1×1 |
| lamp_old | 旧式路灯 | facility | 4 | 1×1 |
| flower_bed | 花圃 | decoration | 3 | 1×1 |
| pond | 小水池 | nature | 4 | 1×1 |

**阶段三 · 小镇（Lv4-6）**

| ID | 名称 | 类别 | 燃料 | 占地 |
| --- | --- | --- | --- | --- |
| asphalt_road | 柏油路 | road | 4 | 1×1 |
| townhouse | 联排房屋 | residence | 10 | 1×1 |
| convenience_store | 便利店 | commercial | 12 | 1×1 |
| street_lamp | 街灯 | facility | 5 | 1×1 |
| small_park | 小公园 | decoration | 8 | 1×1 |
| bench | 长椅 | decoration | 3 | 1×1 |

**阶段四 · 城市（Lv7-10）**

| ID | 名称 | 类别 | 燃料 | 占地 |
| --- | --- | --- | --- | --- |
| city_road | 城市道路 | road | 6 | 1×1 |
| apartment | 公寓楼 | residence | 18 | 1×1 |
| office_building | 办公楼 | commercial | 22 | 1×1 |
| shopping_mall | 商场 | commercial | 25 | 1×1 |
| plaza | 城市广场 | decoration | 15 | 1×1 |
| traffic_light | 红绿灯 | facility | 7 | 1×1 |

**阶段五 · 都市（Lv11+）**

| ID | 名称 | 类别 | 燃料 | 占地 |
| --- | --- | --- | --- | --- |
| highway | 高速路 | road | 10 | 1×1 |
| skyscraper | 摩天大楼 | commercial | 40 | 1×1 |
| landmark_tower | 地标塔 | landmark | 50 | 1×1 |
| grand_park | 大型公园 | decoration | 20 | 1×1 |
| neon_sign | 霓虹招牌 | decoration | 12 | 1×1 |

> **类别说明：** `nature` 自然 / `road` 道路 / `residence` 住宅 / `commercial` 商业 / `facility` 设施 / `decoration` 装饰 / `landmark` 地标
> **占地：** MVP 统一 1×1，降低放置校验复杂度；迭代2 引入 2×2、2×3 多格地标建筑。

#### 5.3.2 放置规则

- 只能放置在 `unlocked === true` 且 `buildingId === undefined` 的瓦片上
- 燃料不足时禁止放置并提示
- 放置成功：扣除燃料、写入 `TileData.buildingId`、添加 `BuildingInstance`
- MVP 不支持拆除与移动（迭代2加入，拆除返还 50% 燃料）

#### 5.3.3 解锁流程

```
等级提升 ──▶ 检查 BuildingType.unlockLevel ──▶ 新建筑加入可建造列表
                                            ──▶ UI 提示"解锁新建筑"
```

### 5.4 猫咪系统

#### 5.4.1 MVP 猫咪配置

| ID | 名称 | 性格 | 移动间隔 | 出现条件 |
| --- | --- | --- | --- | --- |
| cat_mimi | 咪咪 | playful | 15s | 首次进入即出现 |
| cat_doudou | 豆豆 | lazy | 25s | 完成首个番茄钟 |
| cat_xuebao | 雪宝 | curious | 20s | 达到 2 级 |

#### 5.4.2 行为逻辑

- **移动**：每隔 `moveIntervalMs` 随机选择一个相邻且已解锁的空瓦片移动；无可用目标则保持原地
- **状态**：`idle`（待机）↔ `walking`（移动中，播放移动动画）↔ `sleeping`（长时间无互动）↔ `interacting`（被点击后短暂状态）
- **移动动画**：使用 GSAP 在屏幕坐标间插值，时长约 500ms

#### 5.4.3 互动与对话

- 点击猫咪 → 进入 `interacting` 状态 → 弹出对话气泡（2-3 秒后消失）
- 对话从 `CatType.dialogPool` 随机抽取，不重复上一次
- 对话冷却：同一只猫 5 秒内不重复触发对话
- 对话文案示例（咪咪）：
  - "喵～你又来专注啦！"
  - "加油加油，我等着新猫窝呢！"
  - "（伸懒腰）今天的阳光真好～"

### 5.5 等级与进度系统

#### 5.5.1 XP 来源

| 行为 | XP |
| --- | --- |
| 完成一个番茄钟 | +50 |
| 放置一个建筑 | +10 |
| 解锁一个迷雾区域 | +30 |

#### 5.5.2 等级公式

采用平方根曲线，前期升级快、后期渐缓：

```typescript
function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// 各等级所需累计 XP（示例）：
// Lv1: 0, Lv2: 100, Lv3: 400, Lv4: 900, Lv5: 1600, Lv6: 2500...
```

#### 5.5.3 升级流程

```
xp 增加 ──▶ 重新计算 level ──▶ 若 level 提升：
                                ├── 播放升级动画与音效
                                ├── 检查解锁新建筑
                                ├── 检查揭开新迷雾区域
                                └── 弹窗展示升级奖励
```

### 5.6 迷雾系统

#### 5.6.1 初始状态

- 地图中心 5×5 区域初始解锁（玩家起始区）
- 其余区域划分为若干 `FogRegion`，初始 `revealed: false`

#### 5.6.2 揭开条件

| 条件类型 | 说明 |
| --- | --- |
| `level` | 达到指定等级自动揭开 |
| `pomodoroCount` | 累计完成 N 个番茄钟揭开 |

示例区域划分（20×20 地图）：

| 区域 | 范围 | 揭开条件 |
| --- | --- | --- |
| 中心区 | (7,7)-(11,11) | 初始解锁 |
| 东区 | (12,7)-(19,11) | 等级 2 |
| 西区 | (0,7)-(6,11) | 等级 2 |
| 北区 | (7,0)-(11,6) | 完成 5 个番茄钟 |
| 南区 | (7,12)-(11,19) | 完成 5 个番茄钟 |
| 四角 | 其余 | 等级 4 |

#### 5.6.3 渲染

- 未揭开区域：覆盖半透明深色遮罩（`rgba(10,14,26,0.85)`）
- 边缘：使用渐变 alpha 柔化，避免硬边
- 揭开动画：GSAP 从中心向外扩散的 alpha 渐变，时长 800ms

---

## 六、关键交互流程

### 6.1 首次进入流程

```
打开应用
  │
  ▼
落地页（展示产品概念，GSAP 滚动动画）
  │
  ▼ 点击"开始专注"
  │
  ▼
检测本地存档
  ├── 无存档 ──▶ 生成 userId ──▶ 初始化地图（中心区解锁）─▶ 进入游戏页
  └── 有存档 ──▶ 读取存档 ──▶ 校验存档版本 ──▶ 进入游戏页
```

### 6.2 番茄钟完整流程

```
点击"开始专注"
  │
  ▼
番茄钟进入 running，记录 startedAt
  │
  ├── 用户暂停 ──▶ 记录 pausedAt ──▶ 恢复时累加暂停时长
  ├── 用户重置 ──▶ 标记 abandoned ──▶ 回到 idle
  │
  ▼ 倒计时归零
  │
  ▼
发放奖励（fuel +3, xp +50）
  │
  ▼
检查等级提升 ──▶ 若升级：解锁建筑/揭开迷雾/播放动画
  │
  ▼
记录到 pomodoroHistory ──▶ 自动存档 ──▶ 显示完成弹窗
  │
  ▼
回到 idle，可开始下一轮
```

### 6.3 建筑放置流程

```
打开建筑面板 ──▶ 选择建筑（高亮可放置区域）
  │
  ▼
鼠标移到地图 ──▶ 实时显示预览（绿色=可放置，红色=不可）
  │
  ▼ 点击空地
  │
  ▼
校验：燃料是否足够、瓦片是否可用
  ├── 失败 ──▶ 提示原因（燃料不足/位置不可用）
  └── 成功 ──▶ 扣燃料 ──▶ 写入建筑 ──▶ xp+10 ──▶ 存档 ──▶ 播放放置动画
```

### 6.4 猫咪互动流程

```
点击地图上的猫咪
  │
  ▼
检查对话冷却
  ├── 冷却中 ──▶ 仅播放猫咪表情动画，不弹对话
  └── 可对话 ──▶ 进入 interacting 状态 ──▶ 随机抽取对话 ──▶ 弹气泡
                                                          │
                                                          ▼
                                                    2-3 秒后气泡消失
                                                          │
                                                          ▼
                                                    回到 idle，设置冷却
```

---

## 七、视觉与交互规范

### 7.0 整体风格方向

本作融合《城市天际线》的都市规划感与治愈系猫咪陪伴调性，定义为**「治愈系等距都市」**：

- **不是写实 3D**，而是低多边形 + 等距 2.5D 半扁平风格，兼顾视觉表现力与 AI 生成一致性
- **保留天际线核心体验**：道路网作为城市骨架、建筑按功能分区、密度与高度随等级递进
- **保留治愈系调性**：暖色调光晕、猫咪漫步街头、缓慢成长的节奏感，无写实都市的压迫感
- **成长可视化**：玩家肉眼可见地图从「荒野草地 → 乡间村落 → 小镇街区 → 现代城市 → 繁华都市」演化

| 成长阶段 | 等级 | 视觉特征 | 天际线感 |
| --- | --- | --- | --- |
| 荒野 | Lv1 | 草地、泥路、零星树木 | 无 |
| 村落 | Lv2-3 | 木屋、猫窝、碎石路、旧路灯 | 低矮稀疏 |
| 小镇 | Lv4-6 | 联排房屋、柏油路、便利店、街灯 | 中等密度 |
| 城市 | Lv7-10 | 公寓楼、办公楼、商场、城市道路 | 高层密集 |
| 都市 | Lv11+ | 摩天大楼、地标塔、广场、霓虹夜景 | 天际线轮廓 |

### 7.1 色彩系统

基于设计稿，定义 CSS 变量（与 [inspiration-site/index.html](../inspiration-site/index.html) 保持一致）：

```css
:root {
  /* 背景与表面 */
  --bg-deep: #0a0e1a;
  --bg-card: rgba(255, 255, 255, 0.04);
  --bg-card-hover: rgba(255, 255, 255, 0.08);

  /* 主色 */
  --accent-orange: #FF6B35;   /* 番茄钟主色 */
  --accent-coral: #FF8C69;
  --accent-cream: #FFF5E6;
  --accent-lavender: #C4B5FD; /* 猫咪/魔法感 */
  --accent-mint: #6EE7B7;     /* 成长/解锁 */
  --accent-pink: #F9A8D4;

  /* 文字 */
  --text-primary: #F8F9FA;
  --text-secondary: rgba(248, 249, 250, 0.65);
  --text-dim: rgba(248, 249, 250, 0.35);

  /* 光晕 */
  --glow-orange: rgba(255, 107, 53, 0.3);
  --glow-lavender: rgba(196, 181, 253, 0.25);

  /* 边框 */
  --border-subtle: rgba(255, 255, 255, 0.06);
}
```

### 7.2 字体

- 展示字体（标题）：`ZCOOL KuaiLe`（与灵感站一致）
- 正文字体：`Noto Sans SC`，字重 300/400/500/700/900

### 7.3 响应式断点

| 断点 | 宽度 | 布局调整 |
| --- | --- | --- |
| mobile | < 768px | 番茄钟与地图上下布局，建筑面板底部抽屉 |
| tablet/desktop | ≥ 768px | 番茄钟左侧/顶部，地图主区域，建筑面板右侧 |

### 7.4 动效原则

- **GSAP** 用于：落地页滚动触发、升级动画、迷雾揭开、猫咪移动
- **CSS transition** 用于：按钮 hover、面板展开等微交互
- 尊重 `prefers-reduced-motion`：开启时关闭视差与大范围位移，仅保留淡入淡出
- 时长基准：微交互 150-250ms，场景过渡 400-800ms

### 7.5 自定义光标

延续灵感站设计：橙色圆点 + 外环，hover 可交互元素时外环放大。移动端关闭。

---

## 八、性能与优化策略

### 8.1 地图渲染性能

| 策略 | 说明 |
| --- | --- |
| 视口剔除 | 只渲染相机视口内的瓦片与建筑 |
| 静态层缓存 | 地形瓦片预渲染到 RenderTexture，相机移动时整体位移 |
| 精灵图集 | 所有建筑/猫咪精灵打包为图集，减少 draw call |
| 对象池 | 猫咪移动动画复用 tween 对象 |

### 8.2 移动端优化

- PixiJS 优先使用 WebGL，降级 Canvas
- 限制最大缩放为 1.5，减少同屏瓦片数
- 触摸事件被动监听（`passive: true`）避免滚动卡顿
- 图片资源提供 1x / 2x 两套

### 8.3 存档性能

- 存档节流：状态变更后 1 秒内只写一次 localStorage（防抖）
- 番茄钟历史只保留最近 100 条
- 存档体积监控，超过 2MB 时提示导出清理

### 8.4 加载性能

- 路由级代码分割（`React.lazy`）
- 精灵图集懒加载：进入游戏页时再加载地图资源
- 落地页资源最小化，首屏 < 100KB

---

## 九、开发计划与里程碑

### 9.1 里程碑划分

| 里程碑 | 目标 | 主要交付 |
| --- | --- | --- |
| **M0 脚手架** | 搭建工程基础 | Vite + React + TS + Tailwind + Zustand + ESLint/Prettier 配置、目录结构、CI |
| **M1 番茄钟** | 核心闭环可用 | 番茄钟组件、状态机、奖励发放、本地存档、完成通知 |
| **M2 地图基础** | 地图可看可逛 | PixiJS 引擎、等距渲染、拖拽缩放、地形瓦片、相机控制 |
| **M3 建筑系统** | 可建造 | 建筑配置、解锁逻辑、放置交互、建筑面板 UI |
| **M4 猫咪系统** | 有陪伴感 | 猫咪生成、移动、互动对话、对话气泡 UI |
| **M5 迷雾与等级** | 长期目标感 | 迷雾覆盖与揭开、等级系统、升级动画、解锁流程串联 |
| **M6 落地页与打磨** | 可展示 | 落地页 GSAP 动画、响应式适配、音效、整体视觉打磨 |
| **M7 测试与发布** | 可上线 | 关键流程测试、性能调优、Bug 修复、部署 |

### 9.2 验收标准（MVP）✅ 全部通过

- [x] 用户可完成"开始专注 → 25 分钟 → 完成 → 获得燃料与 XP"闭环
- [x] 等距地图可拖拽、缩放，帧率 PC ≥ 60fps（实测 165fps）
- [x] 可在已解锁区域放置至少 6 种建筑（实装 26 种 / 5 阶段递进）
- [x] 至少 2 只猫咪可在地图上移动并响应点击对话（实装 3 只）
- [x] 等级提升可解锁新建筑与新区域，迷雾正确揭开
- [x] 刷新页面后进度完整保留
- [x] PC 与移动端布局均可用
- [x] 落地页滚动动画正常，无控制台报错

---

## 十、风险与待定事项

### 10.1 已识别风险与应对

| 风险 | 影响 | 状态 | 应对 |
| --- | --- | --- | --- |
| PixiJS 与 React 集成复杂度 | 中 | ✅ 已解决 | 用 ref 挂载 PixiJS canvas，状态通过 Zustand 共享，避免 React 重渲染影响画布 |
| AI 美术素材二次处理后比例漂移 | 高 | ✅ 已解决 | 全量改为程序化代码生成（`src/game/render/`），详见 [程序化美术渲染设计](./superpowers/specs/2026-06-21-procedural-art-rendering-design.md) |
| 移动端性能不足 | 中 | ✅ 已解决 | 视口剔除 + 最大缩放限制 1.5 + 触摸事件 passive 监听 |
| localStorage 存档丢失 | 中 | ✅ MVP 阶段解决 | 节流 1 秒 + beforeunload/pagehide 立即刷新 + 损坏降级处理；迭代2 上云同步 |
| 番茄钟后台计时被系统休眠中断 | 中 | ✅ 已解决 | 基于 `startedAt` 时间戳而非累计 tick，切回时用 `Date.now()` 校准 |

### 10.2 待定事项

- [x] ~~美术资源来源：自绘 / AI 生成 / 开源素材？~~ → 已决策：程序化代码生成
- [x] ~~音效来源~~ → 已决策：Web Audio API 程序化合成（避免素材依赖）
- [ ] 是否需要多语言（中/英）？
- [ ] 迭代2 后端技术栈最终确认（SQLite vs PostgreSQL）
- [ ] 是否接入分析埋点（如 Google Analytics）

---

> 本文档为活文档，开发过程中如遇设计调整，请同步更新此处并提升版本号。
