# 远行 · 旅行社落地页模板（travel-page）

虚构旅行社品牌「远行」的完整整站首页模板 —— 搜索条式 hero + 热门目的地 + 主题线路横滑 + 旅行家评价 + CTA + 法务三件套页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点（只学布局结构与交互编排，源码/文案/图片全部原创）

参考：Airbnb Experiences 与 Booking.com 的落地页布局。学到的布局点：

1. **搜索条式 hero**：Airbnb 式的三段搜索（目的地 / 日期 / 人数）+ 珊瑚色搜索按钮，放在大标题下方；搜索后给 toast 反馈而非跳转（演示站无后端）。
2. **热门目的地卡片网格**：Booking 式的目的地宫格，每卡 = 程序化 SVG 场景图 + 城市名 + 一句短描述 + 参考价 + "看看线路"。
3. **主题线路横滑**：Airbnb Experiences 式的横向 scroll-snap 卡带 + 左右箭头按钮，深海军反白区块承载。
4. **旅行家评价**：三列短评卡（星级 + 引用 + 署名城市/线路/出行月份），Booking 式"真实订单评价"口径。
5. **导航**：顶部透明导航，滚动后毛玻璃；移动端汉堡抽屉（Airbnb 移动端同款交互）。
6. **页脚四栏**：品牌介绍 + 探索/帮助/网站政策三栏 + 社交图标 + 版权行，法务三件套用弹窗承载。

## 动效拆解（整页只讲一个核心动效体系）

1. **加载态**：深海军全屏 loader（品牌印徽 + 珊瑚进度条），`window.load` 后最短 650ms 淡出，再触发 hero 入场；3 秒兜底必达完成态。
2. **hero 标题遮罩升起**：两行大字各套 `overflow:hidden` 遮罩，内层 `translateY(112%)→0`，`cubic-bezier(.22,1,.36,1)`，逐行 stagger .05/.18s。完成态写死为 `.hero.in .line>span{transform:translateY(0)}`，无 JS 时（`.no-js`）直接可见。
3. **滚动 stagger 入场**：`[data-rv]` 元素滚动进入视口 88% 线后加 `.in`，透明度 + 上浮 30px，组内每项递增 .09s 延迟。**实现用 scroll/resize + getBoundingClientRect 判定**（本机无头 Chromium 的 IntersectionObserver 不触发，实测改用确定性方案）；4 秒兜底全部 `.in`。
4. **目的地卡片 hover 视差浮起**：指针在卡片上移动时，整卡 `perspective(950px)` 跟随倾斜 ±7° + 上浮 12px + 阴影漫开，卡内 SVG 场景反向位移 14px 形成视差层；离场时以同一 easing 平滑回正。仅 `(hover:hover)` 设备生效，未用 `preserve-3d`（避开 blur 压平坑，本页也无相关组合）。
5. **导航**：滚动 24px 切换 `.scrolled`，透明 → 沙白 82% + `backdrop-filter: blur(14px)`；链接 hover 下划线生长。
6. **手工细节**：全页 SVG `feTurbulence` 纸纹噪点（multiply 5%）、hero 径向 vignette、滚动提示线循环下落、按钮 hover 上浮、卡片"看看线路 →" hover 右滑 5px、`prefers-reduced-motion` 下全部动画跳过直达终态。

## 配置参数（`src/main.js` 顶部）

- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / phone / phoneHref / email / mailtoHref / address / icp / year`。页脚电话/邮箱/地址/备案行、抽屉客服电话、CTA 电话按钮均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组），改文案只改这里。
- `CFG.navOffset = 24` —— 导航毛玻璃触发距离（px）；`CFG.loaderMin = 650` —— 加载态最短展示（ms）；`CFG.toastMs = 4200` —— toast 停留；`CFG.maxGuests = 20` —— 人数步进器上限。

**法务弹窗**：页脚"网站政策"区三个按钮 → 单弹窗壳 + JS 按 key 灌文案；关闭三通道（右上 ✕ / 点击遮罩 / ESC），打开时 `body overflow:hidden` 锁定背景滚动，焦点进关闭钮、关闭后回到原焦点；`≤640px` 全屏式；三篇文案均为真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条），无 Lorem。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"滚动入场 + 卡片视差"一个动效体系，不堆砌。
2. **配色定死**：深海军 `#0B2545` / 沙白 `#FAF7F0` / 珊瑚 `#FF6B4A` 三色全页统一（含 SVG 场景图只用三色及其透明度变化），无彩虹渐变。
3. **字号字距层级**：大标题 `clamp(48px,8vw,104px)` 宋体 .05em 字距；眉题 13px .42em 字距；卡片城市名 24px 宋体 / 价格 21px 宋体；评价引用 16.5px 宋体 1.85 行高。
4. **文案真实感**："玉龙雪山脚下发呆三天""领队阿哲把高反这事安排得明明白白""台风预警连夜改签一分钱没多收"；线路名/天数/价格/余席（"本月余 3 席"）都像真的。无 Lorem、无 emoji 符号列表（星级用 ★ 字符、清单用 ✓，非 emoji）。
5. **手工细节**：纸纹噪点、vignette、滚动提示线、电话按钮、抽屉链接 stagger 浮现、加载态品牌进度条。
6. **easing**：统一 `cubic-bezier(.22,1,.36,1)` 快出慢收物理感；滚动提示用同 easing 循环。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/搜索条/各区块/弹窗/toast/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL/CFG 配置 + loader + 导航 + 汉堡抽屉 + 搜索条（步进器/日期下限/toast）+ 滚动 reveal + 卡片视差 + 线路横滑 + 法务弹窗（无依赖，不用 GSAP/three.js）
- 无 `vendor/` —— 本模板零外部依赖（图片全部 CSS/SVG 程序化生成，无 Google Fonts、无 CDN、无图床热链）

## 重建方式

```bash
cd ~/workspace/fx-lab/travel-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py travel-page
```

单向一次性打包：禁止对已打包的 `index.html` 重复跑；改 `index.src.html`/`styles.css`/`src/main.js` 后重新 `cp` 再跑。

## 移动端说明

- `≤1020px`：目的地/评价改双列→单列（评价单列居中限宽），页脚四栏改双列。
- `≤900px`：汉堡菜单（右侧深海军抽屉，链接 stagger 浮现，ESC/遮罩关闭）；搜索条改纵向三段 + 全宽搜索钮；导航链接隐藏。
- `≤640px`：法务弹窗全屏式；hero 字号 `clamp` 自适应；CTA 按钮全宽。
- 触屏无 hover：卡片视差只在 `(hover:hover)` 设备绑定；横滑带保留手指滑动 + 箭头按钮。
- 渐进增强：无 JS 时所有内容直接可见（隐藏态只在 `.js` 下生效）；`<noscript>` 隐藏 loader。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` 全程监听）。
2. URL 扫描：成品零 `https` 外部 URL（源码 `grep` 0 命中；DOM 中 `[src]/[href]` 无真实 http 外链）；无 picsum/CDN/Google Fonts。
3. 截图：`shots/travel-page.png`（1280×800 整页，滚动遍历触发全部 reveal 后捕获）/ `shots/travel-page-mobile.png`（390×844），亲眼核对无裁切无乱码，toast 隐藏态伪影已修（改用 `visibility:hidden`）。
4. 隐藏元素完成态：22 个 `[data-rv]` 滚动后全部 `.in` 且 opacity 全为 1；hero 两行大字 transform 归零（matrix 恒等）；loader 隐藏。注：本机无头 Chromium 的 IntersectionObserver 不触发，改用 scroll/resize + getBoundingClientRect 确定性判定，并收紧 hero 纵向节奏使 stats 首屏可见（实测 hero 高 893→800px）。
5. 交互验证：搜索条提交 toast 文案正确（含目的地/日期/人数）；人数步进器 ± 上限 20；日期下限为当日；线路横滑左右按钮滚动正常；法务三弹窗分别打开（6/6/5 条）+ 三通道关闭 + ESC + 背景滚动锁定；SITE 变量页脚/抽屉/CTA 三处渲染一致。
6. 文案：无 Lorem/emoji 列表；线路名价格天数均为真实感中文短句。
7. 环境备注：本机多 worker 并行，CDP 偶发连接静默断开（`WS CLOSED`/`ECONNRESET`），截图/检测脚本带重试后通过。`index.html` 为单向打包产物。
