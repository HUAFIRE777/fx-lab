# 屿咖 ISLE · 咖啡品牌落地页模板（coffee-brand-page）

独立咖啡品牌整站首页模板 —— 全屏氛围 hero（蒸汽粒子 + 视差）+ 豆单横滑 + 订阅计划 + 门店 + 品牌故事 + CTA + 完整页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：Starbucks Reserve 与 Blue Bottle Coffee 官网。学到的布局点：

1. **顶栏**：左品牌印徽（圆形"屿"字 + 屿咖/ISLE·烘焙工作室）、中导航（豆单/订阅/门店/故事）、右"门店查找"CTA；滚动 40px 后透明→深咖毛玻璃（`backdrop-filter: blur`）。
2. **全屏氛围 hero**：深色底 + 大标题（屿咖 + ISLE COFFEE ROASTERS 英文副标）+ 一句定位语（"把海岛的慢，烘进每一杯"）+ 双 CTA（实心焦糖钮 + 幽灵钮）；右侧咖啡杯视觉 + 上升蒸汽。
3. **咖啡豆产品线横滑**：一横排豆袋卡片（snap 滑动），每款 = 豆袋示意 SVG + 产地/处理法 + 风味描述 + 价格 + 烘焙度徽。
4. **咖啡订阅会员区块**：深色反转区块，三档订阅（尝鲜/日常/年度）+ "最多人选"徽 + 随时取消承诺。
5. **品牌故事 + 门店**：创始叙事三段 + 数据徽（7 年/4 款豆/3 家店/8000+ 会员）；三家门店卡片（地址/营业时间/电话/一句话特色）。
6. **页脚**：品牌/探索导航/联系信息/网站政策三件套/社交图标/版权行。

## 动效拆解

1. **加载态**：全屏奶油底 loader（"屿"印徽呼吸 + 焦糖进度条 + "正在暖杯…"），`window.load` 后最短 650ms 淡出，再触发 hero 入场；4s 兜底不卡死。
2. **核心动效·蒸汽粒子**：canvas 程序化粒子（30 粒，径向渐变柔边），从杯口升起、正弦摇摆、透明度按生命周期正弦衰减；hero 离开视口 / 标签页隐藏时自动停跑，省电。
3. **核心动效·hero 视差**：`data-plx` 三层（背景暖光 0.28 / 文案 0.06 / 咖啡杯 -0.1），rAF 节流随滚动错速位移；hero 滚出 1.4 屏后停止计算。
4. **hero 入场**：标题/副标/定位语/按钮逐行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，`cubic-bezier(.19,1,.22,1)`，stagger .05→.5s）。
5. **滚动 reveal**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`，各区块子元素用 `--d`  stagger 递进上浮；数字徽（7/4/3/8000+）滚动进入时 easeOutCubic 计数。
6. **hover 微交互**：豆卡/门店卡上浮 8px + 阴影漫开 + 豆袋微旋转；订阅卡边框变焦糖；导航链接下划线生长；按钮上浮 + 阴影（轻微过冲 easing）。
7. **法务弹窗**：单弹窗壳 + JS 按 key 灌文案；打开 scale .98→1 上浮；关闭三通道（右上 X / 遮罩 / ESC）；`body.lock` 锁背景滚动；焦点进关闭钮、关闭后回到原焦点。
8. **汉堡抽屉**（≤900px）：全屏深咖 overlay，链接 stagger 浮现；ESC/点链接关闭。
9. **完成态可达验证**：所有"CSS 先隐藏等 JS 显示"的规则，隐藏态只在 `.js` 下生效（无 JS 直接可见 + `<noscript>` 兜底）；完成态选择器（`.js .reveal.in`、`.js .hero.enter .rl-in`）特异度高于初始态且只用 class 切换、**不清行内 transform**（studiofreight 坑已避）；`prefers-reduced-motion` 下全部直达终态。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` —— 滚动 reveal 触发阈值。
- `CFG.loaderMin = 650` —— 加载态最短展示（ms）。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / address / phone / phoneHref / email / emailHref / hours / icp / year`。页脚与门店卡电话、邮箱、地址、营业时间、版权行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + en + updated + points` 数组），改文案只改这里。

