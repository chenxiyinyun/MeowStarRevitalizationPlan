# 16-bit 日式治愈像素风 · 实施计划

> 基于：2026-06-23  
> 状态：待审核

---

## 一、项目调研结论

### 1.1 当前架构

- **渲染引擎**：PixiJS 8，当前使用 Graphics API 程序化绘制
- **坐标系**：标准 2:1 等距投影，瓦片尺寸 64×32
- **地图引擎**：`MapEngine.ts` 封装，分层渲染（tileLayer 5 层：tile/building/cat/fog/preview）
- **建筑数据**：`src/game/data/buildings.ts`，26+ 种建筑，5 个成长阶段
- **资源目录**：`src/assets/sprites/` 骨架已建好（按 category 分子目录）

### 1.2 现有渲染模块

| 模块 | 文件 | 当前方式 | 目标方式 |
|------|------|---------|---------|
| 瓦片渲染 | `tileRenderer.ts` | Graphics 菱形 | Sprite 纹理 |
| 建筑渲染 | `buildingRenderer.ts` | Graphics 立方体 | Sprite 纹理 |
| 猫咪渲染 | `catRenderer.ts` | Graphics 圆形+三角 | AnimatedSprite 帧动画 |
| 图标渲染 | `iconRenderer.ts` | Graphics 几何 | Sprite 图标 |
| 背景渲染 | `backgroundRenderer.ts` | CSS 渐变 | 保持 CSS + 像素装饰 |

### 1.3 改造范围

- **保留**：PixiJS 引擎、等距坐标系统、MapEngine 分层架构、状态管理
- **替换**：各 Renderer 从 Graphics 绘制改为 Sprite 纹理渲染
- **新增**：AssetManager 资源加载、SpriteSheet 配置文件、AI 生成提示词文档

---

## 二、需要修改/新增的文件与模块

### 2.1 新增文件

```
src/assets/sprites/
├── tiles/
│   ├── terrain/grass_base.png          # 草地基础瓦片
│   ├── terrain/grass_variant1.png   # 草地变体1
│   ├── terrain/grass_variant2.png   # 草地变体2
│   ├── terrain/dirt.png              # 土路瓦片
│   ├── terrain/stone.png             # 石板路瓦片
│   ├── terrain/water.png                # 水面瓦片
│   └── roads/road_straight_h.png       # 道路水平
│   └── roads/road_straight_v.png       # 道路垂直
│   └── roads/road_corner_ne.png     # 道路转角
│   └── roads/road_cross.png         # 道路十字
├── buildings/
│   ├── nature/
│   │   ├── tree_small.png            # 小树
│   │   ├── tree_big.png              # 大树
│   │   ├── bush.png                  # 灌木丛
│   │   ├── mushroom.png              # 蘑菇
│   │   └── pond.png                # 小池塘
│   ├── residence/
│   │   ├── cat_house.png             # 猫窝
│   │   ├── wooden_house.png          # 木屋
│   │   ├── town_house.png             # 联排屋
│   │   ├── apartment.png                # 公寓楼
│   │   ├── residential.png                # 住宅楼
│   │   └── skyscraper.png           # 摩天楼
│   ├── commercial/
│   │   ├── kiosk.png                 # 小卖铺
│   │   ├── convenience.png          # 便利店
│   │   ├── supermarket.png           # 超市
│   │   ├── office.png               # 办公楼
│   │   └── mall.png                # 商场
│   ├── facility/
│   │   ├── lamp_old.png              # 旧路灯
│   │   ├── street_lamp.png           # 街灯
│   │   ├── traffic_light.png       # 红绿灯
│   │   ├── bus_stop.png            # 公交站
│   │   └── subway.png             # 地铁站
│   ├── decoration/
│   │   ├── flower_bed.png          # 花圃
│   │   ├── bench.png               # 公园长椅
│   │   ├── fountain.png            # 喷泉
│   │   └── statue.png              # 雕塑
│   └── landmark/
│       ├── clock_tower.png           # 钟楼
│       └── landmark_tower.png          # 地标塔
├── cats/
│   ├── mimi_idle_01.png             # 咪咪-待机-帧1
│   ├── mimi_idle_02.png             # 咪咪-待机-帧2
│   ├── mimi_walk_01.png             # 咪咪-行走-帧1
│   ├── mimi_walk_02.png             # 咪咪-行走-帧2
│   ├── mimi_walk_03.png             # 咪咪-行走-帧3
│   ├── mimi_walk_04.png             # 咪咪-行走-帧4
│   ├── doudou_idle_01.png           # 豆豆-待机-帧1
│   ├── doudou_idle_02.png           # 豆豆-待机-帧2
│   ├── doudou_walk_01.png           # 豆豆-行走-帧1
│   ├── doudou_walk_02.png           # 豆豆-行走-帧2
│   ├── doudou_walk_03.png           # 豆豆-行走-帧3
│   ├── doudou_walk_04.png           # 豆豆-行走-帧4
│   ├── xuebao_idle_01.png          # 雪宝-待机-帧1
│   ├── xuebao_idle_02.png          # 雪宝-待机-帧2
│   ├── xuebao_walk_01.png          # 雪宝-行走-帧1
│   ├── xuebao_walk_02.png          # 雪宝-行走-帧2
│   ├── xuebao_walk_03.png          # 雪宝-行走-帧3
│   └── xuebao_walk_04.png          # 雪宝-行走-帧4
├── effects/
│   ├── particles.png                    # 粒子精灵图
│   └── glow.png                     # 光晕
└── ui/
    └── icons.png                     # UI 图标集
```

