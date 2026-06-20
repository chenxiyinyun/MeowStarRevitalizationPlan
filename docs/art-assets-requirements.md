# 喵星复兴计划 · AI 美术素材需求清单

> 本文档列出所有需 AI 生成的美术素材，包含用途、尺寸、文件命名、存放路径与生成 prompt。
> 适用于 **GPT Image**（gpt-image）模型，每个 prompt 为完整可直接使用的正面提示词，无需负面提示词。
>
> **文档版本：** v2.0
> **最后更新：** 2026-06-19

---

## 一、总体风格规范

### 1.1 视觉风格定义

所有素材必须遵循统一风格：**低多边形 + 等距 2.5D + 治愈系**。

- **视角**：等距投影（isometric），2:1 比例（宽:高 = 2:1），相机俯角约 30°
- **风格**：low-poly 风格化 3D 渲染，半扁平，边缘干净利落
- **调性**：可爱、温暖、治愈，类似《动物森友会》的温馨感 + 《城市天际线》的规划感
- **光照**：左上方统一光源，柔和暖光，无硬阴影
- **背景**：纯白背景（便于后期去背景处理为透明 PNG）

### 1.2 Prompt 写作原则

GPT Image 使用自然语言描述效果最佳，每个 prompt 为完整句子，已包含风格描述，可直接复制使用，无需拼接。

每个 prompt 遵循以下结构：

```
[主体描述]. [风格与氛围描述]. [背景与光照描述]. [技术与质量描述].
```

**风格锚定句**（已融入每个 prompt）：

> Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset.

### 1.3 生成参数建议

GPT Image API 参数：

| 参数 | 建议值 | 说明 |
| --- | --- | --- |
| `model` | `gpt-image-1` | GPT Image 模型 |
| `quality` | `high` | 高质量，素材用途需清晰 |
| `size` | 见各类素材规格 | 按素材类型选择最接近的预设尺寸 |
| `n` | `1` | 每次生成 1 张，不满意的单独重试 |

**尺寸选择策略**：GPT Image 支持的固定尺寸为 `1024x1024`、`1024x1536`（竖版）、`1536x1024`（横版）。生成后通过裁剪/缩放调整到目标尺寸。

| 素材类型 | 推荐 size 参数 | 生成后裁剪到 |
| --- | --- | --- |
| 地形/道路瓦片（横版 2:1） | `1024x1024` | 1024 × 512 |
| 低矮建筑（自然/村落） | `1024x1024` | 1024 × 1024 |
| 中高层建筑（小镇/城市/都市） | `1024x1536` | 1024 × 1280 / 1536 / 2048 |
| 猫咪精灵 | `1024x1024` | 512 × 512 |
| UI 图标 | `1024x1024` | 512 × 512 |
| 背景插画（横版） | `1536x1024` | 1920 × 1080 |

---

## 二、命名与存放规范

### 2.1 目录结构

所有素材放置于 `src/assets/` 下，按类型分目录：

```
src/assets/
├── sprites/
│   ├── tiles/
│   │   ├── terrain/              # 地形瓦片
│   │   └── roads/                # 道路瓦片
│   ├── buildings/
│   │   ├── nature/               # 自然类建筑
│   │   ├── residence/            # 住宅类建筑
│   │   ├── commercial/           # 商业类建筑
│   │   ├── facility/             # 设施类建筑
│   │   ├── decoration/           # 装饰类建筑
│   │   └── landmark/             # 地标类建筑
│   ├── cats/                     # 猫咪精灵
│   ├── ui/                       # UI 图标
│   └── backgrounds/              # 背景插画
└── audio/                        # 音效（另行处理，本文档不涉及）
```

### 2.2 命名规则

- 全小写，单词用下划线分隔
- 与 [development-design.md](./development-design.md) 建筑配置表中的 `id` 字段保持一致
- 格式：`{id}_{变体}.png`
- 例：`wooden_house.png`、`cat_mimi_idle.png`、`road_dirt_straight_a.png`

