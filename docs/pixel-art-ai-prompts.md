# 16-bit 日式治愈风像素美术 AI 生成提示词

> 🎯 **核心目标**：所有素材风格 100% 统一，像素密度一致，调色板一致，比例一致

---

## 🎯 一致性控制总纲（必读！）

### 为什么两张图会不一样？
AI 生成每次都有随机性，主要差异来源：
1. **像素密度**：有的像素大块、有的像素细腻
2. **尺寸比例**：菱形高宽比随机漂移
3. **色调偏移**：绿色偏黄/偏蓝每次不同
4. **细节程度**：装饰大小、数量不稳定

### 四级一致性控制方案

| 级别 | 方法 | 效果 | 推荐度 |
|------|------|------|--------|
| L1 | 严格提示词约束 | 60% 一致 | ⭐⭐⭐ |
| L2 | 固定种子 (Seed) | 80% 一致 | ⭐⭐⭐⭐ |
| L3 | 参考图 (Image-to-Image) | 95% 一致 | ⭐⭐⭐⭐⭐ |
| L4 | 后期调色板统一 | 99% 一致 | ⭐⭐⭐⭐ |

**推荐工作流**：先用 L1 确定一张完美样板 → 用 L2/L3 批量生成同系列 → 最后 L4 统一调色

---

## 🎨 标准调色板（所有素材必用）

为了色调统一，所有素材请尽量贴近这套颜色：

### 主色
```
草地绿:   #7cc66b (亮) / #5ea84e (中) / #3d8b3d (暗)
暖橙:     #ffab91 / #ff8a65 / #e64a19
天蓝:     #90caf9 / #64b5f6 / #1976d2
奶油黄:   #fff59d / #ffee58 / #fdd835
泥土棕:   #a1887f / #8d6e63 / #6d4c41
石砖灰:   #b0bec5 / #90a4ae / #607d8b
```

### 阴影规则
- 所有阴影偏冷调（加一点点蓝）
- 高光偏暖调（加一点点黄）
- 对比度柔和，不要死黑死白

---

## ⚙️ 通用强制约束前缀（所有提示词必放最开头！）

### 正面提示词前缀（复制粘贴到每一条提示词最前面）
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing, no feathering, no blurry,
uniform pixel size: each pixel is equally sized square pixels,
consistent pixel density across entire image,
16-bit pixel art, retro game sprite style,
Japanese healing game aesthetic, warm pastel color palette,
soft cel-shading, no gradient banding,
Stardew Valley / Animal Crossing inspired,
transparent PNG background, no background elements,
=== END MANDATORY STYLE ===
```

### 负面提示词（每条都加）
```
NEGATIVE PROMPT:
3D render, realistic, photorealistic, blurry, anti-aliased, smooth edges,
thick black outline, watermark, text, signature,
varying pixel sizes, uneven pixel density,
gradient background, gradient sky, shadows on ground,
extra objects outside main subject, messy composition,
different art style, inconsistent style
```

### 地面瓦片额外强制约束（只加在瓦片类）
```
=== TILE SPECIFIC LOCK ===
EXACT 2:1 ASPECT RATIO, width is exactly twice the height,
FLAT 2D top surface only, ABSOLUTELY NO THICKNESS, NO SIDE VIEWS,
diamond shape filled to exact edges,
seamless tile edges, no border, no outline,
single flat plane, no depth, no elevation,
=== END TILE LOCK ===
```

### 建筑/角色额外约束（只加在建筑/角色类）
```
=== SPRITE SPECIFIC LOCK ===
TRUE isometric 45 degree top-down view,
showing TOP SURFACE and TWO side walls,
NOT front view, NOT side view, NOT 2D flat view,
subject centered horizontally,
bottom of subject FLAT and touches bottom of canvas,
NO grass base, NO dirt mound, NO ground platform,
NO ground shadow, no extra base,
full object visible, not cropped,
clean silhouette, no stray pixels,
=== END SPRITE LOCK ===
```

### 建筑/角色负面提示词补充（每条都加）
```
ADDITIONAL NEGATIVE:
front view, flat 2D view, side view, not isometric,
grass base, dirt mound, ground under object, platform,
visible roots, roots sticking out, underground roots,
shadow on ground, cast shadow,
3D render, realistic, blurry, anti-aliased,
thick black outline, background elements
```

---

## 🔄 一致性生成工作流

### 第一步：确定"金标准"样板
1. 用提示词生成 grass_base
2. 反复调整直到满意（像素密度、色调、装饰大小）
3. 这张就是你的"Style Anchor"风格锚点

### 第二步：固定种子批量生成（推荐）
如果你的 AI 工具支持 seed 参数：
- 记下满意那张的 **seed 值**
- 后续同类型素材都用同一个 seed
- 只改描述词内容，seed 不变
- 这样像素密度、色调、风格会高度一致

### 第三步：图生图（最稳的方法）
如果工具支持图生图 (img2img / image-to-image)：
- 把满意的 grass_base 作为参考图
- 描述词改成 grass_variant1 的内容
- 相似度/强度设为 20%-30%（低强度只改内容不改风格）
- 生成出来的风格几乎完全一致

### 第四步：后期统一处理
全部生成完后：
1. 用 Aseprite 打开所有素材
2. `Sprite > Color > Adjust Colors` 统一色调
3. 或者用 `Palette > Import Palette` 应用统一调色板
4. 最后用 `Color Quantization` 统一到 32 色

---

## 🗺️ 一、地形瓦片 (64×32)

> ⚠️ **铁则**：扁平无厚度、硬边菱形、无缝拼接、64×32严格2:1比例
> 生成尺寸建议：**1024×512**（等比放大16倍，后期缩小像素更干净）

### 1. grass_base.png - 基础草地（金标准样板）
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing, no feathering, no blurry,
uniform pixel size: each pixel is equally sized square pixels,
consistent pixel density across entire image,
16-bit pixel art, retro game sprite style,
Japanese healing game aesthetic, warm pastel color palette,
soft cel-shading, no gradient banding,
Stardew Valley / Animal Crossing inspired,
transparent PNG background, no background elements,
=== END MANDATORY STYLE ===

=== TILE SPECIFIC LOCK ===
EXACT 2:1 ASPECT RATIO, width is exactly twice the height,
FLAT 2D top surface only, ABSOLUTELY NO THICKNESS, NO SIDE VIEWS,
diamond shape filled to exact edges,
seamless tile edges, no border, no outline,
single flat plane, no depth, no elevation,
=== END TILE LOCK ===

flat diamond grass tile,
bright fresh green grass with subtle dark green pixel texture,
sparse minimal decoration:
- 2 tiny white daisies with yellow center
- 1 small cluster of 3 pink five-petal flowers
- 1 tiny light grey round pebble stone
grass is short and even, no tall grass blades,
very subtle grass texture variation (lighter and darker green pixels),
diamond edges are clean sharp pixel stairs, no fuzzy edges,
NO dirt, NO soil, NO raised edges, NO thickness,
1024x512 canvas, diamond fills most of the canvas,
transparent outside diamond

NEGATIVE PROMPT:
3D render, realistic, photorealistic, blurry, anti-aliased, smooth edges,
thick black outline, watermark, text, signature,
varying pixel sizes, uneven pixel density,
dirt sides, soil block, thickness, 3d block, cube,
tall grass, too many flowers, cluttered,
gradient background, shadows,
different art style, inconsistent style
```