### 2.2 新增代码文件

| 文件 | 作用 |
|------|------|
| `src/game/AssetManager.ts` | 资源管理器，统一加载 SpriteSheet 和纹理 |
| `src/game/render/SpriteSheet.ts` | SpriteSheet 配置类型定义 |
| `src/config/sprites.ts` | 精灵图配置（建筑→精灵图映射） |
| `src/assets/sprites/prompts.md` | AI 生成提示词汇总文档 |

### 2.3 修改文件

| 文件 | 改动说明 |
|------|---------|
| `src/game/MapEngine.ts` | 集成 AssetManager，改造渲染层调用 Sprite 版本 |
| `src/game/render/tileRenderer.ts` | 新增 `drawTileSprite()` 函数 |
| `src/game/render/buildingRenderer.ts` | 新增 `drawBuildingSprite()` 函数 |
| `src/game/render/catRenderer.ts` | 新增 `drawCatSprite()` 动画版 |
| `src/game/data/buildings.ts` | 新增 `sprite` 字段，存储精灵图名称 |
| `src/types/index.ts` | 新增类型定义 |
| `vite.config.ts` | 配置静态资源加载 |

---

## 三、实施步骤

### Phase 1：资源框架搭建

**目标**：建立资源加载系统和占位文件全部到位

