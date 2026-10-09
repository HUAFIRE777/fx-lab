# neon-sign-3d · 霓虹灯牌

一句话介绍：砖墙上的霓虹灯管招牌——灯管拼出可自定义文字，电流闪烁、偶发"接触不良"式抖动，鼠标靠近哪一笔、哪一笔就亮起来；一键开关灯、三档霓虹色可切。`huafire3d fx-lab — original implementation`

## 参考与借鉴点（手法学习，代码全部原创重写）

**对标对象：酒吧 / 潮牌店门口的霓虹灯招牌（neon sign）。**

借鉴的手法（实现均为原创，未复制任何现成代码/素材）：

1. **灯管拼字**：霓虹灯管沿字形走线——本模板用 canvas 把文字画成"灯管三层"（外层光晕 / 灯管本体 / 白热灯芯），逐字描边 + 大 shadowBlur 烘出发光。
2. **bloom 感**：真实招牌的辉光来自灯管散射——本模板用逐字径向渐变 sprite（additive）叠在灯管上模拟 bloom，另加一层洒在砖墙上的大洗光 sprite。
3. **电流闪烁**：市电哼鸣（正弦叠加的微幅波动）+ 偶发"接触不良"抖动（随机电报过程：突发 50–200ms 的跌落，期间 160Hz 嗡鸣调制）。
4. **开关灯**：开灯是"起辉"（几次闪烁后稳定），关灯是"熄灭"（两次喘息后全黑），熄灯后露出暗色玻璃管。
5. **砖墙质感**：程序化 canvas 砖墙（独立明暗的砖块 + 斑驳 + 浮雕高光/阴影），砖墙随电流轻微呼吸（灯光洒在墙上）。

未借鉴的：任何真实品牌招牌的文字/配色/照片素材 —— 灯牌默认文字「霓虹小馆」为虚构演示用，用户可自行输入（最多 8 字）。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 程序化砖墙 | 1024² canvas：灰缝底 + 逐砖随机明暗 + 斑驳噪点 + 上亮下暗浮雕；`RepeatWrapping`，repeat 按视口宽高比动态算、砖块不变形 |
| 2 | 灯管文字贴图 | 2048×1024 canvas：挂墙背板（圆角 + 吊线）+ 逐字三层描边（光晕/管体/灯芯）；字号自适应（8 字以内逐级缩小直到排下） |
| 3 | 多层辉光 | 逐字 `THREE.Sprite`（径向渐变纹理，additive）+ 墙面大洗光 sprite；颜色随霓虹档位实时重染 |
| 4 | 电流闪烁 | 哼鸣 `0.93+0.07·sin叠加` × 接触不良抖动（随机触发，滑杆 0–100 映射 0–2.4 次/秒）；作用于灯管颜色强度、sprite 透明度、洗光、墙面呼吸 |
| 5 | 开关灯 | 起辉包络 0.7s（闪→灭→闪→稳）、熄灭包络 0.7s（喘息两次→黑）；关灯后淡入暗色玻璃管层 |
| 6 | 鼠标临近增亮 | raycast 灯管平面取 uv.x → 每字高斯 `exp(-(du/0.05)²)` 增亮，指数追踪（`1-exp(-dt·9)`）平滑，有物理感 |
| 7 | 相机视差 | 相机随鼠标轻微偏移 + lookAt 灯牌，指数追踪 |
| 8 | 加载态 | 「正在接通电源」+ 循环进度条；`load+450ms` / 3.2s / 5s 三重兜底必进完成态；进场即触发起辉 |

## 配置参数

在 `src/main.js` 顶部 / 对应函数处调整：

- 霓虹三档：`NEONS` / `NEON_CSS`（粉 `#ff2d95` / 青 `#22d3ee` / 橙 `#fb923c`），一次只用一档
- 闪烁强度：滑杆 `0–100` → 抖动率 `0–2.4次/秒`（`flickAmt * 2.4`）；抖动时长 `0.05–0.2s`、跌落深度 `0.15–0.5`
- 哼鸣：`humAmp = 0.07`（reduced-motion 下 0.02）
- 起辉/熄灭包络：`STRIKE_KEYS` / `SPUTTER_KEYS`，`ENV_DUR = 0.7s`
- 临近增亮：高斯 σ=0.05（u 单位）、追踪系数 `1-exp(-dt·9)`、增亮倍率 `1.6`
- 灯牌尺寸：`SIGN_W = 13.5` 世界单位；相机 `fov 38 / z=20`；砖墙 `z=-6`
- 灯管三层线宽：字号 `fs` 的 `0.16 / 0.075 / 0.028`；光晕 shadowBlur `0.28·fs`
- 配色：`:root` 中 `--bg:#0a0a0f` `--ink:#f5f3ff` `--neon`（随档位切换）

