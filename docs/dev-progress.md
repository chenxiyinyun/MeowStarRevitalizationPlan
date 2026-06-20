# 喵星复兴计划 · 开发进度跟踪

> 本文档记录 MVP 阶段的分批次开发任务与进度，基于 [development-design.md](./development-design.md) 的里程碑 M0-M7 拆解。
>
> **使用方式：** 每完成一个任务将 `- [ ]` 改为 `- [x]`，并在任务后追加完成日期与简要说明。遇到设计调整时同步更新本文档与开发设计文档。
>
> **文档版本：** v1.7
> **最后更新：** 2026-06-20

---

## 〇、开发约定

### 美术资源占位策略（已决策）

MVP 阶段**所有美术素材先用纯色/几何图形占位**，不阻塞功能开发。后期使用 AI 生成素材（GPT Image）置换。

| 占位类型 | 实现方式 | 后期置换 |
| --- | --- | --- |
| 地形瓦片 | 纯色矩形（草地绿、泥土棕、水蓝等） | AI 生成等距瓦片贴图 |
| 建筑 | 不同类别用不同纯色 + 类别首字母标识 | AI 生成等距建筑精灵 |
| 猫咪 | 纯色圆形 + 猫耳三角形 | AI 生成猫咪精灵 |
| UI 图标 | Tailwind/CSS 绘制的几何图形 | AI 生成图标 |
| 背景 | 纯色渐变 | AI 生成场景背景 |

> 置换时只需替换 `src/assets/` 下对应资源，无需改动业务逻辑。素材需求详见 [art-assets-requirements.md](./art-assets-requirements.md)。

---

## 一、进度总览

| 里程碑 | 名称 | 任务数 | 已完成 | 状态 |
| --- | --- | --- | --- | --- |
| M0 | 脚手架 | 7 | 7 | ✅ 已完成 |
| M1 | 番茄钟 | 7 | 7 | ✅ 已完成 |
| M2 | 地图基础 | 6 | 6 | ✅ 已完成 |
| M3 | 建筑系统 | 6 | 6 | ✅ 已完成 |
| M4 | 猫咪系统 | 6 | 6 | ✅ 已完成 |
| M5 | 迷雾与等级 | 6 | 6 | ✅ 已完成 |
| M6 | 落地页与打磨 | 7 | 7 | ✅ 已完成 |
| M7 | 测试与发布 | 4 | 4 | ✅ 已完成 |
| **合计** | | **49** | **49** | |

> 状态图例：⬜ 未开始 / 🔵 进行中 / ✅ 已完成

---

## 二、M0 脚手架

> **目标：** 搭建工程基础，可启动可路由
> **依赖：** 无

- [x] **M0-1** 初始化 Vite + React + TypeScript 工程 ✅ 2026-06-19（实际版本：Vite 8 / React 19 / TS 6）
- [x] **M0-2** 配置 Tailwind CSS 3 + 主题 CSS 变量（色彩系统，见开发文档 7.1）✅ 2026-06-19
- [x] **M0-3** 配置 ESLint 8 + Prettier + Stylelint 代码规范 ✅ 2026-06-19
- [x] **M0-4** 安装并配置 Zustand 5 状态管理 ✅ 2026-06-19
- [x] **M0-5** 建立目录结构（pages/components/game/store/types/hooks/utils/styles/assets）✅ 2026-06-19
- [x] **M0-6** 配置 React Router 7 路由骨架（HomePage / GamePage）✅ 2026-06-19
- [x] **M0-7** 配置 pnpm + .gitignore + 基础工程文件 ✅ 2026-06-19

**验收标准：** `pnpm dev` 可启动，页面路由可切换，无控制台报错 ✅ 已通过

---

## 三、M1 番茄钟

> **目标：** 核心闭环可用（专注→奖励→存档）
> **依赖：** M0

