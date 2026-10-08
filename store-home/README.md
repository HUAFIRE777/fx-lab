# MONO · 极简服饰整站首页

一套商用级电商整站首页模板（虚构品牌 MONO）：导航 / 大 hero / 品类磁贴 / 商品网格 / 编辑故事 / 订阅 / 页脚，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

1. **Apple Store 首页**：极简顶栏（左 logo、中部品类、右图标）+ 滚动后毛玻璃底边线；大 hero「新品主推 + 大字 + CTA」的信息层级；编辑故事式大横幅讲品牌。
2. **Nike 官网首页**：三格品类磁贴行（跑步/日常/户外，hover 放大）；商品卡网格 hover 露出「快速加购」；newsletter 订阅行接多列页脚。

学到的布局点（实现均为原创代码）：①顶栏滚动加底边线+毛玻璃 ②hero 大字逐行升起 ③磁贴 hover 放大 ④商品卡 hover 上浮+阴影+快速加购浮现 ⑤故事横幅大字叠背景视觉 ⑥订阅+多列页脚。

## 动效拆解

- **hero 入场**：标题三行 `yPercent:112→0` 逐行升起（stagger 0.12s，`power3.out`）；右侧视觉 `opacity 0→1 + y 44→0` 淡入上浮。注意坑：CSS 初值 `translateY(112%)` 必须先清掉再交给 GSAP，否则 GSAP 会把百分比解析成 px 烘进 `y` 残留；动画播完给 `html` 加 `hero-in` 类兜住完成态再 `clearProps`，否则 CSS 兜底规则会把行压回去。
- **商品卡 hover**：`translateY(-8px)` + 柔阴影；「快速加购」按钮从底部滑出（移动端无 hover，常驻显示）。
- **区块 reveal**：IntersectionObserver，`opacity 0→1 + y 34→0`，`power3.out` 0.7s。
- **加购反馈**：购物袋徽标 `back.out(3)` 弹跳 + 底部 toast 滑入；按钮本身轻微回弹。
- **全局**：SVG 噪点颗粒（feTurbulence，opacity .05）、商品图骨架 shimmer 加载态（ease-in-out，非 linear）。
- **easing**：全部 `power3.out` / `back.out` / `cubic-bezier(.22,1,.36,1)`，禁用 linear。`prefers-reduced-motion` 直接降级。

## 配置参数

`src/main.js` 顶部 `CONFIG`：

- `accent`：点缀色（默认 `#FF4D00`，只用于 CTA/价格/hover）
- `heroStagger`：hero 逐行间隔（秒）
- `revealMs` / `toastMs` / `cardFakeLoadMs`：reveal 时长 / toast 停留 / 商品图模拟加载时长
- `PRODUCTS`：8 件商品（id / 中文名 / 一句话描述 / 价格 / 旧价 / 标签 / 衣型键 / 配色）——换商品只改这里
- `CATS`：3 个品类磁贴
- `SITE`：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——版权行与公司信息集中一处，换主体只改这里（品牌=`"MONO"`，地址/邮箱/电话/备案号为占位示例值）

商品图与视觉全部程序化绘制（`garmentSVG()` 按衣型键生成几何服装示意 + 色块），零外部图床、零 Google Fonts。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲「极简电商首页」一个主题；动效集中在 hero 入场与加购反馈，无多余装饰动画。
2. **配色**：白主底 + 墨黑 `#111` + 橙红 `#FF4D00` 三色定死；点缀色只出现在 CTA/特价/hover，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(52px,6.5vw,104px)、字距 -0.01em、行高 1.08，有呼吸感；价格数字加粗 tabular。
4. **文案**：真实感中文短句（「480g 重磅抓绒，落肩廓形」「穿三年，还和第一天一样挺」），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：噪点颗粒、骨架加载态、按钮 active 缩放、Sale 菜单橙色下划线、页脚 ICP 示例标注、空搜索结果提示。
6. **easing**：物理感曲线全覆盖，无 linear。

## 法务三件套（模态弹窗实现）+ SITE 配置变量

页脚企业标配三件套做成模态弹窗：

- **触发**：页脚底部「隐私政策 / 服务条款 / Cookie 政策」三个链接（`data-modal="privacy|terms|cookies"`），点击弹对应弹窗。
- **关闭三通道**：右上角 X（hover 旋转 90°）/ 遮罩点击 / ESC；打开时 `body` 锁滚动，关闭后恢复焦点；`role="dialog"` + `aria-modal`。
- **文案**：MONO 服饰口径真实中文条款（隐私 5 条 / 服务 5 条 / Cookie 4 条）：退换货（7 天无理由 / 15 天质量换货）、支付安全（持牌通道、全程加密、不存卡号密码）、配送（48h 发出、包邮、破损拒收）、Cookie 用途（购物袋记忆/统计/可禁用/不跨站追踪），无 Lorem ipsum。
- **SITE 配置变量**（`src/main.js` 顶部）：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——版权行 `© 2026 <organizer> · <icp>` 全部引用变量渲染，换主体只改一处。MONO 品牌：brand/organizer=`"MONO"`，其余为占位（示例）。
- **社交图标**：inline SVG（微信/微博/小红书/抖音，放在页脚品牌列下），hover 变橙红点缀色 + 上浮；小红书 icon 含品牌红块。
- **移动端全屏式**：≤560px 弹窗占满视口（padding 0、圆角 0、高 100%），方便小屏阅读。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / vendor/gsap.min.js / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含响应式断点 1100/900/560）
- `src/main.js` —— classic 脚本：渲染、导航、抽屉、搜索筛选、加购、订阅、动效
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，© GreenSock；打包时内联，无 CDN）
- `README.md` —— 本文件

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py store-home
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤900px：中部菜单收进汉堡抽屉（左滑入+遮罩）；hero 改单列、视觉置顶；商品网格 4→2 列；「快速加购」按钮常驻（无 hover 环境）；订阅表单改纵排。
- ≤560px：页脚单列。法务弹窗全屏式（占满视口、圆角 0）。390×844 已截图验证。
- 搜索浮层 Esc 关闭；抽屉链接点击后自动收起；法务弹窗 X / 遮罩 / ESC 三通道关闭。

## 外链白名单

成品 `index.html` 零 `https` 外部 URL（GSAP 内联、图片全程序化、字体走系统栈）。验证：`grep -o 'https://[^"'\'' ]*' index.html | sort -u` 应无输出。
