# FX·LAB — timeline-lesson-3d 课程章节横轴（原创实现）

> `huafire3d fx-lab — original implementation`
> 深黑底金线的时间线：一整条章节轴可横向拖拽（带惯性），节点激活时水波纹扩散 + 金色解锁粒子爆发，已学完的章节盖上打勾印章。全部代码从零编写，零外部依赖、零外部模型。

## 在线预览

双击 `index.html` 即可（单文件，CSS/JS/Three.js 全内联，无需服务器，断网可开）。

## 参考与复现手法

没有复制任何网站的源码。研究过的公开手法（均为通用模式，代码全部自己重写）：

1. **MasterClass 课程章节条**：横向章节轴 + 当前章节卡片。学的是"轴即目录"的信息架构——拖动轴换章，卡片上浮展示简介。
2. **惯性拖拽**：Pointer Events 记录速度，松手后按 `0.94` 衰减滑行，速度够大时多滑一格再吸附（`expo.out` 900ms）。
3. **激活反馈三件套**：节点放大呼吸 + 3 道错开 130ms 的水波纹 + 170 粒金色粒子爆发（重力下落、加色混合）。

## 动效拆解（一页只讲一个核心动效）

核心动效 = **可拖拽的章节时间线 + 节点激活反馈**：

- 时间线：Three.js 程序化几何——暗金底线、亮金进度线（长度随章节动态重建）、刻度、圆环节点、章节编号精灵。
- 拖拽：`pxToWorld` 由相机视锥实时换算，跟手 1:1；两端橡皮筋限位；松手吸附最近节点。
- 激活：当前节点圆环放大 1.18 倍并呼吸（`sin` 驱动，与 GSAP tween 用 `isTweening` 互斥）；3 道 Ring 波纹扩散（scale 0.4→3.8、透明度→0）；170 粒粒子向上锥形爆发。
- 印章态：`k < active` 的节点弹出 Canvas 绘制的金色印章精灵（圆角方章 + 米白对勾，`back.out` 弹出）。
- 章节卡片：切换时 `y:46→0` 上浮 + 内部元素 stagger；状态标签（已完成/学习中/未解锁）随进度变。

## 配置参数（`src/config.js`）

- `PALETTE`：深黑 `#0E0E12` / 金 `#C9A86A` / 米白 `#F5F1E6`（全页只用这三色）
- `MOTION.spacing`：节点间距；`snapMs`：吸附时长；`inertiaDamp`：惯性衰减；`rippleMs`：波纹时长；`burstLife`：粒子寿命
- `COURSE`：品牌/副标题；`CHAPTERS[]`：`no / title / desc / meta[]`——换课程只改这里

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"拖拽时间线"一个动效；粒子、波纹、印章都是节点激活的即时反馈，无常驻装饰动画。
2. **配色**：深黑/金/米白三色定死，金色只出现在时间线、印章、强调文字，无彩虹渐变。
3. **字体**：系统字体栈；章节标题 24–32px / 简介 15.5px / 标签 12px，`letter-spacing` 分层（品牌 .22em、提示 .24em）。
4. **文案**：真实课程《光影大师课 · 手机摄影》六章，每章一句话人话简介 + 课时/时长，无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG 噪点、加载态（金色脉冲）、按钮 hover 上浮、顶部金色进度发丝线、背景缓漂尘埃。
6. **easing**：吸附 `expo.out`、印章 `back.out(1.8)`、卡片上浮 `expo.out`、stagger `power3.out`，无默认 linear。

## 源码结构

```
timeline-lesson-3d/
├── index.html            # 单文件成品（附件发出这个）
├── index.template.html   # 打包前源码（改结构改这里）
├── styles.css            # 设计系统源码
├── build.py              # 重建脚本：template → index.html → 单文件打包
├── vendor/               # three.module.js / gsap.min.js（开发引用，打包时内联）
├── src/
│   ├── config.js         # 全部可调参数（课程/章节/节奏）
│   ├── scene.js          # Three.js 时间线场景（拖拽/波纹/粒子/印章）
│   └── main.js           # 入口：DOM 卡片 + 拖拽/点击/滚轮/键盘接线
└── README.md
```

## 完成态可达性审计（CSS 先隐藏等 JS 显示）

- 隐藏守卫：`html.js .reveal { opacity:0 }`，`.js` 类由 `main.js` 第一行加上——无 JS 时内容照常可见。
- 显示路径：`init()` 同步建场景 → `goTo(0)` → `body.loaded`；另有 3 秒 `setTimeout` 兜底强制加 `loaded`。
- WebGL 不可用时：`TimelineScene` 构造失败 → `body.nogl`，canvas/提示隐藏，章节卡片照常可点（`console` 无报错）。
- `prefers-reduced-motion` 下：无惯性多滑、无粒子，直接吸附。

## 重建方式

```bash
cd ~/workspace/fx-lab/timeline-lesson-3d && python3 build.py
```

## 移动端说明

canvas `touch-action:none` 横向拖拽跟手；卡片全宽；≤860px 时时间线高度降为 38vh。无头探针只验 console 零 error，不验渲染。