### 2. grass_variant1.png - 草地变体1（稍亮春天气息）
```
[复制上面 grass_base 的完整前缀 + TILE LOCK]

flat diamond grass tile,
SLIGHTLY LIGHTER brighter spring green grass,
sparse decoration:
- 1 small yellow dandelion flower
- 2 tiny light purple wildflowers
- 3-4 very short dark green grass tufts
subtle lighter green patches for sunlit feel,
clean diamond edges, no outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 3. grass_variant2.png - 草地变体2（稍暗森林边缘）
```
[复制上面 grass_base 的完整前缀 + TILE LOCK]

flat diamond grass tile,
DARKER mossy forest green grass,
sparse decoration:
- 1 tiny red mushroom with white spots and white stem
- small mossy darker green patches
- 1 tiny four-leaf clover
more textured grass with darker green undertones,
clean diamond edges, no outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 4. dirt.png - 泥土地
```
[复制上面 grass_base 的完整前缀 + TILE LOCK]

flat diamond dirt path tile,
warm medium brown packed earth,
subtle texture: tiny darker brown specks, small lighter brown patches,
sparse decoration:
- 1-2 tiny light grey pebbles
- very subtle faint footprint indentations
smooth packed dirt look, not too rocky,
clean diamond edges, no outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 5. stone.png - 石砖地
```
[复制上面 grass_base 的完整前缀 + TILE LOCK]

flat diamond cobblestone path tile,
grey irregular cobblestone pattern,
stones are roughly oval/round shapes fitted together,
warm light grey with warm undertones (not cold blue-grey),
tiny moss patches in some cracks between stones,
sparse: maybe 1 tiny tuft of grass growing in a crack,
clean diamond edges, no outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 6. water.png - 水面
```
[复制上面 grass_base 的完整前缀 + TILE LOCK]

flat diamond water tile,
soft calm medium blue water,
gentle horizontal wave ripples (light blue pixel lines),
tiny white sparkle highlights on a few wave crests,
very subtle darker blue shadow pixels for depth,
calm peaceful still water, not choppy,
clean diamond edges, no outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

---

## 🛤️ 二、道路瓦片 (64×32)

> 同样：扁平、硬边、无缝拼接、64×32
> 生成尺寸：1024×512

### 1. road_straight_h.png - 横向直路
```
[复制 MANDATORY STYLE LOCK + TILE SPECIFIC LOCK]

flat diamond dirt road tile,
HORIZONTAL straight path going left to right,
light warm brown packed dirt road in center,
thin lighter stone/pebble border along both road edges,
green grass fills remaining diamond area outside the road,
road takes up about 60% of diamond width,
seamless edges, no dark outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 2. road_straight_v.png - 纵向直路
```
[复制 MANDATORY STYLE LOCK + TILE SPECIFIC LOCK]

flat diamond dirt road tile,
VERTICAL straight path going top to bottom,
light warm brown packed dirt road,
thin lighter stone border along road edges,
green grass fills remaining diamond area outside road,
seamless edges, no dark outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 3. road_corner_ne.png - 东北弯道
```
[复制 MANDATORY STYLE LOCK + TILE SPECIFIC LOCK]

