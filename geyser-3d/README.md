# geyser-3d · 间歇泉喷发

地热山谷中的间歇泉：蓄力冒泡 → 水柱冲天 → 蒸汽弥漫 → 休眠的完整周期，喷发时水雾边缘透出一道淡淡虹光——为旅游 / 地热品牌 hero 而生的地热场景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：黄石老忠实泉（Old Faithful）喷发延时摄影。
- **学的三个手法**：① 间歇周期四段式——休眠蓄力、喷发、平息，周期感来自真实泉眼的"攒力气"节奏；② 水柱形态——底部粗、中部收束、顶部散开成伞状水雾，落地处水雾贴地漫开；③ 虹光位置——只出现在水雾边缘、背光一侧的一道淡弧，不抢水柱主视觉。
- **代码原创声明**：以上只学手法。地形裂缝 shader、水粒子抛物线物理、蒸汽精灵池、周期状态机、虹光弧纹理、交互逻辑全部手写原创，未复制任何现成粒子/地形特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 地热岩地形 | 110×110 位移平面 + fragment shader：FBM 岩石颗粒、ridge 噪声裂缝（泉眼周围 90m 内）、裂缝 emissive 熔岩橙随 `uHeat` 脉动 |
| 水柱粒子 | 4200 粒子 CPU 点池，`vy=√(2gh)` 抛物线 + 重力回卷；按水柱高度算 life，alpha 随 `1-t²` 衰减；additive 混合泉水青 |
| 冒泡蓄力 | 喷发前 6 秒低速小粒子 + 每 ~1.1s 一次试探性小冲，热水盘 emissive 与岩环微颤同步 |
| 蒸汽 | 80 个 billboard 精灵池，落地水滴 10% 概率激起 + 持续环境蒸汽；上升、膨胀、sin 包络淡入淡出 |
| 虹光 | canvas 手绘弧形光晕纹理（外青白、内缘一丝暖），喷发中段 sprite 淡入、峰值透明度仅 0.16，全页只出现一次 |
| 周期状态机 | 休眠 14s → 蓄力 6s → 喷发 9s → 平息 5s，进度条实时显示；点击泉眼触发 2.8s 小喷发（独立通道） |
| 灯光 | 熔岩橙点光随 heat 0→55、泉水青点光喷发时 40；天空穹顶地平线随 heat 泛暖 |
| 相机 | 持续缓慢环绕（0.038 rad/s）+ 鼠标/触屏视差（±7m / ±4m），lookAt 水柱中部 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `level` | 喷发强度滑杆 1–10 | 6 | 水柱高度 `30+(lv-1)/9*30` 米，发射率 `420+lv*105`/s |
| `auto` | 自动循环按钮 | 开 | 关则只响应手动喷发/点击泉眼；`prefers-reduced-motion` 下默认关 |
| `WATER_MAX` | main.js | 4200 | 水粒子池上限 |
| `GRAV` | main.js | 24 | 风格化重力（非真实 9.8，保证抛物线观感） |
| `STEAM_MAX` | main.js | 80 | 蒸汽精灵池上限 |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--bg:#1A1D21` 深岩灰 / `--ink:#7FD8E8` 泉水青 / `--lava:#FF9A3D` 熔岩橙点缀 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——间歇泉喷发周期。无多余装饰模块。
2. **配色**：严格 3 色（#1A1D21 / #7FD8E8 / #FF9A3D），禁用彩虹渐变；橙色只出现在 kicker、滑杆、裂缝微光、读数点缀位；虹光是单道极淡弧形光晕 sprite，非渐变。
3. **字体**：中文标题 Noto Serif SC 衬线，英文小字大字距（.42em），层级分明。
4. **文案**：真实感短句（"地下的热水攒了半天力气，一次全喷出来给你看"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 + 光晕；滑杆 thumb hover 放大；点击提示首次交互/9s 后淡出；蓄力时岩环微颤。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 150ms。

## 源码结构

```
geyser-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/地形/水粒子/蒸汽/虹光/周期机/交互/loader
├── vendor/
│   └── three.module.js # three 真品 652KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/geyser-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py geyser-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题下移避开右上读数，控制面板贴底全宽，footer 隐藏。
- 触屏：点击泉眼小喷发直接用 `click` 事件；`touch-action:manipulation` 防双击缩放；视差走 `pointermove`，触屏拖动同样生效。
- 像素比上限 2，水粒子池与桌面共用，低端机可降 `WATER_MAX`。

## 踩坑记录

1. **虹光包络误写成自乘**：初版 `opacity = min(1, opacity + dt*0.5) * 0.16` 每帧把已压扁的值再压一次，收敛到 ~0.001 基本不可见。修法：用独立 `bowA` 0..1 包络变量，`opacity = bowA * 0.16`。
2. **60m 水柱顶部出画**：初版 FOV 50 / 半径 58 / 视线目标 y=13，最高档水柱顶被裁。修法：FOV 55、半径 74、目标 y=18，10 级顶端刚好入画。
