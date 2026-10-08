# 城市夜跑节 2026 · 营销活动页模板（campaign-page）

整站式营销活动落地页模板 —— 导航栏 + 巨型排印 hero + 数据故事卡 + 三档组别 + 参赛者评价 + 翻牌倒计时 + 报名表单 + 规则页脚。商用级，原创代码，换文案即交付客户。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，代码/文案/视觉全部原创）

1. **Spotify Wrapped 式年度活动页**：学了三点 —— ① 开屏即巨型排印的情绪轰炸（大字 + 年份幽灵字 + 电光点缀色）；② "数据讲故事"区块（把报名人数/城市数做成滚动触发的数字）；③ 整页单一 CTA 动线（所有按钮最终都收敛到报名）。
2. **Awwwards 获奖营销活动页**：学了三点 —— ④ 大胆的描边/实心混排大标题（stroke vs fill 对比）；⑤ 滚动视差分层（背景大字比前景滚动得快/慢）；⑥ 翻牌式倒计时作为"临门一脚"的紧迫感装置。

复现的手法（实现均为原创）：逐字 stagger 入场（JS 切字 + CSS 遮罩上滑）、`data-speed` 多层滚动视差（rAF 节流）、IntersectionObserver 触发的数字滚动（easeOutExpo + 千分位）与卡片 3D 翻入、纯 CSS 3D 翻牌时钟（上下半屏 + 双 flap 动画）、弹簧 easing 的卡片 hover 上浮。

## 动效拆解

1. **加载态**：品牌 + 进度条伪进度（160ms 步进至 80%，`load` 或 2.6s 兜底收尾），完成后 `body.ready` 触发 hero 入场。
2. **Hero 入场**：5 个汉字逐字 `translateY(112%) → 0`，`cubic-bezier(.34,1.56,.64,1)` 弹簧 easing，每字递增 90ms；眉题/英文/日期/CTA 四行随后依次上浮。
3. **滚动视差**：幽灵 "2026"（speed 0.35）、霓虹赛道 SVG（0.15）、hero 内容（-0.06）三层不同速度，rAF 节流，离开首屏自动跳过。
4. **数据卡**：进入视口 → `perspective(1000px) rotateX(48°→0)` 翻入 + 数字 1.6s 滚动到目标值（12,480 / 32 / 96% / 320+）；hover 上浮 + 顶部电光绿线扫过。
5. **组别卡**：hover `translateY(-12px)` 弹簧上浮 + 阴影；中间卡为 featured（绿边框 + "最受欢迎"徽章）；点"选X报名"预选组别并平滑滚动到表单。
6. **倒计时翻牌**：每秒 tick，值变化时上半 flap `rotateX(0→-90°)` 0.28s 翻下，随后静态面切新值、下半 flap `90°→0` 0.28s 翻出；冒号呼吸闪烁。
7. **报名表单**：姓名/手机号双校验（手机号正则 `^1[3-9]\d{9}$`），错误抖动 + 红框 + 聚焦；演示模式 700ms 后出成功态（参赛号 `NR2026-xxxxx`）；填 `CONFIG.SIGNUP_ENDPOINT` 则走真实 `fetch POST`。
8. **手工细节**：SVG 胶片噪点 + 暗角 vignette、霓虹赛道虚线流动画（起点/5K/10K/终点标记）、按钮 hover 上浮发光、移动端抽屉菜单。

## 配置参数（`src/main.js` 顶部 `CONFIG` / `SITE`）

- **`SITE` —— 公司信息集中配置**（2026-10-05 新增）：`organizer`（主办方）/ `address`（联系地址）/ `email`（联系邮箱）/ `phone`（联系电话）/ `icp`（备案占位，上线前替换真实号）。法务区主办方信息条（`#legalOrg/#legalAddr/#legalPhone/#legalMail`）、页脚版权行（`#copyOrg` + `#icp`）全部引用它——**改一处全站生效**。
- `EVENT_DATE` —— 起跑时间 ISO 字符串（默认 `2026-11-08T19:00:00+08:00`），倒计时以此为准；过期自动显示"比赛正在进行中"。
- `COUNTUP_MS` —— 数字滚动时长（默认 1600ms）。
- `REVEAL_FALLBACK_MS` —— 兜底 8s 强制显现所有 `.reveal`（防 IO 失效导致内容永不可见）。
- `LOADER_MIN_MS` / `LOADER_MAX_MS` —— 加载态最短 900ms / 最长 2600ms。
- `SIGNUP_ENDPOINT` —— 报名接口 URL；`null` 为纯前端演示成功态，填 URL 后走 `fetch POST {name, phone, division}`。
- 法务三篇文案：直接改 `index.src.html` 里 `#legal` 三个 `.legal-panel` 的 `<ol>`（每篇 4–6 条，活动口径：报名信息收集 / 肖像授权 / 退赛退款 / Cookie 用途）。
- 文案位置：活动名/日期/价格/规则全部在 `index.src.html` 内联，整页换文案约 15 分钟。