### 2.3 优先级标记

- **P0**：MVP 必需，阶段一至三素材，需优先生成
- **P1**：迭代2 前补充，阶段四至五素材，可后续生成

---

## 三、地形瓦片

### 3.1 规格

| 项 | 值 |
| --- | --- |
| 生成尺寸 | `1024x1024`，裁剪为 1024 × 512 |
| 运行时尺寸 | 64 × 32 |
| 形状 | 等距菱形（isometric diamond），铺满整个画布 |
| 背景 | 纯白，菱形外区域为白色 |
| 格式 | PNG |

### 3.2 清单

| 编号 | 文件名 | 存放路径 | 用途 | Prompt |
| --- | --- | --- | --- | --- |
| T-01 | grass.png | tiles/terrain/ | 草地瓦片 | A flat isometric diamond-shaped tile showing a lush green grass surface viewed from above at an isometric angle. The grass has a subtle texture with slight color variation in vibrant green tones. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| T-02 | dirt.png | tiles/terrain/ | 泥土瓦片 | A flat isometric diamond-shaped tile showing brown dirt ground viewed from above at an isometric angle. The dirt has a subtle earthy texture with warm brown tones. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| T-03 | forest.png | tiles/terrain/ | 森林瓦片 | A flat isometric diamond-shaped tile showing a dense forest floor viewed from above at an isometric angle, with a few small low-poly trees scattered on the surface. The ground is dark green with mossy texture. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| T-04 | water.png | tiles/terrain/ | 水面瓦片 | A flat isometric diamond-shaped tile showing a calm blue water surface viewed from above at an isometric angle, with gentle ripples and a soft blue tone. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

---

## 四、道路瓦片

### 4.1 规格

| 项 | 值 |
| --- | --- |
| 生成尺寸 | `1024x1024`，裁剪为 1024 × 512 |
| 运行时尺寸 | 64 × 32 |
| 形状 | 等距菱形，道路覆盖菱形表面 |
| 背景 | 纯白 |
| 格式 | PNG |

### 4.2 形态说明

每种道路阶段需 3 种形态：

| 形态后缀 | 说明 | 用途 |
| --- | --- | --- |
| `straight_a` | 沿网格 X 轴方向的直道 | 水平方向道路 |
| `straight_b` | 沿网格 Y 轴方向的直道 | 垂直方向道路 |
| `cross` | 十字路口 | 道路交汇处 |

> 弯道、三岔口等形态留待迭代2，MVP 用直道与十字路口覆盖基本路网。

### 4.3 清单