1. 创建完整的 sprites 目录结构（按上方目录）
2. 为每一张需要的图片生成纯色占位 PNG（用对应代表色）
3. 编写 `AssetManager.ts 资源加载管理器
4. 编写 SpriteSheet 配置和类型定义
5. 在 MapEngine 中集成资源加载流程
6. 验证：占位图能正常加载并显示

### Phase 2：瓦片系统像素化

**目标**：地形和道路瓦片替换为精灵图

1. 改造 `tileRenderer.ts`，新增 Sprite 渲染路径
2. 草地瓦片（基础 + 2 变体）
3. 道路瓦片（直/弯/十字/丁字）
4. 实现瓦片自动拼接逻辑（道路连接）
5. 实现瓦片变体随机选择
6. 验证：地图瓦片正常显示像素草地和道路

### Phase 3：建筑系统像素化

**目标**：26+ 种建筑替换为精灵图

1. 改造 `buildingRenderer.ts`，新增 Sprite 渲染路径
2. 建筑数据新增 `sprite` 字段映射
3. 按类别实现建筑渲染（nature/residence/commercial/facility/decoration/landmark）
4. 建筑放置/拆除动画
5. 建筑升级闪光特效
6. 验证：所有建筑能正确显示

### Phase 4：猫咪系统像素化

**目标**：3 只猫咪替换为像素动画

1. 改造 `catRenderer.ts`，新增 AnimatedSprite 版本
2. 实现 idle 动画（2 帧循环）
3. 实现 walk 动画（4 帧循环）
4. 猫咪朝向（四方向）
5. 猫咪交互动画（跳跃/睡觉/玩耍）
6. 验证：猫咪正常播放动画

### Phase 5：UI 与特效

**目标**：UI 图标和特效像素化

1. UI 图标像素化重绘
2. 粒子特效系统
3. 环境动效（云/水/叶）
4. 放置预览高亮
5. 验证：UI 和特效正常

### Phase 6：优化与 Polish

**目标**：性能优化和细节打磨

1. SpriteSheet 打包合批优化
2. 性能优化（视口剔除、LOD）
3. 多分辨率适配
4. 风格统一检查
5. 验证：流畅运行流畅

---

## 四、AI 生成提示词汇总

> 完整提示词将写入 `src/assets/sprites/prompts.md`，以下为分类索引：

### 4.1 通用风格提示词模板

**基础风格描述**：
- 风格：16-bit 像素艺术，像素风格，等距视角，2:1 等距投影
- 视角：等距斜视角，45 度俯视角
- 光源：左上 45 度光源，顶面亮，右暗
- 背景：透明背景 PNG
- 尺寸：根据物体不同尺寸

### 4.2 地形瓦片提示词（6 种）

| 文件名 | 简述 |
|------|------|
| grass_base | 基础草地瓦片 |
| grass_variant1 | 草地变体 1（多一些草 |
| grass_variant2 | 草地变体 2（多一些花） |
| dirt_road | 土道路 |
| stone_road | 石板路 |
| water | 水面瓦片 |

### 4.3 建筑提示词（26 种）

按类别分类，每类有统一风格描述 + 单体描述

### 4.4 猫咪提示词（24 张）

每只猫 8 张（idle×2 + walk×4 + sleep×2）

### 4.5 UI 图标提示词（10+）

建筑类别图标、功能图标等

---

## 五、依赖与注意事项

### 5.1 技术依赖

- **PixiJS 8**：已有，`@pixi/sprite`、`@pixi/animated-sprite`
- **Vite 资源加载**：PNG 静态资源加载
- **可选**：TexturePacker（SpriteSheet 打包工具

### 5.2 注意事项

1. **等距角度一致性**：所有素材 2:1 等距角度必须严格一致，否则视觉会违和
2. **像素对齐**：精灵图锚点位置必须正确，否则位置偏移
3. **透明背景**：PNG 必须是透明背景
4. **命名规范**：严格按命名规范，代码中映射
5. **色板统一**：所有素材用统一色板，避免风格跑偏
6. **性能考虑**：同屏精灵尽量合并到一张 SpriteSheet 减少 draw call

---

## 六、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| AI 生成角度不对 | 视觉违和 | 提供多角度参考图；先生成几张试错；人工微调 |
| 素材质量参差 | 风格不统一 | 建立严格 Style Guide；逐批审核 |
| 锚点位置偏移 | 位置错位 | 统一锚点规范：建筑底部中心为锚点 |
| 性能下降 | 卡顿 | SpriteSheet 合批；视口剔除；LOD |
| 改造量大 | 周期长 | 分阶段上线，先 MVP 再精修 |

---

## 七、验收标准

- [ ] 所有 26 建筑都有对应精灵图
- [ ] 3 只猫咪 idle + walk 动画
- [ ] 地形瓦片（草地 + 道路）
- [ ] MapEngine 能正常加载渲染像素
- [ ] 建筑放置/拆除/升级正常
- [ ] 猫咪动画流畅运行
- [ ] 移动端性能达标（60 FPS）
- [ ] 所有图片命名和映射正确
- [ ] prompts.md 文档完整
