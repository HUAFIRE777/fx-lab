# 聆木 LINGMU · 手工吉他品牌官网首页模板（instrument-page）

虚构品牌「聆木 LINGMU」的手工吉他品牌整站首页模板 —— 导航（滚动毛玻璃+移动端抽屉）+ 吉他弦波形 hero + 电吉他/木吉他/贝斯系列 tab + 艺术家墙 + 新手指南三步 + 免费体验课预约表单 + 法务三件套页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：Fender 官网。学到的布局点：

1. **产品 hero 大图区**：全屏深色氛围底 + 中央乐器大视觉 + 左侧文案双 CTA。本模板把"大图"换成原创金色线稿电吉他 SVG，琴弦是真的会振动的（rAF 物理拨弦）。
2. **系列 tab 切换**：电吉他 / 木吉他 / 贝斯三 tab，切换时卡片淡出重排。本模板每 tab 3 张产品卡（原创线稿小吉他 + 材质规格 + 明码标价）。
3. **艺术家墙**：乐手头像 + 一句话评价矩阵。本模板 6 位虚构乐手，评价全部写真实使用感受，不写代言腔。
4. **新手指南 CTA**：三步入门 + 预约表单。本模板做成"选琴→每天十五分钟→第一个和弦"三步，接免费体验课预约表单（姓名/手机校验 + 成功态）。

## 动效拆解

1. **加载态**：深木棕全屏 loader（「聆木」金字 + 金色细线滑块），`window.load` 后最短 900ms 淡出，再触发 hero 入场；5 秒 CSS 兜底放行（完成态必达）。
2. **主视觉动效（整页唯一核心动效）**：hero 吉他 **SVG 弦波形振动** —— 6 根弦每帧按 `d = A·sin(2πft+φ)·e^(-t/τ)` 重写二次贝塞尔 `d` 属性，带指数衰减的物理拨弦感；入场自动轻拨一次，悬停拨最近的弦，点击琴身拨全部（带 60ms 错峰）。`prefers-reduced-motion` 下静止为直线。
3. **hero 入场**：标题两行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，纯 CSS transition，无 GSAP 百分比坑）；kicker/副文案/CTA/吉他 stagger 90ms 递增；6.5 秒 CSS 兜底动画保证完成态。
4. **导航**：滚动 40px 切换 `.scrolled`（深棕半透明 + `backdrop-filter: blur` + 金色细线）；链接 hover 金色下划线生长；移动端汉堡 → 右侧抽屉（遮罩/X/ESC/点链接收起）。
5. **滚动 stagger**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`，`data-i` 控制 0.12s 递增延迟；入场完成后清除内联 delay，还原 hover 手感；9 秒全局兜底；无 JS 时不隐藏（`.js` 前缀门控）。
6. **卡片 hover**：产品卡上浮 10px + 线稿小吉他放大 1.06 旋转 -2° + 描边变金色；艺术家卡上浮 8px + 金色边框光。
7. **手工细节**：全页 SVG `feTurbulence` 纸纹噪点（`overlay` 混合，透明度 .055）；hero/全页 vignette 暗角；滚动提示线循环下落；按钮 hover 上浮 + 金色阴影；法务弹窗关闭钮 hover 旋转 90°。
8. **法务三件套**：页脚"网站政策"三按钮 → 单弹窗壳 + JS 按 key 灌文案（隐私/服务/Cookie 各 5 条真实感中文条款）；关闭三通道（X/遮罩/ESC），`body.locked` 锁滚动，焦点管理；≤640px 全屏式。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` —— 滚动 reveal 触发阈值。
- `CFG.loaderMin = 900` —— 加载态最短展示（ms）。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / phone / phoneHref / email / emailHref / address / icp / year`。页脚电话/邮箱/地址/备案行/版权年份、联系区均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组），改文案只改这里。
- `SERIES` —— 三系列产品数据（名称/英文名/价格/标签/规格），`guitarMini(kind)` 生成对应线稿。
- `ARTISTS` —— 艺术家墙数据（姓名/身份/评价）。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效（吉他弦波形振动），其余只有 stagger 入场和 hover 微交互，不堆砌视差/3D/粒子。
2. **配色定死 3 色**：深木棕 #2B1D14 / 奶油 #F3EAD8 / 金 #C9A227 全页统一，无彩虹渐变；深浅变化只用同色系透明度叠加。
3. **字体讲究**：标题宋体栈字距 .12–.5em、行高 1.28 有呼吸感；英文小字（LINGMU/DAWN）字距 .4–.6em 做装饰；正文字距 .04–.08em。
4. **无 Lorem、无 emoji**：文案全部真实感中文短句（"让每根弦都有回响""弦距调得比我自己调的还舒服"）；社交图标为原创 inline SVG 线稿；吉他图为原创金色线稿 SVG。
5. **手工细节**：vignette 暗角、纸纹噪点、加载态、滚动提示线、按钮微浮、卡片线稿变色、表单成功态、弹窗焦点管理。
6. **easing 物理感**：`cubic-bezier(.22,1,.36,1)`（out-expo 系）做入场与 hover，弦振动用正弦 × 指数衰减模拟真实拨弦；hover 上浮偏慢（.45–.6s），沉稳不弹跳。

## 源码结构

```
instrument-page/
├── index.src.html   # 源码 HTML（打包输入；打包后勿直接改 index.html）
├── index.html       # 打包产物：单文件 48KB，可直接双击打开/交付
├── styles.css       # 源码样式（打包时内联）
├── src/main.js      # 源码脚本：CFG/SITE/LEGAL/SERIES/ARTISTS 配置 + 交互（打包时内联）
├── vendor/          # 本地库目录（本模板纯原生实现，无外部库）
└── README.md        # 本文件
```

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py instrument-page
# 一次性单向打包，生成 index.html。禁止对已打包的 index.html 二次打包：
# 改 src 后先 cp 覆盖 index.html 再跑一次。
```

## 移动端说明

- ≤860px：导航链接/CTA 隐藏 → 汉堡按钮 + 右侧抽屉（含遮罩/X/ESC 关闭，点链接自动收起）；hero 改单列（文案上、吉他下），双 CTA 全宽；系列卡/艺术家墙 2 列；新手三步单列；CTA 预约卡上下排；页脚 2 列。
- ≤640px：系列卡/艺术家墙单列；页脚单列；法务弹窗全屏式（无圆角、撑满视口）；loader 字号缩小。
- 触屏上弦振动的 hover 拨弦不触发（无 hover），点击拨弦与入场自动拨弦正常工作；stagger 入场与 tab 切换正常。
- `prefers-reduced-motion`：全部动画降为 .01ms，琴弦静止为直线。
