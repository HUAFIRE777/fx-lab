# origami-3d · 折纸展开

一张宣纸，七次折叠，成为一叶小船。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：纸艺折叠动画（origami step-by-step 演示类作品）的"几何折叠步骤化"表现手法——把一次成形拆成若干离散折叠步骤，每步配折痕与说明。
- **学了哪几个手法**：① 折叠步骤化（离散时间轴，每步一折）② 折痕高亮（当步折痕朱砂色渐显，折完留作纸面记忆）③ 步骤说明卡（每步一句话教程文案）。
- **代码原创声明**：本模板所有代码（折叠数学、时间轴、UI）均为原创重写，未复制任何原站源码；three.js 仅作为 WebGL 渲染器使用（vendor 本地文件）。

## 动效拆解

- **主视觉（唯一）**：一张 48×48 细分的平面纸，按 7 步预计算折叠关键帧，运行时绕折痕轴做角度插值。
  1. 对折——上半沿中线 180° 折下（矩形，双层）
  2. 左角归心——正面层左上角沿对角线折向中线
  3. 右角归心——镜像
  4. 前襟上折——正面层下摆翻起压住双角
  5. 后襟上折——背面层下摆翻起（三角已成）
  6. 左舷撑开——左半侧整层绕中线向观者弹出 72°
  7. 右舷撑开——镜像收拢，一叶小船成形
- **折叠 easing**：自定义 easeInOutBack（c1=1.3，约 7% 过冲），纸张折到位有轻微物理回弹，不用 linear。
- **折痕线**：7 条朱砂色线，当步渐显（0→0.95），折完沉为 0.34 留作"纸面记忆"；折痕端点同样参与后续折叠，随纸面一起运动。
- **时间轴**：自动播放（1.5s/步＋0.9s 停顿）/ 上一步·下一步 / 拖拽 scrub（0–7，0.01 步进）/ 步骤圆点跳转；终态出现"展开重折"。
- **克制微交互**：鼠标视差（±0.32）、完成后的轻微浮动、按钮 hover。

## 配置参数

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `SEG` | src/main.js | 48 | 纸面网格细分（48×48） |
| `STEPS` | src/main.js | 7 | 折叠步数 |
| stepDefs[].ang | src/main.js | π / 1.25 | 每步折叠角度（弧度） |
| stepDefs[].zoff | src/main.js | 0.006–0.01 | 层叠防穿插间距 |
| 播放速度 | src/main.js `tween.dur` | 1.5s | 自动播放每步时长 |
| 停顿 | src/main.js `dwell` | 0.9s | 步间停顿 |
| 相机 | src/main.js `fit()` | fov 35 | 窄屏自动拉远保证整纸入画 |
| 配色 | index.src.html `:root` | 宣纸白 #f5f0e6 / 墨黑 #201c16 / 朱砂 #b83a22 | 全页严格三色 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"折纸折叠"一个主视觉动效；其余只有视差、浮动、hover 三处微交互。
2. **配色**：宣纸白＋墨黑＋朱砂三色定死，无渐变、无第四色（阴影/噪点均为中性）。
3. **字体**：标题用宋体系（Songti SC / STSong / Noto Serif SC），字号 clamp 响应、字距 0.14–0.5em，大标题"一叶小船"留白呼吸。
4. **无 Lorem、无 emoji**：文案为中文短句（"万折始于第一折""对称，即是秩序"）；播放/暂停为 CSS 几何图形（三角/双杠），非 emoji。
5. **手工细节**：纸张双面微差（背面 shader 压暗暖 7%）、柔和投影（PCFSoft＋ShadowMaterial）、vignette＋SVG 噪点、加载态"展纸中"、折痕留痕。
6. **easing 物理感**：折叠用 easeInOutBack 回弹；时间轴 tween 用 easeInOutCubic；无 linear。

## 源码结构

```
origami-3d/
├── index.src.html   # 开发版（样式/DOM/文案全内联；importmap 指向 vendor）
├── src/main.js      # 全部逻辑：折叠预计算、渲染、时间轴 UI
├── vendor/
│   └── three.module.js  # three r160 本地文件（1.27MB 真品，打包时由 esbuild 内联）
├── index.html       # 打包成品（单文件，验收以此为准）
└── README.md
```

折叠实现：`stepDefs` 定义每步的判定（当前变形空间）＋折痕轴（点/方向）＋角度；预计算阶段逐顶点跑一遍七步，记录 `ops`（轴点/轴向/角度/层间距/有效位）；运行时 `applyFold(p)` 按进度对每步做 easeInOutBack 角度插值（Rodrigues 旋转），48×48 顶点逐帧求值约 1.7 万次旋转，性能无压力。

## 重建方式

```bash
cd ~/workspace/fx-lab/origami-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py origami-3d   # 单文件打包（一次性单向；改源码后重新 cp 再跑）
```

- 打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在。
- 标准管线：src/main.js 经 esbuild 打包（three 标 external）→ importmap 内 `"three"` 替换为 `/tmp/three.module.min.js` 的 base64 data:URL → 全内联为单文件，约 889KB。
- 验证：`node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/origami-3d/index.html" /tmp/t.png 1280 800 0`

## 移动端说明

- 390×844：标题/说明卡/时间轴纵向重排，说明卡变为底部卡片，时间轴贴底；相机按宽高比自动拉远，整纸入画。
- 触摸：scrub 为原生 `<input type=range>`，触摸拖拽直接可用；步骤圆点可点；无 hover 依赖。
- 省电：`prefers-reduced-motion` 下关闭自动播放与噪点位移动画；移动端噪点动画默认关闭。
- 安全区：底部 UI 均加 `env(safe-area-inset-bottom)`。