flat diamond dirt road corner tile,
L-shaped road curving from north to east (top-right corner),
light warm brown dirt path with smooth rounded corner turn,
thin stone border along road edges,
green grass fills rest of diamond outside road,
seamless edges, no dark outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

### 4. road_cross.png - 十字路口
```
[复制 MANDATORY STYLE LOCK + TILE SPECIFIC LOCK]

flat diamond dirt road intersection tile,
four-way cross shape (north-south-east-west),
light warm brown dirt cross path,
one tiny stone at center intersection,
green grass fills four diamond corners,
seamless edges, no dark outline,
1024x512 canvas, transparent outside diamond

[负面提示词同上]
```

---

## 🌳 三、自然类建筑（有厚度、等距视角、底部对齐）

> ⚠️ **铁则**：真等距视角（能看到顶面+两个侧面）、无草地底座、底部平整结束、纯透明背景
> 生成尺寸：目标尺寸 × 4（例如 64×80 → 生成 256×320）
> 推荐用 grass_base 做图生图参考，相似度 20%

### 1. tree_small.png (64×80) - 小树
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing, no feathering, no blurry,
uniform pixel size: each pixel is equally sized square pixels,
consistent pixel density across entire image,
16-bit pixel art, retro game sprite style,
Japanese healing game aesthetic, warm pastel color palette,
soft cel-shading, no gradient banding,
Stardew Valley / Animal Crossing inspired,
transparent PNG background, no background elements,
=== END MANDATORY STYLE ===

=== SPRITE SPECIFIC LOCK ===
TRUE isometric 45 degree top-down view,
showing TOP SURFACE of canopy and two sides of trunk,
NOT front view, NOT side view, NOT 2D flat view,
canopy is oval/elliptical shape from isometric angle,
subject centered horizontally,
bottom of trunk FLAT and touches bottom of canvas,
NO grass base, NO dirt mound, NO ground platform,
NO ground shadow, no cast shadow,
full object visible, not cropped,
clean silhouette, no stray pixels,
NO visible roots, no roots sticking out,
=== END SPRITE LOCK ===

small cute deciduous tree, chibi proportions,
oval-shaped bright green leaf canopy (isometric top view),
canopy top surface visible from above,
lighter green highlight on top-left of canopy,
darker green shadow on bottom-right underside,
thin brown trunk, trunk ends clean and flat at bottom,
2-3 tiny fallen brown leaves resting on bottom edge (minimal),
a few tiny acorns near base (very small),
cute friendly appearance,
NO grass patch, NO dirt, NO ground under tree,
256x320 canvas, bottom of trunk at exact bottom center,
transparent background only

NEGATIVE PROMPT:
3D render, realistic, photorealistic, blurry, anti-aliased, smooth edges,
thick black outline, watermark, text, signature,
varying pixel sizes, uneven pixel density,
front view, flat 2D view, side view, not isometric,
grass base, dirt mound, ground under object, platform,
visible roots, roots sticking out, underground roots,
shadow on ground, cast shadow,
realistic tree, too detailed bark, pine needles,
ugly, scary, dark, dead tree,
round circular canopy (front view),
background elements
```

### 2. tree_big.png (80×120) - 大树
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK（上面的完整版本）]

large mature deciduous tree,
full lush OVAL-SHAPED canopy viewed from isometric top-down,
canopy top surface clearly visible,
bright green leaves, lighter green highlights on top,
darker green shadow on underside of canopy,
thick brown trunk with subtle bark texture,
trunk ends clean and flat at bottom (no visible roots),
one small bird nest on a branch with tiny blue bird peeking out,
soft warm sunlight from upper left,
cel-shaded highlights and shadows,
grand but still cute chibi proportions,
NO grass base, NO flowers on ground, NO dirt mound,
NO ground, NO platform,
320x480 canvas, bottom of trunk at bottom center,
transparent background only

[负面提示词同上，加上：flowers around base, grass patch]
```

### 3. bush.png (64×40) - 灌木丛
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

cute round leafy bush, low to ground,
OVAL top shape viewed from isometric angle,
dense dark green leaves, lighter green highlight on top,
a few tiny pink berries scattered in foliage,
short wide proportions, wider than tall,
bottom of bush flat and even,
NO grass tufts around base, NO ground,
NO dirt mound, NO grass patch,
isometric view showing top surface and rounded sides,
256x160 canvas, bottom of bush touches bottom center,
transparent background only

[负面提示词同上]
```

### 4. mushroom.png (64×50) - 蘑菇
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

cute chibi red spotted mushroom,
DOME-SHAPED cap viewed from isometric top angle,
top of cap visible, rounded sides,
bright red cap with white circular spots,
thick short white stem,
stem ends flat and clean at bottom,
slightly tilted to one side for playful feel,
kawaii cute proportions, big cap small body,
soft cel-shading, highlight on top-left of cap,
NO grass blades, NO clover, NO ground around base,
NO dirt, NO grass patch,
256x200 canvas, bottom of stem at bottom center,
transparent background only

[负面提示词同上]
```

### 5. pond.png (96×48) - 小水池
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

