# snowglobe-3d · 雪景球

一句话介绍：一颗可以亲手摇的玻璃雪景球——球内三档微缩冬景（小镇/松林/雪人）一键切换，摇一摇即触发暴风雪粒子，雪量随心调。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：圣诞营销页常见的雪景球互动（点击/摇晃球体触发落雪、小场景切换）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 「摇一摇」触发暴风雪：一次能量注入 → 粒子加速 + 球体阻尼晃动 + 能量指数衰减；
  2. 球内微缩场景多档切换：同一底座上换景，带收缩/生长过渡；
  3. 雪量无极调节：粒子绘制数量随滑杆实时变化。
- **代码原创声明**：玻璃折射、三档冬景几何、雪粒子 shader、摇晃物理全部手写；Three.js（MIT，r160，本地 vendor 打包进单文件）。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 玻璃球体 | `MeshPhysicalMaterial`（transmission=1, ior=1.45, thickness=0.4, clearcoat=1）真折射 + 一笔手绘高光弧（torus 弧段贴着球面）卖"玻璃感" |
| 2 | 三档冬景 | 纯程序化几何：小镇（5 栋房子+教堂+路灯+双松，窗户自发光）、松林（8 棵三层松+雪顶+林间灯）、雪人（大小双雪人+围巾礼帽+环绕松）；切换时旧景 easeInBack 收缩、新景 easeOutBack 生长，可中断连点 |
| 3 | 暴风雪粒子 | 2600 点自定义 Shader：柱体内循环下落 + 正弦摇摆 + 闪烁；`uEnergy` 放大下落速度 ×9、摇摆 ×6；能量按 `exp(-dt·1.35)` 衰减 |
| 4 | 摇晃物理 | 能量驱动整机 rig：`rotation.z/x` 阻尼正弦 + y 轴小跳，相机同步微抖（`Math.random` 抖动 × energy） |
| 5 | 雪量滑杆 | `setDrawRange` 实时改绘制数 300–2600，档位文案 微雪/小雪/中雪/大雪 |
| 6 | 氛围层 | CSS vignette + SVG 噪点（grain 动画）+ 背景星空点 + 月亮 sprite；z-index 分层，不用 blur（避 preserve-3d 压平坑） |
| 7 | 加载态 | 「正在灌入第一场雪」+ 循环进度条；850ms 主路径 / 4s 兜底必进完成态；入场后自动来一场小雪暗示可交互 |
| 8 | 拖动旋转 | 指针拖动偏航 ±0.55rad（指数跟随）+ 相机视差；点击球体（射线检测）同样触发摇晃 |

## 配置参数

在 `src/main.js` 顶部 `CFG` / 代码内调整：

- `globeR = 2.18`：玻璃球半径；`groundY = -1.02`：球内地面高度
- `snowMax = 2600`：粒子总数；`snowH = 2.7`：雪柱高度
- `shakeDecay = 1.35`：暴风雪能量衰减（越大散得越快）；`blizzardGain = 8.0`：能量对雪速的放大倍数
- `wobble = 0.085`：摇晃幅度
- 雪量滑杆映射：`lerp(300, snowMax, pct)`；档位阈值 `SNOW_WORDS`
- 场景过渡：收缩 0.32s（easeInBack）+ 生长 0.65s（easeOutBack）
- 配色：`:root` 中 `--night:#0E1B2E` `--snow:#F4F8FF` `--pine:#2E7D5B`

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉（雪景球）；标题/面板/提示均为配角，无第二主角。
2. **配色**：全页严格 3 色（冬夜蓝 #0E1B2E / 雪白 #F4F8FF / 松绿 #2E7D5B），灯火用暖白 emissive 只出现在窗/灯泡上，无彩虹渐变。
3. **字体**：系统字体栈；巨型标题 `clamp(2.4rem,7.2vw,5.2rem)` 字距 .06em，kicker 字距 .5em 12px，细体/黑体混排有层级；大标题直接压在玻璃上形成杂志式叠印。
4. **文案**：真实感中文短句（"把冬天，摇进一颗玻璃球""摇完这场雪，冬天才算真的来过"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：玻璃高光弧、灯火呼吸（`hearth.intensity` 正弦）、vignette + SVG 噪点、铭牌「雪夜物语」Canvas 手绘、按钮 hover 上浮发光、雪粒子闪烁。
6. **easing**：手写物理感缓动（`cubic-bezier(0.16,1,0.3,1)`、指数衰减 `exp(-dt·k)`、easeInBack/easeOutBack），无默认 linear。

## 源码结构

```
snowglobe-3d/
├── index.src.html      # 开发版（内联 CSS + importmap 已移除；落盘为准）
├── index.html          # 打包成品（单文件 499KB，three r160 已打进 bundle，无外部请求；验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：场景/灯光/三档冬景/雪粒子 shader/摇晃物理/交互/入场
├── vendor/
│   └── three.module.js # Three.js r160 本地（MIT；打包时由 esbuild 直接 bundle，不走 data: URL importmap）
├── README.md
└── ../shots/snowglobe-3d.png / snowglobe-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/snowglobe-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py snowglobe-3d
# 4. 验证（以打包成品为准；本机 headless 慢，等待 20s+ 再截图）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/snowglobe-3d/index.html" ~/workspace/fx-lab/shots/snowglobe-3d.png 1280 800 0
```

打包前确认 `/tmp/esb` 存在（缺失：`cd /tmp && npm i esbuild ws` 恢复；本模板不再依赖 `/tmp/three.module.min.js`，见下）。

**打包路线说明（偏离前波，请注意）**：前波用 `importmap` + `data: URL` 内联 three。本模板改用 `src/main.js` 中相对路径 `import … from '../vendor/three.module.js'`，esbuild 直接把 three 打进 bundle——实测 data: URL 版在 headless 下 module 启动极慢且偶发静默不执行（无任何 console 报错），自包含 bundle 更稳、体积反而更小（892KB→499KB）。

## 移动端说明

- 布局：标题/面板全部 `clamp()` 自适应；≤640px 时面板换行、摇一摇按钮独占一行全宽。
- 机位自适应：`fitCamera()` 按宽高比算横向所需机位，竖屏自动拉远，保证球体横向完整入画。
- **摇晃手机**：`deviceorientation` 监听急动（jerk 阈值 + 1.6s 冷却）触发暴风雪；iOS 在首次点击摇一摇时顺手申请权限（需手势）；无权限/无事件时按钮照常可用（降级）。
- 省电：`prefers-reduced-motion` 下摇晃幅度 ×0.4、能量衰减更快；移动端提示文案切换为"摇晃手机试试"。
- 触摸：`pointerdown` 捕获 + 260ms 点击/拖动区分，误触不触发。
