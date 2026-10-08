# feature-showcase-3d — Bento 功能矩阵模板

深色 bento 网格功能矩阵落地页：6 张卡片，每张配一个程序化 3D 小点缀（wireframe/粒子/波形，无外部模型），滚动进入视口 stagger 入场。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全重写）

- **Linear 的 features 页面 bento 网格**：学的三点——① 深色底 + 单一强调色 + 大量留白的克制配色；② 大卡配小字说明的信息层级（标题 17px / 描述 14.5px muted）；③ 卡片内嵌"产品感"小可视化而非装饰图。
- **Arc 浏览器的功能卡片**：学的两点——① 卡片 hover 上浮 + 边框高光的微交互；② 用编号 tag（`01 · COLLABORATE`）给矩阵节奏感。

未复制任何一方源码：布局、配色值、全部 6 个 3D widget、入场编排均为独立实现。

## 复现/原创的手法

1. **单 rAF 循环驱动多 canvas**：6 个 WebGL 上下文共享一个 `requestAnimationFrame`，不可见卡片自动暂停（IntersectionObserver），省电。
2. **滚动 stagger 入场**：`--d` CSS 变量逐卡延迟 85ms，`cubic-bezier(.22,1,.36,1)` 0.9s，物理感来自 ease-out 而非 linear。
3. **hover 加速**：卡片 hover 时对应 widget 的 `boostTarget` 提到 1.7，动画平滑加速（lerp），离开回落。
4. **程序化点缀**：旋转线框立方体簇 / 双色粒子球 / 正弦波形带 / torus knot / 雷达扫描 / 呼吸二十面体——全部 Three.js 基础几何体，无贴图无模型。
5. **降级链**：`prefers-reduced-motion` → 每卡渲染一帧静态构图；WebGL 创建失败 → 显示占位条；移动端单列 + 像素比上限 1.75。

## 参数说明（`src/config.js`）

`CONFIG.features` 数组驱动整页，字段：

| 字段 | 说明 |
|---|---|
| `span` | 桌面端 12 列网格占几列（4/5/7/12） |
| `tag` | 卡片左上角编号，如 `03 · MEASURE` |
| `title` / `desc` | 标题 / 描述（desc 支持 `<b>`） |
| `widget` | 点缀类型：`orbiters` `particles` `wave` `knot` `radar` `morph` |
| `wide` | 宽卡横向布局（canvas 左、文字右） |
| `checks` | 宽卡的 checklist（可选） |

换一套产品：只改这个数组，不用碰布局代码。

## 本地开发 / 打包

- 依赖：`vendor/three.module.js`（Three r160，本地 vendor，零外部 CDN）
- 打包单文件：`python3 ~/workspace/bin/fx-singlefile.py feature-showcase-3d`（内联 CSS/JS，three 走 data-URL importmap）
- 模型 URL：无（本模板刻意不用外部模型，保证单文件可离线打开）

## 验收记录

- [ ] 桌面端截图：6 卡渲染、配色克制、无 lorem ipsum
- [ ] 滚动：stagger 入场顺序对、可逆
- [ ] console 零报错
- [ ] 移动端（390px）：单列、无横向溢出
