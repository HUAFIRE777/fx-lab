# Northloop · SaaS 落地页模板

一家虚构项目协作 SaaS「Northloop」的完整落地页：深空黑底 + 靛蓝点缀，中文真实感文案，纯 CSS 画出的任务看板产品 mock，鼠标视差 + 滚动编排，开箱即用。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**Linear（linear.app）**——只学布局结构和交互编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **顶部 sticky 导航**：左 logo、中间菜单（Product / Solutions / Pricing / Docs）、右 Sign in + Get started 按钮；滚动超过 24px 后透明背景变为毛玻璃（backdrop-blur + 细边框）。
2. **居中 hero**：小 badge（"New: …" pill）+ 大标题 + 副标题 + 双 CTA（主按钮/幽灵按钮）+ 产品界面 mock；mock 用纯 CSS 画任务看板（三列：需求池/进行中/已完成），整块做透视倾斜（rotateX）展示。
3. **客户 logo 云**：一行纯文字 logo，灰度低对比，hover 才提亮——不抢 hero 风头。
4. **交错功能行 ×3**：左文案右视觉 / 右文案左视觉交替，每行配一个小 CSS 视觉（拖拽卡片浮动 / SVG 燃尽线描画 + 柱状图生长 / 集成九宫格）。
5. **评价引用 + 定价预告小卡 + 大 CTA 区块 + 5 栏页脚**：单条客户证言 → 三档定价预告卡（中间高亮"最受欢迎"）→ 全宽渐变 CTA 面板 → 产品/解决方案/资源/公司/法律 5 栏页脚。

## 动效拆解

- **Hero 入场编排**：loader（三个呼吸点）淡出后，badge → 标题 → 副标题 → 双 CTA → 备注 → mock 按 `data-d` 阶梯点亮，`cubic-bezier(.16,.84,.3,1)` 快起慢收。
- **Mock 鼠标视差**：GSAP quickTo 驱动 `rotateX(14°±)` / `rotateY(±6.5°)` / 平移，`power3.out` 0.6s 跟手；鼠标离开回正。无 GSAP 时保持静态倾斜，页面照常完整。
- **滚动 reveal**：IntersectionObserver（threshold 0.16）给各区块加 `.is-in`，`data-d` 做 stagger 延迟；4 秒安全网兜底 IO 漏报；`prefers-reduced-motion` 直接全显。
- **按钮微交互**：hover 上浮 2px + 阴影加深（spring 曲线 `cubic-bezier(.34,1.4,.4,1)`），active 缩放 .97；主 CTA 带磁吸跟手（±14% 位移）。
- **看板可点**：mock 里点任意任务切换完成态（删除线 + 勾选圈），列计数实时跟随——演示用，不是摆设。
- **图表动效**：燃尽线 stroke-dashoffset 描画 1.6s，面积淡入，柱状图逐个生长（stagger .08s）。
- **手工质感**：全页 SVG 噪点 + radial 暗角 vignette；easing 全用物理感 cubic-bezier，禁用 linear。

## 配置参数

- **换文案**：直接改 `index.src.html` 里的中文（标题/副标题/功能行/评价/定价/页脚），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--bg` / `--indigo` / `--white`；全页深浅变化走 `rgba()`，换主色只改两处即可。
- **换链接**：所有 CTA 的 `href="#cta"` / `"#pricing"` / `"#features"` 按需替换为真实 URL；导航菜单文案在 `.menu` 与 `.drawer` 各一份（桌面/移动各一处）。
- **视差强度**：`src/main.js` → mock 段 `rxTo(BASE_RX - dy * 9)` / `ryTo(dx * 13)` 改系数；磁吸强度改 `0.14 / 0.22`。
- **Logo 云**：`.logos-row` 里改公司名，虚构名即可。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, address, email, phone, icp }`：

- 页脚联系方式（地址/邮箱/电话）与底部版权行（`© 2026 <name> · <icp>`）凡带 `data-site="address|email|phone|name|icp"` 的元素，JS 启动时统一用 SITE 渲染（含 `mailto:`/`tel:` 链接自动生成）。
- 买家上线：只改 SITE 五个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `icp` 默认占位 `京ICP备xxxxxx号`，上线后替换真实备案号。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6 条真实感中文要点（数据收集范围、Cookie 用途、退款/解约条款等），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`），CDP 已验证 390px 下为 390×844 铺满。
- 社交图标：页脚品牌区 inline SVG 四个（X / LinkedIn / YouTube / 微信），hover 变靛蓝上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"快"一个核心卖点；动效只服务于 hero mock 和滚动节奏，无装饰性动画堆砌。
2. **配色**：`#08090C` / `#5E6AD2` / `#fff` 三色定死，深浅全走透明度；无彩虹渐变（CTA 面板只有一层靛蓝光晕）。
3. **字体**：大标题 clamp(44px,7.2vw,88px)、字距 -.015em、行高 1.14，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（"开会前先看数据，开会只做决策"），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、加载态三点呼吸、badge 呼吸点。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / spring / `power3.out`，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `vendor/gsap.min.js` / `src/main.js`）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640）
- `src/main.js` —— 交互（classic script，无模块）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72214 字节，已验头；从 cart-fly-3d 拷贝）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/saas-landing
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py saas-landing
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`vendor/gsap.min.js` 与 `src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（importmap/script 已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）。
- mock 看板：隐藏左侧图标栏，第三列折叠，两列网格；倾斜角度收小（8°）。
- 功能行/定价卡/页脚全部单列堆叠；hero 标题 clamp 自适应；抽屉与按钮均为 44px+ 触控友好尺寸。
- 视差与磁吸仅在 `(pointer:fine)` 时启用，触屏不受影响。

## 验收记录（2026-10-05）

- vendor 完整性：`gsap.min.js` 72214 字节，头含 `GSAP 3.12.5`，真品。
- CDP 无头抓 console：零报错（file:// 下 classic script 正常执行）。
- 外链白名单：成品 `index.html` 零 `https` 外部 URL（噪点为 data: URI SVG，不算外链）。
- 截图：桌面 `~/workspace/fx-lab/shots/saas-landing.png`（1440×900）、移动 `~/workspace/fx-lab/shots/saas-landing-mobile.png`（390×844）、弹窗 `~/workspace/fx-lab/shots/saas-landing-modal.png`（桌面打开态）与 `~/workspace/fx-lab/shots/saas-landing-modal-mobile.png`（390 全屏）。
- 完成态可达：reveal 元素仅在 `html.js` 下隐藏；无 JS 时全显；JS 下 hero 由入场编排点亮、其余由 IO + 4s 安全网点亮，均已验证。
- **法务弹窗验收**：三个弹窗分别打开（标题/6 条要点/滚动锁定/`aria-hidden` 全对）与三种关闭方式（X / 遮罩 / ESC）全部 PASS；390px 下弹窗为 390×844 全屏 PASS；console 全程零报错。
- **移动端横向溢出事故（已修）**：`.fv-drag` 的 flex 子项 `min-width:auto` 撑开（内容 452px > 容器 334px），经 grid 自动最小尺寸向上传播，移动端 Chrome 把 layout viewport 撑到 431px（`mobile:true` 下 `innerWidth`=431、`visualViewport`=390，空白页对照 390，证实非 emulation artifact）。修法：`.fv-drag` 加 `flex-wrap:wrap` + 子项 `min-width:0`，列宽 110→100px、gap/padding 收紧。教训：任何横向 flex 组合都要做"内容最小宽度 ≤ 容器"核算，`overflow:hidden` 只能遮视觉、拦不住 viewport 计算。
