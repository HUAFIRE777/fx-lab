# observatory-3d · 天文台星空

山顶天文台圆顶缓缓巡天旋转、观测缝开合透出暖光，银河横贯天际、流星不时划过，三座星座被连线点亮——为科研 / 教育品牌 hero 而生的深空场景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：高山天文台延时摄影（圆顶巡天 + 银河拱桥）。
- **学的三个手法**：① 天文台经典形态——圆柱基座 + 半球穹顶 + 顶部观测缝，快门板沿缝滑动开合；② 银河的"带 + 暗尘"结构——亮带中央压一条暗尘带，星云才有立体感；③ 星座标注——星点连线 + 悬停浮签，天文馆展板的常用做法。
- **代码原创声明**：以上只学手法。GLSL FBM 银河、星点闪烁 shader、穹顶/快门几何、流星拖尾、星座投影、交互逻辑全部手写原创，未复制任何现成天文特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 银河 | 天空球 fragment shader：绕法线大圆的高斯亮带 + 5 阶 FBM 星云团块 + 暗尘带压暗 |
| 星空 | 3200 点 Points 自定义 shader，`aPhase` 逐星闪烁（0.55+0.45·sin），亮星加大尺寸 |
| 天文台 | 圆柱基座（5 扇暖色窗光）+ 半球穹顶（留观测缝缺口）+ 38° 仰角望远镜 |
| 穹顶巡天 | 穹顶组 0.05 rad/s 缓慢旋转；快门弧板沿缝滑动，开合指数趋近（物理感） |
| 缝隙暖光 | 加色渐变光带 + PointLight，强度随开合度联动（0→60） |
| 流星 | 26 颗对象池，canvas 横向渐变拖尾贴片；屏幕投影算拖尾朝向，每 2.5–6.5s 自动一颗 |
| 流星雨 | 点击夜空 / 按钮触发 10 颗连发（0.09s  stagger） |
| 星座 | 北斗七星 / 猎户座 / 天鹅座：天球切平面投影布点，LineSegments 连线 + 悬停浮签 |
| 相机 | 持续 0.035 rad/s 环绕 + 鼠标视差（lookAt 目标偏移 ±3.2） |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| 穹顶开合 | 滑杆 0–100 | 75 | 快门旋转角 `open×(2×SLIT+0.06)`，暖光强度联动 |
| 巡天 | 巡天按钮 | 开 | 穹顶组旋转 0.05 rad/s；`prefers-reduced-motion` 下默认关 |
| 流星雨 | 流星雨按钮 / 点击夜空 | — | 10 颗连发，间隔 0.09s |
| `STAR_N` | main.js | 3200 | 星点数量 |
| `METEOR_POOL` | main.js | 26 | 流星对象池上限 |
| `SLIT` | main.js | 0.22 | 观测缝半角（弧度） |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--bg:#05070F` 深空 / `--ink:#DCE8FF` 星光 / `--warm:#FFC46B` 仅穹顶缝隙与窗光 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——深夜的天文台。无多余装饰模块。
2. **配色**：严格 3 色（#05070F / #DCE8FF / #FFC46B），禁用彩虹渐变；暖色只出现在穹顶缝隙、窗光、kicker 与悬停高亮。
3. **字体**：中文标题系统衬线（Songti SC / STSong / SimSun），英文小字大字距（.42em），层级分明。
4. **文案**：真实感短句（"圆顶缓缓转开，银河正在头顶值班"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 + 暖光晕；滑杆 thumb hover 放大；星座悬停浮签跟随鼠标；点击提示首次流星雨后淡出。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，快门开合指数趋近，intro stagger 140ms。

## 源码结构

```
observatory-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：天空/星/天文台/流星/星座/交互/loader
├── vendor/
│   └── three.module.js # three 真品 652KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/observatory-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py observatory-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题下移避开右上读数，控制面板贴底全宽，footer 隐藏。
- 触屏：点击夜空触发流星雨用 `click` 事件，移动端可直接点；`touch-action:manipulation` 防双击缩放。
- 星座悬停在触屏上不可用，改为点击星点也可触发浮签（raycast 同链路）。
- 像素比上限 2，星点 3200 与桌面共用，低端机可降 `STAR_N`。

## 踩坑记录

1. **球面 phi 语义**：`SphereGeometry` 的 phi=0 方向是 -X，不是 +Z——观测缝初始朝向用 `domeGroup.rotation.y = π/2` 摆正对准初始机位，截图验证为准。
2. **快门与穹顶 z-fighting**：快门弧板半径取 5.66（穹顶 5.6 外侧 0.06），滑到穹顶外层藏起，开合无闪烁。
3. **无头 file:// 下 ES module**：打包后 importmap 的 three 走 data:URL、main.js 已内联，无外部 module 请求，file:// 可正常跑，console 零错。但 WebGL 渲染细节仍以真机为准，无头只验"无报错 + 构图"。
4. **FogExp2 会吃掉远距物体**：`FogExp2(0.0042)` 在 900 距离处 fogFactor≈1——流星、星座线、星座顶点（MeshBasic/LineBasic 默认 `fog:true`）被雾化到完全不可见，而 ShaderMaterial 的星空/银河不受影响。修法：所有天球距离（~900）的材质一律 `fog:false`，雾只留给地面/山体。
5. **天球切平面投影的偏移量必须是弧度级**：`patch()` 里 `c.clone().addScaledVector(u, p[0]*s)` 再 `normalize()`——若 `p*s` 相对单位球 |c|=1 不够小（如 2.2×3.4=7.48），归一化后星点被甩飞到全天，星座线变成横跨天球的巨弧。修法：`s` 取弧度/单位（0.020–0.022，相对单位球 <<1），星座张角约 8–12°。
6. **NDC Y 别取反两次**：`mouse.ty` 已是 `-((y/h)*2-1)`，再 `pointerNDC.set(tx, -ty)` 会翻转回来导致 hover raycast 永远 miss。click 处理器里写的是对的，pointermove 照抄一份时多翻了一次。
7. **hover 验证别用地毯网格**：mouse 视差会让相机在连续 dispatch 间漂移，静态像素估计 + ~10px 热区必 miss。正确做法：页内把 hit 点反投影回屏幕（需临时暴露 camera/raycaster，验完删除），一次 dispatch 命中。
