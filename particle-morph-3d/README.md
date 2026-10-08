# 粒子变形 · PARTICLE MORPH

## 一句话

一套粒子（THREE.Points）在二十面体团块、银河旋涡、"NOVA"文字、星环四个目标点云之间插值变形——切换时先"炸开"再"聚拢"，全程 simplex 噪声呼吸 + additive 辉光。

## 参考与借鉴点

- **参考对象**：SAYELI（2026 短视频病毒母题"粒子聚成 logo 再炸开"）。
- **借鉴点**：① 同一套粒子在多个目标点云之间插值（非多套粒子切换）；② 切换时先炸开（噪声振幅加大）再聚拢的节奏；③ simplex 噪声驱动的持续"呼吸"扰动；④ additive 混合 + 径向渐变精灵纹理做辉光，不用后期库。
- **红线遵守**：simplex 噪声为按公开算法独立实现的原创代码（`Simplex3` 类，种子打乱置换表）；tween 自研；未复制任何第三方噪声/动效源码。

## 动效拆解

1. **目标预计算**：4 个目标各为 `Float32Array(N*3)`，页面加载时一次生成——
   - 二十面体：`IcosahedronGeometry` 三角面随机重心采样，70% 贴面 + 30% 向内填充成团块；
   - 银河旋涡：3 旋臂对数螺旋采样（`r^0.65` 分布 + 旋臂抖动 + 盘面厚度衰减）；
   - NOVA：canvas 2D 画字 → `getImageData` 像素采样 → 映射到平面点云；
   - 星环：torus 参数方程，60% 表面采样 + 40% 管内填充。
2. **变形**：切换时 `from.copy(cur)` 快照当前态，`morphT 0→1`（2.4s），`easeInOutCubic` 插值；噪声振幅按 `sin(π·t)` 在中段达到峰值（`BASE×(1+2.6·burst)`）——视觉上就是"炸开再聚拢"。
3. **呼吸**：静止时每帧三轴独立相位 simplex 噪声（振幅 0.16），粒子永不静止。
4. **辉光**：`PointsMaterial` + `AdditiveBlending` + canvas 生成的径向渐变精灵纹理；顶点色在紫 `#A78BFA` / 青 `#22D3EE` 之间随机混合。
5. **交互**：底部 4 目标按钮 + 自动轮播（6s 一切，可暂停）；鼠标移动在 z=0 平面产生斥力波纹（`sin(t·7 − d·2.4)` 衰减波）；相机随鼠标视差 + 整团缓慢自转。
6. **背景**：CSS vignette + SVG 细噪点 overlay，焦点只留给粒子。

## 配置参数

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `COUNT` | main.js 顶部 | 桌面 40000 / 移动 12000 | 粒子总数（移动端自动降档） |
| `MORPH_DUR` | main.js | 2.4s | 单次变形时长 |
| `CAROUSEL_SEC` | main.js | 6s | 自动轮播间隔 |
| `BASE_BREATH` | main.js | 0.16 | 常态呼吸振幅 |
| `BURST_GAIN` | main.js | 2.6 | 炸开峰值增益 |
| `REPEL_RADIUS/REPEL_STRENGTH` | main.js | 2.4 / 1.1 | 鼠标斥力半径/强度 |
| `IS_MOBILE` | main.js | `matchMedia('(pointer: coarse)')` | 移动端判定 |

## 六项自查

- [x] **克制**：整页只讲"一套粒子变形"一个核心动效；UI 仅标题 + 底部按钮 + 可关监视器。
- [x] **配色**：全页 3 色——黑 `#06060B`、紫 `#A78BFA`、青 `#22D3EE`，无彩虹渐变。
- [x] **字体**：系统字体栈，大标题字距 `.14em`、字号 clamp 响应式，有呼吸感。
- [x] **无 Lorem ipsum/emoji**：全部中文短句（"四万粒星尘，一念聚散"等）。
- [x] **手工细节**：vignette + 细噪点 + 加载态（"粒子凝聚中"扫描条）+ 按钮 hover 上浮发光微交互。
- [x] **easing 物理感**：`easeInOutCubic` 变形（慢起慢收），`cubic-bezier(.2,.9,.25,1.4)` 按钮 hover 回弹，无 linear。

## 源码结构

```
particle-morph-3d/
├── index.src.html   # 页面骨架：importmap + UI（标题/按钮/监视器/加载态）+ 内联样式
├── src/main.js      # 全部逻辑：Simplex3 / 4 目标采样 / 变形状态机 / 主循环
├── vendor/
│   └── three.module.js  # Three.js（本地 vendor，零外部请求）
├── README.md
└── index.html       # fx-singlefile.py 打包成品（一次性单向生成）
```

## 重建方式

```bash
cd ~/workspace/fx-lab/particle-morph-3d
# 1. 语法/打包检查
~/workspace/eazyopc/node_modules/.bin/esbuild src/main.js --bundle --external:three --format=esm --outfile=/dev/null
# 2. 生成成品（一次性单向：index.src.html → index.html，importmap 转 data:URL 内联）
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py particle-morph-3d
# 3. 本地预览（file:// 直接双击 index.html；ES module 已内联，无跨域问题）
```

## 移动端

- 粒子数自动降档：桌面 40000 → 移动 12000（`matchMedia('(pointer: coarse)')` 或宽度 <768px）。
- 触屏：轻点画面切换下一个目标（touchstart/touchend 位移 <14px 判定为点按）；底部按钮照常可用。
- 监视器在移动端默认隐藏以省空间；粒子尺寸略放大（0.075）保证小屏可见度。