## 六项自查（fx-lab 质量线）

1. **克制**：全页只有一个主视觉（霓虹灯牌）；标题/控制条均为功能性微交互，无第二主角。
2. **配色**：全页严格 3 色（背景 #0a0a0f / 文字 #f5f3ff / 一档霓虹色），砖墙压成近黑、无彩虹渐变；灯管发光只在霓虹色→白之间过渡。
3. **字体**：系统字体栈；标题 `clamp(2rem,4.6vw,3.4rem)` 字距 0.06em，kicker 字距 0.5em 大小 11px，层级分明；灯管字 900 字重描边、有呼吸感。
4. **文案**：真实感中文短句（"砖墙上的霓虹灯管招牌""正在接通电源"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：砖块逐块明暗+斑驳、背板吊线、熄灯玻璃管、墙面洗光、vignette + SVG 噪点、「正在接通电源」加载态、开关灯起辉/熄灭包络。
6. **easing**：全部手写物理感缓动（`cubic-bezier(0.16,1,0.3,1)`、指数追踪 `1-exp(-dt·k)`、起辉/熄灭关键帧包络），无默认 linear。

## 源码结构

```
neon-sign-3d/
├── index.src.html      # 开发版（引用 src/main.js + vendor，落盘为准）
├── index.html          # 打包成品（单文件，验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：砖墙纹理 / 灯管贴图 / 辉光sprite / 闪烁引擎 / 鼠标增亮 / 控制条
├── vendor/
│   └── three.module.js # Three.js 本地（MIT，打包时走 importmap data: URL 内联）
├── README.md
└── ../shots/neon-sign-3d.png / neon-sign-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/neon-sign-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py neon-sign-3d
# 4. 验证（以打包成品为准；headless 下 file:// ESM 不跑，只抓 console）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/neon-sign-3d/index.html" ~/workspace/fx-lab/shots/neon-sign-3d.png 1280 800 0
```

打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在（缺失先恢复）。

## 移动端

- 布局：标题/控制条全部 `clamp()` 自适应；390×844 下标题 4.6vw、控制条换行居中、输入框收窄。
- 触摸：`pointermove` 同样驱动临近增亮（手指划过即亮）；控制条按钮 `touch-action` 默认即可，无手势冲突。
- 省电：`pointer:coarse` 下停掉噪点位移（`grain{animation:none}`）；`prefers-reduced-motion` 下关闭抖动（只留微幅哼鸣）、关闭相机视差。
- 单视口无滚动：`body{overflow:hidden;height:100svh}`，灯牌始终完整可见。

## 验收记录

- **console**：打包成品 headless 抓 console（`hcshot.js` 输出），零错误（ESM 在 file:// 下不执行属已知构建限制，以 console 为准）。
- **外部请求**：零真实外部请求——Three.js 走本地 vendor（打包后 data: URL 内联）、字体为系统字体栈、砖墙/辉光/噪点全程序化（canvas + SVG data URI），无 Google Fonts/picsum/国外 CDN、无 R2。
- **截图**：桌面 1280×800 `shots/neon-sign-3d.png`、移动 390×844 `shots/neon-sign-3d-mobile.png`。
- **完成态**：全部完成态选择器带 `html.js` 前缀（`html.js .fade` / `html.js.done …` / `html:not(.js) .loader`）；loader 与排印隐藏只在 JS 生效，无 JS 直接可达完成态；5s 内联兜底必进 `done`。

## 许可与声明

- MIT License（见 fx-lab 根目录 `LICENSE`，Copyright 2026 huafire3d fx-lab）。
- 本模板代码全部原创实现；手法学习对象为现实中的霓虹灯招牌（见"参考与借鉴点"），未复制任何现成代码与素材。
- 灯牌默认文字「霓虹小馆」为虚构演示用；页尾已声明"设计模板演示"。
- Three.js 为 MIT 协议（vendor 本地，打包时内联）。