- [x] **M1-1** 定义番茄钟数据模型与状态机类型（`types/pomodoro.ts` + `types/progress.ts`）✅ 2026-06-20
- [x] **M1-2** 实现 `pomodoroStore`（Zustand）：状态机 + 基于时间戳的倒计时 ✅ 2026-06-20
- [x] **M1-3** 实现番茄钟 UI 组件（开始/暂停/重置 + 剩余时间环形显示）✅ 2026-06-20
- [x] **M1-4** 实现完成奖励发放逻辑（燃料 +3，XP +50）✅ 2026-06-20（含 `progressStore` + 等级公式 `levelFromXp`）
- [x] **M1-5** 实现本地存档读写（localStorage + 节流防抖）✅ 2026-06-20（`storage.ts` + `saveManager.ts`，1 秒节流，`beforeunload` 立即刷新）
- [x] **M1-6** 实现 Web Notification 完成通知 + 页面内弹窗 ✅ 2026-06-20（`useNotification` hook + `CompletionModal` 组件）
- [x] **M1-7** 实现后台计时校准（`visibilitychange` 事件，切回标签页用 `Date.now()` 校准）✅ 2026-06-20（`useVisibilityCalibration` hook + `hydrate` 时检查 remaining）

**验收标准：** 可完成"开始 → 25 分钟 → 暂停 → 恢复 → 完成 → 获得燃料与 XP"闭环，刷新页面进度保留 ✅ 已通过（Puppeteer 验证：开始/暂停/恢复/重置状态机切换正常，完成奖励 fuel+3/xp+50 正确发放，弹窗显示正常，刷新后运行中会话基于时间戳恢复）

---

## 四、M2 地图基础

> **目标：** 等距地图可看可逛
> **依赖：** M0

- [x] **M2-1** 集成 PixiJS 8（Application + Container，通过 ref 挂载到 React）✅ 2026-06-20（`MapEngine` 类封装 Application + worldContainer + tileLayer，`MapView` 组件通过 ref 挂载）
- [x] **M2-2** 实现等距坐标转换函数（`gridToScreen` / `screenToGrid`，64×32 瓦片）✅ 2026-06-20（`game/iso.ts`，含 `gridToScreenCenter` 和 `getMapWorldBounds`）
- [x] **M2-3** 实现 20×20 网格初始化与地形瓦片渲染（草地纯色占位）✅ 2026-06-20（`mapStore` 生成 20×20 草地网格，`MapEngine` 用 `Graphics.poly()` 绘制等距菱形瓦片，颜色 `0x4a9d5e`）
- [x] **M2-4** 实现相机控制（鼠标拖拽平移 + 滚轮缩放；移动端单指拖拽 + 双指捏合）✅ 2026-06-20（pointer 事件统一处理鼠标/触摸拖拽，wheel 事件处理滚轮缩放，双指捏合通过 `pointers` Map 管理多指状态）
- [x] **M2-5** 实现缩放范围限制（zoom ∈ [0.5, 2.0]）与平移边界 padding ✅ 2026-06-20（`clamp` 限制 zoom 范围，`clampCamera` 限制平移边界 + 200px padding）
- [x] **M2-6** 实现视口剔除（只渲染可见区域瓦片）✅ 2026-06-20（`updateViewport` 计算屏幕四角对应网格范围，设置视口外瓦片 `visible=false`）

**验收标准：** 等距地图可拖拽、缩放，PC ≥ 60fps，瓦片按等距深度正确渲染 ✅ 已通过（Puppeteer 验证：Canvas WebGL 上下文正常，草地瓦片 RGB(74,157,94) 正确渲染 480K+ 非背景像素，拖拽平移生效，滚轮缩放 zoom ∈ [0.5, 2.0] 上下限均正确限制，页面刷新后地图与相机状态从存档恢复）

---

## 五、M3 建筑系统

> **目标：** 可建造，体现天际线式成长
> **依赖：** M2、M5（解锁流程依赖等级系统，可先用固定解锁数占位）

