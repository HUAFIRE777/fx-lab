# 驰运 SWIFTLINE · 物流公司落地页模板

一家虚构物流公司「驰运 SWIFTLINE」的完整落地页：藏青 #14264A / 白 / 橙 #F56600 三色定死，中文真实感物流文案（运单查询演示/服务矩阵/时效承诺/网点查询），核心动效是运单查询时间线 + SVG 干线路线路径动画，纯原生 JS 零第三方库，开箱即用。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**FedEx 与顺丰官网**——只学布局结构和信息编排，未复制其源码、文案、图片、商标。具体学到的 4 个布局点：

1. **运单查询 Hero**：首屏核心就是一个大号运单输入框 + 查询按钮（学顺丰首页"查件"前置的做法）；本模板点查询后展开演示时间线（揽收→干线→中转→运输中），右侧配 SVG 干线路线动画。
2. **服务矩阵**：快递 / 快运 / 冷链 / 国际四张等高卡片，每张配图标 + 一句话卖点 + 价格入口——学两家官网的产品分区方式。
3. **时效承诺数据带**：准点率 / 日均单量 / 网点数 / 覆盖区县四个大数字滚动，配"超时自动赔/丢损先行赔/客服 15 秒接"三承诺卡——学 FedEx 的 service commitment 数据带。
4. **网点查询**：输入城市名即出营业部列表（地址/营业时间/电话）——学顺丰的网点查询区块；本模板为演示数据，文案已注明。

## 动效拆解

- **运单查询演示（核心动效）**：点「查询」→ 结果面板 `max-height` 展开 → 900ms 加载态（时间线变灰）→ 进度条 0→80%（1s `var(--ease)`）→ 5 个节点按 220ms 阶梯点亮（translateX 滑入），当前节点橙色呼吸脉冲；运单号经 `cleanNo` 过滤后回显。
- **SVG 路线路径动画（核心动效之二）**：深圳→郑州→北京三次贝塞尔干线；虚线 `stroke-dashoffset` 匀速流动（流向指示，物理上即恒速，刻意用 linear）；包裹圆点用 `getPointAtLength` 沿路径 `easeInOutSine` 7 秒往返，`visibilitychange` 暂停省电；`prefers-reduced-motion` 时圆点静置中点。
- **数字滚动计数器**：`.counter[data-count][data-decimals]` 进入视口（IO threshold 0.4）后 rAF 从 0 数到目标，`easeOutQuart`；万级整数自动千分位（32,000）；收尾强制对齐终值；6 秒安全网兜底；`prefers-reduced-motion` 直接定值。
- **滚动 reveal**：IO（threshold 0.16）+ `data-d` 阶梯延迟（90ms×d，上限 8 档）；4 秒安全网兜底；无 JS 时（`html` 无 `.js` 类）全部直接可见。
- **导航毛玻璃**：`scrollY > 24` 切换 `.scrolled`，透明藏青 → 白底毛玻璃（backdrop-blur 14px）+ 深色文字。
- **卡片 hover**：服务卡上浮 8px + 橙边框 + 箭头右滑 4px，弹簧曲线 `cubic-bezier(.34,1.45,.44,1)`；承诺卡上浮 6px。
- **手工质感**：全页 SVG 噪点（data URI）+ radial 暗角 vignette；badge 呼吸点；按钮 active 缩放 .96；加载态橙线生长。

## 配置参数

- **换文案**：直接改 `index.src.html` 里的中文（标题/服务卡/承诺/网点/页脚），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--navy` / `--orange` / `--white`；全页深浅变化走 `rgba()`，换主色只改两处即可。
- **换统计数字**：时效带四张卡的 `<span class="counter" data-count="X" data-decimals="Y">` 改两个属性即可，动画自动适配小数位与千分位。
- **换链接**：所有 CTA 的 `href="#cta"` / `"#track"` / `"#outlets"` 按需替换为真实 URL；导航菜单文案在 `.menu` 与 `.drawer` 各一份（桌面/移动各一处）。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, phone, email, address, icp }`：

