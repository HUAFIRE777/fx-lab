# 衡信律师事务所 · 落地页模板

一家虚构综合性商事律所「衡信律师事务所」的完整落地页：藏青 + 鎏金 + 纯白三色，宋体庄重排印，天平线稿描画 + 数据滚动为核心动效，业务领域矩阵 / 律师团队 / 案例数据带 / 免费咨询表单 / 法务三件套弹窗，开箱即用。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**国内外红圈所官网（金杜 / 中伦 / 君合等官网的通用结构）**——只学布局结构和交互编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **顶部通栏导航**：左印章式 logo、中间菜单（业务领域 / 律师团队 / 典型案例 / 咨询）、右"免费咨询"CTA；滚动超过 24px 后透明背景变为毛玻璃（backdrop-blur + 细边框）。
2. **主张式 hero**：小 badge（创立年份 + 办公室）+ 大标题主张 + 副标题（年份/规模数据）+ 双 CTA（免费咨询 / 业务领域）+ 右侧程序化视觉（本套用纯 SVG 天平线稿描画动画代替摄影图）。
3. **业务领域矩阵**：编号 + 领域名 + 一句话的卡片网格，hover 上浮 + 顶部鎏金线展开——红圈所"Practice Areas"矩阵的轻量化版本。
4. **律师团队 + 数据带**：合伙人卡片（头像/头衔/执业领域/一句话）接"胜诉率 / 标的额 / 客户数"滚动数字带，再配三条一句话典型案例——对应红圈所"People + Credentials"编排。
5. **免费咨询 CTA + 法务页脚**：表单（姓名/电话/事项分类）+ 提交成功态 + 保密承诺；页脚隐私政策 / 服务条款 / Cookie 三件套弹窗 + 执业许可证编号占位行。

## 动效拆解

- **主视觉动效**：案例数据带滚动数字——进入视口时 92% / 186 亿 / 3,200+ 用 easeOutQuart 从 0 滚到目标值（千分位逗号格式化）；业务领域卡片 hover 微倾（GSAP quickTo，桌面细指针限定）。
- **Hero 入场编排**：loader（衡字印章呼吸）淡出后，badge → 标题（逐行 yPercent 揭示，expo.out）→ 副标题 → 双 CTA → 备注阶梯点亮；右侧天平 SVG 按路径长度描画（power2.inOut）。
- **滚动 reveal**：IntersectionObserver（threshold 0.14）给 37 个元素加 `.is-in`，stagger 延迟；4 秒安全网兜底 IO 漏报；`prefers-reduced-motion` 直接全显。
- **按钮微交互**：hover 上浮 2px + 阴影加深（spring 曲线），active 缩放 .97；案例行 / 荣誉行 hover 左滑 + 底色提亮。
- **手工质感**：全页 SVG 噪点 + radial 暗角 vignette；easing 全用物理感 cubic-bezier / expo / power，禁用 linear。
- **已知坑处理**：GSAP 百分比位移先 `el.style.transform='none'` 清 CSS 初值再设 yPercent（实测不如此会有 px 残留）；无 preserve-3d + blur 组合；CSS 不覆盖 `[hidden]`；成功态用 class 切换。

## 配置参数

- **换文案**：直接改 `index.src.html` 里的中文（标题/领域/律师/案例/荣誉/页脚），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--navy` / `--gold` / `--white`；全页深浅变化走 `rgba()`，换主色只改三处。
- **换链接**：所有 CTA 的 `href="#contact"` / `"#practice"` 等按需替换为真实 URL；导航菜单文案在 `.menu` 与 `.drawer` 各一份（桌面/移动各一处）。
- **描画速度**：`src/main.js` → 天平段 `duration:1.6, stagger:.09`；计数器时长改 `dur = 1800`。
- **倾斜强度**：`src/main.js` → tilt 段 `rx(-dy * 7)` / `ry(dx * 9)` 改系数。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, phone, address, license }`：

- 页脚联系方式（电话/地址）与底部版权行（`© 2026 <name>`）及执业许可证行，凡带 `data-site="phone|address|name|license"` 的元素，JS 启动时统一用 SITE 渲染（含 `tel:` 链接自动生成）。
- 买家上线：只改 SITE 四个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `phone` 默认占位 `400-820-XXXX`，`license` 默认占位 `XXXXXXXXXXXXXXXXXX`，上线后替换真实号码。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6 条真实感中文要点（咨询保密、委托不成立声明、费用说明、Cookie 仅必要等），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。
- 社交图标：页脚品牌区 inline SVG 四个（微信 / LinkedIn / X / 邮件），hover 变鎏金上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"专业可信"一个气质；动效只服务于 hero 天平与数据带，无装饰性动画堆砌。
2. **配色**：`#16233A` / `#B9975B` / `#FFFFFF` 三色定死，深浅全走透明度；无彩虹渐变（深色区只有一层鎏金光晕）。
3. **字体**：大标题 clamp(32px,5.4vw,66px)、字距 .05em、行高 1.34，宋体栈，有呼吸感；零外部字体。
4. **文案**：真实感中文短句（"这起并购谈了十一个月，交割只用了一天"），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 鎏金线展开、按钮 active 缩放、加载态印章呼吸、badge 呼吸点、滚动提示。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / spring / `expo.out` / `power2.inOut`，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `vendor/gsap.min.js` / `src/main.js`）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640）
- `src/main.js` —— 交互（classic script，无模块）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72214 字节，已验头；从 saas-landing 拷贝）
- `index.html` —— 构建产物（单文件 115KB，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/lawfirm-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py lawfirm-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`vendor/gsap.min.js` 与 `src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（script 已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）；hero 改单列，天平视觉置顶。
- ≤640px：领域/团队/数据全部单列堆叠；hero 标题 clamp 下限 32px（已实测 390px 下"守护商业的确定性。"不断行）；法务弹窗全屏。
- 视差与卡片倾斜仅在 `(pointer:fine)` 时启用，触屏不受影响。
- 横向溢出已验证：390px 下 `scrollWidth - innerWidth = 0`。

## 验收记录（2026-10-05）

- vendor 完整性：`gsap.min.js` 72214 字节，头含 `GSAP 3.12.5`，真品；vendor 无 <2KB 空壳 JS。
- CDP 无头抓 console：零报错（file:// 下 classic script 正常执行）。
- 外链白名单：成品 `index.html` 零外部 URL（仅 GSAP 许可证注释里的 gsap.com 字面，属白名单例外；噪点/箭头为 data: URI SVG）。
- 完成态可达：reveal 元素仅在 `html.js` 下隐藏；无 JS 时全显；JS 下 hero 由入场编排点亮、其余由 IO + 4s 安全网点亮；计数器 92%/186 亿/3,200+ 实测滚到目标值；标题 tween 终值 matrix(0) 无残留。
- **GSAP 百分比坑（实踩）**：CSS `translateY(112%)` 会被 GSAP 解析成 px 残留再叠 yPercent 造成双重位移——修法为先 `el.style.transform='none'` 再 `gsap.set(yPercent:112)`，已验证终值归零。
- **截图 pin 坑**：`captureBeyondViewport` 会把 `position:fixed` 的 loader 钉在长截图顶部——交付截图改用视口捕获。
- 表单：空姓名/错误手机/未选分类分别报错；合法提交显示成功态（含事项名称回显）+ 保密承诺。
- 截图：桌面 `~/workspace/fx-lab/shots/lawfirm-page.png`（1280×800）、移动 `~/workspace/fx-lab/shots/lawfirm-page-mobile.png`（390×844）。
