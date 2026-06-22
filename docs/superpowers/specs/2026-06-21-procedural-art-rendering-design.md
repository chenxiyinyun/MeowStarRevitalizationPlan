# 程序化美术渲染设计（Procedural Art Rendering）

> **日期：** 2026-06-21
> **状态：** ✅ 已实施
> **背景：** 项目原先依赖 AI 生成图片素材，经二次处理后出现尺寸比例漂移、拼接缝隙、变形等问题，多次修复未根治。经讨论决定全量转为代码生成美术，彻底移除图片依赖。

---

## 一、设计决策

| 决策项 | 选择 | 理由 |
| --- | --- | --- |
| 保真度 | 极简 low-poly | 契合项目既定风格，代码最擅长绘制几何块面，风格 100% 统一 |
| 建筑差异化 | 类别 + 地标特化 | 6 类绘制函数覆盖 21 种建筑，关键地标单独特化，平衡识别度与代码量 |
| 瓦片表现 | 纯色 + 描边 | 占地面积最大，极简最稳妥；天然无缝拼接 |
| 范围 | 全量代码化 | 瓦片、建筑、猫咪、UI、背景全部代码生成，移除所有图片依赖 |
| 架构 | 独立渲染模块（方案 B） | 新建 `src/game/render/`，职责分离，MapEngine 瘦身，不过度抽象 |

---

## 二、架构总览

### 2.1 目录结构

```
src/game/render/
├── tileRenderer.ts        # 瓦片绘制：纯色菱形+描边、道路形态连接线
├── buildingRenderer.ts    # 建筑绘制：6 类函数 + 地标特化
├── catRenderer.ts         # 猫咪绘制：3 只差异化 + idle/walk 两帧
├── iconRenderer.ts        # UI 图标绘制：8 个几何图标
└── backgroundRenderer.ts  # 背景绘制：CSS 渐变 + DOM 粒子
```

### 2.2 模块职责与接口

每个渲染器导出纯函数，接收 PixiJS `Container`/`Graphics` + 数据参数，返回绘制好的显示对象。不持有状态、不依赖 MapEngine。

```ts
// tileRenderer
drawTerrain(container: Container, terrain: Terrain, sx: number, sy: number, tileSize: TileSize): void
drawRoad(container: Container, neighbors: RoadNeighbors, sx: number, sy: number, tileSize: TileSize, color: number): void

// buildingRenderer
drawBuilding(container: Container, building: BuildingType, sx: number, sy: number, tileSize: TileSize): void

// catRenderer
drawCat(cat: CatType, state: 'idle' | 'walk'): Container

// iconRenderer
drawIcon(name: string, size: number): Graphics

// backgroundRenderer（DOM/CSS，返回 HTML 元素或样式描述）
createBackground(kind: 'hero' | 'game'): HTMLDivElement
```

### 2.3 MapEngine 改造

- 移除 `drawIsoBox`、`drawCat`、`drawTileGraphic` 内联实现
- 移除所有 `import xxxUrl from '...png'`、`TERRAIN_TEXTURE_URLS`、`terrainTextures` 缓存、`Assets.load` 预加载
- `drawTileGraphic` 改为调用 `tileRenderer.drawTerrain` / `tileRenderer.drawRoad`
- `renderBuildings` 改为调用 `buildingRenderer.drawBuilding`
- `drawCat` 改为调用 `catRenderer.drawCat`
- MapEngine 专注交互、相机、状态管理，不再管像素绘制

### 2.4 数据扩展策略

**不改动现有数据结构**。绘制函数用已有的 `category + color + height` 推导造型；特殊建筑（`skyscraper`、`landmark_tower`、`neon_sign`）用 `id` 判断走特化分支。零数据迁移成本。

### 2.5 统一照明模型

沿用现有 `darkenColor` 逻辑，模拟左上方光源：
- 顶面：原色
- 左墙面：原色 × 0.7（暗）
- 右墙面：原色 × 0.85（中）

与现有 `drawIsoBox` 一致，保证视觉延续。

---

## 三、瓦片渲染器 `tileRenderer.ts`

极简方案，彻底解决拼接问题：

- **地形**：纯色菱形（`TERRAIN_COLORS`）+ 1px 半透明描边（`TILE_STROKE_COLOR` / `TILE_STROKE_ALPHA`）。无图片、无纹理、无 mask，相邻瓦片天然无缝。
- **道路**：道路色菱形底 + 白色半透明连接线（沿用现有 `drawRoadConnectors` 逻辑）。4 方向邻居（`RoadNeighbors`）决定线段走向，自然形成直道/弯道/T 字/十字形态。
- **水面动画（可选）**：纯色菱形 + GSAP alpha 呼吸（0.85 ↔ 1.0，3s 循环），让水面有生气，零图片成本。

---

## 四、建筑渲染器 `buildingRenderer.ts`

按 `category` 分发到 6 个绘制函数，用 `color + height + id` 推导造型。统一照明模型（顶面原色/左墙×0.7/右墙×0.85）。

### 4.1 类别绘制函数

