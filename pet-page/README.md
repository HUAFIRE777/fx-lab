# 爪印 PAW · 宠物用品+宠物医院整站首页

一套商用级宠物整站首页模板（虚构品牌「爪印 PAW」）：顶部导航 / 宠物氛围 hero / 品类导航 / 商品网格+订阅购 / 宠物医院服务（预约挂号）/ 养宠知识 / CTA / 页脚，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

**Chewy（美国宠物电商）官网首页**：只学了布局结构，代码全部原创重写。

学到的布局点（实现均为原创代码）：
① 顶部品类导航（选粮/好物/医院/知识四入口，对应 Chewy 的品类导航栏）
② 宠物氛围 hero（大字标题 + 宠物视觉 + 信任数据行，对应 Chewy 首屏宠物氛围区）
③ 商品网格 + 订阅购卡片（Autoship 式「周期送货立省」卡片，对应 Chewy Autoship 区块）
④ 宠物医院服务区块（科室入口 + 预约挂号表单，对应 Chewy 的兽医服务入口布局）
⑤ 养宠知识内容区（三卡片文章流，对应 Chewy 宠物知识栏目）

## 动效拆解

整页只有一个核心动效体系：**滚动 stagger 入场 + 商品卡 hover 上浮/阴影呼吸**。

- **hero 入场**：标题两行 `yPercent:112→0` 逐行升起（stagger 0.14s，`power3.out`）；副标题/按钮/数据行 CSS 延迟淡入。注意坑：CSS 初值 `translateY(112%)` 必须先 `el.style.transform='none'` 清掉再交给 GSAP，否则 GSAP 会把百分比解析成 px 烘进 `y` 残留；播完加 `html.hero-in` 兜住完成态再 `clearProps`，否则 CSS 兜底规则会把行压回去。另有 3 秒兜底定时器，GSAP 异常也强制显示完成态。
- **商品卡 hover**：`translateY(-8px)` + 阴影呼吸（`shadowBreathe` keyframes，深棕阴影↔橙色光晕交替，`ease` 非 linear）；「加入购物袋」按钮从底部滑出（移动端无 hover，常驻显示）。
- **滚动 reveal**：IntersectionObserver，`opacity 0→1 + y 34→0`，`cubic-bezier(.22,1,.36,1)` 0.75s，同行卡片按 `--d` 变量 stagger 0.08s。
- **hero 氛围**：三只爪印 `floaty` 悬浮（ease-in-out 5–6s 交错）、今日有号徽标呼吸点。
- **全局**：SVG 噪点颗粒（feTurbulence，opacity .05）、商品图骨架 shimmer 加载态（ease-in-out）、爪印加载 veil（播完必消失，另有 2.5s 兜底）。
- **easing**：全部 `power3.out` / `cubic-bezier(.22,1,.36,1)` / `ease-in-out`，禁用 linear。`prefers-reduced-motion` 直接降级。

## 配置参数

`src/main.js` 顶部 `SITE` / `CONFIG` / `PRODUCTS`：

- `SITE`：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——页脚联系方式、版权行 `© 2026 <organizer>`、备案号全部引用变量渲染，换主体只改一处（当前均为虚构示例值）
- `CONFIG`：`heroStagger`（hero 逐行间隔秒）/ `revealThreshold` / `toastMs`（toast 停留）/ `cardFakeLoadMs`（商品图模拟加载）
- `PRODUCTS`：8 件商品（id / cat 分类 / kind 图型键 / 中文名 / 一句话描述 / 价格 / 旧价 / 标签）——换商品只改这里；`kind` 对应 `productSVG()` 的程序化包装图（bag/pouch/bone/wand/pump/box/sticks）
- 筛选 chips 的分类键：`all/dog/cat/snack/care`，与 `PRODUCTS[].cat` 对应

商品图、hero 宠物插画、医生头像、文章封面全部程序化绘制（SVG 几何 + 三色），零外部图床、零 Google Fonts。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲「宠物用品+医院一站式」一个主题；动效集中在入场 stagger 与商品卡 hover，无多余装饰动画。
2. **配色**：暖米 `#FFF8F0` / 深棕 `#3E2F25` / 橙 `#F4842B` 三色定死全页；点缀只出现在 CTA/价格/hover，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(44px,5.6vw,76px)、字距 -0.015em、行高 1.16，有呼吸感；价格数字加粗 tabular。
4. **文案**：真实感中文短句（「鲜鸡肉打底，粗蛋白 ≥28%，便便不臭」「拆家精力的出口」「片子看得准，报告当天出，不让主人干等」），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：噪点颗粒、hero blob 边缘 vignette、商品骨架加载态、按钮 active 缩放、预约表单 focus 光环、医生出诊时间徽标、抽屉/弹窗 ESC 关闭。
6. **easing**：物理感曲线全覆盖，无 linear。

## 法务三件套（模态弹窗实现）+ SITE 配置变量

页脚企业标配三件套做成模态弹窗：

- **触发**：页脚底部「隐私政策 / 服务条款 / Cookie 政策」三个按钮（`data-modal="privacy|terms|cookies"`），点击弹对应弹窗。
- **关闭三通道**：右上角 X（hover 旋转 90°）/ 遮罩点击 / ESC；打开时 `html` 锁滚动，关闭后恢复焦点；`role="dialog"` + `aria-modal` + `aria-live` toast。
- **文案**：爪印口径真实中文条款（隐私 5 条 / 服务 5 条 / Cookie 4 条）：7 天无理由退换、持牌支付通道不存卡号、48h 发出满 99 包邮、预约 30 分钟电话确认/爽约两次暂停 30 天、知识栏目不替代面诊，无 Lorem ipsum。
- **SITE 配置变量**（`src/main.js` 顶部）：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——页脚联系方式、版权行、备案号全部引用变量渲染，换主体只改一处。当前品牌=`"爪印 PAW"`，地址/邮箱/电话/备案号为虚构示例值。
- **社交图标**：inline SVG（微信/微博/小红书/抖音，页脚品牌列下），hover 变橙色 + 上浮 4px。
- **移动端全屏式**：≤560px 弹窗占满视口（padding 0、圆角 0、高 100%），方便小屏阅读。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / vendor/gsap.min.js / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含响应式断点 1100/900/560）
- `src/main.js` —— classic 脚本：SITE/商品渲染、导航、抽屉、筛选、订阅、预约表单、法务弹窗、动效
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，© GreenSock；打包时内联，无 CDN）
- `README.md` —— 本文件

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py pet-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤900px：中部菜单收进汉堡抽屉（左滑入+遮罩，链接点击自动收起）；hero 改单列、视觉置顶；商品网格 4→2 列；「加入购物袋」按钮常驻（无 hover 环境）；订阅/医院网格改单列；预约卡片取消 sticky。
- ≤560px：品类 2 列、商品描述隐藏、医生单列、页脚单列；法务弹窗全屏式（占满视口、圆角 0）。390 宽已截图验证。
- 抽屉与法务弹窗均支持 ESC 关闭；预约表单手机号做 11 位校验。

## 外链白名单

成品 `index.html` 零 `https` 外部 URL（GSAP 内联、图片全程序化、字体走系统栈）。验证：`grep -o 'https://[^"'"'"' ]*' index.html | sort -u` 应无输出。
