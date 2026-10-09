# lighthouse-3d · 灯塔

深夜海岸的灯塔：一束旋转的光，守着拍岸的浪。指引 / 咨询类品牌 hero 可用。
huafire3d fx-lab — original implementation

## ② 参考与借鉴点

- **对标对象**：海岸灯塔夜景摄影（长曝光作品里那种"光束在雾里扫出扇形"的感觉）。
- **只学了三个手法**：① 旋转光束的体积感 —— 双层 cone + 噪点颗粒，近灯亮、远端渐隐；
  ② 海浪的层次 —— 顶点波浪（三组正弦叠加）+ 浪尖碎白 + 拍岸白沫带；
  ③ 夜雾 —— 多层 FBM 雾 plane 缓慢漂移 + 灯室光晕 sprite。
- **代码原创声明**：以上手法均为自行实现的 GLSL / Three.js 代码，没有抄任何灯塔相关源码；
  three.js 本体为官方 `three.module.js`（从 vinyl-3d 的 vendor 复制，真品 667KB）。

## ③ 动效拆解

| 模块 | 实现 |
|---|---|
| 灯塔 | cylinder 塔身（canvas 纹理画 6 道条纹）+ 底座 + 观景廊栏杆（12 根立柱 + 圆环）+ 灯室（emissive 材质 + 呼吸明暗）+ 顶部小球灯 |
| 光束 | 双向两束，每束双层 cone（内层亮 / 外层 1.9 倍半径、0.32 透明度），additive 混合；fragment 里按 `1-vUv.y` 做长度衰减、按 uv.x 做边缘衰减、hash 噪点做体积颗粒；整体绕 Y 旋转扫射 |
| 海浪 | 150×150 段 plane，vertex shader 三组正弦叠加起伏；fragment 按高度混深色/浪肩色，浪尖碎白，岛礁周围白沫带随 `sin(time)` 涌动（拍岸节奏） |
| 夜雾 | 4 张大 plane，FBM（4 阶 value noise）alpha，左右反向漂移；另有 `FogExp2` 场景雾 |
| 星空 / 光晕 | 420 点 Points 星空；灯室 radial sprite 光晕 + 远处海平面低雾光 |
| 交互 | 自研 orbit（拖拽旋转 / 滚轮缩放 / 双指 pinch）；雾浓度滑杆（联动 FogExp2 密度 + 雾 plane 透明度）；光束暖黄 / 冷白两档（联动灯光、灯室、光晕颜色）；点按塔身（raycast，拖拽不触发）切换守夜人模式 —— 光束转速 ×3、灯光增强、右上角徽章变化 |

## ④ 配置参数表

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `beamState.targetSpeed` | src/main.js | 0.42 / 守夜人 1.25 | 光束角速度（rad/s 量级系数） |
| `scene.fog.density` | src/main.js `applyFog()` | 0.003 + v×0.024 | 雾浓度滑杆 0–100 映射 |
| 光束颜色 | `setBeamColor()` | #FFE9A8 / #DFF1FF | 暖黄 / 冷白两档 |
| `orbit` | src/main.js | radius 34，phi 1.12 | 初始视角；缩放限 20–60 |
| 海浪振幅 | sea vertex shader | 0.42 / 0.33 / 0.34 | 三组正弦振幅 |
| 白沫带 | sea fragment shader | r 4.5–11.5 | 岛礁周围环带，涌动周期约 7s |
| loader 兜底 | index.src.html 内联脚本 | 3800ms | 首帧渲染即进入，3.8s 强制进入 |

