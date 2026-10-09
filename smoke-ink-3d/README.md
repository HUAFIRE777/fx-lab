# smoke-ink-3d · 墨 / 烟雾墨水扩散

一句话介绍：一滴墨落进深水的全屏流体烟雾——FBM 噪声驱动的墨色在水中晕开、翻卷、缓缓升起，鼠标移动搅动、点击激起涟漪，边缘消散。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：香氛/茶品牌 hero 区常见的"流体烟雾着色器"（深色底 + 一团缓慢翻卷的彩色烟雾 + 鼠标扰动）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 全屏单 quad + fragment shader 做烟：不做流体解算器，用 FBM domain warp 伪造翻卷；
  2. 鼠标速度向量扰动采样域：离指针越近扰动越强，营造"搅动"的真实感；
  3. 纵向包络：底部浓、顶部淡、边缘消散，烟雾看起来"从底部升起"而不是满屏贴图。
- **代码原创声明**：value-noise FBM、domain warp、涟漪旋涡、搅动衰减全部为手写 GLSL/JS；未引用任何原站或第三方 shader 源码；Three.js（MIT）仅作全屏 quad 载体。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 烟主体 | 5 层 octave value-noise FBM；两次 FBM 做 domain warp 扭曲采样域，造出翻卷的丝缕 |
| 2 | 细节层 | 第二路 FBM（更高频、反向 warp）× 0.26 叠加，烟边有细丝而不是光滑色块 |
| 3 | 缓缓升起 | 采样域 `q.y -= t*0.055` 随时间上移 + 纵向包络 `smoothstep(1.15,0.16,uv.y)`，底部浓、顶部淡 |
| 4 | 边缘消散 | 径向 `smoothstep(0.74,0.30,dist)` 让烟在画面边缘化开消失 |
| 5 | 鼠标搅动 | pointermove 算速度向量 → 累加到 `uStir`（限幅 0.9）→ 按 `exp(-d²*2.6)` 距离衰减扰动采样域；每帧 `exp(-dt*3.4)` 衰减 |
| 6 | 点击涟漪 | pointerdown 设 `uClick` + `impulse=1`；shader 里以点击点为中心的切向旋涡 `tang`，冲击 `exp(-dt*2.2)` 衰减 |
| 7 | 墨色切换 | 三档 uniform 颜色（冰蓝/绯/苔绿），JS 侧 `inkCur.lerp(inkTgt, 1-exp(-dt*4))` 指数过渡，无跳变 |
| 8 | 浓核微光 | `col += uInk * pow(smoke,3) * 0.32`：烟最浓处微微发亮，仍是同一墨色 |
| 9 | 加载态 | 「酝酿中」+ 墨滴呼吸动画；首帧渲染后（4 帧）/ load+400ms / 3.5s 三重兜底必进 `html.done` |
| 10 | 质感层 | CSS vignette + SVG feTurbulence 细噪点（steps 跳动），z-index 排序，不用 blur（避 preserve-3d 压平坑） |

## 配置参数

在 `src/main.js` 顶部 / shader uniform 处调整：

- `diffuse`（滑杆 0.2–2，默认 1）：扩散速度倍率，直接乘进 `uTime`
- 上升速度：fragment 中 `flow = vec2(0.0, -t * 0.055)` 的系数
- 烟浓度阈值：`smoothstep(0.36, 0.88, dens)`（阈值越低烟越浓）
- 搅动强度：`warpOff = uStir * (0.30 + 1.6 * prox)`；限幅 `0.9`；衰减 `exp(-dt*3.4)`
- 涟漪强度/范围：`ripple * 1.1`，高斯半径 `exp(-dcl²*2.4)`；衰减 `exp(-dt*2.2)`
- 换色过渡：`inkCur.lerp(inkTgt, 1-exp(-dt*4.0))`
- FBM 层数：`fbm()` 内循环 5 次（性能/质量权衡点）
- 配色：`:root` 中 `--bg:#0b0e14` `--ink-paper:#e8eef5` `--accent:#7dd3fc`；墨水三档 `#7dd3fc / #f472b6 / #a3e635`

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉动效（烟雾）；标题/控制条/噪点均为配角，无第二主角。
2. **配色**：全页严格 3 色（墨底 #0b0e14 / 纸白 #e8eef5 / 冰蓝 #7dd3fc）；墨水一次只用一档三选一（绯/苔绿切换时冰蓝退场），无彩虹渐变。
3. **字体**：系统字体栈；巨标题 `clamp(3.4rem,13vw,9.5rem)` 字重 900，kicker mono 11px 字距 0.5em，描述 0.14em 字距行高 2，层级分明；标题逐组上浮入场。
4. **文案**：真实感中文短句（"一滴墨落进深水，散开，翻卷，又慢慢消失不见。"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：vignette + 细噪点（steps 跳动）、墨滴呼吸加载态、chip 选中发光、滑杆拇指辉光、hint 呼吸圆点、烟雾浓核微光。
6. **easing**：全部物理感缓动（`cubic-bezier(0.16,1,0.3,1)` 入场、指数趋近 `1-exp(-dt*k)` 换色/衰减），无默认 linear。

## 源码结构

```
smoke-ink-3d/
├── index.src.html   # 源码（样式内联 <style>，importmap 指向 vendor）
├── index.html       # 打包产物（单文件，fx-singlefile.py 生成，单向不回写）
├── src/
│   └── main.js      # ESM 入口：加载态门控 → 指针搅动 → 控制条 → Three 全屏 shader
├── vendor/
│   └── three.module.js  # three（MIT），/tmp/three.module.min.js 副本，供 file:// 预览
└── README.md
```

## 重建方式

```bash
# 1. 改源码（只改 index.src.html / src/main.js，不动 index.html）
# 2. 打包（一次性单向；确认 /tmp/esb 与 /tmp/three.module.min.js 存在）
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py smoke-ink-3d
# 3. 验证：无头只抓 console 错误（file:// 禁 ES module，不纠结黑屏）
# 4. 截图：NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
#      "file://$HOME/workspace/fx-lab/smoke-ink-3d/index.html" out.png 1280 800 0
```

注意：打包器会把 `index.html` 原地改写为内联单文件，**不要对已打包的 index.html 重复跑**；改 src 后先 `cp index.src.html index.html` 再跑。

## 移动端说明

- `pointermove/pointerdown` 同时覆盖触屏：手指滑动即搅动，点击即涟漪。
- 390×844 下标题/控制条自动收拢：hint 独占一行置顶，chips 与滑杆居中换行；`env(safe-area-inset-bottom)` 避开小横条。
- `prefers-reduced-motion`：时间流速 ×0.15，噪点/墨滴/hint 动画全部关闭。
- 性能：单 quad 全屏 fragment（约 15 次 noise 求值/像素），移动端 GPU 无压力；`devicePixelRatio` 上限 2。
