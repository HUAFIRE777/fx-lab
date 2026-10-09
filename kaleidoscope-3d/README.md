# kaleidoscope-3d · 万花筒

全屏 fragment shader 万花筒：程序化图案经极坐标镜面折叠成对称图案，缓慢旋转；拖拽改变旋转偏移，滚轮缩放图案密度。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：艺术展 / 电子音乐节现场视觉里的万花筒（kaleidoscope visual）——把噪声云海或几何线条经极坐标折叠成高对称图案，随音乐缓慢旋转。
- **学了哪几个手法**：① 极坐标镜面折叠（角度按瓣数折成 [0, π/N] 再镜像，天然对称）② 双图案源混合（fbm 云海 + 几何线条，模式间连续过渡）③ "交互即演奏"（拖拽给旋转加偏移并带惯性，滚轮实时改图案密度）。
- **代码原创声明**：本模板所有代码（shader、折叠数学、交互、UI）均为原创重写，未复制任何原站源码；three.js 仅作为 WebGL 渲染器使用（vendor 本地文件）。

## 动效拆解

- **主视觉（唯一）**：全屏 quad 跑 fragment shader。图案源 A = 域扭曲 fbm 云海（5 层 value noise，warp 1.6）；源 B = 几何线条（镜面接缝线＋同心光环＋斜网格）。极坐标 `(r,θ)` → θ 按瓣数 N 折叠 → 折叠坐标采样双源 → 三档混合 → 三色映射 → 中心微光呼吸 → 径向收敛 → 暗角 → 动态噪点。
- **对称瓣数**：滑杆 6–16（默认 8），uniform `uSeg` 阻尼逼近，切换时图案连续变形不跳帧。
- **旋转**：自动旋转（速度滑杆 0–100 → 0–0.9 rad/s，默认 25）＋拖拽偏移；松手后角速度指数衰减（惯性），阻尼系数帧率无关。
- **滚轮缩放**：`zoom *= exp(deltaY*0.0012)`，钳制 0.55–3.2，阻尼逼近目标值。
- **图案源三档**：云海 / 线条 / 交融（`uSrc` 0/1/2 连续值，切换时交叉淡入淡出约 0.5s）。
- **完成态**：首帧渲染 5 帧后 loader 淡出、`[data-intro]` 元素浮现（`html.js` 前缀选择器，无 JS 时默认可见）。
- **手工细节**：vignette CSS 覆盖层＋shader 内暗角双层、SVG 噪点覆盖层（opacity .055）＋shader 动态噪点、加载态"凝视中"（脉冲＋进度条动画）。

## 配置参数

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `segT` 范围 | src/main.js / index.src.html | 6–16，默认 8 | 对称瓣数滑杆 |
| `spdT` 映射 | src/main.js | 滑杆值/100×0.9 rad/s，默认 25→0.225 | 旋转速度 |
| `zoomT` 钳制 | src/main.js | 0.55–3.2，默认 1 | 滚轮图案密度 |
| 拖拽系数 | src/main.js | 0.0055 rad/px | 拖拽→旋转偏移 |
| 惯性衰减 | src/main.js | `pow(0.03, dt)` | 松手后角速度衰减 |
| 阻尼系数 | src/main.js | `1-pow(0.002, dt)` | 全部参数逼近，无 linear |
| fbm 层数 | src/main.js shader | 5 | 云海细节层数 |
| 配色 | shader `CBG/CMID/CHI` + CSS `:root` | #0d0a14 / #c084fc / #f0abfc | 全页严格三色 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"万花筒 shader"一个主视觉；其余只有控制条、加载态、拖拽/滚轮三处交互。
2. **配色**：#0d0a14＋#c084fc＋#f0abfc 三色定死，无渐变（滑杆轨道是两紫色相的线性过渡，同色系）、无第四色（噪点为中性明度抖动）。
3. **字体**：标题用宋体系（Songti SC / STSong / Noto Serif SC），字号 clamp 响应、字距 0.14–0.6em，大标题"万花筒"留白呼吸。
4. **无 Lorem、无 emoji**：文案为中文短句（"把云海和几何线条折进镜面"）；控制条为原生滑杆＋文字按钮，无 emoji 图标。
5. **手工细节**：镜面接缝线随瓣数自然出现（折叠数学的副产品）、中心微光呼吸、shader 暗角＋CSS vignette 双层、加载态"凝视中"、按钮 active 态颜色反转。
6. **easing 物理感**：所有参数（瓣数/速度/缩放/源混合）用帧率无关阻尼逼近；拖拽松手惯性指数衰减；加载条用 cubic-bezier；无 linear。

## 源码结构

```
kaleidoscope-3d/
├── index.src.html   # 开发版（样式/DOM/文案全内联；importmap 指向 vendor）
├── src/main.js      # 全部逻辑：three 场景、kaleidoscope shader、拖拽/滚轮/控制条
├── vendor/
│   └── three.module.js  # /tmp/three.module.min.js 拷贝（667KB 真品，打包时走 data:URL）
├── index.html       # 打包成品（单文件 882KB，验收以此为准）
└── README.md
```

万花筒实现：`atan` 取角 → `t=(ang+uRot)*uSeg/τ` → `ft=|fract(t)*2-1|` 镜像折叠 → 折叠角 `a=ft*π/uSeg` → 折叠坐标 `fp` 采样 fbm/线条。接缝线 = `1-smoothstep(0,.09,min(ft,1-ft))`（折叠边界天然成线）。

## 重建方式

```bash
cd ~/workspace/fx-lab/kaleidoscope-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py kaleidoscope-3d   # 单文件打包（一次性单向；改源码后重新 cp 再跑）
```

- 打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在。
- 标准管线：src/main.js 经 esbuild 打包（three 标 external）→ importmap 内 `"three"` 替换为 `/tmp/three.module.min.js` 的 base64 data:URL → 全内联为单文件，约 882KB。
- 验证：`node /tmp/hcshot-console.js "file:///home/hatch/workspace/fx-lab/kaleidoscope-3d/index.html" /tmp/kd.png 1280 800 0`（抓 console＋截图；本机 headless 走 SwiftShader 软渲染，可出图）

## 移动端说明

- 390×844：标题/控制条纵向重排，控制条贴底、安全区适配；hint 文字小屏隐藏（手势即提示）。
- 触摸：canvas `touch-action:none`，单指拖拽即转动；滑杆为原生 `<input type=range>`，触摸直接可用；滚轮缩放对应双指缩放（wheel 事件）。
- 省电：`prefers-reduced-motion` 下自动旋转默认 0、噪点改静态种子；移动端无 hover 依赖。
- 已知：无头 headless 下 WebGL 走软件渲染，帧率低但 console 零错、截图正常；真机 GPU 上为全帧率。