small garden pond, very low profile,
DIAMOND/OVAL shape from isometric top-down view,
rimmed with smooth light grey stones,
top of stone rim visible from above,
soft calm blue water inside,
2 green lily pads floating on water surface,
1 pink lotus flower on one lily pad,
tiny cute green frog sitting on the other,
small ripples on water around frog,
very short height (shallow), stone wall only a few pixels tall,
bottom of stone rim flat and even,
NO grass around edges, NO ground outside pond,
isometric top-down view,
384x192 canvas, bottom of pond rim at bottom center,
transparent background only

[负面提示词同上，加上：grass around pond, ground outside]
```

---

## 🏠 四、居住类建筑

> ⚠️ **铁则**：真等距视角（屋顶+两面墙可见）、无草地底座、底部平整、纯透明背景、无地面阴影
> 生成尺寸：目标尺寸 × 4

### 1. cat_house.png (64×60) - 猫窝
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing, no feathering, no blurry,
uniform pixel size: each pixel is equally sized square pixels,
consistent pixel density across entire image,
16-bit pixel art, retro game sprite style,
Japanese healing game aesthetic, warm pastel color palette,
soft cel-shading, no gradient banding,
Stardew Valley / Animal Crossing inspired,
transparent PNG background, no background elements,
=== END MANDATORY STYLE ===

=== SPRITE SPECIFIC LOCK ===
TRUE isometric 45 degree top-down view,
showing ROOF TOP and two adjacent side walls,
NOT front view, NOT side view, NOT 2D flat view,
roof clearly visible from above,
subject centered horizontally,
bottom of foundation FLAT and touches bottom of canvas,
NO grass base, NO dirt mound, NO ground platform,
NO ground shadow, no cast shadow on ground,
full object visible, not cropped,
clean silhouette, no stray pixels,
=== END SPRITE LOCK ===

tiny cute cat house, chibi proportions,
pointed triangular gable roof, darker orange-brown,
warm orange-brown wood plank walls (two sides visible),
heart-shaped cat door opening on front wall (dark inside),
fluffy pink cushion partially visible inside,
paw print decorations on walls,
small fish bone sign hanging above door,
extremely kawaii, very cute,
foundation bottom is flat and even,
NO grass around base, NO ground, NO dirt,
256x240 canvas, foundation at exact bottom center,
transparent background only

NEGATIVE PROMPT:
3D render, realistic, photorealistic, blurry, anti-aliased, smooth edges,
thick black outline, watermark, text, signature,
varying pixel sizes, uneven pixel density,
front view, flat 2D view, side view, not isometric,
grass base, dirt mound, ground under object, platform,
shadow on ground, cast shadow,
background elements, scenery around building
```

### 2. wooden_house.png (64×80) - 木屋
```
[复制上面 cat_house 的 MANDATORY + SPRITE LOCK 完整前缀]

cozy wooden cottage,
sloped red terracotta tile roof (top surface visible),
natural medium brown wood plank walls,
stone chimney on left side with gentle curl of white smoke,
two windows with white frames and flower boxes (pink and yellow flowers),
small wooden porch with simple bench on front side,
brown front door with welcome mat,
warm cozy farmhouse feel, Stardew Valley style,
foundation bottom flat and even,
NO grass around base, NO ground, NO dirt,
256x320 canvas, foundation at bottom center,
transparent background only

[负面提示词同 cat_house]
```

### 3. town_house.png (64×100) - 联排房屋
```
[复制 MANDATORY + SPRITE LOCK]

two-story European town house,
dark brown shingled sloped roof (top visible),
cream / light beige plaster walls on two sides,
multiple white-framed windows on both floors,
small second-floor balcony with potted red flowers,
red brick foundation,
dark red front door, small mail box next to it,
cozy neighborhood feel,
foundation bottom flat and even,
NO grass, NO ground, NO dirt around base,
256x400 canvas, foundation at bottom center,
transparent background only

[负面提示词同上]
```

### 4. apartment.png (80×140) - 公寓楼
```
[复制 MANDATORY + SPRITE LOCK]

4-story modern apartment building,
flat roof with small rooftop structures (top view visible),
light pastel blue exterior walls, white trim around windows,
multiple balconies with railings, some have laundry hanging,
green awning over ground floor entrance,
flower boxes with red/pink flowers on many windows,
small green shrubs in planters at entrance (on building, not ground),
one bicycle parked near entrance,
friendly residential feel, not too corporate,
foundation bottom flat and even,
NO grass, NO ground, NO dirt,
320x560 canvas, foundation at bottom center,
transparent background only

[负面提示词同上]
```

### 5. residential.png (96×160) - 高级住宅
```
[复制 MANDATORY + SPRITE LOCK]

luxury 5-story residential building,
modern elegant design, flat roof with rooftop garden,
green rooftop garden with small trees and lounge chairs (top view),
large glass balconies with glass railings,
light grey and blue-tinted glass exterior walls,
grand entrance with small decorative fountain,
two palm trees in planters flanking entrance,
underground parking entrance visible on side,
sophisticated but warm, not cold,
foundation bottom flat and even,
NO grass, NO ground, NO dirt,
384x640 canvas, foundation at bottom center,
transparent background only

[负面提示词同上]
```

### 6. skyscraper.png (80×240) - 摩天大楼
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

