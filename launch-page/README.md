# 产品发布页 · Aria Buds Pro

Apple 发布会式新品发布整站模板：粘性产品视觉随滚动旋转叙事，三屏故事 + 高光参数条 + 规格网格 + 预购 CTA，纯黑三色，可直接换文案交付客户上线。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点（手法学习，代码/文案/视觉全部原创）

参考对象：Apple 产品发布会页面（如 AirPods Pro 发布页）。只学**布局结构和交互编排**，未复制任何源码、文案、图片、商标。学的 5 个布局点：

1. **极简产品导航**：左产品名、右锚点菜单（概览/降噪/续航/音质/技术规格）+ 醒目购买按钮；滚动后吸顶 + 毛玻璃（backdrop-filter blur）。
2. **全屏 hero**：产品大视觉（本页用 SVG 手绘真无线耳机示意，艺术化）+ 产品名 + 价格 + 双 CTA（立即预购 / 查看技术规格）。
3. **滚动叙事长区块 3 屏**：降噪 / 续航 / 音质，每屏大字标题 + 短句 + 小视觉，随滚动逐屏揭示；一只大耳机视觉粘性停留，随滚动进度旋转/缩放/位移。
4. **高光参数条**：一行三个关键数字（−48dB / 40小时 / IPX5），数字滚动进场。
5. **规格参数网格表 + 预购 CTA 区块 + 简约页脚**：6 卡规格网格，大 CTA 收尾，页脚只留版权/链接/脚注。

虚构产品：Aria Buds Pro（真无线降噪耳机，¥1299）。文案为真实感中文短句，无 Lorem ipsum、无 emoji 符号列表。

## 动效拆解

- **Hero 入场编排**：`.ready` 类触发后 5 组元素（耳机视觉/kicker/标题/tag+价格/CTA/滚动提示）按 0.08–0.62s  stagger 上升淡入，`cubic-bezier(.2,.8,.2,1)`；耳机视觉另有 6s 悬浮循环。
- **滚动叙事（主视觉）**：`#narr` 内 `.stage` 用 `position:sticky` 钉住 3 屏；rAF 节流的 scroll 监听算 0–1 进度，驱动耳机 `rotate(−14°→+14°)` / `scale(1→1.18)` / X 漂移 ±22px / Y 上浮，有 GSAP 时走 `gsap.set`（quickSetter 级性能），无则原生 transform。纯 CSS transform，不用 three.js。
- **逐屏揭示**：每屏 `.screen` 进入 35% 视口即加 `.on`，标题/段落/小视觉按 0.12s 间隔升起（`r2/r3/r4` 延迟类）。
- **数字滚动**：`−48` / `40` 用 `requestAnimationFrame` + easeOutQuart 1.4s 逐数，tabular-nums 防抖动。
- **续航环**：进入续航屏后 SVG 圆环 `stroke-dashoffset` 1.6s 画满（纯 CSS，过渡由 `.screen.on` 触发）。
- **手工细节**：SVG 噪点全屏（data URI feTurbulence，零外部请求）、radial 暗角 vignette、导航滚动毛玻璃、锚点当前项下划线高亮、按钮 `back.out` 级缩放反馈、加载态（黑屏 + 耳机剪影 + 进度条，保底 3.5s 强制消失，永不卡死）。
- **降级**：全部隐藏态只在 `html.js` 下生效（head 内一行内联脚本加类），无 JS/IO 不可用时内容直接可见；`prefers-reduced-motion` 下停用全部位移动画。

## 配置参数

- 换产品名/价格：`index.src.html` 内 `Aria Buds Pro` / `¥1299` 全文替换（导航、hero、CTA、页脚、title/meta）。
- 换三屏文案：`#anc` / `#battery` / `#sound` 三个 `.screen` 的 `h2` + `p`。
- 高光参数：`.parambar` 三个 `.stat`；可数数字用 `data-count="48" data-prefix="−"`，JS 自动滚动。
- 规格表：`.specgrid` 内 6 个 `.spec` 卡片增删。
- 叙事动效幅度：`src/main.js` → `narrTick`（rot −14→+14、scale 1→1.18、x ±22、y −17）。
- 配色：`styles.css` → `:root` 三色 `--bg #000 / --fg #fff / --mut #86868B`（白色系半透明用于毛玻璃/分割线，不新增色相）。
- **公司信息一改全改**：`src/main.js` 顶部 `SITE = { brand, address, email, phone, icp }`，页脚/预购区/法务区用 `data-site="…"` 占位自动渲染；"联系我们"链接 href 由 JS 拼 `mailto:`。买家只需改 SITE 五个值。

