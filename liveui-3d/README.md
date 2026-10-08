# liveui-3d · 回声 Echo One — 3D 物体上的实时可交互 UI

> 一句话：一台程序化 3D 智能音箱，屏幕上贴的不是贴图——而是一张真实可点的 DOM 播放器卡片，每帧用单应性矩阵做 `matrix3d` 透视贴合，视觉"长"在 3D 物体上，交互走真 DOM。

## 参考与借鉴点

- **参考对象**：「Live UI on 3D」趋势——Chrome 148 origin trial 正在推进的"把真实网页 UI 渲染进 3D 场景"能力，被巴黎 WebGL 大会点名为下一个 hero 范式。本模板是该能力正式落地前的 **fallback 实现**，卖的是"未来感"。
- **借鉴点（只学手法，代码全部原创重写）**：
  1. 「视觉与交互分家」——3D 侧只负责好看（波形/发光/旋转），交互侧用浏览器原生 DOM，两边用投影矩阵缝合；
  2. 「投影贴合」——把 3D 平面四角投影到 2D，解单应性矩阵生成 CSS `matrix3d`，让 DOM 产生透视变形；
  3. 「降级可用」——投影失效时 UI 不消失，而是落回固定位置继续可用。
- 未借鉴：任何第三方现成库/示例代码。本模板零依赖（除 Three.js 外），单应性求解、音频合成、旋转物理均为手写。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | DOM 卡片透视贴合 | 每帧：屏幕 plane 四角 `localToWorld → project` 得 2D 像素 → 高斯消元解 3×3 单应矩阵 → `matrix3d(a,d,0,g, b,e,0,h, 0,0,1,0, c,f,0,1)`（列主序）贴到卡片上；四角向形心内收 14%，露出 3D 波形"画框" |
| 2 | 屏幕波形 | `CanvasTexture` 每帧重绘：播放时取 `AnalyserNode` 频域数据画 44 根荧光绿柱，高度随音量缩放；待机时正弦呼吸 |
| 3 | 旋转物理 | 拖拽改 `rotY` 并记录速度 → 松手惯性 `vel *= 0.06^dt` 衰减；纵轴弹簧回正 `rotX += (0-rotX)·dt·3.2`；闲置 2.5s 后 0.22rad/s 缓自转展示 |
| 4 | 发光环呼吸 | `emissiveIntensity = 1.9 + 0.35·sin(2.1t)`，播放时叠加 `0.5·\|sin(5.2t)\|` 节拍跳动 |
| 5 | 入场 reveal | `body.ready`（首帧渲染后）触发：loader 0.7s 淡出，文案按 `--d` 阶梯 `cubic-bezier(.22,1,.36,1)` 上浮 |
| 6 | 交互反馈 | 播放键 hover 放大 1.1（弹性 `cubic-bezier(.34,1.56,.64,1)`）/ active 压到 0.92；歌曲键 hover 上浮 2px；滑杆 thumb hover 放大 1.25 |
| 7 | 背面淡出 | 屏幕法线与视线夹角 < ~85° 时卡片 `opacity→0 + pointer-events:none`，转回来自动恢复 |

## 配置参数

`src/main.js` 顶部集中可调：

- `SCREEN_W / SCREEN_H` — 3D 屏幕尺寸（2.02 / 1.08 世界单位）
- `BARS` — 波形柱数（44）
- `TRACKS` — 三首合成旋律：`{name, sub, bpm, wave, seq:[[midi,拍数]…]}`，改这里即换歌
- `0.86` — 卡片相对屏幕的内收比例（placeCard 内）
- `0.22` — 闲置自转角速度 rad/s；`2.5` — 闲置判定秒数
- `vol` 滑杆 `0–100` → 增益 `pow(v,1.6)` 曲线映射，实时 `setTargetAtTime`
- 配色三色定死：`--ink #16161A` / `--neon #B4FF39` / `--paper #FFFFFF`（透明度变体允许）

## 六项自查

1. **克制**：整页只讲一个核心动效——"UI 贴在 3D 屏幕上"；below-fold 只有三段原理说明，不堆砌。
2. **配色**：全页严格 3 色（石墨/荧光绿/纸白），经 `grep` 核验无第 4 色。
3. **字体**：中文系统字体栈，字号层级 64/19/13 三档，标题字距 .06em、大标题有呼吸感。
4. **无 Lorem/emoji**：文案为中文短句（"晨间电子""深夜爵士""山间民谣"）；屏幕状态行用 `▶`/`❚❚` 几何符号绘制，非 emoji。
5. **手工细节**：全页 SVG 噪点 overlay、卡片毛玻璃 + 霓虹光晕、滑杆荧光 thumb、圆角波形柱。
6. **easing 物理感**：旋转惯性阻尼、纵轴弹簧回正、按钮弹性曲线——无一处 `linear`。

## 源码结构

```
liveui-3d/
├── index.src.html   # 源码入口：内联 CSS + DOM（播放器卡片/舞台/文案）+ importmap
├── index.html       # 打包成品（fx-singlefile.py 生成，一次性单向，不可重复打包）
├── src/
│   └── main.js      # ESM：场景/音箱/单应性投影/WebAudio 合成/波形纹理/旋转物理
├── vendor/
│   └── three.module.js  # 本地 three（构建期用，打包后走 data: URL 内联）
└── README.md
```

核心函数：`solveHomography()`（8×8 高斯消元求单应矩阵）、`placeCard()`（投影→贴合→降级）、`drawScreen()`（波形纹理）、`schedule()`（WebAudio 前瞻调度）、`setPlaying()`（播放状态机）。

## 重建方式

```bash
cd ~/workspace/fx-lab/liveui-3d
# 1. 改 src/main.js 或 index.src.html
# 2. 校验打包
/tmp/esb/node_modules/.bin/esbuild src/main.js --bundle --format=esm --external:three > /dev/null && echo OK
# 3. 一次性单向打包（禁对已打包的 index.html 重复跑）
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py liveui-3d
```

注意：`fx-singlefile.py` 是一次性单向打包；每次改完源码必须 `cp index.src.html index.html` 后重跑。headless Chromium 禁 `file://` ES module，直测请用打包后的 `index.html`（three 走 data: URL importmap）。

## 移动端

- 舞台切换 `aspect-ratio: 4/5`，卡片逻辑尺寸经媒体查询变为 300×228——`cacheCardSize()` 在每次 `resize` 时重读 `offsetWidth/offsetHeight`（布局尺寸，不受 transform 影响），投影映射自动跟随，不错位。
- 触屏：卡片 `pointerdown` 阻止冒泡，点按钮/拖滑杆不触发旋转；舞台 `touch-action: pan-y`，竖滑翻页、横拖旋转互不打架。
- 已验证：390×844 真机尺寸截图，`matrix3d` 正常贴合、无 fallback、console 零错（见 `shots/liveui-3d-mobile.png`）。

---
huafire3d fx-lab · 原创实现 · 零外部请求
