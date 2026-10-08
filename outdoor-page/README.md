# 野径 TRAILHEAD · 户外装备品牌落地页模板（outdoor-page）

一句话介绍：虚构户外品牌「野径 TRAILHEAD」的单页官网模板——全屏山影视差 hero、徒步/露营/攀登装备翻转卡矩阵、探险故事、会员计划 CTA，零依赖单文件可直接交付。

## 参考站点及布局点（只学布局结构与交互编排，源码/文案/图片全部原创）

- **REI**：学的点——① 全屏旷野 hero，大标题压图；② 装备按场景分类矩阵入口；③ 会员计划独立 CTA 区块。
- **始祖鸟官网**：学的点——① 极简深色基调 + 大量留白；② 产品线叙事而非单品罗列；③ 页脚四栏（选购/支持/联系/社交）信息架构。
- 未复制任何一方的源码、图片与文案：山体为手写 SVG 路径分层，故事配图为双色线稿 SVG，文案全部原创短句。

## 动效拆解

本页只讲**一个核心动效**：hero 山影视差 + 装备卡 hover 翻转；其余为各区块 stagger 入场微交互。

1. **山影视差**：hero 内 4 层手绘山脊 SVG（`data-depth` 0.05/0.12/0.22/0.36/0.55），滚动时 rAF 节流按深度差速 `translate3d`；桌面端另有鼠标微视差（±18px）。星空为 JS 程序化生成的 70 颗闪烁星点，营火点带呼吸闪烁。
2. **装备卡翻转**：`perspective` + `preserve-3d`，hover（桌面）/点击（移动端）时 `rotateY(180deg)`，0.85s `cubic-bezier(.22,1,.36,1)`；背面为产品清单 + 价格 + CTA。键盘 Enter/Space 同样可翻。
3. **stagger 入场**：IntersectionObserver 触发 `.reveal` → `.in`，`data-d="1..4"` 做 0.12s 级联延迟；数字条带 easeOutCubic 计数滚动。
4. **导航**：滚动 40px 后透明 → 毛玻璃（backdrop-filter blur 14px）。
5. 全局 easing 统一 `--ease: cubic-bezier(.22,1,.36,1)`，禁用默认 linear；`prefers-reduced-motion` 下全部动效降级为静态。

## 配置参数（`src/main.js` 顶部 `SITE` / `LEGAL`）

买家只改 `SITE` 对象即可一改全改，页面内以 `data-site` / `data-site-href` 绑定：

| 键 | 说明 |
|---|---|
| `name` | 品牌名（页脚版权行） |
| `address` / `phone` / `email` / `hours` | 页脚"联系我们"四件套 |
| `phoneHref` / `emailHref` | 对应的 `tel:` / `mailto:` 链接 |
| `icp` | 备案号（页脚版权行） |
| `year` | 自动取当年，无需手改 |

`LEGAL` 对象装三件套文案（privacy/terms/cookies），每条为 `[小标题, 正文]` 数组，改文字只动这里。`CFG` 无（本页无可调阈值，写死即用）。

## 法务三件套（弹窗实现）

页脚"隐私政策 / 服务条款 / Cookie 政策"按钮 → 同一弹窗壳动态注入 `LEGAL` 文案。可打开可关闭：右上 × 按钮、点击遮罩、ESC 三种关闭方式；打开时焦点移到关闭按钮、关闭后焦点回到触发按钮；`body` 滚动锁定。文案为真实感通用条款（收集范围/保存期限/退换规则/未成年人/争议解决），无 Lorem ipsum。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效（山影视差 + 卡片翻转），不堆砌；配色定死岩石灰/苔绿/橙红三色 + 中性纸白墨黑，无彩虹渐变。
2. **配色**：三色贯穿（导航描边、kicker、按钮、价格、页脚 hover 全部收敛到 #E0632F），山体用同色系明暗分层。
3. **字体**：标题用宋体系 serif（"把路，走成风景。"大标题字号 clamp 52–104px、字距 .02em），正文用苹方/微软雅黑，kicker 全大写字母间距 .42em，层级分明。
4. **文案**：禁用 Lorem ipsum 与 emoji 列表；短句真实感（"第三天凌晨四点起床，帐篷外是零下六度""搭帐篷比搭宜家衣柜简单"）。
5. **手工细节**：全局 vignette 暗角 + SVG 噪点颗粒、加载态（品牌"径"字 + 进度条，"正在收拾背包…"）、营火呼吸点、按钮 hover 上浮、卡片箭头滑动、故事卡 hover 上浮放大配图。
6. **easing**：统一 `cubic-bezier(.22,1,.36,1)` 物理曲线，计数用 easeOutCubic；无 linear。

## 源码结构

```
outdoor-page/
├── index.src.html   # 源码 HTML（打包入口，勿直接改 index.html）
├── index.html       # 打包成品（单文件，fx-singlefile.py 生成）
├── styles.css       # 全站样式（打包时内联）
├── src/
│   └── main.js      # 零依赖交互脚本（打包时内联）
└── README.md
```

无 `vendor/` 目录：本页零外部依赖（无 GSAP/Three/字体/CDN），纯手写 CSS + 原生 JS，故无空壳风险。已知坑均已规避：翻转卡容器不用 `filter:blur`（暗角/噪点走独立 fixed 层，与 3D 卡片无层叠冲突）；视差位移用像素 `translate3d` 而非百分比；`.reveal` 隐藏态只在 `html.js` 下生效，无 JS / IO 不支持时内容直接可见（完成态可达）；加载态有 `load` + 2.6s 双重关闭兜底。

## 重建方式（fx-singlefile.py，一次性单向）

```bash
cd ~/workspace/fx-lab/outdoor-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py outdoor-page
```

打包器把 `styles.css` 内联为 `<style>`、`src/main.js` 内联为普通 `<script>`。**禁止对已打包的 `index.html` 二次打包**；改源码后永远从 `index.src.html` 重新走三步。

## 移动端说明

- 390×844 验证通过：导航收起为汉堡抽屉菜单（右侧滑入，链接点击/遮罩/ESC 关闭）；hero 太阳移至右上避开标题；装备矩阵/故事/会员改为单列；翻转卡改点击翻转（hover 不可用）；页脚四栏变单列。
- 触摸目标 ≥ 42px；`100svh` 处理移动端地址栏高度；`prefers-reduced-motion` 同步生效。

## 验收记录（2026-10-05）

- ① 无头 console：`pageprobe.js` 抓 12 秒，`ERRORS_WARNINGS=0`（console 零报错零警告）。
- ② 外链：`grep -o 'https\?://'` 成品仅 1 处 `http://www.w3.org/2000/svg`（SVG 命名空间），无 Google Fonts/picsum/国外 CDN。
- ③ vendor：无 vendor 目录（零依赖），无空壳 JS。
- ④ 截图：`~/workspace/fx-lab/shots/outdoor-page.png`（1280×800）与 `outdoor-page-mobile.png`（390×844）。
- ⑤ 法务三件套：CDP 实测 privacy/terms 弹窗打开（标题 + 6 条款 h4 注入）与关闭均正常。
- ⑥ 隐藏元素完成态：CDP 滚动实测 31 个 `.reveal` 随滚动逐个进入 `.in`（900→4600px：10/12/17/19/26）；无 JS 时 `noscript` 保证内容可见；加载态双重兜底关闭。
- 修过的 bug：移动端 hero 太阳与 kicker 文字重叠 → ≤960px 时太阳改右上 88px 定位（截图验证通过）。