- 页脚联系方式（客服热线/邮箱/公司地址）与底部版权行（`© 2026 <name> · <icp>`）凡带 `data-site="phone|email|address|name|icp"` 的元素，JS 启动时统一用 SITE 渲染（含 `mailto:`/`tel:` 链接自动生成）。
- 买家上线：只改 SITE 五个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `phone` 默认占位 `95011`、`icp` 默认占位 `沪ICP备xxxxxx号`，上线后替换真实号码/备案号。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6 条物流口径真实感中文要点（实名寄递信息/运单保存 3 年/禁限寄品/保价 0.5%/未保价最高 7 倍运费/三类 Cookie 说明），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。
- 社交图标：页脚品牌区 inline SVG 四个（微信 / 微博 / 抖音 / 客服热线），hover 变橙色上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"运单查询 + 干线路况"一个核心动效；其余只有各区块 stagger 入场与卡片 hover，无装饰性动画堆砌。
2. **配色**：`#14264A` / `#FFFFFF` / `#F56600` 三色定死，深浅全走透明度；光晕只有单色 radial（非彩虹渐变）。
3. **字体**：大标题 clamp(44px,6.4vw,76px)、字距 -.015em、行高 1.16，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（"寄得快，查得到，到得准""晚到先赔，不扯皮""寄文件也用得上"），数字合理（准点率 98.7%/日均 1200 万单/32000 网点），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、加载态橙线生长、badge 呼吸点、路线虚线流动。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / 弹簧 / `easeOutQuart`；唯一 linear 是干线虚线流向（物理恒速，刻意选择，已注明）。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `src/main.js`，classic script）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640）
- `src/main.js` —— 交互（classic script，零第三方依赖）
- `vendor/` —— 空目录（本模板有意零外部库，原生 JS 全实现；无空壳文件）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/logistics-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py logistics-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）；服务卡 4 列→2 列（≤640px 单列）；hero 两列→单列，路线图移到查询面板下方。
- 网点区两列→单列；统计行 4 列→2 列；hero 标题 clamp 自适应；抽屉与按钮均为 44px+ 触控友好尺寸。
- 法务弹窗 ≤640px 变全屏（`100dvh` 无圆角）；已验证 390px 下 `scrollWidth == clientWidth`，无横向溢出。
- 移动端抽屉打开态截图见 `../shots/logistics-page-mobile.png`。

## 验收记录（2026-10-05）

- vendor 完整性：空目录，零外部库，无空壳 JS（`find vendor -type f` 0 个文件）。
- CDP 无头抓 console：零报错、零异常（Runtime.exceptionThrown + console.error + Log.error 三通道）。
- 外链白名单：成品 `index.html` 零外部 URL（唯一命中 `http://www.w3.org/2000/svg` 为 SVG 命名空间，非外链）。
- 交互验证：运单查询 5/5 节点点亮、结果面板展开、运单号回显；计数器终值 98.7/1200/32,000/2800 全部到达；reveal 26/26 完成；包裹圆点沿路径运动中。
- 法务弹窗验收：隐私政策弹窗打开（标题/6 条要点/滚动锁定/`aria-hidden` 全对）与 ESC 关闭 PASS。
- 完成态可达：reveal 仅在 `html.js` 下隐藏；无 JS 全显；JS 下首屏由 IO、折叠下由 IO + 4s 安全网点亮；计数器另有 6s 安全网。
- 移动端验收：390px 下抽屉打开/关闭正常，`scrollWidth == clientWidth` 无横向溢出 PASS；汉堡右对齐（`margin-left:auto`）。
- **修过的 bug**：① reveal 完成态选择器权重事故——`.reveal.in`(0,2,0) 被 `html.js .reveal`(0,2,1) 压住，全页内容隐身；修法：完成态改为 `html.js .reveal.in`。② 移动端汉堡按钮未右对齐（`.nav-actions` 隐藏后失去 `margin-left:auto` 推力）；修法：≤900px 断点内 `.burger{margin-left:auto}`。
- 无头环境备注：本机 headless Chromium 的 rAF 约 6fps，验收等待 12 秒后取值；真实浏览器中 IO + rAF 即时触发，无此延迟。
- 截图：桌面 `~/workspace/fx-lab/shots/logistics-page.png`（1280×800，全页含查询演示展开态）、移动 `~/workspace/fx-lab/shots/logistics-page-mobile.png`（390×844，抽屉打开态）。
- 已知坑规避：未使用 preserve-3d+blur；未用 GSAP 百分比位移（零 GSAP）；未覆盖 `[hidden]{display:none}`；reveal 完成态三重保障（IO + 安全网 + 无 JS 全显）。