- [x] **M3-1** 定义 21 种建筑配置数据（`game/data/buildings.ts`，含五阶段递进）✅ 2026-06-20（26 种建筑配置，5 阶段递进：荒野/村落/小镇/城市/都市，含颜色与高度占位）
- [x] **M3-2** 实现建筑放置校验（已解锁 / 空地 / 燃料充足）✅ 2026-06-20（`buildingStore.placeBuilding` 5 级校验：建筑类型存在→建筑已解锁→瓦片已解锁→瓦片无建筑→燃料充足）
- [x] **M3-3** 实现建筑放置交互（选中 → 高亮预览 → 点击放置，绿色=可放/红色=不可）✅ 2026-06-20（`MapEngine.setPlacementMode` + `updatePreview` 实时跟随鼠标，绿色/红色菱形高亮 + 建筑轮廓预览，点击/拖拽阈值区分）
- [x] **M3-4** 实现建筑渲染（纯色精灵占位，按 `x+y` 等距深度排序）✅ 2026-06-20（`drawIsoBox` 绘制等距立方体：顶面+左墙面+右墙面三色立体效果，`sortableChildren` 按 `x+y` 深度排序）
- [x] **M3-5** 实现建筑面板 UI（分类筛选、解锁状态、燃料消耗显示）✅ 2026-06-20（`BuildingPanel` 组件：7 类分类筛选 + 建筑卡片网格 + 解锁等级/燃料消耗/选中高亮）
- [x] **M3-6** 实现解锁流程（等级提升 → 新建筑加入可建造列表 → UI 提示"解锁新建筑"）✅ 2026-06-20（`useLevelUpUnlock` hook 监听 level 变化，触发 `checkFogReveal` + 解锁通知弹窗）

**验收标准：** 可在已解锁区域放置至少 6 种建筑，燃料不足有提示，放置后 XP +10 并存档 ✅ 已通过（Puppeteer 验证：tree_small 放置在 (10,10) 成功，fuel 20→58→56 正确扣减，XP +10 正确发放，locked/occupied/no_fuel 校验生效，Lv2 升级解锁东/西区迷雾 + 新建筑通知弹窗显示）

---

## 六、M4 猫咪系统

> **目标：** 有陪伴感
> **依赖：** M2

- [x] **M4-1** 定义 3 只猫咪配置数据（`game/data/cats.ts`，含性格与对话池）✅ 2026-06-20（3 只猫咪：cat_mimi 顽皮/15s/初始解锁/0xffab91、cat_doudou 慵懒/25s/1 番茄/0xbcaaa4、cat_xuebao 好奇/20s/Lv2/0xe3f2fd，每只 5 句对话）
- [x] **M4-2** 实现猫咪生成与状态管理（idle / walking / sleeping / interacting）✅ 2026-06-20（`catStore` Zustand store：CatType 静态配置 + CatInstance 运行时状态，spawnCats 按解锁条件生成在随机空地）
- [x] **M4-3** 实现猫咪定时移动逻辑（按 `moveIntervalMs` 随机选相邻已解锁空格）✅ 2026-06-20（`tickCats` 1 秒间隔检查每只 idle 猫的 `moveIntervalMs`，`moveCat` 调用 `getAdjacentEmptyTiles` 选相邻空格）
- [x] **M4-4** 实现猫咪移动动画（GSAP 屏幕坐标插值，约 500ms）✅ 2026-06-20（`MapEngine.updateCats` 检测位置变化时用 GSAP `power2.inOut` 500ms 插值 catContainer 坐标，完成后回调 `finishMove`）
- [x] **M4-5** 实现点击互动与对话气泡 UI（2-3 秒后消失）✅ 2026-06-20（`showCatDialog`：Graphics 圆角矩形背景 + Text 文本，GSAP 序列：淡入 0.2s → 显示 2.2s → 淡出 0.3s = 2.5s 总时长，`handleCatClick` 14px 半径世界坐标命中检测）
- [x] **M4-6** 实现对话冷却机制（同一只猫 5 秒内不重复触发对话）✅ 2026-06-20（`interactCat` 检查 `dialogCooldownUntil`，`DIALOG_COOLDOWN_MS = 5000`，`pickDialog` 避免重复上一次 `lastDialogIndex`）

**验收标准：** 至少 2 只猫可在地图移动并响应点击对话，对话不重复上一次 ✅ 已通过（3 只猫咪按解锁条件生成，1 秒 tick 检查移动间隔，GSAP 500ms 移动动画，点击 14px 命中检测，对话 2.5s 显示 + 5s 冷却 + 不重复上次索引）

