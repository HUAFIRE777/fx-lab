# flame-3d · 焰 / 程序化火焰

一句话介绍：一团纯程序化的火——FBM 噪声火舌 shader 在纯黑底上撕裂、摆动、向上蹿，火星粒子腾空，火力滑杆、三档火焰形态、火星开关全可玩。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：游戏/影视级程序化火焰（如游戏引擎里的 GPU 火焰 shader、影视特效的程序化火舌）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. FBM 噪声域向上流动 + 横向 domain warp，伪造火舌的撕裂和翻卷；
  2. 噪声减纵向梯度（`flame = n - grad`），让火舌顶部自然尖灭而不是被包络硬切；
  3. 温度色映射：暗橙根部 → 火焰橙 → 炽黄舌尖，用颜色讲"温度"；
  4. 火星粒子：出生偏黄、上升冷却变橙变暗，尺寸随寿命衰减。
- **代码原创声明**：value-noise FBM、火舌包络、摆动、温度色、粒子系统全部为手写 GLSL/JS；未引用任何第三方 shader 源码；Three.js（MIT）仅作 WebGL 载体（全屏 quad + Points）。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 火舌主体 | 5 层 octave value-noise FBM；采样域 `q.y -= t*rise` 向上流动，`q.x += warp*yy` 横向扭曲，火舌撕裂感 |
| 2 | 火舌尖灭 | `flame = n + 0.10 - yy*(0.30-0.08*power)`：噪声减纵向梯度，顶部自然收尖 |
| 3 | 火焰摆动 | `sway` 双正弦叠加，`x -= sway*yy²` 高度平方加权，越高摆幅越大（微风感） |
| 4 | 底宽顶尖包络 | `halfw = width*(1-0.72*yy)` 横向 + `base` 纵向，火舌形 |
| 5 | 闪烁呼吸 | 整体 `breathe` 正弦 + 高频 `fl` 噪声抖，篝火 flicker 大、炉火小 |
| 6 | 温度色 | `mix(暗橙, 火焰橙, d) → mix(→炽黄, d)` + 火舌核心炽核加亮；sRGB 直值计算，防过曝发白 |
| 7 | 上升火星 | 420 粒子池，火力联动数量（60+360*power）；上升+正弦漂移；黄→橙→暗冷却；AdditiveBlending |
| 8 | 热浪扭曲 | 火焰上方低 alpha 上升波纹带，纯热空气感 |
| 9 | 底部燃料辉光 | 贴底的暗橙指数光晕，火"坐"在面板后 |
| 10 | 形态切换 | 篝火/火炬/炉火三档参数（宽/高/闪烁/湍流），JS 侧指数趋近 `1-exp(-dt*3.2)` 无跳变 |
| 11 | 火力联动 | 滑杆 5–100%：火焰高度 `height*(0.5+0.8*power)` + 火星数量联动 |
| 12 | 加载态 | 火焰 SVG 呼吸 + 「点火中」；首帧 4 帧后 / load+400ms / 3.5s 三重兜底必进 `html.done` |
| 13 | 质感层 | CSS vignette + SVG feTurbulence 细噪点（steps 跳动），z-index 排序，不用 blur（避 preserve-3d 压平坑） |

## 配置参数

在 `src/main.js` 顶部 / shader uniform 处调整：

- `MODES` 三档：`width`（火焰半宽）/`height`（火焰高度）/`flicker`（闪烁强度）/`turb`（湍流强度）/`seed`（噪声种子）
- 火力滑杆：`power` 0.05–1，默认 0.65；高度系数 `(0.5+0.8*power)`，火星数 `60+360*power`
- 火焰密度：`smoothstep(0.10, 0.75, body + 0.02)`（阈值越低火焰越壮）
- 摆动：`sway` 双正弦系数；`yy²` 高度加权
- 上升速度：`rise = t*(1.35+flicker*1.0)`
- 噪声基线：`flame = n + 0.10 - grad`（+0.10 补偿实测 GLSL 侧 n 均值偏低）
- 形态过渡：`1-exp(-dt*3.2)`；入场渐入 `1-exp(-t*2.4)`
- FBM 层数：`fbm()` 内循环 5 次（性能/质量权衡点）
- 配色：纯黑 `#0a0a0a` / 火焰橙 `#ff6b1a`(1.0,0.42,0.10) / 炽黄 `#ffc53d`(1.0,0.77,0.24)；shader 内用 sRGB 直值 Vector3

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉动效（火焰+火星同属"一团火"）；标题/控制面板/噪点均为配角，无第二主角。
2. **配色**：全页严格 3 色（纯黑 / 火焰橙 / 炽黄）；火焰温度色只在橙→黄谱内渐变，无彩虹渐变、无杂色。
3. **字体**：系统字体栈；巨标题 `clamp(3.4rem,13vw,9.5rem)` 字重 900，kicker mono 11px 字距 0.5em，描述 0.14em 字距行高 2，层级分明。
4. **文案**：真实感中文短句（"火苗不等人。它从柴堆里站起来，先小后大，先黄后橙，最后都变成腾空的星子。"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：vignette + 细噪点（steps 跳动）、火焰 SVG 呼吸加载态、形态按钮选中渐变发光、滑杆拇指辉光、火星开关滑动、火焰根部燃料辉光。
6. **easing**：全部物理感缓动（`cubic-bezier(0.16,1,0.3,1)` 入场、指数趋近 `1-exp(-dt*k)` 形态切换/入场渐入），无默认 linear。

## 源码结构

```
flame-3d/
├── index.html        # 单文件成品（fx-singlefile.py 打包，three.js 内联为 data:URL importmap）
├── index.src.html    # 源码 HTML（样式+结构+importmap）
├── src/
│   └── main.js       # 火焰 shader + 火星粒子 + 控制逻辑（ESM，import 'three'）
├── vendor/
│   └── three.module.js  # three@0.183.0 本地（MIT）
├── README.md
└── （shots/ 在 fx-lab/shots/：flame-3d.png / flame-3d-mobile.png）
```

## 重建方式

```bash
cd ~/workspace/fx-lab/flame-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py flame-3d   # 一次性单向打包
```

- 打包前确认 `/tmp/esb`（esbuild）与 `/tmp/three.module.min.js` 存在；缺失则 `cd /tmp && npm i esbuild ws`，three.module.min.js 用 esbuild 从 `vendor/three.module.js` 压缩生成。
- 验证：headless 抓 console（零错）→ 确认零外部请求 → 桌面/移动截图亲眼验收。

## 移动端说明

- 控制面板 `flex-wrap` 换行，滑杆 `touch-action:pan-x`，开关/按钮 `touch-action:manipulation`，原生 input range 触屏直接可用。
- 火焰宽度按 `aspect/1.6` 归一化，移动端视觉宽度与桌面一致；高度不缩放，窄屏上火焰更挺拔。
- 底部 dock 留 `env(safe-area-inset-bottom)` 安全区。
- 390x844 实测：火焰、火星、标题、控制面板全正常，console 零错。
