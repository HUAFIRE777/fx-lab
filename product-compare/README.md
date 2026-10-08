# product-compare · 双品 3D 对比模板

<!-- huafire3d fx-lab — original implementation -->

独立站对比页模板：左右并排两个 3D 产品，同步旋转；中间参数对照表；一键「只看差异」。

## 用的两个模型（为什么选它们）

| 侧 | 模型 | R2 链接状态 |
|---|---|---|
| A | `tripo_headphone.glb`（头戴式耳机，Tripo H3.1 生成） | ✅ 已上线，可直链 |
| B | `tripo_keyboard.glb`（机械键盘，Tripo H3.1 生成） | ⏳ 待 `hero/` 同步到 R2 后可用 |

基址：`https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/`

选择理由：① 同类（`electronics/` 桌面音频外设），对比页讲得通——耳机 vs 键盘是独立站经典「桌面装备二选一」场景；② 都是 Tripo H3.1 生成的减面版（3.8MB / 2.9MB），加载快，适合网页；③ 体量相近，归一化后视觉可比。

**R2 现状说明（2026-10-05 实测）**：`models-web/hero/` 在 R2 上目前只有 `electronics/tripo_headphone.glb` 一个文件（`hero/` 整目录在 r2-sync 中被 deferred，同步脚本 `~/workspace/bin/r2-sync-models.py` 跑完后 B 侧自动点亮，零改代码）。B 侧 404 时页面按「加载失败隔离」处理：A 侧正常渲染，B 视口显示占位提示 + 重试按钮。

## 渲染架构（单 renderer + scissor，理由）

- **一个 `WebGLRenderer`，`setScissorTest` 分区画两个视口**，而不是双 renderer。
  理由：① 只占一个 GL 上下文——移动端上下文数量有限，双 renderer 直接翻倍显存与上下文开销；② 一套 RAF 循环统一调度，非激活视口可精确降帧；③ 环境反射贴图、接触阴影贴图天然共享，不重复上传 GPU。
- **非激活视口降帧**：热视口（最后交互的一侧 / 正在阻尼运动 / 拖拽中 / 交互后 1.5s 内）每帧渲染；冷视口每 4 帧渲染一次（约 15fps）。自转速度慢（0.22 rad/s），15fps 下无可感知顿挫。
- **同步旋转逻辑**：每视口一套手写轨道 rig（theta/phi/radius + 目标值，指数阻尼积分，有物理惯性）。`pointerdown/move` 的旋转增量默认同时写入两侧 rig 的目标值；关闭「同步旋转」后只写本侧。滚轮缩放同样遵循开关。闲置 3 秒后两侧展台式缓慢自转。

## 对照表

`src/config.js` 的 `SPECS` 数组驱动渲染；差异行自动判定（`String(a) !== String(b)`），无需手写。差异行：琥珀色左 border + 淡底高亮；「只看差异」开关隐藏相同行。表头显示「N 处不同 · M 处相同」。

## 加载失败隔离

两侧 `loadModel` 是独立 promise（`modelCache` 按 URL 缓存，失败不缓存）；一边 404/解码失败只影响本视口的状态层（占位 + 重试），另一边照常渲染。重试按钮清缓存重拉。

## 质量自查（六条）

1. 克制：整页只有一个核心动效——双 3D 转台同步旋转；其余只有 hover 轻过渡。
2. 配色：墨黑 `#0f0f12` / 纸白 `#ece7db` / 琥珀 `#e0a43c` 三色定死，无彩虹渐变（vignette 与噪点均为单色）。
3. 字体：系统字体栈；44px 大标题 + 0.32em eyebrow 字距，层级分明。
4. 文案：真实短句，无 Lorem ipsum、无 emoji 列表；脚注诚实标注「参数为模板演示数据」。
5. 手工细节：视口 vignette 暗角、SVG 噪点颗粒、shimmer 加载态、行 hover 微移、开关弹簧 easing。
6. easing：轨道用指数阻尼（`1 - exp(-dt*9)`），开关用 `cubic-bezier(0.3, 1.4, 0.5, 1)` 回弹，无 linear。

## 文件

```
product-compare/
├── index.template.html   # 源码（可编辑；index.html 由它生成，勿手改）
├── index.html            # 单文件成品（build.py 生成，附件发出这一个）
├── styles.css
├── src/
│   ├── main.js           # 渲染 + 交互 + 表格（原创）
│   ├── config.js         # 产品/参数/COPY 配置（接入时只改这里）
│   └── draco-inline.gen.js  # build.py 生成：draco 解码器内联
├── vendor/
│   ├── three.module.js   # three r183（与 lusion 同一文件，md5 一致）
│   └── addons/GLTFLoader.js, DRACOLoader.js
└── build.py / README.md
```

## 构建

```bash
cd ~/workspace/fx-lab/product-compare
python3 build.py   # 生成 draco 内联 → index.html → 调 fx-singlefile.py 打单文件
```

单文件说明：`three` 走 importmap data: URL（base64），`GLTFLoader/DRACOLoader` 由 esbuild 打进 bundle，draco wasm 内联为 base64——**零外部 JS/CSS**。模型 URL 保持 R2 外链（不打包进文件）。

## 红线

只学通用手法（scissor 分区、PMREM 环境、指数阻尼轨道均为图形学通用做法），未复制任何现有网站代码。文件头均有 `huafire3d fx-lab — original implementation` 注释。