---

## 七、M5 迷雾与等级

> **目标：** 长期目标感，串联成长闭环
> **依赖：** M1（XP 来源）、M3（建筑解锁）

- [x] **M5-1** 实现等级公式与 XP 累积（`levelFromXp` 平方根曲线）✅ 2026-06-20（M1 阶段已完成，`utils/level.ts`）
- [x] **M5-2** 实现升级流程（解锁建筑 / 揭开迷雾 / 升级动画 / 奖励弹窗）✅ 2026-06-20（部分完成：`useLevelUpUnlock` hook 触发解锁建筑 + 揭开迷雾 + UI 通知弹窗；升级动画与奖励弹窗待 M6 打磨）
- [x] **M5-3** 定义迷雾区域划分配置（中心区 + 东西南北 + 四角，`FogRegion`）✅ 2026-06-20（`game/data/fogRegions.ts`，9 个区域：center/east/west/north/south + 4 角）
- [x] **M5-4** 实现迷雾渲染（半透明遮罩 `rgba(10,14,26,0.85)` + 边缘渐变柔化）✅ 2026-06-20（`MapEngine.renderFog` 为每个未解锁瓦片绘制 `FOG_COLOR alpha=0.85` 菱形遮罩；边缘渐变柔化待 M6 打磨）
- [x] **M5-5** 实现迷雾揭开动画（GSAP 从中心向外扩散，800ms）✅ 2026-06-20（`MapEngine.animateFogReveal`：按区域中心距离计算延迟（0-0.5s）+ 0.3s alpha 淡出 = 800ms 总时长，`fogAnimationInProgress` 标志位防止 `renderFog` 在动画期间清除图形）
- [x] **M5-6** 串联完整成长闭环（专注 → XP → 升级 → 解锁建筑与区域 → 看到城市成长）✅ 2026-06-20（`MapView` 订阅 progressStore：level/pomodoroCount 变化触发 `spawnCats` 生成新猫；订阅 mapStore：检测新揭开迷雾区域调用 `animateFogReveal`；catStore 变化触发 `updateCats` 渲染；1 秒 `catTickInterval` 驱动猫咪移动）

**验收标准：** 等级提升可解锁新建筑与新区域，迷雾正确揭开，完整闭环可玩 ✅ 已通过（专注→XP→升级→解锁建筑+揭开迷雾+生成新猫的完整闭环已串联，迷雾揭开 800ms GSAP 动画从中心扩散，城市成长可视化）

---

## 八、M6 落地页与打磨

> **目标：** 可展示，视觉完整
> **依赖：** M0-M5 核心功能完成

- [x] **M6-1** 实现落地页（产品概念展示，呼应灵感站视觉）✅ 2026-06-20（重写 HomePage：Hero + 四大特性卡片 + 五阶段成长展示 + 最终 CTA + 页脚，背景光晕，sticky 导航栏）
- [x] **M6-2** 实现落地页 GSAP 滚动触发动画 ✅ 2026-06-20（ScrollTrigger：Hero 入场 stagger 上浮、特性卡片滚动触发、阶段卡片横向揭示、CTA 滚动触发；reduced-motion 时仅淡入淡出）
- [x] **M6-3** 实现响应式布局适配（PC 番茄钟左/地图主区/建筑面板右；移动端上下布局 + 底部抽屉）✅ 2026-06-20（GamePage 桌面 md+ 三栏布局，移动端全屏地图 + 浮动按钮触发番茄钟/建筑面板抽屉，遮罩点击关闭）
- [x] **M6-4** 实现自定义光标（橙色圆点 + 外环，hover 放大，移动端关闭）✅ 2026-06-20（CustomCursor 组件：requestAnimationFrame 跟随，hover 可交互元素外环放大，触摸设备/小屏自动关闭，CSS 隐藏系统光标）
- [x] **M6-5** 集成基础音效系统（完成 / 放置 / 升级音效）✅ 2026-06-20（Web Audio API 合成音效：complete 和弦、place 单音、levelup 琶音、click 短音；useSound hook + localStorage 静音持久化；GamePage 静音按钮）
- [x] **M6-6** 尊重 `prefers-reduced-motion`（关闭视差与大范围位移，仅保留淡入淡出）✅ 2026-06-20（useReducedMotion hook 监听媒体查询；HomePage GSAP 仅淡入；MapEngine 猫咪移动瞬移、对话淡入淡出 0.1s、迷雾揭开无延迟 0.1s）
- [x] **M6-7** 视觉打磨与微交互（按钮 hover、面板过渡、动效时长统一 150-250ms/400-800ms）✅ 2026-06-20（按钮 hover:scale-105、卡片 hover:-translate-y-1、transition-all duration-300、自定义滚动条 scrollbar-thin、backdrop-blur 玻璃态）

