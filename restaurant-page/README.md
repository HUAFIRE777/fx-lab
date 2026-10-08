# 山外山 · 餐厅官网首页模板（restaurant-page）

高端餐厅官网首页模板 —— 深色氛围 hero + 主厨寄语 + 招牌菜 + 到店信息 + 食客评价 + 预订 CTA，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：米其林餐厅官网（如 Noma 式）与高端餐厅站点。学到的布局点：

1. **导航**：左店名（圆形"山"印徽 + 山外山/山野料理·杭州）、中（关于/菜单/主厨/地址）、右预订按钮；滚动后毛玻璃（`backdrop-filter: blur` + 深色半透明）。
2. **全屏氛围 hero**：深色渐变 + 纹理（程序化径向暖光 + SVG 纸纹噪点），大标题（店名"山外山" + 定位语"山野之味，当季而食"）+ 预订 CTA（实心陶土钮 + 幽灵钮"看看菜单"）。
3. **主厨寄语**：几何图形头像（SVG 同心圆 + 山形线稿）+ 引言大字 + 署名（陈默 · 十八年灶台）。
4. **招牌菜 4 道**：卡片 = CSS/SVG 绘制的摆盘示意几何（深色圆盘 + 抽象食材形）+ 菜名 + 价格 + 一句描述，配壹贰叁肆序号徽。
5. **营业时间/地址/电话三栏信息**：连体三栏卡片，一行一事，电话字号放大。
6. **食客评价摘录 + 页脚**：三条短评（平台 + 月份署名）→ 深色预订 CTA（"今晚，山里见。" + 预约电话大字）→ 页脚（品牌/导航/联系/法务三件套/社交图标/备案行）。

## 动效拆解

1. **加载态**：全屏深色 loader（"山"印徽 + 陶土进度条），`window.load` 后最短 650ms 淡出，再触发 hero 入场。
2. **hero**：背景层 26s `kenburns`（scale 1→1.09 缓慢呼吸，`ease-in-out` 无限往返）；大字三行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，`cubic-bezier(.19,1,.22,1)`，逐行 stagger .05/.15/.28s）；CTA 组延迟淡入上浮；滚动提示线循环下落。
3. **导航**：滚动 40px 切换 `.scrolled` 毛玻璃；链接 hover 下划线生长。
4. **滚动 reveal**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`，菜品/三栏/评价 stagger 递进上浮。
5. **菜品卡 hover**：整卡上浮 8px + 阴影漫开，盘内 SVG 微放大旋转 2°；鸡汤卡蒸汽三线错峰升腾。
6. **手工细节**：全页 SVG `feTurbulence` 纸纹（`multiply` 5%）；按钮 hover 上浮 + 陶土阴影；预订电话 hover 下划线生长；`prefers-reduced-motion` 下全部动画跳过直达终态。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` / `CFG.revealMargin` —— 滚动 reveal 触发阈值与边距。
- `CFG.loaderMin = 650` —— 加载态最短展示（ms）。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / address / email / mailtoHref / phone / phoneHref / hours / icp / year`。页脚与正文电话/邮箱/地址/备案行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组），改文案只改这里。

## 法务三件套（弹窗实现）+ SITE 配置变量

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）。
- 关闭三通道：右上 X、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖预订取消、信息保存、Cookie 用途等），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/小红书/抖音，几何抽象线稿），hover 变陶土色上浮。
- 备案/版权行：`© {year} {name} ｜ {icp}` 由 SITE 渲染，`icp` 默认为 `京ICP备xxxxxxxxxx号-1` 占位。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"山野炭火"一个氛围，动效只有呼吸/升起/上浮三板斧，不堆砌。
2. **配色定死**：暖纸 `#FAF6EF` / 炭黑 `#1C1A17` / 陶土 `#C1502E` 三色全页统一，hero 反转炭黑底，无彩虹渐变。
3. **字号字距层级**：店名 `clamp(72px,14vw,168px)` 宋体 .1em 字距；眉题 13px .42em 字距；菜名 23px / 价格 19px 陶土；评价引用 18px 宋体。
4. **文案真实感**："千岛湖青鱼，炭火慢烤两刻钟""老父亲连喝了三碗""十二张桌，先到先得"。无 Lorem、无 emoji 符号列表（序号用壹贰叁肆汉字徽）。
5. **手工细节**：纸纹噪点、vignette、蒸汽错峰、电话大字下划线生长、加载态品牌滑杆、卡片序号徽。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），kenburns 用 `ease-in-out` 往返。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/各区块/弹窗/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL 配置 + loader + 导航 + 汉堡菜单 + reveal + 法务弹窗（无依赖，不用 GSAP/three.js）
- 无 `vendor/` —— 本模板零外部依赖（此前验证过 GSAP 真品 72KB 在 cart-fly-3d，但本模板纯 CSS 动效，不需要）

## 重建命令

```bash
cd ~/workspace/fx-lab/restaurant-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py restaurant-page
```

## 移动端说明

- `≤900px`：汉堡菜单（全屏深色 overlay，链接 stagger 浮现）；菜品/评价/三栏/页脚全部单列。
- `≤640px`：法务弹窗全屏式；hero 字号 `clamp` 自适应；CTA 按钮收窄。
- 触屏无 hover，卡片上浮只在可 hover 设备生效；蒸汽/kenburns 在 `prefers-reduced-motion` 下静止。
- 渐进增强：无 JS 时所有内容直接可见（`.js` 类由脚本添加，隐藏态只在有 JS 时生效）；另有 `<noscript>` 兜底。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` 全程监听）。
2. URL 扫描：零 `https` 外部 URL（仅 SVG data-URI 内的 `w3.org` 命名空间）；无 picsum/CDN/Google Fonts。
3. 截图：`shots/restaurant-page.png`（1440×900 hero）/ `shots/restaurant-page-mobile.png`（390×844）/ `shots/restaurant-page-modal.png`（390px 隐私政策弹窗全屏态），三张亲眼核对无裁切无乱码。
4. 隐藏元素完成态：27 个 `.reveal` 滚动后 opacity 全为 1；hero 三行大字 transform 归零；loader 隐藏。注：曾踩中 `.js .loaded` 后代选择器 bug（两类同在 `<html>` 上，应为 `.js.loaded` 并集），CDP 探针抓出，已修。
5. 法务弹窗：隐私/服务条款/Cookie 三个分别打开验证（标题 + 6/6/5 条要点 + 背景滚动锁定），关闭三通道（X/遮罩/ESC）逐个验证通过；移动端弹窗宽 390px 全屏式。
6. SITE 渲染：页脚电话/邮箱/地址/备案行均为变量渲染，改 `SITE` 即全改。
7. 文案：无 Lorem/emoji 列表；菜名价格描述均为真实感中文短句。
8. 环境备注：本机多 worker 并行，CDP 曾出现 Chrome 被外部清理导致连接静默断开（`WS CLOSED EXTERNALLY`），加"ws close  loud 退出 + CDP 超时 + 3 次重试"后一次通过。`index.html` 为单向打包产物，改 `index.src.html` 后重跑。