#### 阶段一 · 泥土路（Lv1，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| R-01 | road_dirt_straight_a.png | tiles/roads/ | An isometric diamond-shaped tile showing a brown dirt path running horizontally across the diamond surface, viewed from above at an isometric angle. The path is a simple earth trail with warm brown tones. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-02 | road_dirt_straight_b.png | tiles/roads/ | An isometric diamond-shaped tile showing a brown dirt path running diagonally across the diamond surface from one corner to the opposite corner, viewed from above at an isometric angle. The path is a simple earth trail with warm brown tones. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-03 | road_dirt_cross.png | tiles/roads/ | An isometric diamond-shaped tile showing a brown dirt path crossroads intersection, with two dirt trails crossing each other in an X pattern across the diamond surface, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段二 · 碎石路（Lv2，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| R-04 | road_gravel_straight_a.png | tiles/roads/ | An isometric diamond-shaped tile showing a gray gravel path running horizontally across the diamond surface, viewed from above at an isometric angle. The path is made of small gray gravel stones with a neat appearance. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-05 | road_gravel_straight_b.png | tiles/roads/ | An isometric diamond-shaped tile showing a gray gravel path running diagonally across the diamond surface from one corner to the opposite corner, viewed from above at an isometric angle. The path is made of small gray gravel stones with a neat appearance. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-06 | road_gravel_cross.png | tiles/roads/ | An isometric diamond-shaped tile showing a gray gravel path crossroads intersection, with two gravel trails crossing each other in an X pattern across the diamond surface, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段三 · 柏油路（Lv4，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| R-07 | road_asphalt_straight_a.png | tiles/roads/ | An isometric diamond-shaped tile showing a dark gray asphalt road running horizontally across the diamond surface, with a yellow center line, viewed from above at an isometric angle. The road looks like a simple two-lane street. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-08 | road_asphalt_straight_b.png | tiles/roads/ | An isometric diamond-shaped tile showing a dark gray asphalt road running diagonally across the diamond surface from one corner to the opposite corner, with a yellow center line, viewed from above at an isometric angle. The road looks like a simple two-lane street. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-09 | road_asphalt_cross.png | tiles/roads/ | An isometric diamond-shaped tile showing a dark gray asphalt road crossroads intersection, with two roads crossing each other in an X pattern and yellow lane markings, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段四 · 城市道路（Lv7，P1）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| R-10 | road_city_straight_a.png | tiles/roads/ | An isometric diamond-shaped tile showing a city road running horizontally across the diamond surface, with dark asphalt, white lane markings, and narrow sidewalks on both sides, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-11 | road_city_straight_b.png | tiles/roads/ | An isometric diamond-shaped tile showing a city road running diagonally across the diamond surface from one corner to the opposite corner, with dark asphalt, white lane markings, and narrow sidewalks on both sides, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-12 | road_city_cross.png | tiles/roads/ | An isometric diamond-shaped tile showing a city road crossroads intersection with dark asphalt, white crosswalk markings, and sidewalks on all four sides, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段五 · 高速路（Lv11，P1）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| R-13 | road_highway_straight_a.png | tiles/roads/ | An isometric diamond-shaped tile showing a multi-lane highway running horizontally across the diamond surface, with dark asphalt and white dashed lane markings separating multiple lanes, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-14 | road_highway_straight_b.png | tiles/roads/ | An isometric diamond-shaped tile showing a multi-lane highway running diagonally across the diamond surface from one corner to the opposite corner, with dark asphalt and white dashed lane markings separating multiple lanes, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| R-15 | road_highway_cross.png | tiles/roads/ | An isometric diamond-shaped tile showing a highway interchange intersection with multiple lanes of dark asphalt curving and merging, viewed from above at an isometric angle. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

---

## 五、建筑精灵

### 5.1 规格

建筑精灵为**单个建筑物体的等距渲染图**，底部居中对齐，不包含地形瓦片。

| 建筑阶段 | 生成 size | 裁剪后尺寸 | 运行时尺寸 | 说明 |
| --- | --- | --- | --- | --- |
| 自然类（树、灌木） | `1024x1024` | 1024 × 1024 | 128 × 128 | 低矮物体 |
| 村落建筑 | `1024x1024` | 1024 × 1024 | 128 × 128 | 1-2 层小建筑 |
| 小镇建筑 | `1024x1536` | 1024 × 1280 | 128 × 160 | 2-3 层建筑 |
| 城市建筑 | `1024x1536` | 1024 × 1536 | 128 × 192 | 高层建筑 |
| 都市建筑 | `1024x1536` | 1024 × 2048 | 128 × 256 | 摩天大楼，最高 |

> 所有建筑**底部居中对齐**，便于程序化放置到瓦片上。建筑底座宽度不超过菱形瓦片宽度。

### 5.2 清单

