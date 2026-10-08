# 黑板推导 · 为什么球表面积是 4πr²

一块黑板，粉笔逐笔写出"球表面积"的 4 步推导，右边的 3D 线框球跟着每一步转过去给你看。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **3Blue1Brown 的分镜节奏**：一个结论只讲一条主线，每步只抛一个新想法（"薄带面积与纬度无关"就是那个 aha 时刻）。学的是"一步一惊奇"的叙事切分。
2. **可汗学院黑板风**：深绿黑板 + 粉笔白板书 + 黄色标重点。学的是"板书三色"的视觉纪律——白写过程、黄写结论。

复现的手法（实现均为原创）：SVG 逐字显现 + 粉笔头光标跟随手绘下划线描边、粉笔尘粒子、feTurbulence 粉笔糙边滤镜、3D 旋转角度与步骤绑定。

## 动效拆解

- **粉笔书写**：每步文案由 JS 生成 SVG `<text>`，每个汉字一个 `<tspan>`，45ms 间隔逐字显现；公式下方有一条手绘波浪下划线（seeded 随机，保证每次形状一致），用 `stroke-dashoffset` 0.9s 描出，粉笔头圆点沿 `getPointAtLength` 跟随，伴随 5 粒粉笔尘。
- **步骤切换**：下一步→动画书写；上一步→瞬间落定（粉笔已写过，不重写）；空格/←/→ 键同样翻页。
- **3D 联动**：线框球（粉笔白）+ 外切圆柱线框；第 2 步弹出一条琥珀色薄带并呼吸脉冲；第 3 步 9 条薄带逐条弹出；第 4 步圆柱染成粉笔黄、球旋转整整一周。每步 `rotY` 目标不同，用 `inOutCubic` 1.3s 转过去。
- **微交互**：3D 侧板可拖拽旋转 / 滚轮缩放（手写轨道控制）；无操作 3 秒后缓慢自转。

## 配置参数

- `src/main.js` 顶部 `STEPS`：每步的 `label/lines/formula/big/rotY/cap`（文案/公式/是否大字/3D 旋转目标/侧板解说）。
- 换推导主题：改 `STEPS` 文案 + `drive3D(i)` 里的 3D 出现逻辑；下划线宽度随公式长度在 `buildStep` 内 `w` 常量调。
- 书写速度：`animateDraw` 内 `per`（行 0.045/字、公式 0.07/字）。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"粉笔推导 4πr²"一个核心动效，无多余装饰。
2. **配色**：黑板绿 `#1E3A2F` + 粉笔白 `#F5F2E9` + 粉笔黄 `#F2C94C` 三色定死（木框深棕仅作画框）。
3. **字体**：板书全用楷体（`Kaiti SC` 优先），公式 46px、结论 64px，字距宽松，有呼吸感。
4. **文案**：真实推导语句（阿基米德圆柱包裹法，四步），无 Lorem、无 emoji 列表。
5. **手工细节**：粉笔糙边滤镜、粉笔尘、木框 + 内阴影黑板、按钮 hover 描边变黄、加载"黑板准备中"。
6. **easing**：自研 tween 引擎，全部 `backOut` / `outCubic` / `inOutCubic`，无 linear。

## 源码结构

- `index.template.html` —— 开发模板（CSS 全内联 `<style>`，importmap 指 `./vendor/three.module.js`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 885KB）
- `src/main.js` —— 粉笔 SVG 书写引擎、步骤机、Three.js 线框场景、轨道控制
- `src/tween.js` —— 自研微型补间引擎（与 code-typing-3d 共用同一份；vendor 的 gsap.min.js 经查只是 132 字节 license 头、无本体，故自研替代）
- `vendor/` —— three.module.js（本地，无 CDN）

## 模型说明

全部程序化几何（线框球/线框圆柱/球面薄带），**零外部依赖、零网络请求**：无 R2 外链，无 CORS 问题。WebGL 不可用时黑板书写与翻页逻辑照常工作。

## 重建命令

```bash
cd ~/workspace/fx-lab/whiteboard-derive-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py whiteboard-derive-3d
# 验收（4 步翻页全链路）
NODE_PATH=/tmp/hcshot/node_modules timeout 120 node /tmp/probe-wb.js "file:///home/hatch/workspace/fx-lab/whiteboard-derive-3d/index.html"
grep -oE 'https?://[^"'"'"' )]+' index.html | sort -u
```

## 完成态可达性审计（无头靠读代码）

- `.step` 组默认 `display:none`，`showStep()` 必给当前组加 `.current`（`display:block`）；探针已验证 4 步标签/指示器/解说全部正确出现。
- `finalizeInstant()`（上一步路径）把全部 tspan 置 `opacity:1`、下划线 `dashoffset=0`、藏粉笔头——无"写一半卡住"状态；探针已验证回退后 19 字全部可见。
- 第 4 步 `btnNext.disabled=true`、`dots` 4 个全亮，终态明确。

## 移动端说明

≤900px 时上下堆叠：黑板在上（≥52vh）、3D 侧板在下（≥44vh）；顶栏提示隐藏。触摸拖拽旋转经 pointer 事件支持。
