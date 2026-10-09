# mushroom-3d · 荧光蘑菇森林

一句话介绍：深夜里一片会发光的蘑菇森林——48 株程序化荧光蘑菇、萤火虫粒子与地面流雾，点蘑菇泛起涟漪光波，一键飘散孢子。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：奇幻插画/绘本中的荧光森林场景（发光菌群 + 萤火虫 + 雾气纵深的氛围营造）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 「发光层次」：近景蘑菇高亮、中景菌群光晕、远景树影剪影，三层明暗拉出纵深；
  2. 「萤火虫」：暖黄/青绿混色光点在林间做曲线漂移 + 明暗呼吸；
  3. 「雾气纵深」：贴地的流动薄雾遮住中景脚部，让远景在雾里若隐若现。
- **代码原创声明**：蘑菇程序化建模、FBM 雾 shader、萤火虫/孢子粒子 shader、涟漪光波全部手写；Three.js（MIT，本地 vendor 打包进单文件）。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 蘑菇群 | 程序化建模：菌柄 `CylinderGeometry` + 菌盖压扁半球（`SphereGeometry` 0–0.55π + y 压缩 0.62）；48 株簇状分布（5 个菌落中心高斯散布 + 散生 + 2 株前景大株撑构图）；菌盖白点手工点缀 |
| 2 | 发光 | 菌盖 `emissive`（青 #5CFFB1 为主、22% 暖橙点缀）+ 每株一枚 additive 光晕 sprite 做"假光源"；真 point light 全场只放 2 盏（青/暖各一，呼吸闪烁）省性能 |
| 3 | 萤火虫 | 140 点自定义 Shader：JS 每帧算 lissajous 位置（`cx + ax·sin(wx·t+px)` 三轴不同频率），shader 里做呼吸闪烁（`0.5+0.5·sin` 平方增反差）+ 18% 暖黄混色 |
| 4 | 地面流雾 | `PlaneGeometry` + FBM shader（4 层 value noise），双层噪声错速平流，中心浓边缘淡的 mask，additive 叠加 |
| 5 | 点击涟漪 | 射线点中菌盖 → ring 池放一枚扩散光波（easeOutCubic 0.5→5.1 缩放 + 透明度衰减）+ 半径 4.2 内蘑菇 `pulse` 亮度脉冲（指数衰减） |
| 6 | 孢子飘散 | 600 粒子池：从 3 株随机蘑菇菌盖向上喷发，初速球面随机 + 浮力上升 + 空气阻尼，shader 按生命做 `pow(1-vL,1.4)` 淡出 |
| 7 | 滑杆 | 荧光强度（0.2–2.2×，联动 emissive/光晕/萤火/雾/孢子）；夜色浓度（联动 hemi/ambient/雾密度/曝光/荧光增益，文案 薄暮/入夜/深夜） |
| 8 | 相机 | 拖拽偏航 ±0.55rad（指数跟随）+ 呼吸式微摆；点击与拖拽用位移<9px & 时长<450ms 区分 |
| 9 | 加载态 | 「菌丝正在蔓延」+ 循环进度条；首帧渲染 12 帧后进场 / 3.8s 兜底必进完成态 |

## 配置参数

在 `src/main.js` 顶部 `CFG` 调整：

- `shroomN = 48`（移动 30）：蘑菇数量；`flyN = 140`（移动 70）：萤火虫数量
- `sporeN = 600`（移动 300）：孢子池；`ringPool = 5`：涟漪池
- `pulseRadius = 4.2`：涟漪影响半径；`pulseDecay = 2.2`：脉冲衰减；`ringLife = 1.15`：涟漪时长
- 暖色蘑菇比例：`buildMushroom` 内 `Math.random() < 0.22`
- 夜色默认 `night = 0.72`（`nightRange` value）；荧光默认 100%
- 配色：`:root` 中 `--bg:#070B08` `--glow:#5CFFB1` `--warm:#FF9E57`

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉（荧光蘑菇森林）；标题/滑杆/提示均为配角，无第二主角。
2. **配色**：全页严格 3 色（深林黑 #070B08 / 荧光青 #5CFFB1 / 菌盖暖橙 #FF9E57 点缀），无彩虹渐变；雾气是青的低透明叠加，不引入新色。
3. **字体**：中文标题衬线（Songti SC/STSong/Noto Serif SC）`clamp(44px,6.4vw,76px)` 字距 .28em；英文小字大字距（.5em）；loader 衬线中文 + 英文小字双行。
4. **文案**：真实感中文短句（"森林在夜里发光""菌丝正在蔓延""点击蘑菇 · 泛起涟漪光波"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：菌盖手点白点、菌盖呼吸（相位各异的 2% 缩放）、双灯不同频率闪烁、vignette + SVG 噪点、按钮 hover 上浮发光、孢子冷却态。
6. **easing**：`cubic-bezier(.22,1,.36,1)`（入场/按钮）、easeOutCubic（涟漪扩散）、指数衰减（脉冲/偏航跟随），无默认 linear。

