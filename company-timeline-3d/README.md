# 公司 3D 时间线 · company-timeline-3d

<!-- huafire3d fx-lab — original implementation -->

公司介绍「发展历程」页模板。纵向滚动叙事，一个核心动效：**中央发光进度线随滚动生长**，事件卡片左右交替 3D 翻转入场。

## 参考与原创边界

- 手法参考：DNEG 官网 About 页的滚动叙事节奏（滚动驱动故事、分段高潮），以及经典交错时间线版式（中央轴线 / 大年份描边字 / sticky 年份导航）。只看了效果、学了手法。
- 代码 100% 原创重写：进度线计算、卡片翻转、徽章 3D 图标、懒加载调度均为独立实现。未下载、未复制任何参考站源码。
- 3D 图标（火箭/金币/地球/奖杯/大楼/星）全部由 Three.js 基础几何体程序化搭建，无外部模型文件。

## 手法拆解

| 手法 | 实现 |
|---|---|
| 发光进度线 | `.rail-fill` 高度 = 视口 62% 线扫过时间线的比例，scroll + rAF 更新；往回滚自动缩回（可逆） |
| 卡片 3D 翻转入场 | `perspective:1400px` 容器内，卡片初态 `rotateY(±22deg)+translateY`，IntersectionObserver 加 `.is-in` 触发 `cubic-bezier(.22,1,.36,1)` 回正 |
| 大年份描边字 | `-webkit-text-stroke` 1.5px 金色描边，透明填充，字号 clamp 随视口 |
| sticky 年份导航 | `position:sticky` 年份药丸，当前年份由徽章中心距视口 55% 线最近者决定，点击 `scrollIntoView(center)` 跳转 |
| 3D 徽章 | 72px 圆形徽章内嵌 56px WebGL 画布；懒挂载（进视口前 200px 才建上下文）、离视口暂停渲染、DPR 上限 1.5；首帧渲染前显示脉冲加载环 |
| 手工质感 | 全局 SVG 噪点（opacity .055）+ hero vignette + 卡片 hover 上浮微交互 |

## 参数（改这里即可复用）

`src/config.js` 的 `CONFIG`：

- `brand / kicker / title / subtitle / outro`：页头页尾文案
- `accent`：全页唯一的强调色（默认金 `#e0a83e`），进度线/描边字/徽章/徽章光统一跟随
- `events[]`：`{ year, tag, title, desc, stat:{value,label}|null, icon }`
  - `icon` 可选：`rocket | coin | globe | trophy | tower | star`
  - 增删事件只改数组，版式/导航/进度自动适配

## 降级

- `prefers-reduced-motion`：静态普通列表，无翻转、无 3D、无平滑滚动
- WebGL 不可用：徽章降级为金色圆点，阅读不受影响
- 移动端（≤860px）：单列，时间线贴左，徽章 56px

## 构建

```bash
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py company-timeline-3d
```

`index.html` 为最终单文件交付物（双击可看，零外部依赖）。
