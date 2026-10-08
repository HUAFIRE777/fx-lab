# unboxing-scroll · 滚动开箱 3D 模板

<!-- huafire3d fx-lab — original implementation -->

独立站产品故事长页：滚轮即运镜——滚动进度精确映射相机轨道（环绕鉴赏 → 分解视图 → 细节特写），卖点标注随滚动逐段浮现。示例产品 KEY·01 机械键盘（R2 模型外链）。双击 `index.html` 即可看。

手法参考：Apple 式 scrollytelling 开箱长页（滚动驱动相机 + 分阶段卖点）。

## 手法拆解

| 手法 | 做法 | 为什么 |
|---|---|---|
| 滚动即运镜 | scrollY 纯函数 → 相机轨道关键帧（角度/半径/高度插值） | 倒滚即回，天然可逆，无重型滚动库 |
| 分解视图 | 包围盒切片（桌面 8 块/移动 4 块），滚动 38%–62% 散开 | 一睹内部乾坤，开箱感的来源 |
| 卖点标注 | 3 个锚点卡片（键帽/结构/底壳），按进度区间显隐 | 镜头带到哪里，讲解跟到哪里 |
| 阶段文案 | 环绕鉴赏 → 分解视图 → 细节特写三阶段提示 | 用户知道自己滚到哪一幕 |
| 静态降级 | `prefers-reduced-motion` → 三段式图文，不初始化 WebGL | 可访问性 |

## 参数说明（`src/config.js`，改完即生效）

- `modelUrl` — 模型地址；`modelWidth` — 模型归一化宽度
- `camera.keys` — 运镜关键帧：`p`(滚动进度 0~1)/`angle`(环绕角)/`radius`/`height`/`targetY`
- `explode` — 分解：`grid`(切块)/`distance`(散开距离)/`range`(进度区间)
- `labels[]` — 标注：`title`/`text`/`anchor`(包围盒相对坐标)/`show`(显示区间)/`side`
- `phases` — 阶段文案；`staticSections` — 降级三段文案

## 质量自查（fx-lab 第四条铁律）

① 整页只讲"滚动驱动运镜开箱"一个核心动效；② 配色 2 色：深空黑底 + 单色高光；
③ 大标题有呼吸感，标注卡片字号层级分明；④ 无 lorem、无 emoji，文案全是真实卖点短句；
⑤ 手工细节：vignette 暗角、feTurbulence 噪点、加载态、标注卡片 hover 微交互；
⑥ 滚动映射原生 rAF 平滑跟随，相机过渡带物理感惯性。

## 源码结构

```
unboxing-scroll/
├── index.html            # 单文件成品（template + singlefile 生成）
├── index.template.html   # 开发模板（改这里，再打包）
├── src/
│   ├── config.js         # 中央参数（换产品/文案/运镜只改这里）
│   ├── main.js           # 入口：滚动映射 + 降级分支
│   ├── scene.js          # Three.js 场景/分解视图
│   ├── labels.js         # 卖点标注卡片
│   └── draco-bin.js      # Draco 解码库内联（build-draco-bin.py 生成）
├── vendor/               # Three.js 本地库
└── README.md
```

改完模板后重新打包：`cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py unboxing-scroll`
（singlefile 是单向的，不要对已打包的 index.html 重复跑。）

## 移动端

移动端分解切块降为 4 块省面数；触屏滚动即运镜（无冲突手势）；窄屏标注卡片自动收起为单行。

## 模型实测笔记（tripo_keyboard.glb）

- 单 mesh / 单 primitive，Draco 压缩 —— `GLTFLoader` 需配 `DRACOLoader`；
  解码器（`vendor/draco/`，MIT 随 three 分发）已 base64 内联进 `src/draco-bin.js`
  （`build-draco-bin.py` 重生成），单文件包无外部 `.wasm` 依赖
- 点云三视图实测：键盘以"躺平、键帽朝 +Y"建模，长边在 Z（0.98），
  归一化时自动把最长水平边转到 X 轴；键帽区几何/纹理已验证朝上，无需手动翻转
- 纹理：蓝黑红三色键帽（baseColor JPEG 内嵌）

## 验证（2026-10-05 无头实测）

- 三态截图：A（p=0.12 组装+标注期）/ B（p=0.5 分解成 8 块）/ C（p=1.0 键帽特写）
  均已出帧；分解视图 8 块清晰分离、无错位裁剪
- 标注显隐：按 stage-relative 进度复核，L1 在 p≈0.26 单独显示、L2+L3 在 p≈0.64
  同时显示、p=1 时全隐藏 —— 与 config.labels 区间一致
- 可逆：滚回后进度条归零（`pct=0%`）
- reduced-motion：`--force-prefers-reduced-motion` 下走静态三段式图文、不初始化 WebGL
- console：加载链路 + 各态抓帧全程零报错
- 移动端（390×844）：见下 —— 标注卡钳制在安全区内、无遮挡（结果见下）
- 代码复审抓出的真 bug（已修）：裁剪面是世界坐标，部件移动时必须同步平移
  （`constant -= normal·offset`），否则分解到最大时部件滑出 cell 被裁没 ——
  最终交付物 B 态 8 块完整渲染验证通过。另：曾怀疑锚点 `worldToLocal` 矩阵脏，
  查 vendor 源码确认 r160 的 `worldToLocal` 内部已调 `updateWorldMatrix`，
  属误报；补的显式 `rig.updateMatrixWorld(true)` 保留作无害冗余
- `window.__unboxReady` 就绪标志 + `#p=` hash（`#p=0.5` 直达分解态）供自动化截图
- 本机 headless Chromium 禁 `file://` ES module：无头截图用"模型内联为 data URL
  的测试副本"（`/tmp`，不进交付物）；`Page.captureScreenshot` 在高负载下会超时，
  改用页内 `canvas.toDataURL` 抓帧（测试副本开 `preserveDrawingBuffer`，交付物保持关闭）
- console 零报错已验（加载链路）；滚动手感需真机再验