modern tall skyscraper, chibi cute proportions (not too realistic),
flat roof with helipad (top view visible), white H mark on helipad,
glass curtain wall facade reflecting soft blue sky,
many floors, windows: some warm yellow lit, some dark,
pointed antenna spire at very top center,
observation deck near top with windows,
main entrance at bottom front,
soft purple-blue twilight tint, impressive but cute,
foundation bottom flat and even,
NO grass around base, NO ground, NO plaza,
320x960 canvas, foundation at bottom center,
transparent background only

[负面提示词同 cat_house]
```

---

## 🏪 五、商业类建筑

> ⚠️ **铁则**：真等距视角（屋顶+两面墙可见）、无草地底座、底部平整、纯透明背景、无地面阴影

### 1. kiosk.png (64×50) - 报刊亭
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

cute small newsstand kiosk,
bright orange sloped roof (top view visible),
light blue wooden walls on two sides,
magazines and newspapers displayed on outside rack,
small serving counter with cash register visible on front side,
newspaper sign on roof,
vending machine attached to side wall,
cozy street corner feel,
foundation bottom flat and even,
NO grass, NO ground, NO dirt,
256x200 canvas, base at bottom center,
transparent background only

NEGATIVE PROMPT:
[...复制 cat_house 的负面提示词...]
```

### 2. convenience.png (64×70) - 便利店
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

friendly neighborhood convenience store,
flat roof (top view visible) with AC unit,
large glass front windows showing shelves inside,
warm glowing red "OPEN" neon sign in window,
light blue awning with white store logo text,
vending machine attached to side wall,
automatic sliding glass doors,
small sale poster on window,
welcoming 24hr shop feel,
foundation bottom flat and even,
NO parking lot, NO bikes outside, NO ground,
256x280 canvas, foundation at bottom center,
transparent background only

[负面提示词同 cat_house]
```

### 3. supermarket.png (96×90) - 超市
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

neighborhood supermarket,
large single story building,
flat roof (top view visible), colorful supermarket sign on roof,
big glass entrance with automatic sliding doors,
shopping carts near entrance (attached to building),
sale posters in front windows,
bright and friendly,
foundation bottom flat and even,
NO parking lot, NO ground, NO plaza,
384x360 canvas, foundation at bottom center,
transparent background only

[负面提示词同上]
```

### 4. office.png (80×150) - 办公楼
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

6-story modern office building,
flat roof (top view visible) with HVAC units,
blue tinted glass curtain wall facade,
light grey concrete frame between floors,
large glass lobby entrance with revolving door,
company logo sign above entrance (simple shape, no text),
potted plants in planters at entryway,
two flag poles on roof,
some windows have blinds drawn, some open,
professional yet warm friendly,
foundation bottom flat and even,
NO plaza, NO benches, NO ground,
320x600 canvas, foundation at bottom center,
transparent background only

[负面提示词同上]
```

### 5. mall.png (128×120) - 商场
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

large multi-story shopping mall (3 floors),
flat roof (top view visible),
wide main entrance with escalators visible through glass,
multiple colorful store signs for different shops,
food court area visible through upper windows,
mall directory sign near entrance,
decorative pennant flags along roof edge,
vibrant but soft pastel colors,
foundation bottom flat and even,
NO parking lot, NO fountain, NO plaza, NO ground,
512x480 canvas, foundation at bottom center,
transparent background only

[负面提示词同上]
```

---

## 💡 六、设施类建筑

> ⚠️ **铁则**：真等距视角、无草地底座、底部平整、纯透明背景、无地面阴影

### 1. lamp_old.png (32×80) - 旧式路灯
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

old fashioned ornate street lamp,
black cast iron pole with decorative scroll curves,
warm amber glowing lantern at top,
classic vintage lantern design with glass panels,
flat concrete base at bottom, flush against ground,
soft warm glow halo around lantern light,
nostalgic old town feel,
base bottom is flat and even,
NO grass around base, NO ground, NO dirt,
128x320 canvas, base at exact bottom center,
transparent background only

[负面提示词同 cat_house]
```

### 2. street_lamp.png (32×100) - 现代街灯
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

modern sleek street lamp,
tall thin silver-grey metal pole,
horizontal arm holding rectangular LED light,
soft warm white light from fixture,
minimalist clean design, no decoration,
flat square concrete base,
subtle light glow around lamp head,
clean modern city feel,
base bottom flat and even,
NO grass, NO ground, NO dirt,
128x400 canvas, base at bottom center,
transparent background only

[负面提示词同上]
```

### 3. traffic_light.png (32×80) - 红绿灯
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

traffic light pole,
black metal pole,
signal head with three lights stacked vertically,
top RED light is lit and glowing,
middle yellow and bottom green are off (dark),
pedestrian signal button on pole lower down,
small street sign attached to pole,
flat square concrete base,
base bottom flat and even,
NO grass, NO ground, NO dirt,
128x320 canvas, base at bottom center,
transparent background only

[负面提示词同上]
```

### 4. bus_stop.png (64×60) - 公交站
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

cute bus stop shelter,
blue tinted glass roof (top view visible),
silver metal poles holding up roof,
wooden bench inside shelter,
bus timetable posted on pole,
blue bus stop sign on tall pole,
grey trash can next to shelter,
cozy public transit feel,
foundation bottom flat and even,
NO flower bed, NO grass, NO ground,
256x240 canvas, bottom at bottom center,
transparent background only

[负面提示词同上]
```