| 类别 | 函数 | 造型规则 | 覆盖建筑 |
| --- | --- | --- | --- |
| nature | `drawNature` | 树=三角锥树冠+棕色短干；灌木=扁圆球；池塘=扁菱形水面 | tree_small, bush, pond |
| residence | `drawResidence` | 盒子+三角屋顶+窗户；`height` 决定窗户行数；猫窝加圆门洞 | 木屋, 猫窝, 联排, 公寓 |
| commercial | `drawCommercial` | 盒子+玻璃窗网格（亮色小方块阵列）；摩天楼特化：更高+顶部收窄 | 便利店, 办公楼, 商场, 摩天楼 |
| facility | `drawFacility` | 细杆+灯头；路灯=黄圆灯，街灯=白圆灯，红绿灯=三色竖排小圆 | 旧路灯, 街灯, 红绿灯 |
| decoration | `drawDecoration` | 花圃=低盒+彩色点；长椅=扁木条；公园=草地+小树点；广场=几何铺装 | 花圃, 长椅, 小公园, 广场, 霓虹招牌 |
| landmark | `drawLandmark` | 尖塔+发光顶球（GSAP 呼吸光晕） | 地标塔 |

### 4.2 特化分支

以下建筑用 `id` 判断，走独立造型逻辑：
- `skyscraper`：高瘦盒子 + 顶部收窄 + 密集窗网格
- `landmark_tower`：尖塔 + 顶部发光球（GSAP alpha 呼吸）
- `neon_sign`：立式色板 + 发光描边（GSAP 颜色脉动）

### 4.3 差异化策略

同类别内用 `color`（已有）+ `height`（已有）区分尺寸与色调；关键地标用 `id` 判断走特化分支。21 种建筑视觉可区分，代码仅需 6 个主函数 + 3 个特化分支。

### 4.4 residence 造型示意

```
      /\          ← 三角屋顶（color 亮色）
     /  \
    /____\
    | □ □||      ← 窗户（亮色方块），height 越大行数越多
    | □ □||
    |____||      ← 门（左墙面，暗色矩形）
```

---

## 五、猫咪渲染器 `catRenderer.ts`

3 只猫用 `color + personality` 推导差异化，`idle`/`walk` 两帧几何姿态切换。比现有 `drawCat`（纯圆+三角耳）增加条纹、体型、姿态区分，仍为几何块面。

| 猫 | 造型特征 | idle 姿态 | walk 姿态 |
| --- | --- | --- | --- |
| 咪咪（橘猫·playful） | 橘色 + 背部条纹小线段 | 坐姿（圆身+竖耳+翘尾） | 站姿（椭圆身+抬前爪） |
| 豆豆（灰猫·lazy） | 灰色 + 圆胖体形 | 趴姿（扁椭圆+眯眼） | 慢走（椭圆身+微抬爪） |
| 雪宝（白猫·curious） | 白色 + 蓝眼 + 竖耳 | 站姿（椭圆身+警觉耳） | 欢快走（椭圆身+抬爪高） |

左方向通过 `scale.x = -1` 翻转实现，无需额外帧。

---

## 六、UI 图标渲染器 `iconRenderer.ts`

8 个图标用 `Graphics` 画几何，运行时缩放到 32/48px：

| 图标 | 几何造型 |
| --- | --- |
| fuel | 橙色水滴形（圆+三角组合） |
| xp | 紫色五角星 |
| level | 金色盾牌+中心星 |
| pomodoro | 红色圆+顶部绿叶 |
| settings | 橙色齿轮（齿=小矩形环绕） |
| sound_on | 喇叭三角+声波弧 |
| sound_off | 喇叭三角+叉 |
| cat_paw | 粉色爪印（1 大圆+4 小圆） |

---

## 七、背景渲染器 `backgroundRenderer.ts`

不走 PixiJS，用 CSS 渐变 + DOM 粒子，更轻量：
- `hero_bg`：深蓝→紫渐变 + 浮动光点（CSS 动画或少量 GSAP）
- `game_bg`：纯深蓝渐变 + 微弱光晕，衬在 PixiJS canvas 后方
- 替代原 `BG-01`/`BG-02` 图片需求

---

## 八、清理迁移

### 8.1 MapEngine.ts 清理

- 删除 4 个 `import xxxUrl from '...png'`
- 删除 `TERRAIN_TEXTURE_URLS` 常量
- 删除 `terrainTextures` 缓存字段及 `init()` 中的 `Assets.load` 预加载
- 删除 `drawTileGraphic` 中的 sprite/mask 分支
- 删除 `drawIsoBox`、`drawCat` 内联实现
- 改为调用对应渲染器

### 8.2 图片资源清理

- 删除 `src/assets/sprites/tiles/terrain/` 下 4 张 PNG
- 删除 `src/assets/sprites/tiles/roads/` 下 9 张 PNG
- 建筑/猫咪/UI/背景目录本就无图，无需处理
- `scripts/process-tile-images.mjs` 保留，顶部注释标注"仅用于未来可选 AI 素材"

### 8.3 文档更新

- `docs/art-assets-requirements.md` 顶部标注"已转为代码生成方案，AI 素材部分仅作历史参考"

---

## 九、风险与对策

| 风险 | 对策 |
| --- | --- |
| 视觉表现力低于 AI 图 | 用户已确认极简 low-poly；配色+光照保证质感 |
| MapEngine 重构引入回归 | 只动绘制层，交互/相机/状态逻辑零改动；每步 typecheck |
| 21 种建筑逐一验证 | dev server 目视检查，按阶段分批验证 |

---

## 十、测试策略

- 渲染器为纯函数，可独立单测（传入参数断言 Graphics 子节点数/颜色）
- dev server 逐类目视确认：先瓦片拼接，再 6 类建筑，再猫咪/UI/背景
- `pnpm typecheck` + `pnpm lint` 每步验证
