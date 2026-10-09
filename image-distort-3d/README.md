# image-distort-3d · 图片扭曲转场

`huafire3d fx-lab — original implementation`：作品集列表页，悬停标题时右侧图片做 WebGL 扭曲转场——鼠标划得越快，画面皱得越深。

## 参考与借鉴点

- **对标对象**：Awwwards 获奖作品集站点常见的列表页交互——左侧项目标题列表，右侧一块图片预览区，hover 标题时图片以 shader 置换做转场。
- **借鉴的手法**（只学手法，不碰原站源码）：
  1. 「列表 hover → 图片过渡」的布局与交互节奏；
  2. 转场用噪声驱动的 UV 位移（displacement），而非简单的淡入淡出；
  3. 转场瞬间叠加 RGB 通道分离，制造"信号撕裂"感。
- **代码原创声明**：全部代码（含 GLSL simplex noise、程序化图片生成、转场时序）均为本模板原创重写，未复制任何原站源码；three.js / GSAP 为本地 vendor 引入的开源库。

## 动效拆解

全页只有一个主视觉动效：**WebGL 图片扭曲转场**，其余均为克制微交互。

1. **双纹理噪声擦除转场**：当前图/下一图两张纹理，`u_prog` 由 GSAP `expo.inOut` 驱动 0→1；混合阈值叠加 simplex noise，形成"皱纹蔓延式"擦除。
2. **速度驱动的扭曲强度**：`pointermove` 计算鼠标速度（px/s，归一化），经指数平滑后写入 `u_vel`；位移幅度 `amp = 0.018 + vel*0.22 + surge*0.30`，RGB 分离量同步放大——划得越快皱得越深，停手后惯性衰减。
3. **闲时呼吸**：无操作时 `u_time` 驱动的微小噪声扰动（amp 基底 0.018），图片"活着"但不抢戏。
4. **微交互**：列表项 hover 下划线生长（`scaleX` + expo easing）、标题右移 6px、序号变赭石；caption 索引/名称/进度条切换时淡入上浮；图片框四角赭石角标。
5. **固定层**：vignette 暗角 + SVG 噪点 overlay（steps 跳帧动画，胶片感）。

## 配置参数

在 `src/main.js` 顶部附近调整：

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `WORKS` | 顶部 | 7 项 | 项目标题/标签/年份，增删即增减图片（图片按 seed 自动生成） |
| 转场时长 | `goTo()` | 1.15s | GSAP `expo.inOut`，转场峰值扭曲 `surge*0.30` |
| 速度灵敏度 | pointermove | /2600 | 速度归一化分母，越小越敏感 |
| 位移基底/速度/峰值 | shader `amp` | 0.018 / 0.22 / 0.24 | UV 位移三档权重 |
| RGB 分离 | shader `shift` | 0.004 / 0.045 / 0.05 | 基底 / 速度 / 转场峰值 |
| 噪声尺度 | shader | 3.2 / 6.5 | 皱纹粗细，大值=细皱纹 |
| 图片尺寸 | `makeArtwork` | 960×720 | canvas 程序化生成分辨率 |
| DPR 上限 | renderer | 2 | `Math.min(devicePixelRatio, 2)` |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个主视觉动效（图片扭曲转场），列表/标题/页脚全部收敛为纸质感排印，无多余装饰。
2. **配色定死 3 色**：米白 `#F4F1EA` 底、墨黑 `#1B1A17` 字、赭石 `#B56B2B` 点缀（含其邻近明度 `#D49A63/#4A4844/#E7E2D6`，无彩虹渐变，程序化图片同样锁死该色系）。
3. **字体讲究**：标题用宋体系 serif 大字号（`clamp(34px,4.6vw,58px)`，字距 `.06em`，行高 1.28，有呼吸感）；序号/meta 用等宽 mono 小字距大 tracking，层级分明。
4. **无 Lorem ipsum / emoji**：文案为真实感中文短句（"七个项目，七种姿态。""右侧的图不是配图，是每个项目的脾气。"），符号列表用 CSS 绘制。
5. **手工细节**：vignette + 跳帧噪点 overlay、四角赭石角标、hover 下划线生长、caption 进度条、四步加载文案（"正在研磨颜料…"）、FPS 角标。
6. **easing 有物理感**：转场 `expo.inOut`、列表 `cubic-bezier(0.16,1,0.3,1)`、速度经指数平滑+惯性衰减；无 linear。

## 源码结构

```
image-distort-3d/
├── index.src.html   # 开发版：内联 CSS + importmap(three→vendor) + src/main.js
├── src/main.js      # 全部逻辑：作品数据 / 种子随机 / 程序化图片生成 /
│                    #   Three.js shader(双纹理+simplex noise+RGB分离) /
│                    #   鼠标速度追踪 / GSAP 转场 / 加载态 / 主循环
├── vendor/
│   ├── three.module.js  # three.js（本地，与 typo-neon-3d 同源）
│   └── gsap.min.js      # GSAP 3（本地，72KB 真品）
├── index.html       # 打包成品（fx-singlefile.py 单向生成，勿手改）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab
# 1. 修改 index.src.html / src/*
# 2. 同步到打包入口
cp image-distort-3d/index.src.html image-distort-3d/index.html
# 3. 单向打包（bundle 内联 + importmap 转 data: URL）
python3 ~/workspace/bin/fx-singlefile.py image-distort-3d
# 注意：禁止对已打包的 index.html 重复跑；改源码后从 index.src.html 重新 cp 再跑。
```

验证（以打包成品为准）：

```bash
# 桌面/移动截图
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/image-distort-3d/index.html" ~/workspace/fx-lab/shots/image-distort-3d.png 1280 800 0
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/image-distort-3d/index.html" ~/workspace/fx-lab/shots/image-distort-3d-mobile.png 390 844 1
```

## 移动端说明

- 无 hover 环境：列表项改用**点按切换**（`click` + `focusin` 均触发 `goTo`），转场逻辑与桌面一致。
- 布局变为单列：预览区置顶（`order:-1`），列表在下；顶栏提示文案隐藏。
- 扭曲强度在移动端主要由转场峰值（`surge`）提供，闲时呼吸保持图片活性。
- `prefers-reduced-motion`：关闭噪点跳帧动画，transition 压至 0.01ms。
- 触摸设备无 `pointermove` 速度输入时，转场仍完整可用，仅"划得越快皱得越深"退化为固定强度。