### 5. subway.png (64×50) - 地铁站入口
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

subway station entrance,
stairs going down underground,
glass and metal canopy over stair entrance (top view visible),
bright blue metro sign with white "M" symbol,
ticket machine to left of stairs,
glass railing along stair sides,
small map sign,
clean modern transit design,
ground level bottom flat and even,
NO grass, NO ground around entrance, NO plaza,
256x200 canvas, ground level at bottom center,
transparent background only

[负面提示词同上]
```

---

## 🌸 七、装饰类建筑

> ⚠️ **铁则**：真等距视角、无草地底座、底部平整、纯透明背景、无地面阴影

### 1. flower_bed.png (64×30) - 花圃
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

raised rectangular flower bed,
low light grey stone border around edges,
top of stone border visible from above,
dense mixed flowers inside: pink roses, yellow daisies, purple lavender,
rich dark green foliage between flowers,
2-3 small butterflies (orange and blue) flying above,
low height (short bed), isometric top-down view,
bottom of stone border flat and even,
NO grass around outside, NO ground, NO dirt,
256x120 canvas, bottom of stone border at bottom center,
transparent background only

[负面提示词同 cat_house]
```

### 2. bench.png (64×30) - 长椅
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

wooden park bench,
warm medium brown wood slats for seat and backrest,
black cast iron legs with decorative curved design,
one small brown sparrow bird perched on armrest,
a few fallen leaves on seat,
simple classic park bench design,
isometric view,
legs bottom flat and even,
NO grass under bench, NO ground, NO pavement,
256x120 canvas, legs at bottom center,
transparent background only

[负面提示词同上]
```

### 3. fountain.png (80×80) - 喷泉
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

classic two-tier stone garden fountain,
round light beige stone basins,
top of basins visible from above,
clear light blue water spraying up from center top,
water cascading down from upper basin to lower basin,
gold coins visible at bottom of lower basin,
small decorative carved patterns on stone base,
soft water splash pixels,
peaceful relaxing zen feel,
bottom of base flat and even,
NO grass around, NO ground, NO stones around,
320x320 canvas, base at bottom center,
transparent background only

[负面提示词同上]
```

### 4. statue.png (64×100) - 猫雕像
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

cute cat statue monument,
chibi cat standing on hind legs holding a fish,
light grey weathered stone material,
tall rectangular stone pedestal,
top of pedestal visible from above,
small blank plaque on front of pedestal,
green moss growing in patches at base of pedestal,
whimsical cute town landmark,
bottom of pedestal flat and even,
NO grass around base, NO yellow flowers, NO ground,
256x400 canvas, pedestal base at bottom center,
transparent background only

[负面提示词同上]
```

---

## 🗼 八、地标类建筑

> ⚠️ **铁则**：真等距视角、无草地底座、底部平整、纯透明背景、无地面阴影

### 1. clock_tower.png (64×160) - 钟楼
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

charming old clock tower,
red brick and light beige stone construction,
pointed dark grey slate spire roof (top view visible),
large round clock face on front (white face, black hands, gold numbers),
bells visible through open arched belfry,
arched windows on lower floors,
warm golden sunset light hitting left side,
nostalgic cozy town center feel,
foundation bottom flat and even,
NO trees at base, NO benches, NO grass, NO ground,
256x640 canvas, foundation at bottom center,
transparent background only

[负面提示词同 cat_house]
```

### 2. landmark_tower.png (80×280) - 地标塔
```
[复制 MANDATORY STYLE LOCK + SPRITE SPECIFIC LOCK]

iconic city landmark tower, unique tapered design,
wider at bottom, narrowing toward top,
flat observation deck near top (top view visible),
tall thin antenna spire at very peak,
decorative ring lights,
soft gradient coloring: light blue at base, lighter toward top,
small observation deck railing visible,
main entrance at bottom front,
soft twilight dusk feeling, many warm lit windows,
impressive yet cute chibi proportions,
foundation bottom flat and even,
NO plaza, NO people at base, NO grass, NO ground,
320x1120 canvas, base at bottom center,
transparent background only

[负面提示词同 cat_house]
```

---

## 🐱 九、猫咪精灵（Q版等距、硬像素边缘）

> ⚠️ **铁则**：真等距3/4视角（不是纯正面）、无地面阴影、无草地底座、纯透明背景
> ⚠️ 猫咪一致性最重要！**强烈建议用图生图方式**
> 先生成咪咪 idle_01 确认风格，然后用它作为参考图生成其他帧和其他猫
> 生成尺寸：4x 目标尺寸

### 🐱 猫咪通用前缀
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing, no feathering, no blurry,
uniform pixel size, consistent pixel density,
16-bit pixel art, chibi kawaii style,
Japanese healing game aesthetic, warm pastel colors,
soft cel-shading, transparent background,
=== END MANDATORY STYLE ===

=== CAT SPRITE LOCK ===
TRUE isometric 3/4 view, not front view, not side view,
can see TOP of head and one side of body,
cat is standing/sitting on flat ground plane,
paws at bottom of canvas, flat and even,
NO shadow on ground, NO cast shadow,
NO grass under cat, NO ground, NO dirt,
full cat visible, not cropped, centered horizontally,
=== END CAT LOCK ===

