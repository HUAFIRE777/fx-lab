# submarine-3d · 潜水艇深潜

透过圆形铆钉舷窗看深海：浮游颗粒漂浮、座头鲸剪影带着荧光缓缓游过，点击舷窗发射声呐，下潜越深光线越暗、水母与鮟鱇鱼相继登场——为海洋馆 / 探险品牌 hero 而生的深海场景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：深海纪录片舷窗镜头（submarine porthole footage）。
- **学的三个手法**：① 舷窗构图——圆形开孔 + 铆钉舱壁，把"看海"变成"在船舱里看海"；② 深度压暗——越深环境光越弱、雾越浓，深渊只剩生物自带的光；③ 声呐回波——点击后同心圆扩散、延迟亮起的回波光点。
- **代码原创声明**：以上只学手法。鲸鱼/鱼群/水母/鮟鱇鱼程序化几何、声呐环、深度环境映射、舷窗遮罩 CSS 全部手写原创，未复制任何现成海洋特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 舷窗 | CSS radial-gradient 整页舱壁开孔（`--pr:38vmin`），inline SVG 金属圈 + JS 生成 16 颗铆钉，玻璃反光两层渐变 |
| 深海背景 | canvas 生成的纵向渐变纹理做 `scene.background`，FogExp2 随深度加浓（0.013→0.045）+ CSS `#depthdim` 压暗 |
| 浮游颗粒 | 1100 点 marine snow，下沉 + 正弦横漂，出界回卷；气泡 60 点上升循环 |
| 海面光柱 | 4 张 additive 渐变平面，顶部斜射，透明度随深度 →0 |
| 座头鲸 | 球体拉长身体 + 尾柄 + 双叶尾鳍（`fluke.rotation.x` 拍动）+ 背鳍/胸鳍，26 颗荧光斑点 Points 呼吸明灭；46 米巡游往返，深度 <450m 可见 |
| 银鱼群 | InstancedMesh 42 条锥形鱼，椭球编队 + lissajous 中心路径，逐条相位摆动，朝向沿速度 |
| 月形水母 | 半球伞盖 + 内核辉光 + 7 条触手 Line（逐帧正弦摆动），伞盖 `scale.y` 脉动，180–850m 可见 |
| 深海鮟鱇鱼 | 剪影身体 + 头顶钓竿（stalk + 荧光 bulb + Sprite 辉光 + PointLight），钓竿摇摆，>520m 淡入 |
| 声呐 | 点击舷窗：CSS 双环扩散 + 3D RingGeometry 贴点击射线扩散 + 4 个延迟回波光点；点击窗外不响应 |
| 深度系统 | 目标深度平滑趋近（`dt*1.6`），环境光/雾/生物可见度全部映射 `k=depth/1000` |
| 相机 | 持续 ±0.55 缓慢横漂 + 俯仰呼吸，潜水艇摇摆感 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| 深度滑杆 | 0–1000m | 0 | 步进 10m；滚轮 ±50m；下潜/上浮按钮 ±120m |
| 图鉴解锁 | main.js `GUIDE` | 0/120/300/650m | 银鱼群 / 座头鲸 / 月形水母 / 深海鮟鱇鱼，达线弹 toast |
| `SNOW_N` / `BUB_N` | main.js | 1100 / 60 | 颗粒与气泡池上限 |
| 鲸鱼巡游 | `whaleState` | 3.4 m/s | 往返 -46↔46，间歇 6–16s |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--bg:#04121F` 深海 / `--sea:#9FD8FF` 舷窗光 / `--glow:#6BFFD8` 生物荧光 |
| 舷窗 | `--pr/--pcx/--pcy` | 38vmin / 50% / 44% | CSS 与 JS 共用同一组变量，改一处全同步 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——舷窗里的深海。无多余装饰模块。
2. **配色**：严格 3 色（#04121F / #9FD8FF / #6BFFD8），禁用彩虹渐变；荧光绿只出现在生物与图鉴点缀位。
3. **字体**：中文标题系统衬线栈（Songti SC / STSong / SimSun），英文小字大字距（.42em），层级分明；零 Google Fonts。
4. **文案**：真实感短句（"关上舱门，舷窗外是另一颗星球""有些住户只在深处开灯"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；舱壁接缝线（mask 开孔）；按钮 hover 上浮 + 光晕；滑杆 thumb hover 放大；图鉴解锁 toast 带荧光边框。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 130ms，深度趋近物理感阻尼。

## 源码结构

```
submarine-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/鲸鱼/鱼群/水母/鮟鱇鱼/声呐/深度系统
├── vendor/
│   └── three.module.js # three 真品 667KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/submarine-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py submarine-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：舷窗圆心上移（`--pcy:40%`），标题压缩至顶部，控制面板贴底全宽（图鉴两列），toast 移到舷窗上方，footer 隐藏。
- 触屏：点击舷窗发射声呐用 `click` 事件，移动端可直接点；`touch-action:manipulation` 防双击缩放；滚轮下潜桌面端有效。
- 像素比上限 2；`prefers-reduced-motion` 下相机摇摆与粒子漂移降速、CSS 动效近乎关闭。

## 踩坑记录

1. **舷窗开孔与墙体接缝的层叠**：接缝线层若与墙体同元素，repeating-linear-gradient 会透进舷窗圆内。修法：接缝单独一层，用 `mask-image: radial-gradient` 挖掉圆心，只留墙体部分。
2. **CSS 变量跨语言同步**：舷窗半径/圆心被 CSS（遮罩/玻璃/铆钉圈）与 JS（点击命中/铆钉定位）同时依赖——定死 `--pr/--pcx/--pcy` 一组变量，JS 里按同一公式 `min(vw,vh)*0.38` 计算，不许各写各的。
3. **file:// 下 ES module**：打包后 importmap 的 three 走 data:URL、main.js 已内联，无外部 module 请求，file:// 可正常跑，console 零错。WebGL 渲染细节仍以真机为准，无头只验"无报错 + 构图"。
4. **无头构图器限流导致 loader 视觉残留**：本机无头 Chromium（--disable-gpu）rAF 被限到约 1fps，CSS transition 几乎不推进——`boot()` 已执行（loader class=done）但 computed opacity 恒为 1，截图会拍到 loader 盖住场景。真机 60fps 无此问题。验收截图对策：CDP 里 `loader.style.display='none'` + 给 `[data-intro]` 补 `is-in`，只影响截图，不改页面逻辑。
