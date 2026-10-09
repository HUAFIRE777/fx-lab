# tornado-3d · 龙卷风

EF0–EF5 风力可调的龙卷风气象可视化：螺旋粒子漏斗云柱 + 卷起的碎片杂物 + 地面扩散尘环 + 翻滚云底，拖动滑杆亲手把风加到最大。

## 参考对象及借鉴点

- 气象可视化（NOAA 风暴教育片）：只借"漏斗上宽下窄、地面尘脚外扩"的形态语言与 EF 等级叙事框架。
- 电影感灾难镜头（《龙卷风》式跟拍）：只借"低机位环绕 + 开场由远及近推进"的镜头手法。
- 代码全部原创重写：漏斗为 GPU 顶点着色器螺旋粒子，云底为 fbm 噪声 shader，未复制任何现成实现。

## 动效拆解

1. **漏斗粒子柱**（9000 点，ShaderMaterial）：每粒子含高度/初相/径向抖动/速度抖动四属性；顶点着色器按 `profile(y)`（顶部云底扩张 5.6、中部收窄 1.5、地面尘脚 +2.6）算半径，角速度按 `1/r^0.72`（角动量守恒观感，核心转得快），高度做 `fract` 上升循环，首尾用 edge fade 藏住循环跳变；整组再做正弦摆动（x/z 位移 + 轻微倾斜）。
2. **碎片 debris**（InstancedMesh 120 灰 + 26 橙色余烬）：CPU 每帧更新，集中在漏斗下 2/3，轨道半径复用同一 profile 函数，翻滚欧拉角 + 上下浮动。
3. **地面尘环**（5 个 RingGeometry）：错峰循环扩张 2→17 倍、透明度衰减，模拟尘土外扩。
4. **云底**（圆柱 + fbm 噪声 shader）：4 阶 fbm 缓慢滚动，顶部淡出；随机 3.5–9 秒一次橙色尘光闪烁（云 uniform + 点光源 + 全屏 flash 层三重联动，180ms 双脉冲感）。
5. **开场**：相机从 46 半径阻尼推进到 27，一镜到底。
6. **慢动作**：timeScale 目标 0.12，指数插值过渡。

## 配置参数

| 参数 | 说明 |
|---|---|
| `EF_LEVELS[0–5]` | 每级 density（粒子绘制比例）/ spin（转速）/ rise（上升速度）/ width（漏斗宽度）/ debris / ring / flash 共 7 维联动 |
| `FUNNEL_H = 14` | 漏斗高度（世界单位） |
| `FUNNEL_N = 9000` | 漏斗粒子总数（EF5 全开） |
| 滑杆 | EF0–EF5，目标参数指数插值（`1-exp(-dt*3.2)`）过渡，有物理感 |
| 慢动作开关 | timeScale 1 → 0.12 |
| 重置视角 | theta/phi/radius 回默认值（阻尼） |
| 视角 | 拖拽旋转（方位/俯仰，俯仰钳制 0.52–1.46）、滚轮/双指缩放（13–52）、触屏点对点拖拽 |

EF 风速对照：EF0 105–137 / EF1 138–178 / EF2 179–218 / EF3 219–266 / EF4 267–322 / EF5 ＞322 km/h。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"龙卷风"一个主视觉，无多余装饰元素；控制面板只留 3 个控件。
2. **配色**：严格三色 #1A1D21（风暴灰）/ #8A9199（尘灰）/ #FF7A1A（警示橙），标题雾白仅为文字可读性；无彩虹渐变。
3. **字体**：标题 40–68px / 字距 .12em / 英文副标 mono .42em / 说明文 14px 行高 1.9，三级层级分明。
4. **文案**：无 Lorem ipsum、无 emoji 列表；短句全部真实感（"EF5 的风速超过 322 km/h —— 足以把一辆汽车抛向半空"，各级破坏描述均为真实 EF 对照）。
5. **手工细节**：vignette 暗角 + SVG 噪点颗粒动画 + 加载态（"正在聚集风暴"旋转环）+ 滑杆 thumb 悬停放大发光 + EF 切换数字 bump 动画 + 开关切换橙光。
6. **easing**：全站 `cubic-bezier(0.16,1,0.3,1)`；EF 参数/相机/慢动作均为指数阻尼插值，非线性跳变。

## 源码结构

```
tornado-3d/
├── index.html       # 成品（单文件，three 以 data: URL importmap 内联，零外部请求）
├── index.src.html   # 打包前源码（HTML + CSS）
├── src/
│   └── main.js      # 场景/着色器/交互（import * as THREE from 'three'）
├── vendor/
│   └── three.module.js  # three@0.183.0 本地
├── README.md
└── shots/ 引用 ../shots/tornado-3d.png（桌面）/ tornado-3d-mobile.png（移动）
```

main.js 分段：EF 参数表 → 渲染器/场景/相机/灯光 → 地面（canvas 纹理）→ 漏斗粒子 shader → 碎片 → 尘环 → 云底 shader → 背景尘埃 → 自定义环绕视角 → UI 接线 → 主循环。

## 重建方式

```bash
# 1. 改 index.src.html / src/main.js
# 2. 复制为 index.html 后一次性单向打包（确认 /tmp/esb 与 /tmp/three.module.min.js 存在）
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py tornado-3d
# 3. 截图验收（headless 可跑打包后的 data: URL importmap 页面）
cd ~/workspace/fx-lab && NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file://$PWD/tornado-3d/index.html shots/tornado-3d.png 1280 800 0
```

注意：`fx-singlefile.py` 为一次性单向打包，不要对已打包的 index.html 重复跑；改 src 后重走"复制→打包"流程。

## 移动端说明

- 390×844 布局：标题缩小、面板变为底部全宽单行（滑杆 38vw），hint 与开关文字隐藏，触屏拖拽直接旋转视角、双指缩放。
- `touch-action:none` + Pointer Events 统一处理鼠标/触屏；DPR 上限 2。
- `prefers-reduced-motion` 下关闭噪点动画与入场动画。