cute chibi cat, 2-head tall proportions,
very big round eyes, tiny pink nose, small whisker dots,
fluffy fur,
```

---

### 咪咪 (橘猫) - 48×44
> 基础色：bright orange fur, darker orange tabby stripes, white chest and paws, yellow-green eyes

#### idle_01 - 待机1
```
[猫咪通用前缀]

orange tabby cat SITTING UPRIGHT,
fluffy bright orange fur with darker orange vertical tabby stripes,
white chest, white front paws,
big round yellow-green eyes wide open,
pink inner ears,
fluffy tail curled around body to the right,
front paws together in front,
alert but relaxed expression, slight head tilt,
kawaii cute,
192x176 canvas, bottom of paws at exact bottom center,
transparent background

NEGATIVE PROMPT:
realistic cat, too detailed fur, scary, ugly,
standing pose, walking pose,
3D render, blurry, anti-aliased,
thick outline, background elements
```

#### idle_02 - 待机2（眨眼）
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat SITTING UPRIGHT,
same pose as idle_01,
EYES HALF CLOSED, slow blinking,
content happy expression, slight smile,
ears slightly relaxed back,
rest of body identical to idle_01,
192x176 canvas, paws at bottom center,
transparent background
```

#### walk_01 - 行走1
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat WALKING,
front RIGHT paw lifted forward mid-step,
back LEFT paw pushing off ground,
tail up and slightly curved,
perked ears forward,
determined cute expression, looking ahead,
body slightly elongated,
192x176 canvas, lowest paw at bottom center,
transparent background
```

#### walk_02 - 行走2
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat WALKING, passing pose,
all four paws under body, weight shifting,
tail swishing to left side,
ears forward,
walking forward motion,
192x176 canvas, paws at bottom center,
transparent background
```

#### walk_03 - 行走3
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat WALKING,
front LEFT paw lifted forward,
back RIGHT paw pushing off,
mirror of walk_01 pose,
tail up curved other way,
192x176 canvas, lowest paw at bottom center,
transparent background
```

#### walk_04 - 行走4
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat WALKING, push-off pose,
back legs both pushing from ground,
body stretched slightly forward,
tail straight back for balance,
ears perked forward,
mid-stride fully extended,
192x176 canvas, back paws at bottom center,
transparent background
```

#### sleep_01 - 睡眠1 (48×32)
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat SLEEPING CURLED UP TIGHT,
tightly curled into a fluffy ball,
tail wrapped around body covering face partially,
eyes completely closed, peaceful expression,
one small "z" letter floating above head,
fluffy orange fur ball shape,
pink inner ear peeking out,
viewed from slightly above side,
extremely kawaii peaceful sleeping,
192x128 canvas, bottom of curl at exact bottom center,
transparent background
```

#### sleep_02 - 睡眠2 (48×32)
```
[猫咪通用前缀 + 颜色同idle_01]

orange tabby cat SLEEPING CURLED UP,
same as sleep_01 but slightly repositioned,
bigger "Z" floating above,
tiny content smile,
body slightly expanded (breathing in),
192x128 canvas, bottom at bottom center,
transparent background
```

---

### 豆豆 (灰猫) - 52×44

> 用图生图最方便！拿咪咪的图做参考，强度 30%，改颜色描述：
>
> **颜色替换**：
> - orange tabby → chubby grey british shorthair
> - bright orange fur with darker orange tabby stripes → solid soft blue-grey fur, round chubby cheeks
> - yellow-green eyes → big round copper golden eyes
> - white chest and paws → lighter grey chest, white chin
>
> **体型**：rounder, chubbier, fatter face, slightly wider than tall

---

### 雪宝 (白猫) - 44×48

> 同样用咪咪做参考图生图，改颜色：
>
> **颜色替换**：
> - orange tabby → fluffy white persian cat
> - orange fur with stripes → long fluffy pure white fur, very fluffy tail like a feather duster
> - yellow-green eyes → bright blue eyes, pink nose, pink paw pads
> - white chest and paws → entirely white fluffy fur
>
> **体型**：fluffier, rounder, bigger tail, slightly taller from all the fur

---

## ✨ 十、特效

### 1. particles.png (64×64) - 粒子贴图合集
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing,
uniform pixel size, 16-bit pixel art,
Japanese healing style, warm colors,
transparent background,
=== END MANDATORY STYLE ===

particle sprite sheet, multiple small shapes scattered:
- 4-pointed star sparkles (golden yellow)
- small circular glows (pale yellow)
- diamond sparkles (pale pink)
- tiny heart shapes (pink)
- small 5-point stars (light yellow)
warm golden and pink color palette,
glowing effect but crisp pixel edges,
magical happy sparkles,
256x256 canvas, particles spread out naturally,
transparent background

NEGATIVE PROMPT:
blurry, soft glow, 3D, realistic,
too many particles, cluttered,
black background, white background
```

### 2. glow.png (128×128) - 柔和光晕
```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliased blur,
16-bit pixel art, discrete pixel steps,
=== END MANDATORY STYLE ===

soft radial glow effect,
perfectly centered circular glow,
bright warm golden-orange center,
fades out in stepped pixel rings to transparent,
multiple concentric rings of decreasing brightness,
warm ambient light, cozy atmosphere,
512x512 canvas, perfectly centered,
transparent background

NEGATIVE PROMPT:
smooth gradient, blurry, 3D, lens flare realistic,
off-center, irregular shape
```