## ⑤ "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"灯塔 + 光束"一个主视觉，雾/浪/星空全是配角，没有第二套动效抢戏。
2. **配色定死 3 色**：深海夜 `#06121F`、灯光暖黄 `#FFE9A8`、雾蓝灰 `#8FA3B8` 系；塔身条纹用暖灰 + 深蓝（配色家族内），无彩虹渐变。
3. **字体讲究**：中文标题衬线（Songti SC / STSong / Noto Serif SC），大字号 + 宽松行高；英文小字全大写 + 0.5em 以上字距。
4. **无 Lorem、无 emoji**：文案全是真实感短句（"为归航的人，留一盏灯""深夜的海面只有两种颜色：浪和光"）。
5. **手工细节**：vignette 暗角 + SVG 噪点覆盖层（pointer-events:none，mix-blend-mode:overlay）；光束噪点颗粒、灯室呼吸、滑杆 thumb hover 放大。
6. **easing**：全站 `--ease: cubic-bezier(.22,1,.36,1)`；intro 元素 140ms  staggered 上浮。

## ⑥ 源码结构

```
lighthouse-3d/
├── index.src.html      # 源码：内联样式 + importmap + 经典脚本(intro 进入/3.8s 兜底)
├── index.html          # 打包产物（fx-singlefile.py 单向打包，勿重复跑）
├── src/main.js         # 全部 3D 逻辑（ESM，import * as THREE from 'three'）
├── vendor/
│   └── three.module.js # 官方 three（667KB，从 vinyl-3d 复制）
└── README.md
```

main.js 内部分段：自研 orbit → 灯光 → 星空 → 礁石岛 → 灯塔 → 光束 shader → 光晕 → 海浪 shader → 夜雾 FBM → 交互（雾滑杆/颜色/守夜人/raycast 点选）→ intro 进入 → 主循环。

## ⑦ 重建方式

```bash
cd ~/workspace/fx-lab/lighthouse-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py lighthouse-3d
```

- 改源码只改 `index.src.html` / `src/main.js`，改完重新跑上面三行。
- **禁止对已打包的 index.html 重复跑 singlefile**（importmap 已内联，会坏）。
- vendor 的 three.module.js 从 `~/workspace/fx-lab/vinyl-3d/vendor/` 复制，不要自己下载。

## ⑧ 移动端说明

- 触屏：单指拖拽旋转视角，双指 pinch 缩放；点按塔身切换守夜人模式（raycast，滑动不误触）。
- 布局：≤640px 时标题块收窄、徽章移到右下、控制条换行，`touch-action:none` 防页面滚动。
- 性能：`setPixelRatio(min(devicePixelRatio, 2))`；海浪 150×150 段在中端机可跑，低端机可降到 96 段。

## ⑨ 踩坑记录

1. **雾 shader 少了个右括号**：`hash` 里 `fract(... * 43758.5453;` 编译失败，四个雾 plane 全灭 —— 但页面其余正常，第一版截图里雾"看起来只是淡"，差点漏掉。教训：凡写 GLSL，必跑 console 检查（本模板用 CDP 抓 `Runtime.consoleAPICalled` + `Runtime.exceptionThrown`），肉眼不可靠。
2. **白沫块状噪点**：第一版用 `floor()` 网格 hash + `step()`，白沫呈像素方块。改成双线性插值的 value noise + `smoothstep()` 阈值，白沫变成柔边云絮。
3. **intro 时序漂移**：第一版把 `enter()` 定时器放在 module 脚本里，load 事件先于 module 执行完（887KB 解析慢），移动端截图里徽章/控制条没出现。修法：intro 进入逻辑搬到经典内联脚本（解析期即定义），`main.js` 首帧渲染后调 `window.__lhEnter()`；3.8s 兜底保留在经典脚本里。
4. **hcshot 的 3s 固定等待在负载高时不够**：CDP `/json/list` 间歇 `fetch failed`。/tmp 里放了个加重试的副本 `/tmp/hcshot-retry.js`（不改共享工具）；另注意 node 不展开 `~`，截图输出路径必须用绝对路径。
5. **海浪"馒头 blob"**：第三组低频正弦振幅 0.55 太大，远处海面像一排馒头。降到 0.34，浪肩高光阈值同步下调。