## 法务三件套（独立区块实现，2026-10-05 新增）

报名 CTA 之后、页脚之前是独立的 `<section id="legal">`：

- 标签页切换：隐私政策 / 服务条款 / Cookie 政策，`role=tablist/tab/tabpanel` + `aria-selected` 联动；激活标签电光绿胶囊，面板 `panelIn`（translateY 14px → 0 + 淡入，0.45s ease-out）。
- 页脚三个锚点 `#legal`（带 `data-legal-tab`）：点击切到对应标签 + 平滑滚动（`scroll-margin-top` 避开固定导航）；无 JS 时原生锚点照样滚到位、无 JS 时三篇全部展示（渐进增强）。
- 主办方信息条（主办方/地址/电话/邮箱）由 JS 从 `SITE` 渲染；无 JS 时留静态兜底文字。
- 社交图标：页脚 `.social` 内联 SVG（微信 / 微博 / 抖音 / 小红书，`stroke=currentColor`），`href="#"` 占位上线替换真实链接；hover 变电光绿 + 上浮。
- 文案：真实感中文活动条款，每篇 4–6 条（报名只收姓名/手机号/组别且 12 个月删除、赛道摄影肖像授权可邮件撤回、10/25 前全额退款、只写一个"记住组别" Cookie），无 Lorem ipsum。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"报名"一个动线，所有动效服务于 hero 情绪 + 倒计时紧迫感，不堆砌。
2. **配色定死**：深紫黑 `#0E0B16` 主底 / 电光绿 `#D4FF3F` 点缀 / 白字，三色全页统一，无彩虹渐变（辉光均为单色径向）。
3. **字号字距层级**：hero `clamp(76px,15vw,210px)` 900 字重；kicker 12px 字距 .38em；数字 `tabular-nums` 等宽。
4. **文案真实感**："去年第一次跑 10K，冲过终点时两边全是喊加油的陌生人，值了。"——陈默；"早鸟价 10 月 20 日截止 · 总名额 15000 人，报满即止"。无 Lorem、无 emoji 列表（列表标记用绿色短横）。
5. **手工细节**：噪点、暗角、赛道虚线流动、翻牌中线、按钮弹簧 hover、加载态"正在点亮赛道…"。
6. **easing**：全页禁用 linear；入场/hover 用 overshoot 弹簧 `cubic-bezier(.34,1.56,.64,1)`，显现用 `cubic-bezier(.2,.8,.2,1)`，翻牌上半 ease-in、下半 ease-out 模拟重力。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/排印/卡片/翻牌时钟/响应式/减弱动效）
- `src/main.js` —— 加载态 + 切字 + 导航/抽屉 + IO 显现 + 数字滚动 + 视差 + 翻牌倒计时 + 表单 + SITE 渲染 + 法务标签切换（零依赖，无 GSAP/three.js）
- `README.md` —— 本文件
- 无 `vendor/` 目录：本模板纯原生实现，不需要 GSAP（vendor 完整性检查不适用）；唯一 JS `src/main.js`（>2KB ✓）

## 重建命令

```bash
cd ~/workspace/fx-lab/campaign-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py campaign-page
```

## 移动端说明

- `≤860px`：导航收起为汉堡 + 右侧抽屉（含报名 CTA）；组别/评价单列；数据卡 2 列；hero 按钮全宽。
- `≤560px`：数据卡片内边距收紧；翻牌时钟缩小（`clamp` 自适应）；规则单列。
- 触屏无 hover，卡片上浮/描边效果仅桌面；抽屉支持 Esc 与遮罩关闭。
- `prefers-reduced-motion`：加载快进、入场/视差/翻牌/数字滚动全部跳过，直接显示终态。

## 验收记录（2026-10-05）

1. **console**：CDP 全程抓取（9s 轮询 + 全部交互），零 error、零 exception、零 warning。
2. **外链白名单**：`https://` 出现 0 次；仅 2 处 SVG `xmlns` 命名空间字符串（非网络请求）；无 Google Fonts/picsum/CDN/图床。
3. **截图**：`shots/campaign-page.png`（1440×900 hero）/ `shots/campaign-page-mobile.png`（390×844，汉堡+抽屉正常）。
4. **交互实测（CDP）**：hero 5 字入场完成态 transform=none、末字确为电光绿；27/27 `.reveal` 显现且 settled；数字滚动终值 12,480/32/96/320；组别按钮预选（half）并滚动；空表单报错、填表后成功态 + 参赛号；倒计时每秒 tick（34天→）；移动端抽屉开合正常。
5. **完成态可达**：隐藏类只在 `.js` 下生效（无 JS 直接可见）；IO 失效有 8s 兜底强制显现；`transitionend` 未触发有 1.6s 兜底加 `settled`。
6. **文案**：无 Lorem ipsum、无 emoji 符号列表，全部真实感中文短句。
