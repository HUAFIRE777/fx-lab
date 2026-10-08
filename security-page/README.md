# 守望 · 智能安防品牌落地页模板

一家虚构智能安防品牌「守望」的完整落地页：白 + 深海军蓝 + 电光蓝三色定死，中文真实感安防文案（门铃/摄像头/报警主机三件套、场景守护故事、安装三步、套装价格），雷达扫描主视觉动效 + 滚动 reveal 动效体系，纯原生 JS 零第三方库，开箱即用。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**Ring（ring.com）**——只学布局结构和信息编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **顶部 sticky 导航**：左品牌 logo、中间产品/场景/安装/套装菜单、右预约 CTA；滚动超过 24px 后透明底变为毛玻璃。
2. **Hero 左文案右产品视觉**：大标题 + 双 CTA 之下，右侧放一块深色"实时守护"面板（Ring 放的是设备图，这里换成原创雷达扫描动效）。
3. **产品线矩阵**：门铃 / 摄像头 / 报警器三张等高卡片，每张配线条图标 + 核心卖点 + 起步价——学 Ring 的 devices 分区。
4. **场景故事 + 安装步骤**：生活场景叙事（深夜归家/出差/长辈）接"三步装好"流程——学 Ring 的 use-case → how-it-works 编排。
5. **套装价格 + 预约表单 + 五栏页脚**：三档套装（主推档高亮）→ 预约勘测表单 → 品牌/产品/服务/联系/法律五栏页脚，法律栏挂法务三件套弹窗——学 Ring 的定价页信息密度。

## 动效拆解

- **雷达扫描（整页唯一主视觉动效）**：深海军蓝圆盘 + 同心刻度环 + conic 扫描扇（4.2s 匀角速度旋转——真实雷达即匀速，非装饰 linear）+ 三层扩散 ping 波（`cubic-bezier(.16,.84,.3,1)`）+ 三个设备光点呼吸；下方四格设备 LIVE 缩略 + 在线计数器。
- **滚动 reveal**：IO（threshold 0.16）+ `data-d` stagger 90ms 阶梯；4 秒安全网兜底 IO 漏报；无 JS 时（`html` 无 `.js` 类）全部直接可见。
- **数字滚动计数器**：`.counter[data-count][data-decimals]` 进入视口后 rAF 从 0 数到目标，`easeOutQuart` 快起慢收；收尾强制对齐终值；`prefers-reduced-motion` 直接定值；6 秒安全网兜底。
- **卡片 hover 上浮**：产品卡/套装卡/安装步骤统一 `translateY(-6~-8px)` + 阴影加深，产品卡顶部电光蓝线条由左向右生长，`--ease` 物理曲线。
- **Hero 入场编排**：loader（品牌布防线生长）淡出后，badge → 标题 → 副文案 → 双 CTA → 备注 → 雷达卡按序点亮。
- **场景 tabs**：三场景切换，面板 `panelin` 淡入上浮 .5s；SVG 场景插画内带呼吸/闪烁微动画（SMIL）。
- **表单交互**：字段失焦即时清错；提交按钮加载态（spinner + 禁用）；成功态对勾描边动画（stroke-dashoffset）。
- **手工质感**：全页 SVG 噪点（data URI，非外链）+ hero 顶部电光蓝光晕 + 雷达卡暗角 vignette；弹窗 X hover 旋转 90°；按钮 active 缩放 .97。

## 配置参数

- **换文案**：直接改 `index.src.html` 里的中文（标题/产品卡/场景/步骤/套装/页脚），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--navy` / `--blue` / `--paper`；全页深浅变化走 `rgba()`，换主色只改三处即可。
- **换价格/数字**：套装卡 `.price` 与表单 select 选项同步改；计数器改 `<span class="counter" data-count="X" data-decimals="Y">` 两个属性。
- **换链接**：所有 CTA 的 `href="#plans"` / `"#booking"` 按需替换为真实 URL；导航菜单文案在 `.menu` 与 `.drawer` 各一份（桌面/移动各一处）。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, phone, email, address, icp }`：

