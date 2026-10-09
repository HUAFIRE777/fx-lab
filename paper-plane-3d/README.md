# paper-plane-3d · 纸飞机飞行

huafire3d fx-lab — original implementation。纸飞机沿云中岛屿航线巡航，拖着粒子尾迹；按住拖拽蓄力、松开亲手把它掷出去，飞完自动回航。

## 参考与借鉴点

- 对标：旅行品牌广告与 404 页面里常见的纸飞机意象（机票/远方/心愿）。
- 只学了三个手法：① 折纸质感（三角面片 + 折痕线表现纸的折叠）；② 尾迹（飞机身后拖一条渐隐的光带/粒子）；③ 抛物线飞行（掷出后先扬后落的弧线）。
- 代码全部原创：飞机几何、航线样条、尾迹粒子 shader、投掷物理均为本模板手写，未复制任何第三方纸飞机实现。

## 动效拆解

1. **折纸飞机**：机头(+Z)到机尾的三角面片拼出经典纸镖造型——左右机翼各一片大三角、中央一条垂直龙骨、尾翼一小片夕阳橙折角；机翼边缘用 `EdgesGeometry` 画折痕线；`DoubleSide` 纸质材质。
2. **机翼扑动**：左右机翼各挂一个 pivot，绕机身纵轴做小幅反相扑动（巡航轻颤 0.10 rad / 投掷急拍 0.30 rad）。
3. **环岛航线**：8 个控制点的闭合 Catmull-Rom 样条穿过 7 座云中岛屿；飞机朝向取样条切线，转弯处按切线变化率做压坡滚转（bank）。
4. **粒子尾迹**：160 粒循环池，机尾每帧播撒，自定义 shader 按寿命做大小/透明/白→橙渐变；投掷时播撒量 ×3。
5. **投掷交互**：canvas 上 pointerdown 开始蓄力（力度环 + 方向箭头），pointerup 按拖拽向量换算成世界方向发射；柔和重力 + 空气阻尼飞 4.5 秒后进入回航，追上幽灵航点后无缝切回巡航。
6. **白天 / 夜航**：一整套配色插值（天空穹顶 shader、雾、海、太阳→月亮、云染色、灯光），夜航淡入 320 颗星星、岛屿信标灯亮起。
7. **环境**：天空穹顶渐变 shader、海面、14 朵程序化柔边云（canvas 纹理）缓慢漂移、相机跟随 + 指针视差 + 极慢环绕。

## 配置参数表

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `CRUISE_V` | main.js | 3.4 | 巡航线速度（单位/秒），航速档 ×0.7/×1/×1.5 |
| `TRAIL_N` | main.js | 160 | 尾迹粒子池大小 |
| 投掷初速 | `endDrag` | 5 + power×13 | power = 拖拽像素 / 380，上限 1 |
| 投掷重力 | tick thrown | 2.1 | 柔和下坠，非真实重力 |
| 自由飞行时长 | tick thrown | 4.5s | 超时或速度 < 2.2 即回航 |
| 回航追击速度 | tick return | 8 | 追上幽灵航点（<0.7）切回巡航 |
| loader 兜底 | main.js 末尾 | 3800ms | 首帧 10 帧完成态 + 3.8s 强制完成态 |
| 相机跟随阻尼 | tick | 0.12 | 跟随飞机位置的 damp 系数 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"纸飞机飞行"一个主视觉，无多余装饰动效。
2. **配色**：纸白 `#F5F1E8` + 天空蓝 `#7FB8E8` + 夕阳橙 `#F0974B`，夜航转深蓝系；无彩虹渐变。
3. **字体**：中文标题衬线（Songti SC/STSong/Noto Serif SC），英文小字 0.5em 大字距。
4. **文案**：真实感短句（"把心愿折进风里，它知道要往哪儿飞"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG 噪点覆盖层（pointer-events:none）；折痕线；信标灯；力度环蓄力 UI。
6. **easing**：界面过渡统一 `cubic-bezier(.22,1,.36,1)`；按钮 hover 用弹性 `cubic-bezier(.34,1.56,.64,1)` 微交互。

## 源码结构

```
paper-plane-3d/
├── index.src.html      # 源码：内联样式 + importmap(./vendor/three.module.js) + UI 骨架
├── index.html          # fx-singlefile.py 一次性打包产物（不手改、不重复打包）
├── src/main.js         # 全部逻辑（ESM，import * as THREE from 'three'）
├── vendor/
│   └── three.module.js # three 真品 667KB（从 vinyl-3d 复制）
└── README.md
```

main.js 内部分节：配色常量 → 状态 → 渲染器 → 灯光 → 天空穹顶/海/星/日月 → 云 → 岛屿 → 纸飞机 → 航线 → 尾迹 → 投掷交互 → 控制项 → 朝向/压坡 → 主循环 → 完成态。

## 重建方式

```bash
cd ~/workspace/fx-lab/paper-plane-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py paper-plane-3d
```

注意：`fx-singlefile.py` 是一次性单向打包，禁止对已打包的 `index.html` 重复跑；改 `src/` 或 `index.src.html` 后重走上面三步。

## 移动端说明

- 投掷手势走统一 Pointer Events（pointerdown/move/up），触屏可用；canvas `touch-action:none` 防滚动抢手势。
- 640px 以下：标题字号/字距收缩、说明文案收窄、右侧圈数标签隐藏、hint 隐藏、控制栏收紧换行。
- 按钮最小 44px 触击区；`touch-action:manipulation` 防双击缩放。

## 踩坑记录

1. **滚转叠加写错**：初版 `orientAlong` 里把阻尼计算和 `rotateZ` 写成了一行四则混杂表达式，滚转量完全不对。教训：阻尼→存值→旋转三步分开写，一行只干一件事。
2. **环境光引用**：曾用 `scene.children[0]` 取 AmbientLight 调夜航亮度，顺序一变就崩。改为命名变量 `ambLight` 持有引用。
3. **投掷方向换算**：屏幕拖拽向量转世界方向时，记得用相机基向量（`matrixWorld.extractBasis`）分解，并给 -Z（视线反方向）加一点纵深分量，否则飞机只在屏幕平面里平移、没有"飞出去"的感觉。
4. **回航衔接**：投掷结束后直接把飞机位置 lerp 回航线会有"瞬移感"。做法：幽灵航点 `tGhost` 在投掷期间照常推进，回航时飞机主动追过去，距离 < 0.7 才切回巡航，过渡自然。
5. **夜航配色**：太阳圆盘和光晕是同一个 `sunGroup`，夜航时只改颜色（橙→纸白）当月亮用，不用另建月亮，省一次 draw call 思路但主要是省代码。
