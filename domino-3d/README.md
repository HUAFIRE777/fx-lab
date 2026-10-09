# domino-3d · 多米诺连锁倒塌

一句话介绍：程序化多米诺骨牌阵列（直线/S 弯/双排）+ 自研确定性倒塌链——每块牌绕底边前沿翻倒、前块角度越过接触角即触发下一块；牌面逐字印上你的触发词，相机跟随倒塌前锋缓慢推进。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：营销活动页常见的"连锁反应"开场（第一块牌倒下 → 镜头跟随一路连锁 → 落版）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 连锁触发节奏：前块倒到"碰到下一块"的角度才触发下一块，节奏由几何决定而非固定时序；
  2. 相机跟随前锋：镜头不拍全景，只追着倒塌前锋缓慢推进，悬念感拉满；
  3. 首块高亮：第一块用强调色，明确"从这里开始推"。
- **代码原创声明**：倒塌链积分、接触角触发、三种阵列生成、牌面 canvas 纹理、相机跟随全部手写；未使用 cannon 等任何物理库；Three.js（MIT）为本地 vendor。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 倒塌链（核心） | 每块牌 `tilt.rotation.z = -θ` 绕底边前沿翻转；`θ(τ)=REST·τ^2.15` 加速式 ease-in（越倒越快，有重力感）；落定加 `0.03·sin·exp` 衰减"咔哒"回弹 |
| 2 | 接触角触发 | `θc = asin((SPACING−T)/H) ≈ 21°`，前块 θ 越过 θc 即把下一块 `t0` 置为当前时刻；每块 θc 带 ±8% 确定性抖动（mulberry32 种子），节奏有机但可复现 |
| 3 | 三种阵列 | 直线 48 块 / S 弯 54 块（`z=A·sin`，朝向取切线）/ 双排 52 块（A 排每块同时触发 B 排同位块，双链并进） |
| 4 | 触发词牌面 | CanvasTexture 256×1024：上半印触发词逐字（一块一字）、下半印编号；第一块红底米字，其余米底墨字；纹理按字缓存 |
| 5 | 相机跟随 | 待命时缓慢环绕扫视；推倒后目标=前锋牌+前瞻 8 块，`1−exp(−dt·k)` 指数追踪（k=2.6/3.4），缓慢推进；支持拖拽微调 yaw/pitch |
| 6 | 慢动作 | timeScale 1/3.4：倒塌积分与触发时序同比例拉长，相机追踪不受影响 |
| 7 | 地面引导线 | LineDashedMaterial 米色虚线，标出链条走向（S 弯/双排时尤其有用） |
| 8 | 加载态 | 「骨牌码放中」+ 循环进度条；首帧+500ms / 3s 兜底必进完成态 |

## 配置参数

在 `src/main.js` 顶部 `D` 对象调整：

- `W/H/T = 0.62/2.7/0.44`：牌宽/牌高/牌厚
- `SPACING = 1.42`：中心间距（改小更密、连锁更快；需 `< H·sin(REST)+T` 否则够不着）
- `REST = 1.27`：倒定角（弧度，≈73°）
- `FALL_TIME = 0.46`：单块倒下秒数；`SLOW_K = 3.4` 慢动作倍率
- `GRAV_POW = 2.15`：倒塌加速指数（越大后段越"砸"）
- `LAYOUTS`：各阵列块数（line 48 / sbend 54 / double 52）
- 配色：`INK/CREAM/RED` 三个常量，全页严格 3 色
- 灯光：Hemisphere 0.85 + 主光 2.1（2048 阴影）+ 红色轮廓光 0.55

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉动效（多米诺连锁倒塌）；标题/HUD/控制条均为功能性微交互，无第二主角。
2. **配色**：全页严格 3 色（墨 #0f0e0c / 米白 #f5f0e6 / 红 #dc2626），无彩虹渐变；红色只用于首块牌、推倒按钮、进度强调。
3. **字体**：系统字体栈；巨型标题 `clamp(3rem,9vw,7.2rem)` 字距 -0.02em，kicker 字距 0.5em，HUD 数字 tabular-nums，层级分明。
4. **文案**：真实感中文短句（"推倒第一块，剩下的交给连锁。"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：牌面 canvas 手绘（边框/中线/逐字/编号）、落定咔哒回弹、地面引导虚线、vignette + SVG 噪点、「骨牌码放中」加载态、按钮 hover 上浮发光。
6. **easing**：全部手写物理感缓动（`τ^2.15` 重力加速、指数追踪 `1−exp(−dt·k)`、`cubic-bezier(0.16,1,0.3,1)`），无默认 linear。

## 源码结构

```
domino-3d/
├── index.src.html      # 开发版（引用 src/main.js + importmap→vendor，落盘为准）
├── index.html          # 打包成品（单文件，验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：倒塌链 / 三阵列 / 牌面纹理 / 相机跟随 / 控件
├── vendor/
│   └── three.module.js # Three.js 本地（MIT，打包时走 importmap data: URL 内联）
├── README.md
└── ../shots/domino-3d.png / domino-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/domino-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py domino-3d
# 4. 验证（以打包成品为准）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/domino-3d/index.html" ~/workspace/fx-lab/shots/domino-3d.png 1280 800 0
```

打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在（缺失先恢复）。

## 移动端说明

- 布局：标题/HUD/控制条全部 `clamp()` + flex wrap 自适应；390×844 下标题 9vw、控制条换行收纳。
- 省电：移动端（`pointer:coarse`）停掉噪点位移；`prefers-reduced-motion` 下停掉待命环绕。
- 触摸：canvas `touch-action:none`，拖拽旋转视角；按钮均为原生 button，可点区域充足。

## 验收结论

- console：零错误（CDP 抓取 `Runtime.consoleAPICalled` + `Log.entryAdded`，error/severe 为空）。
- 外部请求：零真实外部请求（打包成品 grep `https?://` 仅命中 SVG 命名空间声明与 importmap data: URL，无网络 fetch）。
- 截图：桌面 1280×800 + 移动 390×844 已落盘 `../shots/domino-3d.png` / `domino-3d-mobile.png`。
- 完成态选择器：全部带 `html.js` 前缀（`html.js body.ready .loader/.stage/.hud/.controls`）。
- vendor：`three.module.js` 1.27MB 实体，无 <2KB 空壳。
