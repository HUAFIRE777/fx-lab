# cloth-flag-3d · 布料波浪

朱砂红绸全屏布料波浪 shader：顶点多层正弦 + simplex 噪声扰动，三种形态（旗/绸/幅）切换，风力滑杆可调，指尖在布面上拖动拨出涟漪。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：品牌官网常用的丝绸/旗帜布料背景动效（大面积布料 + 风力感波浪 + 可交互）。
- **学的手法**（只学思路，不抄代码）：
  1. 顶点着色器做布料波浪（多层正弦叠加 + 噪声扰动），而非法线贴图造假；
  2. 风力参数同时驱动振幅与速度，一根滑杆控制整体"风感"；
  3. 双面渲染时背面压暗，模拟布料正反面光照差异。
- **代码原创声明**：位移函数（三形态混合）、涟漪扩散环、展旗卷筒 reveal、法线数值偏导、杆件淡入淡出逻辑均为本模板独立编写；simplex 噪声采用 Ashima 公开标准实现（业界通用手法）；未接触任何原站源码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 布料波浪 | 顶点 shader：`f0 旗`（左缘固定、波向右缘放大）/`f1 绸`（上缘固定、噪声主导垂落）/`f2 幅`（上下固定、中部鼓动），`uMode 0→2` 连续值在三者之间插值混合，切换时带 1.4s easeInOutCubic 过渡 |
| 风力 | `amp = 0.10 + 0.95·w`，`spd = 0.5 + 2.4·w`；滑杆目标值经 lerp 惯性跟随，形态切换时叠加一阵指数衰减的阵风（物理感） |
| 涟漪 | 6 槽位循环 uniform `vec4(uv, 起始时间, 强度)`；顶点 shader 里径向扩散波环 `exp(-g²)·exp(-age·1.8)`，2.5s 衰减完；raycast 取布面 uv，拖动节流（位移/时间双阈值）连续播撒 |
| 法线/光照 | 高度场数值偏导求法线（涟漪不计入，省性能）；wrap 光照 + 镜面高光（丝绸感）；`gl_FrontFacing` 区分正反面，背面压暗 34% 并偏冷 |
| 展旗加载 | `uReveal 0→1`（2.4s easeInOutCubic）：未展开部分按 `p.x = edge + R·sin(d/R)` 卷成筒，卷边从左扫到右；播完标题层 `.is-in` 淡入、中央自动一圈涟漪点睛 |
| 杆件/飘带 | 旗杆（旗）/顶部横杆（绸）/上下横杆（幅）按形态淡入淡出；3 条边缘飘带复用同一 shader（uv 映射到旗面自由端），只在旗形态下显现 |
| 微交互 | 形态按钮 hover 上浮、风力滑块 thumb 悬停放大、布面 grab/grabbing 光标 |

## 配置参数

| 参数 | 位置 | 说明 |
|---|---|---|
| `PLANE_W / PLANE_H` | `src/main.js` | 布料尺寸（世界单位），默认 10.5 × 6.6 |
| `SEG` | `src/main.js` | 网格细分，桌面 150×92 / 移动 76×48 |
| 风力滑杆 | 页面底部 | 0–100，默认 42；同时控制振幅与速度 |
| 形态按钮 | 页面底部 | 旗（0）/ 绸（1）/ 幅（2），`uMode` 连续插值 |
| `RIPPLE_N` | `src/main.js` | 涟漪槽位数，默认 6 |
| 配色 | `index.src.html :root` | 墨黑 `#0d0b09` / 朱砂 `#c23a22` / 米白 `#ece2cc`（严格三色） |
| 相机 | `src/main.js` | fov 40 / z 9.6，两缘杆件恰好入画 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只有一个主视觉动效（布料波浪），其余只有按钮 hover、滑块、标题淡入等微交互。
2. **配色**：全页严格三色（墨黑/朱砂/米白），无彩虹渐变；布料明暗全部由光照算出，非贴图渐变。
3. **字体**：标题宋体栈、字号 clamp(56px, 9.5vw, 128px)、字距 .18em，大标题有呼吸感；层级 kicker → h1 → slogan 三档分明。
4. **文案**：真实感中文短句（"一匹红绸，半城风声。" / "朱砂为底 · 风作针脚" / "指尖所至 涟漪自生"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：vignette + SVG 噪点颗粒（1.1s steps 跳动）、展旗卷筒加载态、布料边缘压暗（厚度感）、双面光照差异、飘带、旗杆古铜色、形态切换带阵风。
6. **easing**：easeInOutCubic（展旗/形态切换）、easeOutExpo（备用）、风力 lerp 惯性、阵风指数衰减；全站无 linear。

## 源码结构

```
cloth-flag-3d/
├── index.src.html   # 开发版：结构 + 全部 CSS + importmap（three → vendor）
├── src/main.js      # 全部逻辑（ESM）：场景/布料 shader/涟漪/杆件/交互/加载
├── vendor/
│   └── three.module.js  # 本地 three（从 typo-neon-3d 复制，约 1.2MB）
├── index.html       # 打包成品（单文件，fx-singlefile.py 生成，勿手改）
└── README.md
```

`src/main.js` 内部分节：基础（renderer/scene/camera）→ 缓动工具 → snoise → 布料 shader（VERT/FRAG）→ 涟漪槽位 → 飘带 → 杆件 → 状态（风力/形态）→ 拨动交互 → 展旗加载 → 主循环。

## 重建方式

```bash
cd ~/workspace/fx-lab/cloth-flag-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py cloth-flag-3d
# 输出 index.html：single-file OK（esbuild 打包 main.js 内联 + three 走 data: URL importmap）
```

- 打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在。
- 单向打包：改源码后从 `index.src.html` 重新 cp 再跑，禁止对已打包的 `index.html` 重复跑。
- 验证：`NODE_PATH=/tmp/hcshot/node_modules node /tmp/cloth-shot.js <out.png> <w> <h> <mobile>`（等 reveal 完成态后截图 + 断言 console 零错误、零 http(s) 外链）。

## 移动端说明

- 断点 640px：竖排文字隐藏、标题上移、控制条改为纵向堆叠（形态三按钮均分一行、滑杆全宽）。
- 性能降级：网格细分降至 76×48、pixelRatio 上限 1.5（桌面 2）；shader 内避免高精度性能坑（噪声单次采样复用、涟漪不计入法线）。
- 触摸：canvas `touch-action: none`，pointerdown/move 统一处理，手指拖动即拨涟漪；`pointer: coarse` 设备自动走移动端配置。
- 安全区：底部控制条含 `env(safe-area-inset-bottom)`；`prefers-reduced-motion` 下展旗瞬间完成、噪点动画关闭。
