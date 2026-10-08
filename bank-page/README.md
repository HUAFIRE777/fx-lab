# 恒信银行 · 银行金融落地页模板

一家虚构银行「恒信银行」的完整金融落地页：藏青 + 金 + 米白三色定死，中文真实感金融文案（存款/理财/贷款利率数字均按 2026 年市场合理水平编写），数字滚动计数器 + 卡片 hover 上浮动效体系，纯原生 JS 零第三方库，开箱即用。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**Chase（chase.com）与招商银行 App/官网**——只学布局结构和信息编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **顶部 sticky 导航**：左品牌 logo、中间业务菜单（个人金融/存贷利率/手机银行/安全保障）、右登录 + 开户按钮；滚动超过 24px 后透明底变为毛玻璃（backdrop-blur + 细边框）。
2. **Hero 利率/开户优惠卡片**：大标题 + 双 CTA 之下横排三张利率卡（活期/大额存单/房贷），热销卡加"新客专享"角标——学 Chase 首页的 rate table 前置做法。
3. **业务矩阵四宫格**：储蓄 / 理财 / 贷款 / 信用卡四张等高卡片，每张配图标 + 核心数字 + 一句话卖点 + 详情链接——学招行的"一站式金融服务"分区。
4. **手机银行 App 下载区块**：左文案（三大卖点 + 应用商店按钮）右纯 CSS 手机 mock（余额卡 + 功能入口 + 支出柱状图）——学两家都有的 App 推广位。
5. **安全承诺 + 大 CTA + 五栏页脚**：三道防线卡片 → 全宽开户 CTA 面板 → 品牌/产品/帮助/关于/法律五栏页脚，法律栏挂法务三件套弹窗——学 Chase 页脚的信息密度。

## 动效拆解

- **数字滚动计数器（核心动效）**：`.counter[data-count][data-decimals]` 进入视口（IO threshold 0.4）后 `requestAnimationFrame` 从 0 数到目标，`easeOutQuart` 快起慢收物理感；收尾强制对齐终值避免浮点残差；`prefers-reduced-motion` 直接定值；6 秒安全网兜底 IO 漏报。
- **卡片 hover 上浮（核心动效之二）**：利率卡/业务卡/安全卡统一 `translateY(-6~-8px)` + 阴影加深 + 金色边框，`cubic-bezier(.34,1.45,.44,1)` 弹簧曲线，整页一个动效体系。
- **Hero 入场编排**：loader（金线生长）淡出后，badge → 标题 → 副标题 → 双 CTA → 备注 → 利率卡按 `data-d` 阶梯点亮，`cubic-bezier(.16,.84,.3,1)`。
- **滚动 reveal**：IO（threshold 0.16）+ `data-d` stagger 延迟；4 秒安全网兜底；无 JS 时（`html` 无 `.js` 类）全部直接可见。
- **导航毛玻璃**：`scrollY > 24` 切换 `.scrolled`，透明藏青 → 米白毛玻璃 + 深色文字。
- **按钮微交互**：hover 上浮 2px，active 缩放 .97；业务卡箭头 hover 右滑 4px；弹窗 X 按钮 hover 旋转 90°。
- **手工质感**：全页 SVG 噪点（data URI，非外链）+ radial 暗角 vignette；easing 全用物理感曲线，禁用 linear。

## 配置参数

- **换文案**：直接改 `index.src.html` 里的中文（标题/利率/业务卡/安全承诺/页脚），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--navy` / `--gold` / `--cream`；全页深浅变化走 `rgba()`，换主色只改三处即可。
- **换利率数字**：hero 三张卡与业务卡里的 `<span class="counter" data-count="X" data-decimals="Y">` 改两个属性即可，动画自动适配小数位。
- **换链接**：所有 CTA 的 `href="#cta"` / `"#app"` 按需替换为真实 URL；导航菜单文案在 `.menu` 与 `.drawer` 各一份（桌面/移动各一处）。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, address, email, phone, icp }`：

