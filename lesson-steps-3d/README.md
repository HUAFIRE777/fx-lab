# FX·LAB — lesson-steps-3d 课程步骤页（原创实现）

> `huafire3d fx-lab — original implementation`
> 纸白底的课程步骤页：一颗 3D 发光进度珠沿左侧轨道物理滚动，右侧步骤卡片 3D 翻转入场。全部代码从零编写，零外部依赖、零外部模型。

## 在线预览

双击 `index.html` 即可（单文件，CSS/JS/Three.js 全内联，无需服务器，断网可开）。

## 参考与复现手法

没有复制任何网站的源码。研究过的公开手法（均为通用模式，代码全部自己重写）：

1. **Stripe docs 式步骤导航**：左侧纵向轨道 + 步骤节点，点击/键盘/滚轮切换，当前步骤高亮。学的是"轨道即导航"的信息架构。
2. **Linear 式进度细节**：进度有"物理感"——本模板把进度做成一颗会滚的 3D 珠子，滚动距离越远用时越长（`expo.out` 收尾像刹车），滚转角度 = 位移/半径，物理上"滚"而不是"滑"。
3. **卡片 3D 翻转入场**：父容器 `perspective:1400px`，旧卡 `rotateX(38°)` 翻出，新卡 `rotateX(-52°)` 翻入 + 内部元素 stagger 升起。

## 动效拆解（一页只讲一个核心动效）

核心动效 = **3D 发光进度珠沿轨道物理滚动**：

- 珠子：Three.js 二十面体（`flatShading`）+ 靛蓝自发光材质 + 跟随点光源 + 加色混合光晕精灵。
- 拖尾：12 个光晕精灵沿最近 420ms 的历史位置排开，老位置淡出——只在运动时可见。
- 滚动：GSAP `expo.out`，时长 = 480ms + 170ms×跨越步数；渲染循环里按 `rotation.z -= dy / R` 滚转，另带轻微呼吸缩放。
- 卡片翻转是配角：切换步骤时旧卡翻出、新卡翻入，内部标题/正文/标签 stagger 上升。
- 轨道填充线（靛蓝渐变）高度同步动画到当前节点。

## 配置参数（`src/config.js`）

- `PALETTE`：纸白 `#FAFAF8` / 墨 `#1A1A1A` / 靛蓝 `#3B5BFD`（全页只用这三色）
- `MOTION.beadBaseMs / beadPerStepMs`：珠子滚动基础时长与每步追加
- `MOTION.flipOutMs / flipInMs`：卡片翻转时长；`wheelLockMs`：滚轮节流
- `COURSE`：品牌/课程标题/副标题；`STEPS[]`：`no / short / title / body[] / meta[]`——换课程只改这里

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"进度珠滚动"一个动效，卡片翻转是配角，无多余装饰动画。
2. **配色**：纸白/墨/靛蓝三色定死，渐变只出现在轨道填充与光晕，无彩虹。
3. **字体**：系统字体栈；标题 30–46px / 正文 15.5px / 标签 12px，字距用 `letter-spacing` 分层（品牌 .22em、标签 .3em）。
4. **文案**：真实课程《光线追踪，五步入门》，每步 2–3 句人话讲解，无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG 噪点、加载态（脉冲圆点）、节点/按钮 hover 上浮、珠子呼吸。
6. **easing**：滚动 `expo.out`、翻转 `power2.in → expo.out`、stagger `power3.out`，无默认 linear。

## 源码结构

```
lesson-steps-3d/
├── index.html            # 单文件成品（附件发出这个）
├── index.template.html   # 打包前源码（改结构改这里）
├── styles.css            # 设计系统源码
├── build.py              # 重建脚本：template → index.html → 单文件打包
├── vendor/               # three.module.js / gsap.min.js（开发引用，打包时内联）
├── src/
│   ├── config.js         # 全部可调参数（课程/步骤/节奏）
│   ├── bead.js           # 3D 进度珠（Three.js 场景 + 拖尾）
│   └── main.js           # 入口：轨道/卡片/键盘/滚轮接线
└── README.md
```

## 完成态可达性审计（CSS 先隐藏等 JS 显示）

- 隐藏守卫：`html.js .reveal { opacity:0 }`，`.js` 类由 `main.js` 第一行加上——无 JS 时内容照常可见。
- 显示路径：`init()` → 首帧 `layout()` 后 `goTo(0)` → `body.loaded`；另有 3 秒 `setTimeout` 兜底强制加 `loaded`。
- `prefers-reduced-motion` 下直接显示、无翻转动画。

## 重建方式

```bash
cd ~/workspace/fx-lab/lesson-steps-3d && python3 build.py
```

## 移动端说明

≤860px 时轨道变为顶部横向步骤条（横滑），WebGL 珠子隐藏（DOM 圆点高亮代替），卡片全宽；点击/上下键切换保留。无头探针只验 console 零 error，不验渲染。
