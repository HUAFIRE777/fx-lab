# 加购飞入 · 3D 购物车

点击商品卡「加入」后，3D 缩略图沿抛物线飞入右上角购物车，抽屉从右侧滑出，件数徽标弹跳、总价数字逐位翻牌。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **Apple Store App 加购动效**：商品图抛物线飞入购物车图标、图标轻微回弹。学的是"飞入轨迹 + 落点反馈"的节奏感。
2. **Nike App 购物车抽屉**：右侧滑出、清单行内直接增减数量、总价实时更新。学的是"抽屉内闭环改数量"的交互结构。

复现的手法（实现均为原创）：二次贝塞尔抛物线（控制点取中点上方 150px，`power2.in` 加速落袋感）、购物车徽标 `back.out` 回弹、总价逐数字位翻牌（0–9 竖排 strip + `translateY`）、抽屉 `cubic-bezier(.2,.8,.2,1)` 滑出。

## 动效拆解

- **飞入**：点击「加入」→ 截取该卡 3D 缩略图（canvas.toDataURL，WebGL 无纹理不污染）→ 按起/落点坐标算二次贝塞尔 → GSAP 0.72s `power2.in`，同时缩放 1→0.26、旋转 50° → 落点后移除。
- **徽标**：数量 `scale(0)→scale(1)` 弹簧出现；每次落袋 `gsap.fromTo scale 1.7→1, back.out(3)`。
- **抽屉**：`translateX(105%) → 0`，0.55s `--ease-out`；遮罩同步淡入；空态有虚线篮子插画。
- **翻牌总价**：数字位竖排 0–9，`translateY(-d em)` 拨动，0.55s；千分位逗号为静态分隔符；仅字符结构变化时重建 DOM。
- **卡片 3D**：每卡独立小场景（key 光 + 橙色 rim 光），0.55 rad/s 慢转 + 正弦浮动；首帧渲染后淡入。

## 配置参数

- `src/config.js`：`PRODUCTS`（id / 中文名 / 短句 / 价格 / 抽屉无图时的单字 fallback）、`ACCENT`。
- 换商品：改 `PRODUCTS` + 在 `src/products3d.js` 加同名 builder（返回 ~1 单位高的 `THREE.Group`，底部基座用 `pedestal()`）。
- 飞行动画时长/抛物线高度：`src/main.js` → `flyToCart`（duration 0.72、控制点 `-150px`）。
- 翻牌时长：CSS `.digit .strip` transition 0.55s。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"加购飞入"一个核心动效，无多余装饰动画。
2. **配色**：墨黑 `#0c0d10` + 白 + 橙 `#ff5c1f` 三色，无渐变滥用（背景仅两处极淡的橙色光晕）。
3. **字体**：大标题 clamp(36px,5vw,62px)、字距 .05em、行高 1.12，有呼吸感；数字全部 tabular-nums。
4. **文案**：真实感中文短句（"戴上，世界就安静了"），无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、空购物车虚线篮子。
6. **easing**：全部 `cubic-bezier(.2,.8,.2,1)` / `back.out` / `power2.in`，无 linear。

## 源码结构

- `index.template.html` —— 开发模板（CSS 全内联 `<style>`，importmap 指 `./vendor/three.module.js`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 961KB）
- `src/config.js` —— 商品数据 / 配色
- `src/products3d.js` —— 四件程序化 3D 商品（耳机/杯子/手表/音箱）+ 基座
- `src/main.js` —— 卡片渲染、飞入抛物线、抽屉、翻牌、步进器
- `vendor/` —— three.module.js + GLTFLoader/DRACOLoader + gsap.min.js（本地，无 CDN；GSAP 3.12.5 © GreenSock，standard license，头部 URL 注释已剥离以符合外链白名单，版权归属见本节）

## 模型说明

四件商品全部程序化几何，**零外部依赖、零网络请求**：无 R2 外链，无 CORS 问题，无加载失败态。WebGL 不可用时卡片显示单字占位（`.webgl-fail`），页面其余功能完整。

## 重建命令

```bash
cd ~/workspace/fx-lab/cart-fly-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py cart-fly-3d
# 验收
NODE_PATH=/tmp/hcshot/node_modules node /tmp/probe2.js "file:///home/hatch/workspace/fx-lab/cart-fly-3d/index.html" 12 cart-click
grep -oh 'https://[^"'"'"' )]*' ~/workspace/fx-lab/cart-fly-3d/index.html | sort -u
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/cart-fly-3d/index.html" ~/workspace/fx-lab/shots/cart-fly-3d.png 1440 900 0
```

## 移动端说明

- ≤900px 网格 2 列，顶栏导航隐藏，抽屉宽 94vw。
- `prefers-reduced-motion`：跳过抛物线飞行动画（直接加购），CSS 过渡全部压到 0.01ms。
- 触屏：加入/步进器均为原生 button 点击，无 hover 依赖。

## 隐藏元素完成态审计（2026-10-05）

- 抽屉默认 `translateX(105%)`：受控面板，`.open` 类可达（点击购物车按钮 / 每次加购自动打开）。
- 徽标默认 `scale(0)`：装饰性计数，`.show` 类随数量可达。
- `body.js` 入场淡入：JS 第一行即加 `js` 类，无 JS 时内容直接可见；`loaded` 在双 rAF 后添加，失败时页面仍可见。
- 未覆盖 `[hidden]{display:none}`；无永久隐藏的内容元素。