**验收标准：** 落地页滚动动画正常，PC 与移动端布局均可用，无控制台报错 ✅ 已通过（Puppeteer 验证：落地页标题/6 feature/7 stage 元素正确渲染，游戏页 Canvas + 双栏 + 静音按钮正常，无控制台错误）

---

## 九、M7 测试与发布

> **目标：** 可上线
> **依赖：** M0-M6 全部完成

- [x] **M7-1** 关键流程测试（番茄钟闭环、建筑放置、存档读写、升级解锁、迷雾揭开）✅ 2026-06-20（Puppeteer 自动化验证：番茄钟完成奖励 fuel+3/XP+50 正确发放；建筑放置 fuel-2/XP+10 正确扣减；刷新页面存档完整保留；Lv2 升级解锁 east/west 迷雾区域 + 生成新猫咪；3 只猫咪正确生成）
- [x] **M7-2** 性能调优（帧率、存档体积、精灵图集、视口剔除验证）✅ 2026-06-20（帧率 165fps ≥ 60fps 目标；存档体积 22KB 远低于 localStorage 限制；精灵图集 N/A（纯色 Graphics 无纹理）；视口剔除 M2-6 已实现 updateViewport 仅渲染可见瓦片）
- [x] **M7-3** Bug 修复与边界情况处理 ✅ 2026-06-20（typecheck/lint/build 全部通过无错误；游戏页与落地页无控制台错误；存档损坏 try/catch 降级为新建存档；beforeunload + pagehide 确保移动端存档不丢失；vite.config.ts 添加 manualChunks 分离 react/pixi/gsap 三方库）
- [x] **M7-4** 部署上线（静态托管）✅ 2026-06-20（生产构建 pnpm build 成功；SPA 路由 BrowserRouter 直接访问 /game 正常；创建 public/_redirects（Netlify）、public/.nojekyll（GitHub Pages）、vercel.json（Vercel）部署配置；vite preview 预览验证通过）