#### 阶段一 · 荒野（Lv1，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| B-01 | tree_small.png | buildings/nature/ | A small low-poly tree with a round fluffy green canopy and a short brown trunk, standing alone as a single cute tree. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-02 | bush.png | buildings/nature/ | A small low-poly green bush, round and fluffy like a soft shrub ball, standing alone as a single cute decoration. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段二 · 村落（Lv2-3，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| B-03 | wooden_house.png | buildings/residence/ | A cozy small wooden cabin house with a triangle pitched roof, warm orange-brown wood walls, and a tiny window on the front. The cabin looks quaint and inviting. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-04 | cat_house.png | buildings/residence/ | A cute tiny cat house shaped like a miniature wooden shelter with a round circular cat entrance hole on the front, warm wood color, and a small triangular roof. It looks adorable and cozy, sized for a small cat. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-05 | lamp_old.png | buildings/facility/ | A vintage-style street lamp post with an old-fashioned iron design, featuring a warm yellow glowing light at the top. The lamp stands tall and elegant. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-06 | flower_bed.png | buildings/decoration/ | A small wooden flower bed box filled with colorful low-poly flowers in pink, yellow, and purple blooms. The box is neat and charming, adding a touch of beauty. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-07 | pond.png | buildings/nature/ | A small round pond with calm blue water, a few lily pads floating on the surface, and tiny stones arranged around the edge. The pond looks peaceful and serene. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段三 · 小镇（Lv4-6，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| B-08 | townhouse.png | buildings/residence/ | A two-story townhouse with a pitched roof, beige and brown facade, and multiple windows on both floors. The house looks neat and suburban, slightly taller than a cabin. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-09 | convenience_store.png | buildings/commercial/ | A small convenience store with a glass storefront, colorful signage above the entrance, and a striped awning. The store looks friendly and inviting, like a cozy neighborhood shop. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-10 | street_lamp.png | buildings/facility/ | A modern street lamp post with a sleek silver metal design and a warm white LED glow at the top. The lamp looks contemporary and clean, taller than a vintage lamp. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-11 | small_park.png | buildings/decoration/ | A small park scene containing a single low-poly tree, a wooden bench, and a tiny fence surrounding a patch of green grass. The park is compact and charming. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-12 | bench.png | buildings/decoration/ | A single wooden park bench with warm brown wood slats and a simple metal frame. The bench looks cozy and inviting, placed alone as a standalone decoration. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段四 · 城市（Lv7-10，P1）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| B-13 | apartment.png | buildings/residence/ | A tall modern apartment building with 6 floors, a beige and white facade, many windows with warm glowing lights, and balcony railings on each floor. The building is significantly taller than a townhouse, showing clear urban density. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-14 | office_building.png | buildings/commercial/ | A modern glass office building with 8 floors, a blue-tinted glass facade, and a sleek corporate look. The building is tall and elegant with reflective windows. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-15 | shopping_mall.png | buildings/commercial/ | A large shopping mall building with a glass dome entrance, colorful storefronts visible on the facade, and a grand appearance. The building is wide and imposing but still cute in style. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-16 | plaza.png | buildings/decoration/ | A city plaza with decorative pavement patterns in geometric designs and a small fountain in the center. The plaza looks open and elegant, an urban gathering space. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-17 | traffic_light.png | buildings/facility/ | A traffic light pole with three lights — red, yellow, and green — arranged vertically, on a sleek silver metal pole. The traffic light stands at an urban intersection height. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

#### 阶段五 · 都市（Lv11+，P1）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| B-18 | skyscraper.png | buildings/commercial/ | A towering skyscraper with over 20 floors, a glass and steel facade with sleek modern design, and reflective windows with warm glowing lights scattered across the surface. The building is dramatically taller than all other buildings, dominating the skyline. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-19 | landmark_tower.png | buildings/landmark/ | A unique landmark tower with a futuristic spire design, a glowing top that emits soft light, and an iconic silhouette. The tower is tall and majestic, serving as a city landmark that stands out from ordinary buildings. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-20 | grand_park.png | buildings/decoration/ | A large city park with multiple low-poly trees, winding walking paths, a small pond, and a gazebo. The park is lush and green, larger and more elaborate than a small park. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |
| B-21 | neon_sign.png | buildings/decoration/ | A colorful neon sign board with glowing pink and blue tubes forming an abstract decorative pattern. The sign has a cyberpunk city vibe with vibrant glowing colors against a dark backing panel. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The object is centered and bottom-aligned. The style is inspired by Cities Skylines but cuter and more whimsical, like a charming video game asset. |

