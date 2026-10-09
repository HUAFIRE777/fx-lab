# crystal-cave-3d · 水晶洞穴漫游

一句话介绍：程序化环形水晶洞穴——发光水晶簇沿隧道壁生长、点光源随呼吸闪烁，相机自动巡航（滚轮加速、拖拽环视），点按任意水晶平滑聚焦并浮现信息卡。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：珠宝品牌沉浸页常用的"水晶洞穴"开场（幽暗洞穴 → 发光晶体 → 镜头深入 → 凑近单品）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 发光体即光源：水晶自发光 + 真实点光源只给少数近处簇，远近层次靠雾和光晕拉开；
  2. 镜头永远在动：自动巡航不停，交互只改变速度和朝向，不打断沉浸；
  3. 点击单品聚焦：从漫游态平滑推近到单品，出信息卡，关闭后无缝回到巡航。
- **代码原创声明**：环形隧道生成、水晶簇程序化建模（六棱柱+晶尖+八面体小晶）、呼吸闪烁、巡航/聚焦相机、尘埃粒子全部手写；Three.js（MIT）为本地 vendor。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 水晶呼吸闪烁（核心） | 每簇独立材质，`emissiveIntensity = 0.92 + sin(t·1.35+φ)·0.3 + sin(t·3.9+2.1φ)·0.1`；光晕 sprite 缩放/透明度、点光源强度同相位联动 |
| 2 | 自动巡航 | 相机沿闭合 CatmullRom 环路 `t` 推进，`lookAt` 取前方 2.2% 处；无限循环，走不到头 |
| 3 | 滚动加速 | 滚轮推高 `boost`（上限 4×），`1−exp(−dt·0.9)` 指数衰减回 1；HUD 状态切"加速巡航" |
| 4 | 拖拽环视 | pointer 拖拽改 yaw/pitch（±0.55/±0.32 rad），松手后 `1−exp(−dt·0.7)` 缓慢回正 |
| 5 | 点击聚焦 | raycast 命中水晶 → smootherstep 插值把相机推到晶簇前 6.4 米，信息卡浮现；点空白/关闭/ESC 无缝回巡航 |
| 6 | 发光色三档 | 紫晶光 / 冰蓝光 / 双色混光（簇按奇偶取色）；一切换更新材质 emissive、光晕纹理、点光源色 |
| 7 | 尘埃粒子 | 340 点沿隧道分布，Additive 混合，透明度呼吸 + 整体缓慢浮沉 |
| 8 | 雾 + 暗角 | FogExp2(0x0D0716, 0.02) 拉深邃；2D 径向 vignette + SVG 噪点覆盖层（无 preserve-3d，不用 z-index 补救） |
| 9 | 加载态 | 「水晶生长中」+ 循环进度条；首帧+550ms / 3s 兜底必进完成态 |

## 配置参数

在 `src/main.js` 顶部 `D` 对象调整：

- `TUBE_R = 9`：隧道半径（改大更空旷，改小更压迫）
- `RING_R = 58` / `CTRL_PTS = 12`：环路半径与控制点数（周长≈380m，水晶簇数量随周长变）
- `CLUSTER_EVERY = 8`：水晶簇间隔米数（改小更密）
- `BASE_SPEED = 0.0038`：巡航基速（t/秒；约 1.4 m/s）
- `FOG_D = 0.02`：雾浓度（改大更深邃、更看不清远处）
- `LIGHT_EVERY = 8`：每 N 个簇一盏真实点光源（改小更亮、更吃性能）
- 配色：`BG/VIOLET/ICE` 三个常量，全页严格 3 色（#0D0716 / #A78BFA / #BFE9FF）
- 发光色档：`GLOW_MODES`（violet / ice / mixed）

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉动效（水晶洞穴巡航）；标题/HUD/控制条/信息卡均为功能性微交互，无第二主角。
2. **配色**：全页严格 3 色（深紫黑 #0D0716 / 水晶紫 #A78BFA / 冰蓝 #BFE9FF），无彩虹渐变；混光档也只是两色按簇交替，不引入第四色。
3. **字体**：系统字体栈；巨型标题 `clamp(2.6rem,8vw,6.4rem)` 字距 0.02em，kicker 字距 0.5em，HUD 深度数字 tabular-nums，层级分明。
4. **文案**：真实感中文短句（"往深处走，光自己会找过来。"），信息卡文案手写 5 句轮换（"别碰，体温会在晶面上留下痕迹。"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：水晶六棱柱+晶尖手建、底座岩块、光晕 canvas 径向渐变手绘、vignette + SVG 噪点、「水晶生长中」加载态、滑杆/分段按钮 hover 发光、信息卡毛玻璃。
6. **easing**：全部手写物理感缓动（呼吸正弦叠加、指数追踪 `1−exp(−dt·k)`、smootherstep 聚焦、boost 指数衰减、`cubic-bezier(0.16,1,0.3,1)`），无默认 linear。

## 源码结构

```
crystal-cave-3d/
├── index.src.html      # 开发版（引用 src/main.js + importmap→vendor，落盘为准）
├── index.html          # 打包成品（单文件，验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：隧道/水晶簇/巡航/聚焦/控件/粒子
├── vendor/
│   └── three.module.js # Three.js 本地（MIT，打包时走 importmap data: URL 内联）
├── README.md
└── ../shots/crystal-cave-3d.png / crystal-cave-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/crystal-cave-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入（打包器就地改写，单向！改完先备份 index.src.html）
cp index.src.html index.html
# 3. 打包（需 /tmp/esb 的 esbuild 与 /tmp/three.module.min.js；缺失见下）
python3 ~/workspace/bin/fx-singlefile.py crystal-cave-3d
# 4. 截图验收
cd ~/workspace/fx-lab && NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file://$PWD/crystal-cave-3d/index.html shots/crystal-cave-3d.png 1280 800 0
```

工具链恢复（若缺失）：`cd /tmp/esb && npm i esbuild`；three.module.min.js 用 esbuild 从 `vendor/three.module.js` 压缩生成：
` /tmp/esb/node_modules/.bin/esbuild vendor/three.module.js --minify --format=esm > /tmp/three.module.min.js`。

## 移动端说明

- 触屏：单指拖拽环视，轻点（移动 <12px、<450ms）即点击聚焦水晶，与桌面 click 同链路；
- 布局：`@media (max-width:640px)` 收紧标题/HUD，控制条换行缩小，提示文字隐藏，信息卡改为底部居中全宽；
- 噪点动画在 `pointer:coarse` 下关闭，省电；
- 滑杆/分段按钮触摸区 ≥ 40px 高，`touch-action:none` 只在 canvas 上，避免页面级手势冲突。