## 源码结构

```
mushroom-3d/
├── index.src.html      # 源码页：内联 CSS + importmap(./vendor/three.module.js) + ESM 入口
├── index.html          # 打包产物（fx-singlefile.py 一次性单向生成，不可重复打包）
├── src/main.js         # 全部场景代码（ESM，import * as THREE from 'three'）
├── vendor/
│   └── three.module.js # Three.js 真品（667KB，从 vinyl-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/mushroom-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py mushroom-3d
```

改 `src/` 后重建：先改源码，再 `cp index.src.html index.html` 重新跑一次 singlefile。**禁止对已打包的 index.html 重复跑**（importmap 已是 data:URL，会二次破坏）。

## 移动端说明

- `matchMedia('(pointer:coarse)')` 或窄屏即判定移动端：蘑菇 48→30、萤火虫 140→70、孢子池 600→300、像素比上限 1.6。
- 触屏：蘑菇点击（tap）与相机拖拽共用 pointer 事件区分；滑杆 `touch-action:pan-x` 可正常拖动。
- 小屏布局：标题缩小、说明段落隐藏、侧边统计隐藏、提示条隐藏，控制栏换行居中。

## 踩坑记录

1. **sprite 光晕的"假光源"取舍**：48 株蘑菇若每株放 point light，WebGL 前向渲染光照计算爆炸。实测方案：全场只放 2 盏真 point light（青主光 + 暖辅光，呼吸闪烁），每株蘑菇用一枚 additive radial sprite 冒充光晕——视觉上发光层次不输，draw call 只多 48 个 sprite。
2. **菌盖压扁后白点贴合**：`capGeo.scale(1, 0.62, 1)` 烘进几何体后，白点 y 坐标要按 `cos(ph) * capR * 0.60`（不是 0.62·cos）近似，否则点会浮空或陷进菌盖。取 0.60 留一点嵌入余量。
3. **雾 plane 的 z-fighting**：雾 plane y=0.02、涟漪 ring y=0.04、地面 y=0，三层错开 0.02 避免深度打架；三者都关 depthWrite，只有地面写深度。
4. **点击 vs 拖拽**：蘑菇点击用 raycaster，但相机拖拽也走 pointerdown——用"位移 <9px 且时长 <450ms"判定为点击，否则判拖拽，避免转视角时误触涟漪。
5. **萤火虫 `frustumCulled = false`**：Points 位置每帧在 JS 里改，three 的包围球不会自动更新，不关剔除会被视锥误裁——粒子凭空消失一半。
6. **hcshot 静默失败的真因**：ws 只处理了 onmessage 没处理 onclose——renderer 在截图时崩溃（1006），`captureScreenshot` 的 promise 永不 resolve，node 事件循环排空后 exit 0 且无任何输出。排查时先加 onclose 日志，不要对着"无报错"干瞪眼。
7. **高负载下软渲染要加等待**：本机 load 17 时 SwiftShader 软渲染 WebGL 极慢，hcshot 默认 3.5s 等待不够，`captureScreenshot` 直接把 renderer 拖崩溃；/tmp 拷一份把等待加到 9s 即成功。先 `uptime` 看负载，别急着怀疑代码。
8. **`pkill -f "meta-chromium"` 会杀掉自己的 shell**：pattern 出现在自己命令行的参数里，pkill 按 full cmdline 匹配连自己一起杀——用 `pkill -f "meta-chromiu[m]"` 括号技巧避开自匹配。
