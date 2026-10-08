# 安澜 ANLAN · 保险公司整站落地页

一套商用级保险公司落地页模板（虚构品牌「安澜 ANLAN」）：保障计算器 hero（滑杆实时联动保费）/ 寿险·医疗·意外·年金产品矩阵 / 理赔四步流程 / 顾问预约表单 / CTA / 企业页脚，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

1. **平安官网**：hero 区放"保障试算"入口、按人生阶段陈列产品矩阵（寿险/医疗/意外/年金四分法）、理赔流程步骤化展示。
2. **友邦官网**：顾问预约表单前置转化、页脚企业信息四栏式（品牌/产品/服务/联系）。

学到的布局点（实现均为原创代码）：①保障计算器 hero（年龄/保额滑杆 + 期限分段，保费实时联动）②四卡产品矩阵（价格锚点 + 标签 + hover 上浮）③理赔四步横向步骤线 ④顾问预约双栏（左卖点清单 / 右表单）⑤页脚法务三件套弹窗。

## 动效拆解

整页只讲一个核心动效：**保费计算器实时联动 + 数字滚动**，其余为各区块 stagger 入场微交互。

- **hero 入场**：标题两行 `yPercent:112→0` 逐行升起（stagger 0.12s，`power3.out`）；kicker/副文案/计算器卡片 `opacity + y` 淡入。坑：CSS 初值 `translateY(112%)` 必须先 `el.style.transform='none'` 清掉再交给 GSAP，否则百分比被解析成 px 残留；tween 播完 `clearProps` 后 CSS 兜底规则会把行压回去——已加 `[data-intro].in .rl-line{transform:none}` 完成态覆盖规则（studiofreight 事故复盘结论）。
- **保费数字滚动**：滑杆/期限变化时，保费数字 520ms 内 `easeOutCubic` 滚动到新值（rAF 手写，非 GSAP，避免与入场动画抢 ticker）。
- **区块 reveal**：IntersectionObserver，同父容器内 `.rv` 按出现顺序加 ≤360ms 递进延迟，形成 stagger；`cubic-bezier(.22,1,.36,1)` 0.7s。
- **加载态**：计算器首屏保费数字先 shimmer 骨架 700ms 再出数（ease-in-out，非 linear）。
- **hover 微交互**：产品卡上浮 + 阴影 + 图标反白；步骤圆圈放大变青；按钮 active 缩放；页脚链接 hover 左移。
- **全局**：SVG 噪点颗粒（feTurbulence，opacity .05）+ vignette 暗角；`prefers-reduced-motion` 直接显示完成态。
- **完成态可达**：`.js` 类由 main.js 首行添加——JS 失败则隐藏规则永不生效，内容默认可见（CDP 实证：正常加载后 `[data-intro]` 获得 `in` 类）。

## 配置参数

`src/main.js` 顶部 `SITE`（一改全改，页脚联系方式/版权行/`data-site` 占位全部引用它）：

- `brand` / `brandEn`：品牌名（默认 `安澜` / `ANLAN`）
- `organizer`：版权主体（默认 `安澜保险经纪有限公司`）
- `phone`：客服热线（默认 `400-820-9555`，示例）
- `address`：公司地址（示例）
- `email`：联系邮箱（示例）
- `icp`：备案号（示例，页脚版权行展示）

计算器费率模型（同文件 `bandRate` / `TERM_MULT`）：年龄四档费率（2.1/3.4/5.9/9.8‰）× 期限系数（10年0.85/20年1.0/30年1.25），保费 = 保额 × 费率 / 1000。换费率只改这两处。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲"保费算得清"一件事；动效集中在计算器联动与入场，无装饰性动画。
2. **配色**：深蓝 `#0F2A5C` / 浅灰 `#F2F4F7` / 青 `#2FB3A3` 三色定死；hero 与 CTA 的大圆点缀均为同色系低透明度，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(40px,4.6vw,62px)、字距 -0.01em、行高 1.18；保费数字 tabular-nums 等宽滚动不跳动。
4. **文案**：真实感中文短句（"保费多少，先算清楚再决定""和真人聊聊，再决定买不买"），无 Lorem ipsum、无 emoji 符号列表；hero 下带"保险产品说明"合规提示行。
5. **手工细节**：噪点 + vignette、骨架 shimmer、滑杆拇指 hover 放大、表单错误态红框 + 行内提示、成功态覆盖式确认面板、页脚 ICP 示例标注。
6. **easing**：`power3.out` / `cubic-bezier(.22,1,.36,1)` / `easeOutCubic` 全覆盖，无 linear（shimmer 用 ease-in-out）。

## 法务三件套（模态弹窗实现）+ SITE 配置变量

- **触发**：页脚「隐私政策 / 服务条款 / Cookie 政策」三个链接（`data-modal`），点击弹对应弹窗；页脚"Cookie 设置"同样打开 Cookie 政策。
- **关闭三通道**：右上角 X（hover 旋转 90°）/ 遮罩点击 / ESC；打开时 `body` 锁滚动，关闭后恢复焦点；`role="dialog"` + `aria-modal`。
- **文案**：安澜口径真实中文条款（隐私 5 条 / 服务 5 条 / Cookie 4 条）：信息收集范围与用途、境内加密存储、15 个工作日响应权、试算结果免责声明、Cookie 必要型/分析型说明、不跨站追踪；落款"最后更新 2026 年 10 月 · SITE.organizer"。无 Lorem ipsum。
- **移动端全屏式**：≤560px 弹窗占满视口（圆角 0、高 100%）。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / vendor/gsap.min.js / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含响应式断点 1024/900/560）
- `src/main.js` —— classic 脚本：SITE 渲染、导航、抽屉、hero 入场、reveal、计算器、表单校验、法务弹窗
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，© GreenSock；打包时内联，无 CDN）
- `README.md` —— 本文件

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py insurance-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤900px：中部菜单收进汉堡抽屉（右滑入 + 遮罩，链接点击自动收起）；hero 改单列、计算器卡片置文案下方；产品网格 4→2 列；顾问双栏改单列。
- ≤560px：产品网格 1 列；理赔步骤 2×2；页脚单列；法务弹窗全屏式。390×844 已截图验证。
- 抽屉与弹窗均支持 ESC 关闭；表单手机号按 `^1[3-9]\d{9}$` 校验。

## 外链白名单

成品 `index.html` 零 `https` 外部 URL（GSAP 内联、图标全 inline SVG、噪点为 data: URI、字体走系统栈）。验证：`grep -o 'https\?://[^"'\'' >]*' index.html | grep -v www.w3.org | sort -u` 应无输出（仅允许 SVG 命名空间 `www.w3.org`）。