## 法务三件套（独立区块实现，2026-10-05 追加企业标配）

- 预购 CTA 之后、页脚之前有独立 `<section id="legal">`：三栏（桌面 grid 3 列 / ≤640px 堆叠单列）。
- 三栏内容：**隐私政策**（收集的信息/用途/保存/您的权利/安全措施，共 5 条）、**服务条款**（预购与发货/退款政策/价格与优惠/保修服务/服务变更，共 5 条）、**Cookie 政策**（用途/不做的事情/自行管理/保留期限，共 4 条）。文案为真实感中文通用条款，无 Lorem ipsum。
- 页脚有三个锚点链接 `href="#legal"`（隐私政策/服务条款/Cookie 政策），点击经 `html{scroll-behavior:smooth}` 平滑滚动到法务区块（CDP 实测三链逐个点击均多步渐进、终点=legal 顶部）。
- 页脚版权行 `© <年> <SITE.brand> Audio · <SITE.icp>`；社交图标 X/YouTube/微信为 inline SVG，hover 变白 + 上浮 2px；法务区末尾有联系行（地址/邮箱/电话均走 SITE）。
- 配色仍死守 #000/#fff/#86868B 三色，未引入新色。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"一款耳机的发布叙事"一件事；动效只有入场、揭示、叙事旋转、数字四种，无装饰动画。
2. **配色**：纯黑 #000 + 白 + 灰 #86868B 三色定死，无彩虹渐变（光晕仅用白色径向淡出）。
3. **字体**：系统字体栈（无 Google Fonts）；大标题 clamp(44px,7.5vw,96px)、字距 −.015em、行高 1.05；数字 tabular-nums。
4. **文案**：真实感中文短句（"戴上，世界安静了。""充一次电，听一整周。"），无 Lorem、无 emoji 列表；页脚有实验室脚注拟真。
5. **手工细节**：vignette 暗角、SVG 噪点、耳机悬浮、按钮 active 缩放、滚动提示线生长动画、续航环绘制、锚点高亮下划线。
6. **easing**：全部 `cubic-bezier(.2,.8,.2,1)` / easeOutQuart / `back.out` 级弹簧，无 linear（均衡器用 ease-in-out 正弦循环属呼吸感例外）。

## 源码结构

- `index.src.html` —— 开发源码（link styles.css / classic script 引入 vendor + src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 103KB，**单向生成，不可重复打包**）
- `styles.css` —— 全部样式（三色变量、响应式断点 900/640px）
- `src/main.js` —— 全部交互（classic script，无 ES module，无 three.js）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72214→72190 字节；头部注释内 `https://gsap.com` URL 已剥离以符合零外链白名单，版权归属 GreenSock，见本节）
- `README.md` —— 本文件

## 重建命令

```bash
cd ~/workspace/fx-lab/launch-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py launch-page   # 单向，只跑一次
# 验收
NODE_PATH=/tmp/hcshot/node_modules node /tmp/probe-launch.js "file:///home/hatch/workspace/fx-lab/launch-page/index.html"
grep -oh 'https://[^"'"'"' )<>]*' ~/workspace/fx-lab/launch-page/index.html | sort -u   # 应为空
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/launch-page/index.html" ~/workspace/fx-lab/shots/launch-page.png 1440 900 0
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/launch-page/index.html" ~/workspace/fx-lab/shots/launch-page-mobile.png 390 844 1
```

**vendor 完整性必查**（打包前）：`ls -la vendor/`，每个 .js 必须 >2KB 且是真实库内容——本页 gsap.min.js 72190 字节，头部为 `GSAP 3.12.5` 版权声明，空壳=事故（前车之鉴见第三波 cart-fly-3d 返修）。

## 移动端说明

- ≤640px：导航收起为汉堡菜单（全屏下拉毛玻璃面板，ESC/点选关闭）；hero 双 CTA 纵向堆叠；叙事三屏全部左对齐（取消右侧屏的右对齐）；参数条改单列；规格网格改单列；粘性耳机缩小至 56vw。
- 已验 390×844：hero、汉堡开关、滚动揭示均正常（见 `shots/launch-page-mobile.png`）。