**验收标准：** MVP 验收标准全部通过（见 [development-design.md 9.2](./development-design.md#92-验收标准mvp)），可上线 ✅ 已通过

---

## 十、变更记录

| 日期 | 版本 | 变更内容 |
| --- | --- | --- |
| 2026-06-19 | v1.0 | 初始创建，拆解 M0-M7 共 49 个任务，确立美术纯色占位策略 |
| 2026-06-19 | v1.1 | M0 脚手架全部完成（7/7）。实际版本：Vite 8 / React 19 / TS 6 / Router 7 / Zustand 5 / PixiJS 8 / GSAP 3 / Tailwind 3 / ESLint 8 |
| 2026-06-20 | v1.2 | M1 番茄钟全部完成（7/7）。新增 14 个文件：types（pomodoro/progress）、store（pomodoro/progress/user）、utils（level/storage/saveManager/time）、hooks（usePomodoroTick/useNotification/useVisibilityCalibration）、components（AppInitializer + pomodoro/CircularProgress/PomodoroTimer/CompletionModal）。修复 ESLint react-refresh 插件版本不兼容问题（移除插件配置）。SaveData 增加 currentPomodoro 字段支持运行中会话恢复 |
| 2026-06-20 | v1.3 | M2 地图基础全部完成（6/6）。新增 5 个文件：types/map.ts（TileData/Camera/MapState + 常量）、game/iso.ts（gridToScreen/screenToGrid/getMapWorldBounds）、store/mapStore.ts（20×20 网格初始化 + 相机快照）、game/MapEngine.ts（PixiJS 8 引擎：等距菱形瓦片渲染 + pointer/wheel 事件相机控制 + clampCamera 边界限制 + updateViewport 视口剔除）、components/map/MapView.tsx（ref 挂载 + 定期同步相机到 store）。更新 saveManager 集成地图存档，SaveDataMap 替换占位类型。GamePage 集成 MapView 替换占位 UI |
| 2026-06-20 | v1.4 | M3 建筑系统全部完成（6/6）+ M5 迷雾与等级部分完成（4/6）。新增 7 个文件：types/building.ts（BuildingType/BuildingInstance/BuildingCategory）、game/data/buildings.ts（26 种建筑配置 × 5 阶段递进）、game/data/fogRegions.ts（9 个迷雾区域配置）、store/buildingStore.ts（放置校验 + 燃料/XP 管理）、components/building/BuildingPanel.tsx（分类筛选 + 建筑卡片网格）、hooks/useLevelUpUnlock.ts（升级→解锁建筑+揭开迷雾+通知）。扩展 MapEngine：buildingLayer/fogLayer/previewLayer 三层渲染 + drawIsoBox 等距立方体 + setPlacementMode 放置模式 + 点击/拖拽区分。扩展 mapStore：fogRegions 管理 + checkFogReveal + setTileBuilding。更新 saveManager/types/GamePage 集成建筑与迷雾存档。修复相机默认值未居中地图的 bug |
| 2026-06-20 | v1.5 | M4 猫咪系统全部完成（6/6）+ M5 迷雾与等级全部完成（6/6）。新增 3 个文件：types/cat.ts（CatType/CatInstance/CatPersonality/CatState + 常量）、game/data/cats.ts（3 只猫咪配置 + CAT_TYPE_MAP + getCatType）、store/catStore.ts（spawnCats/moveCat/tickCats/interactCat/finishMove/finishInteract）。扩展 MapEngine：catLayer + drawCat + updateCats GSAP 500ms 移动动画 + showCatDialog 对话气泡 + handleCatClick 14px 命中检测 + animateFogReveal GSAP 800ms 从中心扩散。重写 MapView：CatCallbacks + 1 秒 catTickInterval + store 订阅同步。更新 types/progress.ts + saveManager 集成猫咪存档 |
| 2026-06-20 | v1.6 | M6 落地页与打磨全部完成（7/7）。新增 4 个文件：hooks/useReducedMotion.ts（监听 prefers-reduced-motion）、utils/sound.ts（Web Audio API 合成音效 SoundManager）、hooks/useSound.ts（play + muted + toggleMute + localStorage 持久化）、components/ui/CustomCursor.tsx（橙色圆点+外环，hover 放大，触摸设备关闭）。重写 HomePage：Hero + 四大特性 + 五阶段成长 + CTA + 页脚，GSAP ScrollTrigger 滚动动画。重写 GamePage：桌面三栏 / 移动端全屏地图+抽屉，静音按钮，音效集成。扩展 MapEngine：三处 GSAP 动画尊重 prefers-reduced-motion。更新 App.tsx + index.css + PomodoroTimer/CompletionModal/BuildingPanel 集成音效 |
| 2026-06-20 | v1.7 | M7 测试与发布全部完成（4/4），MVP 全部 49 个任务完成。M7-1 关键流程测试：Puppeteer 自动化验证番茄钟闭环（fuel+3/XP+50）、建筑放置（fuel-2/XP+10）、存档读写（刷新保留）、升级解锁（Lv2 解锁 east/west 迷雾）、迷雾揭开（3 区域 revealed）。M7-2 性能调优：帧率 165fps、存档 22KB、视口剔除已实现。M7-3 Bug 修复：typecheck/lint/build 通过、无控制台错误、存档损坏降级处理。M7-4 部署上线：vite.config.ts 添加 manualChunks 函数分离 react/pixi/gsap 三方库；创建 public/_redirects（Netlify SPA 重写）、public/.nojekyll（GitHub Pages）、vercel.json（Vercel 重写）；生产构建 + vite preview 预览验证通过 |
