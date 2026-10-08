# 衣橱档案 · 横向滚动杂志陈列

滚轮驱动的横向杂志式陈列：纵向滚动映射为横向轨道，五幕各一件服装 3D 雕塑 + 大标题，文字/舞台/背景大词三层视差。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **SSENSE editorial**：整屏单品大片 + 巨型描边编号 + 极简文字排印。学的是"一屏一件、编号即装饰"的杂志感。
2. **Jacquemus 官网**：纵向滚动驱动的横向画廊、元素错速视差。学的是"滚轮→横向"的映射关系与多层错速。

复现的手法（实现均为原创）：Lenis 平滑滚动取 `scroll/limit` 为全局 progress，轨道 `translate3d` 横向位移；每幕 `local = progress*4 - i` 驱动三层视差（文字 -70px/幕、舞台 +55px/幕、背景大词 -170px/幕）+ 边缘幕淡出。

## 动效拆解

- **横向映射**：`#space` 高 520vh 提供纵向滚动量；`#track` fixed 横向 5×100vw；`progress = scrollY / (docH - vh)`；`trackX = -progress × (trackW - vw)`。
- **三层视差**：同一 `local` 值驱动文字、舞台、描边背景大词反向错速，营造杂志翻页的纵深。
- **幕间过渡**：非当前幕按 `|local|` 降透明度（最低 0.1），相邻幕呈幽灵态滑入。
- **计数器/进度**：右上 `01 / 05` 随 `round(progress×4)` 切换；顶部 3px 赭石细线 `scaleX(progress)`。
- **3D 舞台**：每幕独立场景（半球光 + 暖 key + 赭石 rim），服装形体包围盒归一化（最低点 y=-0.5，悬浮陈列），0.4 rad/s 慢转 + 正弦浮动 ±0.035。

## 配置参数

- `src/config.js`：`PANELS`（编号 / 中文标题 / 短句 / 材质 / 价格 / 背景英文大词 / 主色）。
- 换服装：`src/garments.js` 加 builder（返回 `THREE.Group`，最低点会被自动归一化到 y=-0.5）。
- 滚动阻尼：`new Lenis({ lerp: 0.09 })`；视差系数在 `update()` 内（-70 / +55 / -170）。
- 幕数：`#space` 高度按 `幕数 × 104vh` 调整（当前 5 幕 = 520vh）。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"滚轮横向陈列"一个核心动效，无多余转场。
2. **配色**：米白 `#f4efe6` + 墨 `#1a1712` + 赭石 `#b4552d` 三色，背景大词仅用 7% 透明描边。
3. **字体**：标题 Georgia 衬线 + 大字号 clamp(44px,5.4vw,84px)、字距 .06em；编号用 1.5px 描边空心字，有呼吸感。
4. **文案**：真实感中文短句（"风一吹，裙摆先替你回答。"），无 Lorem、无 emoji 列表。
5. **手工细节**：纸纹噪点、暗角、舞台底部手工椭圆阴影、滚轮滚动提示动画、材质 tag 胶囊。
6. **easing**：Lenis 惯性 + CSS `cubic-bezier(.2,.8,.2,1)`，无 linear。

## 源码结构

- `index.template.html` —— 开发模板（CSS 全内联 `<style>`，importmap 指 `./vendor/three.module.js`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 895KB）
- `src/config.js` —— 五幕文案 / 配色 / 背景大词
- `src/garments.js` —— 五件抽象服装形体（长裙/风衣/西装/高领衫/球鞋，Lathe/Torus/Box/Sphere 程序化）
- `src/main.js` —— 建幕、Lenis 横向映射、三层视差、渲染循环
- `vendor/` —— three.module.js + GLTFLoader/DRACOLoader + lenis.min.js + gsap.min.js（本地，无 CDN；gsap 备用当前未引用；GSAP 3.12.5 © GreenSock，standard license，头部 URL 注释已剥离以符合外链白名单）

## 模型说明

五件服装全部程序化抽象形体，**零外部依赖、零网络请求**：无 R2 外链，无 CORS 问题。WebGL 不可用时舞台显示单字占位（`.webgl-fail`），横向滚动与文案不受影响。

## 重建命令

```bash
cd ~/workspace/fx-lab/lookbook-scroll
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py lookbook-scroll
# 验收
NODE_PATH=/tmp/hcshot/node_modules node /tmp/probe2.js "file:///home/hatch/workspace/fx-lab/lookbook-scroll/index.html" 12 lookbook-scroll
grep -oh 'https://[^"'"'"' )]*' ~/workspace/fx-lab/lookbook-scroll/index.html | sort -u
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/lookbook-scroll/index.html" ~/workspace/fx-lab/shots/lookbook-scroll.png 1440 900 0
```

## 移动端说明

- ≤820px 单列布局：文字在上、舞台在下（`min(58vw,40vh)`），背景大词 44vw。
- 横向映射逻辑不变（Lenis 接管纵向滚动），触屏滑动同样触发。
- `prefers-reduced-motion`：不初始化 Lenis（原生滚动）、3D 停止旋转与浮动。

## 隐藏元素完成态审计（2026-10-05）

- 无"隐藏等 JS 显示"的内容元素：所有文字/舞台默认可见；`body.js` 入场淡入仅在 JS 成功时生效（`loaded` 双 rAF 后添加），无 JS 时内容直接可见。
- 幕间透明度由 `update()` 逐帧计算，`progress=0` 时第一幕 `local=0` → opacity 恒为 1，可达性由数学保证。
- 未覆盖 `[hidden]{display:none}`；无 `preserve-3d` + `blur` 组合（视差全部走 `translateX` + z-index 自然层叠）。