---

## 六、猫咪精灵

### 6.1 规格

每只猫需 2 帧精灵图：`idle`（静止）与 `walk`（行走），均朝右方向。左方向通过程序化水平翻转实现。

| 项 | 值 |
| --- | --- |
| 生成 size | `1024x1024` |
| 裁剪后尺寸 | 512 × 512 |
| 运行时尺寸 | 64 × 64 |
| 朝向 | 朝右（左侧用代码翻转） |
| 背景 | 纯白 |
| 格式 | PNG |
| 底部对齐 | 是（四脚着地） |

> 猫咪的 prompt 中将 "isometric building game asset" 替换为 "isometric game character"，保持与建筑风格统一但强调角色属性。

### 6.2 清单

#### 咪咪（playful · 橘猫，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| C-01 | cat_mimi_idle.png | cats/ | A cute orange tabby cat sitting upright with big round eyes and a playful happy expression. The cat is fluffy with orange and white stripes, sitting neatly and facing right. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The character is centered and bottom-aligned, facing right. The style is like a charming video game character, cute and whimsical. |
| C-02 | cat_mimi_walk.png | cats/ | A cute orange tabby cat captured mid-step in a walking pose, with big round eyes and a playful happy expression. The cat is fluffy with orange and white stripes, with one front paw lifted in a walking stride, facing right. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The character is centered and bottom-aligned, facing right. The style is like a charming video game character, cute and whimsical. |

#### 豆豆（lazy · 灰猫，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| C-03 | cat_doudou_idle.png | cats/ | A chubby lazy gray cat lying down lazily on its belly with half-closed sleepy eyes and a round plump body. The cat looks relaxed and content, facing right. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The character is centered and bottom-aligned, facing right. The style is like a charming video game character, cute and whimsical. |
| C-04 | cat_doudou_walk.png | cats/ | A chubby gray cat walking slowly with a relaxed and lazy posture, half-closed sleepy eyes, and a round plump body. The cat has a casual ambling walk with one paw slightly forward, facing right. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The character is centered and bottom-aligned, facing right. The style is like a charming video game character, cute and whimsical. |

#### 雪宝（curious · 白猫，P0）

| 编号 | 文件名 | 存放路径 | Prompt |
| --- | --- | --- | --- |
| C-05 | cat_xuebao_idle.png | cats/ | A curious white cat standing alert with perked-up ears and bright blue eyes, looking around with an inquisitive expression. The cat has pristine white fur and a slender alert posture, facing right. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The character is centered and bottom-aligned, facing right. The style is like a charming video game character, cute and whimsical. |
| C-06 | cat_xuebao_walk.png | cats/ | A curious white cat in a prancing lively walk pose with perked-up ears and bright blue eyes. The cat has a spring in its step with an energetic prancing gait, pristine white fur, facing right. Rendered in a low-poly stylized 3D isometric view at 2:1 ratio, with a cozy and cute aesthetic, warm color palette, soft warm lighting coming from the top-left with no harsh shadows, set against a clean solid white background with no ground shadow. The character is centered and bottom-aligned, facing right. The style is like a charming video game character, cute and whimsical. |

---

## 七、UI 图标

### 7.1 规格

| 项 | 值 |
| --- | --- |
| 生成 size | `1024x1024` |
| 裁剪后尺寸 | 512 × 512 |
| 运行时尺寸 | 32 × 32 / 48 × 48 |
| 风格 | 与整体 low-poly 治愈风一致，但为正面视图（非等距） |
| 背景 | 纯白 |
| 格式 | PNG |