- 页脚联系方式（客服热线/邮箱/地址）与底部版权行（`© 2026 <name> · <icp>`）凡带 `data-site="phone|email|address|name|icp"` 的元素，JS 启动时统一用 SITE 渲染（含 `tel:`/`mailto:` 链接自动生成，`data-site-link`）。
- 买家上线：只改 SITE 五个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `phone` 默认占位 `400-888-2666`、`icp` 默认占位 `沪ICP备00000000号-1`，上线后替换真实号码/备案号。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗；表单同意勾选旁的《隐私政策》同入口。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6 条安防口径真实感中文要点（影像本地存储优先/端到端加密/人脸识别只在端侧/删除权 15 天清备份/订阅退订/无第三方 Cookie 等），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。
- 社交图标：页脚品牌区 inline SVG 四个（微信 / 微博 / 抖音 / 客服电话），hover 变电光蓝上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"安心看得见"一个核心感受；动效只服务于雷达主视觉与信息 reveal，无装饰性动画堆砌。
2. **配色**：`#0A1E3C` / `#1E7BFF` / `#F6F9FD` 三色定死，深浅全走透明度；无彩虹渐变（hero 只有一层电光蓝光晕）。
3. **字体**：大标题 clamp(44px,6.4vw,78px)、字距 -.015em、行高 1.12，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（"门口的眼睛，快递到了先告诉你""加班到半夜，家先亮了灯""孝心，守望帮你尽"），价格数字合理（499/399/299 起，套装 899/1899/3299），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、加载态布防线生长、LIVE 呼吸点、雷达光点标签。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / 弹簧 / `easeOutQuart`；唯一的 linear 是雷达扫描扇——真实雷达匀角速度，属物理正确而非装饰。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `src/main.js`，classic script）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640）
- `src/main.js` —— 交互（classic script，零第三方依赖；顶部 `SITE` + `MODAL_DOCS`）
- `vendor/` —— 空目录（本模板有意零外部库，原生 JS 全实现；无空壳文件）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/security-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py security-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）；产品卡/套装卡/安装步骤全部单列堆叠，主推套装置顶。
- hero 文案在上、雷达卡在下（max-width 440px 居中）；数据条 2×2；场景面板文案在上、插画在下。
- 页脚五栏 → 2×2；hero 双 CTA 等宽并排；抽屉链接 44px+ 触控友好。
- 法务弹窗 ≤640px 变全屏（`100dvh` 无圆角）；已验证 390px 下无横向溢出。

## 验收记录（2026-10-05）

- vendor 完整性：空目录，零外部库，无空壳 JS。
- CDP 无头抓 console：零报错、零异常（Runtime.consoleAPICalled + pageerror 双通道，等 6 秒）。
- 外链白名单：成品 `index.html` 零真实外部网络请求（`http` 仅出现在 SVG `xmlns` 的 w3.org 命名空间字面，无许可证注释 URL）。
- 完成态可达：reveal 元素仅在 `html.js` 下隐藏；无 JS 时全显；JS 下 hero 由入场编排点亮、其余由 IO + 4s 安全网点亮；计数器另有 6s 安全网直接定值；滚动到底后 CDP 逐个计数验证全部可见。
- **表单验收**：空提交逐项报错、错误手机号报错、未勾选协议报错；合法提交 → 加载态 → 成功态 PASS。
- **法务弹窗验收**：隐私政策弹窗打开（标题/6 条要点/滚动锁定/`aria-hidden` 全对）与 ESC 关闭 PASS。
- **移动端验收**：390px 下抽屉打开/关闭正常，无横向溢出 PASS。
- **无头环境备注**：本机 headless Chromium 的 rAF 约 6fps，验收等待时间放长后取值；真实浏览器中 IO + rAF 即时触发。
- 截图：桌面 `~/workspace/fx-lab/shots/security-page.png`（1280×800）、移动 `~/workspace/fx-lab/shots/security-page-mobile.png`（390×844）。
- 已知坑规避：未使用 preserve-3d+blur（雷达用平面层叠）；未用 GSAP（无百分比位移坑）；`[hidden]{display:none!important}` 显式声明；reveal 完成态三重保障（IO + 安全网 + 无 JS 全显）。
