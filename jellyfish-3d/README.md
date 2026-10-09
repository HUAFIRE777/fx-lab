# jellyfish-3d · 水母群游

深海里的一群发光水母，靠收缩与舒张安静地游。`huafire3d fx-lab — original implementation`

## 一句话介绍

程序化生成的深海水母群：伞盖呼吸式收缩推进、触手弹簧摆动、深海光柱与浮游颗粒，点击海面泛起涟漪，水母会循着波纹聚拢而来。

## 参考对象及借鉴点

- **对标对象**：深海纪录片（Blue Planet 类深海段落）的"生物发光 + 丁达尔光柱 + 浮游颗粒"质感——只学了这三种氛围手法。
- **学了哪几个手法**：① 顶光光柱（丁达尔效应的平面渐变做法）② 浮游颗粒（marine snow 缓慢下沉）③ 生物发光边缘（fresnel 边缘亮、中心透）。
- **代码原创声明**：本模板所有代码（水母建模、游动物理、触手摆动、涟漪、UI）均为原创重写，未复制任何原站源码；three.js 仅作为 WebGL 渲染器使用（vendor 本地文件）。

## 动效拆解

- **主视觉（唯一）**：程序化水母群。伞盖 = 半球几何 + 自定义 fresnel shader（边缘亮、顶部渐亮、随时间微颤）；体内一颗加色发光核心；7 条缘触手 + 4 条口腕合成一条 LineSegments，additive 混合、颜色沿长度衰减到黑（=隐形）。
- **呼吸游动**：收缩波形 `pow(max(sin,0), 2.4)`——快收慢放；收缩时伞盖横向鼓、纵向压（体积守恒感），同时产生向上的推进力；叠加浮力回中弹簧 + 阻尼，悬停稳定不乱飘。
- **触手摆动**：正弦叠层（频率/相位/振幅沿长度递增）+ 速度滞后拖尾（游得越快拖得越开）+ 收缩瞬间下推，程序化弹簧感，无物理引擎。
- **涟漪吸引**：点击海面（数学平面求交）在点击点生成 3 圈扩散涟漪（青-品红-青），同时设置 7 秒吸引点，水母水平转向聚拢，强度随时间衰减。
- **环境**：5 束顶光光柱（平面渐变 shader，缓慢摇摆）、420 粒浮游颗粒（下沉循环 + 横向漂移）、指数雾营造深海纵深。
- **Easing**：收缩用幂函数波形（非 linear）；涟漪扩散 ease-out；相机视差 lerp 跟随；标题呼吸 6s 周期。

## 配置参数

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| 水母数量 | 面板滑杆 / `buildSchool(n)` | 10（3–24） | 重建水母群，旧实例 dispose |
| 发光强度 | 面板滑杆 / `glow` | 100%（20–200%） | 伞盖 shader、触手、光柱、颗粒、涟漪统一乘数 |
| `pulseRate` | src/main.js Jellyfish | 0.55–0.8 | 每只水母呼吸频率（随机） |
| `SURF_Y` | src/main.js | 4.8 | 海面点击平面高度 |
| 吸引时长 | src/main.js | 7s | 点击后水母聚拢持续时间 |
| `depth` 漂移 | src/main.js | 1240± | 右上角深度计缓慢随机漂移（装饰） |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"水母群游"一个主视觉；面板只有 2 个滑杆 + 1 句提示，无多余控件。
2. **配色**：全页严格三色——深海 #04121F / 荧光青 #7DF9FF / 品红 #FF6FD8；约 1/4 水母为品红个体，其余全青，无彩虹渐变。
3. **字体**：标题宋体 900 加大字距（.22em）+ 呼吸动画；kicker 11px 大字距；面板 12px；三级层级分明。
4. **文案**："它们没有大脑，也没有心脏，却靠了六亿年的收缩与舒张，活成了海里最安静的舞者。"——真实感短句，无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG 噪点颗粒（1.2s 步进抖动）；加载态"正在下潜"旋转环；滑杆 hover 放大 + 光晕；深度计每 2.4s 微微漂移；点击提示首次点击后淡出。
6. **Easing**：收缩幂波形、涟漪 ease-out 扩散、相机 lerp 视差、标题呼吸——无一处 linear。

## 源码结构

```
jellyfish-3d/
├── index.src.html      # 源码 HTML（全部 CSS + 页面结构 + importmap）
├── index.html          # 单文件成品（fx-singlefile.py 打包生成，一次性单向）
├── src/
│   └── main.js         # 水母/环境/涟漪/交互全部逻辑（three.js ESM）
├── vendor/
│   └── three.module.js # three@0.183.0 本地（与前波模板同版本）
└── README.md
```

## 重建方式

```bash
# 1. 改源码（index.src.html / src/main.js）
# 2. 拷为 index.html 再打包（打包器一次性单向，会改写 index.html）
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py jellyfish-3d
# 3. 截图验证（先抓 console 修错，再拍终版）
cd ~/workspace/fx-lab
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file://$PWD/jellyfish-3d/index.html shots/jellyfish-3d.png 1280 800 0
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file://$PWD/jellyfish-3d/index.html shots/jellyfish-3d-mobile.png 390 844 1
```

注意：headless Chromium 禁 file:// ES module，验证 console 必须跑**打包后**的 index.html（data: URL importmap，headless 可跑）。

## 移动端说明

- 点击=触屏点按：`pointerdown` 统一处理，iOS/Android 均可点击海面泛涟漪。
- 布局：≤640px 时隐藏右上深度计、面板收窄、标题字号 clamp 自适应、安全区 bottom 适配刘海。
- 性能：24 只水母上限在移动端软件渲染下仍可跑；`prefers-reduced-motion` 关闭装饰动画。
- 已知：低端机首帧着色器编译慢，加载态"正在下潜"会多停留 1–2 秒，属正常（完成态由首帧渲染触发，必可达）。