> UI 图标的风格描述句替换为：`Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design.`

### 7.2 清单

| 编号 | 文件名 | 存放路径 | 用途 | Prompt |
| --- | --- | --- | --- | --- |
| U-01 | fuel.png | ui/ | 燃料图标 | A glowing orange fuel droplet icon with a warm energy drop shape. The droplet has a soft glow and a cute rounded form. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-02 | xp.png | ui/ | 经验值图标 | A purple star icon with small sparkles around it, representing experience points. The star has a cute rounded shape with a magical glow. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-03 | level.png | ui/ | 等级图标 | A golden shield badge with a star in the center, representing a level-up achievement. The badge has a cute rounded shape with a warm metallic sheen. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-04 | pomodoro.png | ui/ | 番茄钟图标 | A cute red tomato icon with a green leaf on top, representing a pomodoro timer. The tomato has a round plump shape with a friendly cartoon look. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-05 | settings.png | ui/ | 设置图标 | A warm orange gear cog icon with a simple circular design, representing settings. The gear has a cute rounded tooth design. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-06 | sound_on.png | ui/ | 音效开启 | A speaker icon with curved sound waves emanating to the right, in warm orange color. The speaker has a cute rounded design. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-07 | sound_off.png | ui/ | 音效关闭 | A speaker icon with a diagonal cross mark over it, in warm orange color, representing muted sound. The speaker has a cute rounded design. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |
| U-08 | cat_paw.png | ui/ | 猫爪图标 | A cute pink cat paw print icon with soft rounded toe pads and a main pad, representing a cat theme. The paw print is adorable and smooth. Rendered as a flat stylized game icon with a cozy and cute aesthetic, warm color palette, clean solid white background, centered, simple and minimal design. |

---

## 八、背景与氛围插画

### 8.1 规格

| 项 | 值 |
| --- | --- |
| 生成 size | `1536x1024`（横版） |
| 裁剪后尺寸 | 1920 × 1080 |
| 风格 | 深色治愈系氛围，与落地页 [inspiration-site/index.html](../inspiration-site/index.html) 一致 |
| 背景 | 深蓝 `#0a0e1a`，带渐变光晕 |
| 格式 | PNG / JPG |

> 背景插画**不使用**等距视角，使用宽幅氛围插画风格。
> 背景风格描述句替换为：`Rendered as an atmospheric digital illustration with a dark cozy night ambiance, deep blue background, soft glowing orbs, warm accent lights, dreamy and serene mood.`

### 8.2 清单

| 编号 | 文件名 | 存放路径 | 用途 | Prompt |
| --- | --- | --- | --- | --- |
| BG-01 | hero_bg.png | backgrounds/ | 落地页 Hero 背景 | A dreamy floating island city at night, with tiny low-poly buildings and small cats sitting on a floating rock suspended in a starry sky. The scene has a purple and blue gradient glow with warm orange window lights twinkling in the buildings. The overall mood is magical and serene. Rendered as an atmospheric digital illustration with a dark cozy night ambiance, deep blue background, soft glowing orbs, warm accent lights, dreamy and serene mood. No text. |
| BG-02 | game_bg.png | backgrounds/ | 游戏页背景（地图后方） | A subtle dark blue gradient background with soft purple and teal glowing orbs floating gently, minimal and dreamy in atmosphere, with faint bokeh light particles scattered across. The scene is calm and unobtrusive, suitable as a backdrop behind a game map. Rendered as an atmospheric digital illustration with a dark cozy night ambiance, deep blue background, soft glowing orbs, warm accent lights, dreamy and serene mood. No text. |

---

## 九、后期处理说明

### 9.1 去背景

AI 生成的图片为纯白背景，需处理为透明 PNG：

1. **推荐工具**：Photoshop（魔棒 + 反选删除）、remove.bg、或在线工具
2. **要求**：
   - 去除纯白背景，保留主体
   - 主体边缘干净，无白边残留
   - 输出 PNG 格式，带 alpha 通道