---

## 🖼️ 十一、UI 图标 (256×256 精灵图集)

```
=== MANDATORY STYLE LOCK ===
CRISP HARD PIXEL EDGES, no anti-aliasing,
uniform pixel size, 16-bit pixel art,
Japanese healing style, warm pastel palette,
=== END MANDATORY STYLE ===

UI icon sprite sheet, 8x8 grid layout,
each icon is 32x32 pixels, evenly spaced with 1px gap,
all icons same cute chibi style, front view mostly,
icons in order left to right, top to bottom:
Row 1: house, tree, cat face, shopping bag, lightbulb, flower, tower, heart
Row 2: gold coin, yellow star, gear, hamburger menu, fish, yarn ball, speech bubble, music note
warm pastel color palette consistent across all icons,
thick clean outlines, easy to recognize at small size,
1024x1024 canvas, transparent background

NEGATIVE PROMPT:
different styles, inconsistent,
3D icons, realistic icons,
too detailed, messy,
misaligned grid, wrong spacing
```

---

## 📋 快速质检清单（每张图必过）

### 🟢 必过项（不过就是废图）
- [ ] 边缘是硬像素锯齿，没有模糊羽化/抗锯齿
- [ ] 背景完全透明，没有底色/渐变
- [ ] 整体是像素风格，不是写实/3D渲染
- [ ] 尺寸比例正确（瓦片严格2:1，建筑/猫咪按指定尺寸）
- [ ] 没有多余的 stray pixels（孤零零散的像素点）

### 🟡 一致性检查
- [ ] 像素密度和样板图（grass_base）差不多
- [ ] 色调在标准调色板范围内
- [ ] 装饰的大小/数量和样板图在同一量级
- [ ] 整体感觉"像是同一个游戏里的"

### 🔵 瓦片专属
- [ ] 完全扁平，没有任何厚度/侧面/泥土块
- [ ] 边缘没有深色描边/外框
- [ ] 菱形四个尖角清晰，毛边不超出 1px
- [ ] 拼接处颜色过渡自然（没有明显分界线）

### 🔴 建筑/猫咪专属（最重要！）
- [ ] **真等距视角**：能看到顶面（屋顶/树冠/头顶）+ 两个侧面
- [ ] **不是正面视图**：不是正对着镜头的 2D 贴画感
- [ ] **无草地底座**：底部没有草皮/泥土平台/地砖
- [ ] **无地面阴影**：脚下没有投影到地面的阴影
- [ ] **底部平整**：最底部是平的，没有根伸出来/没有不规则突出
- [ ] 完整显示，没有被画布边缘裁剪
- [ ] 居中对齐，左右留白均匀

### ⚠️ 常见踩坑快速排查
1. **底部有草？** → 废，重生成（加 NO grass base）
2. **正面视图看不到顶？** → 废，重生成（加 TRUE isometric top-down）
3. **有地面阴影？** → 废，重生成（加 NO cast shadow）
4. **像素模糊？** → 废，重生成（加 CRISP HARD PIXEL EDGES）

---

## 🔧 后期统一处理流程（必做！）

全部生成完以后，统一做这一步，能让一致性从 80% 提升到 95%+

### 工具：Aseprite
1. **打开第一张满意的图**，提取它的调色板
   - `Sprite > Color > Import Palette > From Sprite`
2. **保存调色板**为 `meowstar_palette.ase`
3. **批量处理其他图**：
   - 打开图片
   - `Sprite > Color > Load Palette` 加载保存的调色板
   - `Sprite > Color > Quantize` 映射到调色板
4. **检查边缘**：放大到 800%，清除半透明像素
5. **统一尺寸**：确保所有瓦片都是 64×32，建筑按指定尺寸

### 如果没有 Aseprite
也可以用 Photoshop 的 **"存储为 Web 所用格式"** 统一颜色面板，或者用在线工具 **pixlr.com** 处理。

---

## 💡 GPT Image 2 / Nano Banana Pro 实用技巧

### 1. 生成尺寸设置
- **瓦片类**：设为 1024×512（正好 2:1）
- **建筑/猫咪**：设为目标尺寸的 4 倍，缩小后像素更锐利
- **不要用 1:1 方形**，否则比例会飘

### 2. 种子固定大法
- 生成到满意的一张时，**记下 seed 值**
- 后续同类型全部用同一个 seed
- 只改描述词，不改 seed
- 效果：风格高度统一

### 3. 图生图风格传递
- 有满意的样板后，尽量用 img2img
- 风格相似度/强度设为 **20%-30%**（低强度）
- 这样只改内容，风格几乎完全保留

### 4. 批量生成顺序
```
第1步：grass_base → 反复调到完美（这是风格锚点）
第2步：用 grass_base 图生图 → grass_variant1, grass_variant2, dirt, stone, water
第3步：用草地色参考 → 生成 tree_small
第4步：用 tree_small 图生图 → tree_big, bush, mushroom, pond...
第5步：建筑类按顺序生成，保持风格连贯
第6步：猫咪最难最后做，用参考图逐帧生成
第7步：最后统一调色板后期处理
```

按这个顺序来，整体风格会越来越统一，不会一张一个样！