## 法务三件套（弹窗实现）

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗。
- 关闭三通道：右上 X、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖订阅规则、退换、信息保存期限等），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/小红书/抖音，几何抽象线稿），hover 变焦糖色上浮。
- 版权行：`© {year} {name} · {icp}` 由 SITE 渲染，`icp` 默认为 `沪ICP备xxxxxxxxxx号-1` 占位。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"蒸汽 + 视差"一个核心动效，各区块只有 stagger 上浮/hover 上浮两板斧，不堆砌。
2. **配色定死**：深咖 `#2B1D16` / 奶油 `#F5EFE6` / 焦糖 `#C68B4E` 三色全页统一，深浅区块交替只靠这三色 + 透明度，无彩虹渐变。
3. **字号字距层级**：hero 大标题 `clamp(76px,11vw,150px)` 宋体 .1em 字距；眉题 12px .42em 字距；豆名 20px 宋体 / 价格 24px；英文副标 13px .5em 字距透气。
4. **文案真实感**："花香干净得像刚晒过的被子""门口有棵香樟""特调海盐拿铁是这家店限定的，离岛前记得喝一杯"。产品名/价格/门店名/营业时间全部像真的，无 Lorem、无 emoji 符号列表。
5. **手工细节**：SVG `feTurbulence` 纸纹（overlay 7%）、hero vignette、蒸汽错峰摇摆、豆袋 hover 微旋转、导航下划线生长、加载态"正在暖杯…"、滚动提示线循环下落。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），按钮用带轻微过冲的 `cubic-bezier(.34,1.3,.44,1)`，计数用 easeOutCubic；全页无 linear。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/各区块/弹窗/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL 配置 + loader + 导航 + 汉堡菜单 + reveal/计数 + 蒸汽粒子 + 视差 + 法务弹窗（**零依赖**，不用 GSAP/three.js）
- 无 `vendor/` —— 本模板纯 CSS/SVG/canvas 程序化视觉，零外部请求（此前验证过 GSAP 真品 72KB 在 cart-fly-3d，但本模板不需要）
- 未使用 `preserve-3d`，无 `filter:blur()` 压平风险；未覆盖 `[hidden]`；蒸汽用径向渐变柔边而非 blur

## 重建命令

```bash
cd ~/workspace/fx-lab/coffee-brand-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py coffee-brand-page
```

## 移动端说明

- `≤900px`：汉堡菜单（全屏深咖 overlay，链接 stagger 浮现）；hero 改单列、咖啡杯置顶；订阅/门店/故事/页脚全部单列；豆单保持横滑（snap）。
- `≤640px`：法务弹窗全屏式；hero 字号 `clamp` 自适应；CTA 按钮收窄。
- 触屏无 hover，卡片上浮只在可 hover 设备生效；蒸汽/视差在 `prefers-reduced-motion` 下静止。
- 渐进增强：无 JS 时所有内容直接可见（`.js` 类由脚本添加，隐藏态只在有 JS 时生效）；另有 `<noscript>` 兜底隐藏 loader。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` + `Log.entryAdded` 全程监听，滚动触发全部代码路径）。
2. reveal 全量：慢速滚动 35/35 全部触发 `.in`（移动端横滑豆卡 2–4 在横向滑入时触发，属设计行为）。
3. URL 扫描：零 `https` 外部 URL（仅 SVG data-URI 内的 `http://www.w3.org` 命名空间字面）；无 picsum/CDN/Google Fonts。
4. 交互验证：法务弹窗开/关/X/遮罩/ESC 全通；汉堡抽屉开/关/ESC 全通；焦点管理正常。
5. 截图：`shots/coffee-brand-page.png`（1280×800 全页）/ `shots/coffee-brand-page-mobile.png`（390×844 全页）/ `shots/coffee-brand-page-modal.png`（隐私政策弹窗），三张亲眼核对无裁切无乱码；修过 1 个 bug（订阅区幽灵按钮在深咖底上隐形，删掉错误的 `.section .btn-ghost` 覆盖规则）。
6. 打包：`fx-singlefile.py` 一次成型 46KB；中途发现 `styles.css` 首段被一次 append 写丢导致按钮塌陷，已重写整文件并重新打包验证。