3. **等距瓦片特殊处理**：菱形外的白色区域去除，菱形内保留，注意菱形边缘抗锯齿

### 9.2 尺寸调整

生成尺寸为高清，开发时按需缩放：

| 素材类型 | 生成尺寸 | 裁剪后 | 运行时尺寸 |
| --- | --- | --- | --- |
| 地形/道路瓦片 | 1024 × 1024 | 1024 × 512 | 64 × 32 |
| 自然/村落建筑 | 1024 × 1024 | 1024 × 1024 | 128 × 128 |
| 小镇建筑 | 1024 × 1536 | 1024 × 1280 | 128 × 160 |
| 城市/都市建筑 | 1024 × 1536 | 1024 × 1536 / 2048 | 128 × 192 / 256 |
| 猫咪 | 1024 × 1024 | 512 × 512 | 64 × 64 |
| UI 图标 | 1024 × 1024 | 512 × 512 | 32 × 32 / 48 × 48 |
| 背景插画 | 1536 × 1024 | 1920 × 1080 | 按视口缩放 |

### 9.3 一致性检查

生成后请检查同一批次素材的：
- 视角是否统一（等距 2:1）
- 光照方向是否一致（左上方）
- 色彩风格是否协调（暖色治愈系）
- 比例是否合理（建筑之间的高度递进关系）

如不一致，建议重新生成并微调 prompt 措辞，强化风格约束。

---

## 十、素材总表

### 10.1 数量统计

| 类别 | P0（MVP） | P1（迭代2） | 合计 |
| --- | --- | --- | --- |
| 地形瓦片 | 4 | 0 | 4 |
| 道路瓦片 | 9 | 6 | 15 |
| 建筑精灵 | 12 | 9 | 21 |
| 猫咪精灵 | 6 | 0 | 6 |
| UI 图标 | 8 | 0 | 8 |
| 背景插画 | 2 | 0 | 2 |
| **合计** | **41** | **15** | **56** |

### 10.2 生成顺序建议

1. **第一批（风格定调）**：T-01 草地、B-01 小树、C-01 咪咪idle —— 确认整体风格
2. **第二批（地形与道路 P0）**：T-02~T-04、R-01~R-09
3. **第三批（建筑 P0）**：B-02~B-12
4. **第四批（猫咪 P0）**：C-02~C-06
5. **第五批（UI 与背景）**：U-01~U-08、BG-01~BG-02
6. **第六批（P1 城市/都市）**：B-13~B-21、R-10~R-15

> 建议第一批生成后先发给开发侧确认风格，调整 prompt 后再批量生成其余素材。

---

## 十一、Prompt 调试指南

### 11.1 常见问题与调整方向

| 问题 | 调整方向 |
| --- | --- |
| 风格不够统一 | 在 prompt 开头强化 "low-poly stylized 3D isometric" 描述 |
| 背景非纯白 | 强调 "pure solid white background, no gradient, no shadow on ground" |
| 物体未居中 | 添加 "the object is perfectly centered in the frame" |
| 建筑高度递进不明显 | 在 prompt 中明确层数和相对高度描述 |
| 猫咪方向不对 | 强调 "facing right, the cat's head points to the right side of the image" |
| 等距角度不准确 | 添加 "camera angle at 30 degrees from horizontal, true isometric projection" |
| 画面元素过多 | 强化 "single object only, no other objects, no clutter" |

### 11.2 批量生成建议

- 同类素材建议连续生成，GPT Image 会保持一定的上下文风格一致性
- 如果某张不满意，微调 prompt 后单独重试即可，无需重新生成整批
- 生成后统一做去背景处理，保证 alpha 通道质量一致

---

> 本文档为活文档，素材生成过程中如需调整风格或新增素材，请同步更新并提升版本号。