- 页脚联系方式（客服热线/邮箱/总行地址）与底部版权行（`© 2026 <name> · 金融许可证号 · <icp>`）凡带 `data-site="phone|email|address|name|icp"` 的元素，JS 启动时统一用 SITE 渲染（含 `mailto:`/`tel:` 链接自动生成）。
- 买家上线：只改 SITE 五个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `phone` 默认占位 `955XX`、`icp` 默认占位 `沪ICP备xxxxxx号`，上线后替换真实号码/备案号。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6 条金融口径真实感中文要点（实名开户/反洗钱报送/交易记录保存 5 年/口头挂失 5 日/收费公示/无第三方广告 Cookie 等），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。
- 社交图标：页脚品牌区 inline SVG 四个（微信 / 微博 / 抖音 / 客服热线），hover 变金色上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"稳"一个核心感受；动效只服务于数字滚动与卡片上浮，无装饰性动画堆砌。
2. **配色**：`#0A1F44` / `#B9975B` / `#F8F6F0` 三色定死，深浅全走透明度；无彩虹渐变（CTA 面板只有一层金色光晕）。
3. **字体**：大标题 clamp(46px,7.4vw,88px)、字距 -.015em、行高 1.14，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（"钱放在恒信，稳稳当当""急用钱不心疼""盗刷先过我们这关"），利率数字合理（活期 0.15%/大额存单 2.35%/首套房贷 3.05%），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、加载态金线生长、badge 呼吸点、手机 mock 纯 CSS 手绘。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / 弹簧 / `easeOutQuart`，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `src/main.js`，classic script）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640）
- `src/main.js` —— 交互（classic script，零第三方依赖）
- `vendor/` —— 空目录（本模板有意零外部库，原生 JS 全实现；无空壳文件）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/bank-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py bank-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）；利率卡/业务卡/安全卡全部单列堆叠。
- 手机 mock 在 ≤900px 移到文案上方（`order:-1`），尺寸缩小至 262×548。
- 页脚五栏 → 两栏；统计行单列；hero 标题 clamp 自适应；抽屉与按钮均为 44px+ 触控友好尺寸。
- 法务弹窗 ≤640px 变全屏（`100dvh` 无圆角）；已验证 390px 下 `innerWidth == scrollWidth`，无横向溢出。

## 验收记录（2026-10-05）

- vendor 完整性：空目录，零外部库，无空壳 JS。
- CDP 无头抓 console：零报错、零异常（页面内 error 监听 + CDP Runtime 双通道）。
- 外链白名单：成品 `index.html` 零 `https` 外部 URL（噪点为 data: URI SVG，不算外链）。
- 计数器终值：10 个计数器全部到达终值（0.15/2.35/3.05/2.35/4.12/3.05/56/386/1.2/98.6），CDP 逐个读取确认。
- 完成态可达：reveal 元素仅在 `html.js` 下隐藏；无 JS 时全显；JS 下 hero 由入场编排点亮、其余由 IO + 4s 安全网点亮；计数器另有 6s 安全网直接定值。
- **法务弹窗验收**：隐私政策弹窗打开（标题/6 条要点/滚动锁定/`aria-hidden` 全对）与 ESC 关闭 PASS。
- **移动端验收**：390px 下抽屉打开/关闭正常，`scrollWidth == innerWidth` 无横向溢出 PASS。
- **无头环境备注**：本机 headless Chromium 的 rAF 约 6fps、CDP 驱动下脚本执行有数秒延迟，验收截图等待 10 秒后取值；真实浏览器中 IO + rAF 即时触发，无此延迟。
- 截图：桌面 `~/workspace/fx-lab/shots/bank-page.png`（1280×800，含计数器终值）、弹窗 `~/workspace/fx-lab/shots/bank-page-modal.png`、移动 `~/workspace/fx-lab/shots/bank-page-mobile.png`（390×844，抽屉打开态）。
- 已知坑规避：未使用 preserve-3d+blur；未用 GSAP 百分比位移；未覆盖 `[hidden]{display:none}`；reveal 完成态三重保障（IO + 安全网 + 无 JS 全显）。
