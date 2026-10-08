# 打字机代码 · 3D 粒子阵列

看一段 15 行的 JS 循环代码被逐字敲出来，点「运行」后 24 根粒子柱跟着代码的每一行从地面升起来。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **Stripe docs 的代码块展示**：行号 + 语法高亮 + 一键复制的"文档式代码"质感。学的是"代码本身就是展品"的呈现方式——等宽字体、克制的行高、关键字先行。
2. **carbon.now.sh 的代码美学**：macOS 红绿灯窗口头、代码截图感。学的是"把代码框做成一张值得截图的卡片"（窗口头 + 圆角 + 状态栏）。

复现的手法（实现均为原创）：逐字符打字机（空格加速、行尾停顿、关键字打完闪光点亮）、运行中当前执行行琥珀色高亮、3D 柱体 `backOut` 回弹升起、迷你终端日志逐行打印。

## 动效拆解

- **打字机**：代码以 `[类型, 文本]` token 数组存放，逐字符追加；关键字（绿 `#3FB950`）/函数名（亮绿）打完瞬间闪光；光标块闪烁跟随。
- **运行**：5 个步骤按绝对时间调度，每步先点亮对应代码行（琥珀底），再触发 3D 动作——①参数行→底座圆盘 `backOut` 弹出；②group 行→琥珀线框包围盒淡入；③循环行→终端打印"遍历 24 个格子"；④循环体行→24 根柱体逐根 `backOut(1.5)` 升起、顶部琥珀粒子 `backOut(2.2)` 弹出；⑤GridHelper 行→底座网格淡入收尾。
- **完成态**：右上角绿色徽标 `is-in` 弹出、镜头轻轻推进、进入 idle 缓慢自转。
- **微交互**：拖拽旋转 / 滚轮缩放（手写轨道控制，不依赖 addons）；悬停柱子时顶部粒子放大 1.7 倍。

## 配置参数

- `src/main.js` 顶部：`CODE`（代码内容与配色 token）、`COLS/ROWS/GAP`（阵列规模）、`colH`（柱高伪随机函数，确定性，同代码永远同阵列）。
- 打字速度：`typeCode` 内 `sleep(ch === ' ' ? 6 : 15)`；运行各步时间：`runAll` 内 `at(t, fn)` 绝对时间表。
- 换代码：改 `CODE` 数组 + `runAll` 的行号映射（`markLines([...])`）。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"代码逐行生长成 3D"一个核心动效，无多余装饰。
2. **配色**：深黑 `#0D1117` + 绿 `#3FB950` + 琥珀 `#D29922` 三色定死，无渐变滥用。
3. **字体**：等宽代码 13.5px/行高 1.75，行号 12px 收敛；标题 15px 字距 .04em，有呼吸感。
4. **文案**：真实教学代码（循环生成粒子阵列，中文注释写人话），无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角、SVG 噪点、按钮 hover 浮起/active 缩放、运行按钮呼吸光环、加载 shimmer 条。
6. **easing**：自研 tween 引擎，全部 `backOut` / `outCubic` / `inOutCubic`，无 linear。

## 源码结构

- `index.template.html` —— 开发模板（CSS 全内联 `<style>`，importmap 指 `./vendor/three.module.js`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 888KB）
- `src/main.js` —— 打字机、Three.js 场景、运行序列、轨道控制、悬停射线
- `src/tween.js` —— 自研微型补间引擎（duration/delay/ease/update/complete；vendor 的 gsap.min.js 经查只是 132 字节的 license 头、无本体，故自研替代）
- `vendor/` —— three.module.js（本地，无 CDN）

## 模型说明

全部程序化几何（圆柱/球体/线框盒/GridHelper），**零外部依赖、零网络请求**：无 R2 外链，无 CORS 问题。WebGL 不可用时编辑器打字与按钮逻辑照常工作。

## 重建命令

```bash
cd ~/workspace/fx-lab/code-typing-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py code-typing-3d
# 验收（打字→运行→完成态全链路）
NODE_PATH=/tmp/hcshot/node_modules timeout 120 node /tmp/probe-run2.js "file:///home/hatch/workspace/fx-lab/code-typing-3d/index.html"
grep -oE 'https?://[^"'"'"' )]+' index.html | sort -u
```

## 完成态可达性审计（无头靠读代码）

- `.done-badge` 初始 `opacity:0`，`onRunDone()` 必加 `is-in` 类（探针已验证 `doneBadge is-in: true`）。
- 运行按钮初始 `disabled`，`typeCode` 正常结束必解禁（探针已验证 armed）。
- `clearStage()` 内 `killAll()` 停掉所有补间，重置后无残留动画。

## 移动端说明

≤900px 时上下堆叠：编辑器在上（代码区最高 46vh 可滚）、3D 视口在下（52vh）；顶栏副标题隐藏。触摸拖拽旋转经 pointer 事件支持。
