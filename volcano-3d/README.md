# volcano-3d · 火山喷发

一座会呼吸的火山：熔岩沿抛物线喷发坠落，烟柱在风里翻滚，火山口辉光随喷发脉动 —— huafire3d fx-lab — original implementation。

## ② 参考与借鉴点

- **对标对象**：火山喷发纪录片影像（熔岩喷泉夜拍、火山灰柱航拍）。
- **只学了三个手法**：① 熔岩块的抛物线轨迹（上抛 → 重力回落 → 落地冷却变暗）；② 烟柱边上升边翻滚、被风横向拖拽；③ 火山口的辉光脉动（亮度随喷发强度呼吸）。
- **代码全部原创**：山体噪声置换、熔岩流 emissive shader、CPU 粒子池、烟团 sprite 动画均为本模板手写，未复制任何第三方火山/粒子代码；three.js 仅作 WebGL 渲染器（vendor 本地真品文件）。

## ③ 动效拆解

1. **火山锥**：`CylinderGeometry`（上 1.15 / 下 7.0 / 高 4.6）CPU 顶点置换 —— 自研 2D value noise 做山脊起伏 + 火山口锯齿；`onBeforeCompile` 注入 GLSL：双层角度噪声形成熔岩流纹，`uTime` 驱动向下流淌，越靠近山口越亮（`topGlow`），`uFlow` 随喷发强度调制。
2. **熔岩粒子**：3000 粒 CPU 池，火山口生成 → 初速上抛+外扩 → 重力抛物线 → 碰到山体锥面近似高度即熄灭；颜色按剩余寿命三段插值：亮橙 `#FF9E33` → 熔岩红 `#FF4D00` → 暗红 `#4D0F02`（落地冷却）。
3. **烟柱**：36 个 `Sprite`，程序化 canvas 纹理（柔边圆+明暗斑）；每团独立年龄循环：上升 13–18 单位、scale 2.6→12、风力 `WIND·a²` 横向拖拽 + 正弦翻滚摆动 + 自旋转；透明度按 `sin(π·a)` 淡入淡出。
4. **辉光**：火山口 `PointLight(#FF4D00)` + 内壁 `PointLight`，强度 = 基础×强度 + 噪声闪烁 + 大喷发加成；熔岩池圆盘脉动缩放、色相随闪烁微调；山口上方 additive 光晕盘。
5. **氛围**：暮档玄黑 + 星空点 + 雾；昼档提亮背景/半球光/方向光（阻尼过渡）；相机缓慢环绕 + 指针视差 + 拖拽环视；大喷发时轻微震屏（`prefers-reduced-motion` 下关闭）。
6. **交互**：喷发强度滑杆 1–10（粒子速率/速度/光强/烟速/熔岩流亮度联动）；"大喷发"按钮 → 3 秒冷却，强度倍率 ×4.2 衰减约 5 秒；昼/暮两档光照切换。

## ④ 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `PMAX` | main.js | 3000 | 熔岩粒子池上限 |
| `SMOKE_N` | main.js | 36 | 烟团 sprite 数 |
| `GRAV` | main.js | 5.4 | 粒子重力（场景单位/s²） |
| `WIND` | main.js | 1.35 | 风力（+x 拖拽系数） |
| `CONE_H/RT/RB` | main.js | 4.6/1.15/7.0 | 山体高/顶半径/底半径 |
| 喷发强度 | UI 滑杆 | 4 | 1–10，联动粒子/光/烟/流 |
| 大喷发倍率 | main.js `eff` | ×4.2 | `1 + burst×3.2`，衰减率 0.22/s |
| 相机半径 | main.js | 15.8 | 缓慢环绕 ±0.22rad |
| loader 超时 | index.src.html | 3.8s | 模块无论成败强制进入完成态 |

