# wormhole-3d · 虫洞穿越

一句话介绍：滚动驱动穿越速度的全屏虫洞隧道——滚得越快穿越越快、FOV 随之拉伸，隧道尽头跃出白光、落入虚构新品发布区。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：Awwwards 获奖站点中常见的"发布会开场式穿越转场"（长滚动段 + 隧道纵深 + 终点白光切发布）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 滚动驱动穿越速度：页面滚动增量 → 隧道行进距离，滚得越快穿越越快；
  2. 速度感三件套：FOV 拉伸 + 粒子流加速 + 径向速度线覆盖层；
  3. 隧道末端"出口"白光：远端发光体随进度增强，过渡到发布区时全屏白闪一次。
- **代码原创声明**：隧道环/粒子/出口光全部为手写 GLSL shader 与原创 JS，未引用任何原站源码；Three.js（MIT）与排印/布局代码均为本模板原创实现。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 虫洞隧道环 | 单个开口圆柱（BackSide）+ Fragment Shader：`sin(worldZ + uTravel)` 画环，`pow(...,28)` 收细环带；环亮度带 `sin(time)` 脉冲 |
| 2 | 滚动驱动穿越 | 380vh 长滚动段 → 进度 p → `uTravel = p × 620` 世界单位；`uTravelBase` 以指数追踪（快跟慢回，有物理感） |
| 3 | 速度三件套 | 滚动速度平滑为 `speed 0..1` → 相机 FOV 68→126 拉伸；粒子 `gl_PointSize × (1+speed×1.6)`；CSS 径向速度线层 opacity = speed |
| 4 | 粒子流 | 1400 点，Vertex Shader 里 `mod(z + uTravel)` 循环涌向相机，掠过相机时淡出；近白远紫、闪烁 |
| 5 | 出口白光 | 远端 z=-204 加色发光平面（白核+紫晕），`uExit = smoothstep(p)` 增强；隧道末段全屏白闪一次后褪去 |
| 6 | HUD | 左上 VELOCITY（c 为单位， tabular-nums）、右上穿越进度 %；中央阶段文案 4 段交叉淡入 |
| 7 | 加载态 | 「跃迁引擎预热」+ 循环进度条；`load+450ms` / 3.2s / 5s 三重兜底必进完成态 |
| 8 | 重新穿越 | easeInOutCubic 1.9s 滚回顶部，反向穿越同样触发 FOV/速度反馈 |

## 配置参数

在 `src/main.js` 顶部 / shader uniform 处调整：

- `TRAVEL_LEN = 620`：全程穿越对应的世界单位（越大穿越感越长）
- `FOV_BASE = 68` / `FOV_MAX = 126`：静息 / 满速视场角
- 隧道环密度：fragment 中 `phase = (vZ + uTravel) * 0.9` 的系数；环锐度 `pow(..., 28.0)`
- 粒子数：`N = 1400`（reduced-motion 时 500）
- 速度灵敏度：`target = min(1, velRaw / 26)`，平滑系数 `exp(-dt*5.5)`
- 出口白光起始：`uExit = smoothstep((p-0.55)/0.45)`；全屏白闪区间 `p ∈ [0.78, 1.0]`
- 隧道段高度：`.tunnel{height:380vh}`（越长穿越时间越长）
- 配色：`:root` 中 `--void:#04060D` `--violet:#9B6BFF` `--white:#F5F3FF`

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉动效（虫洞穿越）；HUD/按钮/文案切换均为微交互，无第二主角。
2. **配色**：全页严格 3 色（深空蓝黑 #04060D / 电紫 #9B6BFF / 白 #F5F3FF），无彩虹渐变；隧道发光只在紫→白之间过渡。
3. **字体**：系统字体栈；巨型标题 `clamp(4.5rem,21vw,15rem)` 字距 -0.02em，kicker 字距 0.55em 大小 12px，层级分明；大标题逐字 clip-path 上场、有呼吸感。
4. **文案**：真实感中文短句（"向下滚动，点燃跃迁引擎""把算力，折叠进口袋"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：隧道环脉冲、速度线 FOV 拉伸、vignette + SVG 噪点、"跃迁引擎预热"加载态、按钮 hover 上浮发光、高速相机微抖。
6. **easing**：全部手写物理感缓动（`cubic-bezier(0.16,1,0.3,1)`、指数追踪 `1-exp(-dt*k)`、easeInOutCubic），无默认 linear。

## 源码结构

```
wormhole-3d/
├── index.src.html      # 开发版（引用 src/main.js + vendor，落盘为准）
├── index.html          # 打包成品（单文件，验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：滚动引擎 / Three.js 隧道 / HUD / 按住穿越 / 重新穿越
├── vendor/
│   ├── three.module.js # Three.js 本地（MIT，打包时走 importmap data: URL 内联）
│   └── gsap.min.js     # 本模板未使用（预留）
├── README.md
└── ../shots/wormhole-3d.png / wormhole-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/wormhole-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py wormhole-3d
# 4. 验证（以打包成品为准）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/wormhole-3d/index.html" ~/workspace/fx-lab/shots/wormhole-3d.png 1280 800 0
```

打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在（缺失先恢复）。

## 移动端说明

- 布局：标题/阶段文案/HUD 全部 `clamp()` 自适应；390×844 下巨型标题 24vw、HUD 字距收紧。
- **按住穿越**：移动端（`pointer:coarse`）滚动不便，穿越段 pin 内显示圆形「按住穿越」按钮；长按以程序化滚动驱动同一套速度链路（FOV/粒子/进度/HUD 全生效），松开即停；按钮有按压缩放 + 紫光反馈。
- 省电：移动端停掉噪点位移（`grain{animation:none}`）；`prefers-reduced-motion` 下粒子减半、关闭静息漂移与速度线层。
- 触摸：按钮 `touch-action:none` + 指针捕获，滑动误触不触发。
