# 价值观 3D 滚动页（culture-values-3d）

<!-- huafire3d fx-lab — original implementation -->

纵向滚动驱动中央 3D 粒子几何体形变（球→立方→圆环→锥体）、每屏讲一个价值观的公司文化页。双击 `index.html` 即可看（单文件，断网可开，零外链）。

参考来源：Stripe / Airbnb 文化页的"滚动叙事"结构（滚动进度驱动内容与视觉同步变化）只学了叙事手法；粒子几何体形变（表面采样 + 球面角排序点对应 + smootherstep 插值）为本模板原创实现，代码全部重写，未复制任何第三方源码。

## 动效拆解

| 手法 | 做法 | 为什么 |
|---|---|---|
| 几何体表面采样 | 球/立方/圆环/锥体各采样 3800 个表面点（`src/morph.js`，mulberry32 定种子） | 同一数量级点云，形变时点对点插值；定种子保证每次打开形态一致 |
| 球面角排序点对应 | 四组点云按 (theta, phi) 排序后再配对 | 第 k 个点大致同方位，morph 时粒子沿短路径滑行，不会满天乱飞 |
| 滚动→形变映射 | `scrollY / (scrollHeight - vh)` → t ∈ [0,3]，段内 smootherstep 缓动 | 滚动即形变进度，停在两屏之间时几何体停在中间态，有"捏橡皮泥"感 |
| Lenis 平滑滚动 | `lerp: 0.09` + `autoRaf` | 滚动本身有惯性，形变过渡不生硬 |
| 自转 + 呼吸浮动 | `rotation.y += dt*0.12`，`rotation.x/z` 用 sin 缓动 | 几何体是"活"的，但转速慢到不抢文案 |
| 文案 active 切换 | 四屏按滚动段切换 `.active`（opacity/translateY 过渡） | 未激活屏保留 0.26 透明度，JS 挂了也不白屏消失 |
| 圆点导航 | 右侧 4 圆点，点击 Lenis 平滑滚到对应屏 | 滚动之外的第二入口 |
| 加载态 | 进度条 + 百分比，首帧渲染后 350ms 淡出移除 | 程序化 3D 无外部资源，加载态只为仪式感 |

## 参数说明（`src/config.js`，改完即生效）

- `brand` / `brandSub` — 顶栏品牌名 / 副标题
- `palette.{paper,clay,ink}` — 暖白 / 陶土 / 墨三色
- `points` — 粒子数（默认 3800）；`pointSize` — 粒子基础大小（世界单位 0.12，`sizeAttenuation` 下屏幕约 8px，按视口缩放；勿写成像素级大数，否则单粒子被放大上千像素、无头渲染卡死）
- `values[]` — 每屏 `{title, en, shape, desc}`：标题/英文/几何体名/短句，加减屏只改这里
- `hint` — 首屏滚动提示文案；`closing` — 末屏结尾行文案

## 质量自查（"不像 AI 写的"六项）

① 整页只讲"滚动驱动 3D 几何体形变"一个核心动效；② 配色 3 色：暖白 #faf6ef + 陶土 #c1502e + 墨 #201a15，无渐变堆砌；
③ 字号/字距/层级：大标题 clamp(64px,9vw,124px) 800 粗 + .1em 字距，编号行 .3em 字距，描述行 2 倍行高；
④ 无 Lorem、无 emoji 列表（短句均为真实感中文："坏消息先说，数字不说谎，从不骗自己。"）；
⑤ 手工细节：radial 暗角、feTurbulence 胶片噪点、滚动提示小线条循环下坠、圆点 hover 放大、加载进度条；
⑥ easing：文案过渡与提示动画统一 `cubic-bezier(.2,.8,.2,1)`，形变段内用 smootherstep（非 linear）。

## 源码结构

```
culture-values-3d/
├── index.html            # 单文件成品（附件交付用，由 template + singlefile 生成）
├── index.template.html   # 开发模板（改这里，再打包）
├── src/
│   ├── config.js         # 中央参数（文案/配色/粒子数）
│   ├── morph.js          # 几何体采样 + 球面角排序 + smootherstep 插值
│   ├── ui.js             # DOM 搭建（顶栏/四屏/圆点/加载态）
│   └── main.js           # three 场景 + Lenis + 滚动映射 + 主循环
├── vendor/               # three.module.js + lenis.min.js（本地）
└── README.md
```

改完模板后重新打包：`cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py culture-values-3d`
（注意 singlefile 是单向的，不要对已打包的 index.html 重复跑。）

## 移动端

几何体居中（桌面端偏右给文案让位）、标题字号降到 clamp(52px,15vw,76px)、圆点导航内收；
`prefers-reduced-motion` 下文案全部显示、关闭自转只保留滚动形变。