## ⑤ "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"火山喷发"一个主视觉，无多余装饰元素。
2. **配色**：玄黑 `#0A0A0B` + 熔岩橙红 `#FF4D00` + 烟灰三色定死，无彩虹渐变（粒子三段色是"冷却"叙事，非装饰渐变）。
3. **字体**：中文标题衬线（Songti SC/STSong/Noto Serif SC），英文小字 0.52em 大字距。
4. **文案**：真实感短句（"地心的一次呼吸""岩浆正在上升"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：vignette 暗角 + SVG 噪点覆盖层（`pointer-events:none`）；滑杆拇指 hover 放大、按钮 hover 浮起发光；加载文案"岩浆正在上升"。
6. **Easing**：CSS 过渡统一 `cubic-bezier(.22,1,.36,1)`；JS 侧数值用指数阻尼 `damp()` 逼近，有物理感。

## ⑥ 源码结构

```
volcano-3d/
├── index.src.html      # 源码 HTML（内联样式/importmap/loader 兜底）
├── index.html          # 打包产物（fx-singlefile.py 一次性生成，不可重复跑）
├── src/main.js         # 全部 3D 逻辑（ESM，import three）
├── vendor/three.module.js  # three.js 真品（667KB，从 vinyl-3d 复制）
└── README.md
```

`main.js` 分段：常量 → 自研 value noise → 渲染器/灯光 → 地面 → 火山锥+熔岩流 shader → 火山口（内壁/熔岩池/光晕）→ 程序化 sprite 纹理 → 熔岩粒子池 → 烟柱 → 星空 → 状态 → 交互（滑杆/大喷发/昼暮/拖拽）→ 主循环。

## ⑦ 重建方式

```bash
cd ~/workspace/fx-lab/volcano-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py volcano-3d
```

- `fx-singlefile.py` 为一次性单向打包：**禁止对已打包的 index.html 重复跑**（importmap 已是 data:URL）。改 `src/` 后重建一律先 `cp index.src.html index.html` 再跑脚本。
- 本机 headless Chromium 禁 `file://` ES module 直引 —— 验证一律用打包后的 `index.html`。

## ⑧ 移动端说明

- 390×844 实测：标题/控制面板纵向堆叠不错乱，滑杆 `touch-action:pan-x` 可拖，按钮 ≥44px 触控区，`side-tag`/`hint` 隐藏让位。
- 相机/粒子数未按设备降级：3000 粒 CPU 更新在主流手机可跑；若低端机卡顿，可将 `PMAX` 降至 1500、`SMOKE_N` 降至 24。
- `prefers-reduced-motion`：关闭震屏，加载动画静止。

## ⑨ 踩坑记录

1. **完成态选择器必须带 `html.js` 前缀**：`[data-intro]{opacity:0}` 若无前缀，无 JS 时内容永久隐藏。本模板 loader 兜底用独立内联 `<script>`（非 module），3.8s 强制 `done` + `is-in`，模块成败都不影响。
2. **粒子初速白色问题**：`C_HOT` 初值 `[1.0,0.80,0.32]` 经 ACES tone mapping 后发白，偏离"亮橙"叙事 → 改为 `[1.0,0.62,0.20]`。
3. **桌面端控制栏换行遮挡 hint**：`flex-wrap:wrap` 在 1280px 下把"大喷发"按钮挤成纵向三字 → 桌面端强制 `nowrap` + `flex-shrink:0`，hint 上调至 136px。
4. **`pkill -f` 自杀坑**：pattern 字面出现在本 shell 命令行（如 `pkill -f "meta-chromium/chrome"` 且命令行含该路径）会杀掉自己 → 一律用括号写法 `pkill -f "[m]eta-chromium/chrome"`，且 pkill 与含字面路径的命令分两次执行。
5. **高负载下 hcshot 误报**：系统 load 20+ 时 Chrome 启动慢，hcshot 固定 3s 等待报 `fetch failed` —— 不是页面问题。改用带轮询重试的副本脚本（`/tmp/hcshot-patient.js`），load 回落后一次通过。
6. **熔岩流 shader 阈值**：`smoothstep(0.60,0.92)` 时山体近半被熔岩覆盖、岩石质感丢失 → 收紧到 `(0.64,0.94)`，只留条带状流纹。
