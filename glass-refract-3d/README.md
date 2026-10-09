# glass-refract-3d · 玻璃折射棱镜

一句话介绍：全屏玻璃折射 hero——程序化线条波纹背景 + MeshPhysicalMaterial 真实折射透镜（球体/胶囊体），鼠标视差漂移、透镜缓慢自转，折射率/数量/背景三档可调。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：棱镜折射类 hero（玻璃透镜扭曲背后图案、鼠标视差）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 透镜后方背景发生真实折射扭曲：用 `MeshPhysicalMaterial(transmission=1)` 而非假反射贴图；
  2. 程序化背景纹理：细线条波纹 canvas 纹理，线条越细折射越好看；
  3. 鼠标视差分层：透镜按深度系数差速漂移 + 相机轻微跟随，营造纵深。
- **代码原创声明**：三种背景图案生成器、透镜布局/视差/自转、控制条逻辑全部手写；Three.js（MIT）为本地 vendor，无任何原站源码。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 真实折射透镜 | `MeshPhysicalMaterial`：`transmission:1`、`roughness:0.05`、`thickness:2.4`、`clearcoat:1`；背景是真实 3D 平面（非 scene.background），保证进入 transmission 渲染管线 |
| 2 | 程序化背景图案 | 2048×1280 canvas 纹理三档：同心波纹（正弦扰动圆环）/ 斜波条纹（对角线族法向正弦偏移）/ 流场网格（正弦流场短划线）；细线 1px，月白低透明 + 每 N 条一条棱镜蓝点缀 |
| 3 | 鼠标视差漂移 | 指针归一化 → 指数跟随 `1-exp(-dt*4.2)`（快跟慢回）；透镜按深度系数差速偏移，相机反向轻微跟随（x ±0.38 / y ∓0.26） |
| 4 | 透镜缓慢自转 | 每颗透镜随机旋转轴 + 0.12–0.3 rad/s；叠加正弦浮沉（bob），`prefers-reduced-motion` 下降速/停浮沉 |
| 5 | 环境反射 | 程序化 equirect 渐变（地平线高光带 + 棱镜蓝光斑）→ PMREM，玻璃边缘有真实高光，无外部 HDR |
| 6 | 控制条 | 折射率滑杆（1.00–2.00，实时写 `material.ior`）、透镜数量 3/5/8（重建透镜组）、背景图案三档（重建 canvas 纹理）；分段按钮 `aria-pressed` |
| 7 | 加载态 | 「棱镜 / CALIBRATING」+ 循环细进度条；首帧 + 700ms 进完成态，3.2s/6s 双重兜底 + 无 JS 失败时的 6s 强制完成态 |

## 配置参数

在 `src/main.js` 顶部 / 相关函数处调整：

- `CFG.ior = 1.52`：默认折射率（1=无折射，2=强扭曲）；滑杆范围写在 `index.src.html` 的 `#ior` 上
- `CFG.count = 5`：默认透镜数；`buildLenses(n)` 内 `spreadX` 控制横向铺展
- `thickness: 2.4` / `roughness: 0.05`：玻璃厚度/粗糙度（`lensMat` 定义处）
- 背景纹理分辨率：`makePattern(mode, 2048, 1280)`；线条密度（同心波纹 `r += 9`、斜波 `d += 10`、流场 `cell = 44`）
- 视差强度：透镜 `mouse.sx * depth * 1.35`，相机 `mouse.sx * 0.38`；跟随系数 `1-exp(-dt*4.2)`（越大越跟手）
- 自转速度：`rotSpeed 0.12–0.3 rad/s`；浮沉幅度 `bobAmp 0.12–0.28`
- 配色：`:root` 中 `--ink:#0a0c10` `--paper:#e8f4ff` `--sky:#7dd3fc`

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉（玻璃折射透镜群）；标题/控制条/噪点均为配角，无第二主角。
2. **配色**：全页严格 3 色（墨黑 #0a0c10 / 月白 #e8f4ff / 棱镜蓝 #7dd3fc），无彩虹渐变；环境反射高光只在白→蓝之间。
3. **字体**：系统字体栈；巨型标题 `clamp(44px,7vw,88px)` 字距 0.12em，英文 kicker mono 字距 0.55em，层级分明。
4. **文案**：真实感中文短句（"光穿过玻璃时会拐弯——移动鼠标，看背景在透镜里折成涟漪"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette + SVG 噪点（steps 跳动）、透镜正弦浮沉、滑杆 thumb 悬停放大发光、"CALIBRATING"加载态、分段按钮选中态反白。
6. **easing**：全部手写物理感缓动（`cubic-bezier(0.16,1,0.3,1)`、指数跟随 `1-exp(-dt*4.2)`），无默认 linear。

## 源码结构

```
glass-refract-3d/
├── index.src.html      # 开发版（引用 src/main.js + vendor，落盘为准）
├── index.html          # 打包成品（单文件 883KB，验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：图案生成器 / PMREM 环境 / 透镜组 / 视差 / 控制条 / 加载态
├── vendor/
│   └── three.module.js # Three.js 本地（MIT，打包时走 importmap data: URL 内联，1.27MB）
├── README.md
└── ../shots/glass-refract-3d.png / glass-refract-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/glass-refract-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py glass-refract-3d
# 4. 验证（以打包成品为准：console 抓取 + 截图）
node /tmp/console-check.js "file:///home/hatch/workspace/fx-lab/glass-refract-3d/index.html"
```

打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在（缺失先恢复）。本套纯程序化，无需 R2 模型、无外部请求。

## 移动端说明

- 布局：标题/控制条全部 `clamp()` 自适应；390×844 下控制条自动换行（滑杆+数量一行、图案一行），提示行隐藏。
- 触摸：`pointermove` 覆盖触摸拖动，手指滑动即驱动视差；按钮 44px+ 热区。
- 省电：移动端 DPR 上限 1.5（桌面 1.75）；`prefers-reduced-motion` 下透镜降速、停浮沉、噪点静止。
