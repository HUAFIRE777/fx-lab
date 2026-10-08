# 绒 RONG · 美发美容店落地页模板（salon-page）

美发美容店「绒 RONG」完整落地页 —— 发丝光泽 hero + 服务价目表 + 造型师墙 + 门店信息 + 在线预约表单，优雅高级风，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：Drybar 式美发沙龙站。学到的布局点：

1. **导航**：左品牌徽 + 中部四菜单（服务价目/造型师/门店/预约）+ 右预约 CTA；滚动 40px 后透明→毛玻璃。
2. **Hero 一左一右**：左侧大标题 + 双 CTA + 信任背书行，右侧主视觉（原站用模特摄影图，本模板用程序化 SVG 发丝 + 香槟金光泽流动）。
3. **价格跑马灯**：hero 下方黑色横条滚动价目，原站用于服务速览，本模板做成 6 项循环 ticker。
4. **服务价目四卡**：剪/染/烫/护四分类卡片，每卡 4 行价目，热门档深色反白 + 「约得最多」徽。
5. **造型师墙**：深色区块四人卡片（头像/职级/年限/擅长标签/一句话理念 + 「约他/她」直达预约并预选造型师）。
6. **门店信息**：左右分栏（地址/电话/营业时间/交通定义列表 + 线稿门店示意图）。
7. **预约表单 CTA**：深色区块左文案右表单（称呼/手机/服务/造型师/日期/时间段），提交走校验 + 成功态面板。

## 动效拆解

整页**只讲一个核心动效**：hero「发丝光泽流动」。其余全部是微交互。

1. **加载态**：奶油白全屏（「绒」字徽呼吸 + RONG 字距 + 香槟金进度条），`window.load` 后最短 700ms 淡出，再触发 hero 入场；4s 兜底放行。
2. **hero 核心动效**：
   - 8 束程序化 SVG 发丝（贝塞尔垂落曲线，曜石黑描边）；
   - 香槟金光泽带沿发丝流动：同路径复制一层 `stroke-dasharray:150 1500`，`stroke-dashoffset 1650→-150`，`ease-in-out` 7.5s 循环（线性 dash 位移的遮罩式光泽）；
   - 整束发丝 ±1.1° 缓慢摇摆（9s ease-in-out 往返，transform-origin 顶部）；
   - 大标题两行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，第二行 .14s 递进，`cubic-bezier(.19,1,.22,1)`）；CTA/背书行淡入上浮；
   - 「今日空位」悬浮卡片 5.5s 上下浮动；hero vignette 四周收暗。
3. **导航**：滚动 40px 切 `.scrolled` 毛玻璃；链接 hover 金色下划线生长；移动端汉堡→曜石黑全屏抽屉，链接 stagger 浮现。
4. **滚动 reveal**：`IntersectionObserver`（阈值 .12），同行卡片按 `data-d` 0/.1/.2/.3s 递进；reveal 完成后清 `transition-delay`（否则 hover 被拖慢）。
5. **微交互**：价目卡/造型师卡 hover 上浮 8px + 阴影漫开；按钮 hover 上浮 + 阴影；滚动提示线循环下落；造型师「约他/她」点击预选表单造型师。
6. **手工细节**：全页 SVG `feTurbulence` 纸纹（`multiply` 5.5%）；hero vignette；门店线稿示意图；价目虚线分隔；「染烫前免费发质检测，不合适直接劝退」等行业黑话。

## 配置参数（`src/main.js` 顶部）

- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / address / phone / phoneHref / email / mailtoHref / hours / icp / year`。页脚电话/邮箱/地址/营业时间/备案行、抽屉电话、成功态来电提示均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组，`[小标题, 正文]`），改文案只改这里。
- 发丝光泽：`stroke-dasharray` 第一值=光泽带长度（150），`@keyframes sheen` 改周期；`sway` 改摇摆幅度/周期。

## 法务三件套（弹窗实现）+ SITE 配置变量

- 页脚「网站政策」区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）；表单下方「隐私政策」文字链同入口。
- 关闭三通道：右上 ✕、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为美发店真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖预约取消、改约费用、染烫返工、储值卡有效期），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/小红书/抖音，几何抽象线稿），hover 变金底上浮。
- 备案/版权行：`© {year} {name} · 把时间还给自己 ｜ {icp}` 由 SITE 渲染，`icp` 默认为 `沪ICP备xxxxxxxxxx号-1` 占位。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲「把一个下午留给头发」一件事，动效只有光泽流动/遮罩升起/上浮，不堆砌。
2. **配色定死**：奶油白 `#FAF5EE` / 曜石黑 `#161412` / 香槟金 `#C7A35B` 三色全页统一（深浅变化只用同色系透明度），无彩虹渐变。
3. **字号字距层级**：大标题 `clamp(52px,7vw,96px)` 宋体 .06em 字距；眉题 12px .42em 字距；价目 17px 宋体；造型师理念 14px 宋体 1.9 行高。
4. **文案真实感**：「脸型比流行重要，先看骨相再动剪刀」「卷度是睡出来的，不是夹出来的」「好发型长在健康的头皮上」。无 Lorem、无 emoji 符号列表（序号用 01/02/03、价目用 ¥ 直标）。
5. **手工细节**：纸纹噪点、vignette、光泽流动、门店线稿图、发质检测/褪色掉色等行业黑话、姓氏单字头像徽。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），摇摆/光泽/呼吸用 `ease-in-out` 往返；跑马灯用 linear（无缝循环必需，属例外）。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/跑马灯/各区块/表单/弹窗/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL 配置 + loader + 导航 + 抽屉 + reveal + 法务弹窗 + 预约表单校验/成功态（零依赖，不用 GSAP/three.js）
- 无 `vendor/` —— 本模板零外部依赖（发丝用程序化 SVG、光泽用 stroke-dash 动画，不需要三维库）

## 重建命令

```bash
cd ~/workspace/fx-lab/salon-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py salon-page
```

## 移动端说明

- `≤1020px`：hero 改单列（发丝视觉置顶缩小、文案居中）；价目/造型师网格 2 列；门店/预约改单列。
- `≤900px`：汉堡菜单（曜石黑全屏抽屉，链接 stagger 浮现）；桌面导航隐藏。
- `≤640px`：全部单列；法务弹窗全屏式；表单双列改单列；标题字号 `clamp` 自适应。
- 触屏无 hover，上浮只在可 hover 设备生效；`prefers-reduced-motion` 下光泽/摇摆/跑马灯/升起全部静止直达终态。
- 渐进增强：无 JS 时所有内容直接可见（`.js` 类由脚本添加，隐藏态只在有 JS 时生效）。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` 全程监听，file:// 打开等待 6s）。
2. URL 扫描：成品 `index.html` 内零 `https` 外部 URL；无 Google Fonts/picsum/unpkg/jsdelivr。
3. 截图：`shots/salon-page.png`（1280×800）/ `shots/salon-page-mobile.png`（390×844）亲眼核对无裁切无乱码。
4. 隐藏元素完成态：hero 两行大字 transform 归零（`is-in` 覆盖规则生效）、35 个 `.reveal` 滚动后全部 `.in`；loader 隐藏。
5. 法务弹窗：服务条款打开验证（标题 + 6 条要点 + 背景滚动锁定），关闭三通道（✕/遮罩/ESC）逐个验证通过；移动端弹窗全屏式。
6. 表单：空提交 5 字段标红并聚焦首个；手机号正则 `^1[3-9]\d{9}$`；日期禁选过去；正确填写后成功态面板显示预约摘要 + 再约按钮。
7. SITE 渲染：页脚电话/邮箱/地址/营业时间/备案行均为变量渲染，改 `SITE` 即全改。
8. 文案：无 Lorem/emoji 列表；价目/造型师/条款均为真实感中文短句。
