# typo-neon-3d · 巨型排印 + 单霓虹色 + 3D 点缀

虚构赛车手「林跃」2026 赛季宣言页 —— 排印是主角，3D 只做点缀。黑场之上，一个占满视口的「疾速」，配一抹霓虹 #D2FF00。

`huafire3d fx-lab — original implementation`

## 参考与借鉴点（手法学习，代码全部原创重写）

**对标对象：landonorris.com（Awwwards 2026 Site of the Year，Lando Norris 个人站）。**

借鉴的手法（实现均为原创，未复制其任何代码/素材）：

1. **巨型排印即 hero**：首屏只有一个词，占满视口；超粗字重 + 负字距 + 紧行高，字本身就是视觉。
2. **单霓虹色克制使用**：全页只出现两种颜色（近黑底 + 一抹霓虹），霓虹只落在关键词描边、下划线、小标签、进度线等"点睛"位置。
3. **3D 做点缀不做主角**：背景一层淡粒子 + 一个缓慢旋转的线框体，随鼠标视差轻微偏移；透明度压到 0.15，绝不抢字。
4. **电影感滚动节奏**：章节 pin 式停留，文字逐行以慢 easing 切入，像导演剪辑的节奏点。
5. **颗粒与暗角**：film grain 噪点 overlay + vignette，给数字页面加胶片感。

未借鉴的：其真实车手 IP / 赛事影像 / 品牌色系 —— 本模板人物「林跃」纯虚构，数字为模板演示用，页尾已声明。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 首屏逐字上场 | 每字包 `.mask(overflow:hidden)`，`.ch` 从 `translateY(112%)` 以 `cubic-bezier(0.16,1,0.3,1)` 升起，110ms stagger；第二字镂空霓虹描边 |
| 2 | 章节 pin 式停留 | `.chapter{height:270vh}` + `.pin{position:sticky}`，滚动进度驱动 `.ln` 逐行 `clip-path: inset()` 切入 + 上浮 |
| 3 | 滚动进度霓虹细线 | 顶部 2px 线，`transform: scaleX(scrollProgress)`，带霓虹光晕 |
| 4 | 背景粒子流 | Three.js Points，1800 点（≤3000 上限），缓慢上浮循环，透明度 0.5 |
| 5 | 线框 TorusKnot | `wireframe` 霓虹色，透明度 0.15，偏右构图，0.07–0.11 rad/s 慢速自转 |
| 6 | 鼠标视差 | 整组 `rig` 做 lerp 跟随（系数 0.045，物理感阻尼），触屏设备跳过 |
| 7 | 噪点 + 暗角 | SVG feTurbulence 噪点（霓虹色 5.5% alpha，data-URI 零请求）+ 径向 vignette |
| 8 | hover 霓虹呼吸 | CTA / 导航 hover 时 `box-shadow` 脉冲 `breathe` 关键帧 |
| 9 | 加载态 | 「暖胎中」霓虹进度条；`load+450ms` 或 3.2s 兜底进完成态，另有独立 classic 脚本 5s 绝对兜底 |

## 配置参数

都在源码字面量里，无配置文件：

- `src/main.js`：`COUNT = 1800`（粒子数） / knot 透明度 `0.15` / 粒子透明度 `0.5` / 视差 lerp `0.045` / DPR 上限 `1.75` / knot 位置 `(3.1, 0.5, -1.5)`
- `index.src.html` CSS 变量：`--neon: #D2FF00` / `--ink: #0A0A0A` / `--ease: cubic-bezier(0.16,1,0.3,1)`
- 章节节奏：`.chapter{height:270vh}`（移动端 230vh），行切入阈值 `0.1 + i*0.15`
- 换主角词：改 `.mega` 内的字；换霓虹色：改 `--neon` 一处（粒子/knot/描边/噪点全跟随）

## 六项自查（fx-lab 质量线）

1. **克制**：整页只讲"巨型排印"一个核心动效；3D 只有粒子 + 线框体两样点缀。
2. **配色**：严格 2 色 —— `#0A0A0A` + `#D2FF00`，次级文字/边框均为霓虹的 alpha 衍生，无第三色（headless 取样验证：computed colors 仅 `rgb(210,255,0)` / `rgb(10,10,10)` 及其 alpha）。
3. **字体**：纯系统栈（PingFang SC / Hiragino / Microsoft YaHei / system-ui），无 Google Fonts；对比靠字重 900 + `clamp()` 尺寸。
4. **文案**：中文短句，无 Lorem ipsum、无 emoji；人物「林跃」纯虚构，页尾已声明。
5. **手工细节**：vignette + 噪点 + 加载态 + hover 呼吸 + 滚动进度线，齐全。
6. **easing**：全站统一 `cubic-bezier(0.16,1,0.3,1)`，视差用 lerp 阻尼，有物理感。

## 源码结构

```
typo-neon-3d/
├── index.src.html      # 源码：HTML + 全量 CSS + DOM（改这里）
├── index.html          # 打包成品（fx-singlefile.py 单向生成，不手改）
├── src/main.js         # ESM 行为层：门控/加载态/滚动引擎/Three.js 点缀
├── vendor/
│   ├── three.module.js # 本地 three（构建时 importmap → data:URL 内联）
│   └── gsap.min.js     # 未使用（本模板用 CSS transition + rAF，留作备用）
└── README.md
```

- `three` 从 `product-launch-hero-3d/vendor/` 拷贝，未从网络下载。
- GSAP 未使用：滚动切入用 `clip-path` + CSS transition + rAF 节流 scroll，包更小、零依赖。
- 隐藏态全部挂在 `html.js` 前缀下（无 JS 时内容直接可见）；完成态三保险：`load+450ms` / 模块内 3.2s 兜底 / 独立 classic 脚本 5s 绝对兜底。

## 重建方式

```bash
cd ~/workspace/fx-lab/typo-neon-3d
# 改 index.src.html / src/main.js，然后：
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py typo-neon-3d
# fx-singlefile.py 为一次性单向打包：每次从 src 全新生成，不对已打包的 index.html 重复跑
```

验证：

```bash
/tmp/esb/node_modules/.bin/esbuild src/main.js --bundle --format=esm --external:three --minify > /dev/null && echo ESBUILD_OK
URL="file:///home/hatch/workspace/fx-lab/typo-neon-3d/index.html" OUT=/tmp/t.png WAIT=9 \
  NODE_PATH=/tmp/hcshot/node_modules node /tmp/test-typo.js
# 要求：ERRORS []、EXTERNAL []、htmlClass 含 done、canvas true
```

已知环境限制：本机 headless Chromium 禁 `file://` ES module，且 `--disable-gpu` 下 WebGL 黑屏 —— 故 console 零错即通过，不纠结黑屏；截图以排印/CSS 层为准。

## 移动端

- 巨型字 `clamp(5.5rem, 34vw, 12rem)` 缩放；章节字 `clamp(1.9rem, 5.6vw, 4.6rem)`。
- 触屏跳过鼠标视差（`pointer: coarse` 检测）；噪点位移动画在小屏停掉以省电。
- 统计行在小屏自动转纵排；导航字距收紧；经 390×844 真机尺寸 headless 验证无横向溢出、触屏滚动章节切入正常。
