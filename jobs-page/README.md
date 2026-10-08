# 职得 · 招聘平台落地页模板

一家虚构招聘平台「职得」的完整落地页：深蓝 hero + 可交互职位搜索（关键词+城市实时过滤职位列表）、12 个真实感职位卡、8 家入驻公司墙、3 则求职者故事、CTA 与法务三件套弹窗，开箱即用。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**LinkedIn / Indeed**——只学布局结构和交互编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **职位搜索式 hero**：大标题 + 副标题 + 一横条搜索（关键词输入框 + 城市下拉 + 亮色搜索按钮），下方挂热门关键词快捷入口与平台数据三栏（入驻企业/在招职位/回复率）。
2. **热门职位列表**：卡片三列网格，每卡含公司徽标（字母徽标）、职位名、公司·城市、技能标签、薪资、查看详情；顶部配类别筛选 chips（全部/技术/产品/设计/运营市场）。
3. **入驻公司墙**：纯文字公司名 + 字母徽标 + 在招数，一行四格，灰度低对比不抢戏。
4. **求职者故事**：三栏引用卡（引言大 + 头像 + 姓名/身份），对应 LinkedIn 的用户证言区。
5. **双 CTA + 五栏页脚**：深蓝大 CTA 面板（求职者/企业双按钮）→ 品牌+求职者/企业/关于/法律五栏页脚，法律栏挂隐私/条款/Cookie 三弹窗。

## 动效拆解

- **核心动效体系（整页只讲这一个）**：① 职位卡片 hover 上浮 6px + 阴影加深（spring 曲线 `cubic-bezier(.34,1.4,.4,1)`）；② 搜索/筛选时列表先 stagger 淡出（`.025s` 间隔），换数据后再 stagger 从下方 18px 弹入（`.06s` 间隔，`power3.out`），形成"重排"节奏。无 GSAP 时降级为直接替换，功能完整。
- **Hero 入场编排**：loader（三呼吸点 + "正在为你匹配好工作…"）淡出后，badge → 标题 → 副标题 → 搜索条 → 热门词 → 数据栏按 `data-d` 阶梯点亮，`cubic-bezier(.16,.84,.3,1)` 快起慢收。
- **滚动 reveal**：IntersectionObserver（threshold .14）给各区块加 `.is-in`，`data-d` 做 stagger 延迟；4 秒安全网兜底 IO 漏报；`prefers-reduced-motion` 直接全显。
- **导航**：滚动超 24px 后透明底变毛玻璃（backdrop-blur + 细边框 + 柔阴影），logo 与菜单同步换深色。
- **手工质感**：全页 SVG 噪点 + hero 底部 radial 暗角 vignette；easing 全用物理感 cubic-bezier / power，禁用 linear。

## 配置参数

- **换文案**：直接改 `index.src.html`（标题/职位数据在 `src/main.js` → `JOBS` 数组：职位名/公司/类别/城市/薪资/标签/急招标记），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--navy`（#0B1F3A）/ `--mist`（#F6F8FA）/ `--blue`（#0A66C2）；全页深浅变化走透明度，换主色只改三处。
- **筛选类别**：chips 的 `data-cat` 与 `JOBS` 的 `cat` 字段对应（tech/product/design/ops），加类别时两处同步加。
- **城市列表**：hero `<select id="citySel">` 的 option 与 `JOBS` 的 `city` 字段对齐即可。
- **热门关键词**：`.hero-tags button` 的 `data-kw`，点击后自动填入搜索框并执行搜索。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, address, email, phone, icp }`：

- 页脚联系方式（地址/邮箱/电话）与底部版权行（`© 2026 <name> · <icp>`）凡带 `data-site="address|email|phone|name|icp"` 的元素，JS 启动时统一用 SITE 渲染（含 `mailto:`/`tel:` 链接自动生成）。
- 买家上线：只改 SITE 五个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `icp` 默认占位 `浙ICP备2026000000号`，上线后替换真实备案号。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6 条真实感中文要点（收集范围、使用目的、存储安全、用户权利、退款规则等），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。
- 社交图标：页脚品牌区 inline SVG 四个（微信/微博/知乎/B站），hover 变亮蓝上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"搜职位"一个核心交互；动效只服务于卡片 hover 与搜索重排，无装饰性动画堆砌。
2. **配色**：`#0B1F3A` / `#F6F8FA` / `#0A66C2` 三色定死，深浅全走透明度；无彩虹渐变（CTA 面板只有一层亮蓝光晕）。
3. **字体**：大标题 clamp(40px,6.4vw,72px)、字距 -.01em、行高 1.18，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（"周三晚上投的简历，周五就拿到了 offer"），职位名/公司名/薪资像真的（25-40K·月、500万+粉丝号经验）；无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、加载态三点呼吸、急招小蓝标。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / spring / `power3.out` / `power2.in`，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `vendor/gsap.min.js` / `src/main.js`）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640）
- `src/main.js` —— 交互（classic script，无模块：SITE/法务文案/职位数据/搜索筛选/抽屉/弹窗/reveal/loader）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72214 字节，已验头；从 saas-landing 拷贝）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/jobs-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py jobs-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`vendor/gsap.min.js` 与 `src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（script 已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）；搜索条纵向堆叠（关键词/城市/按钮各占一行）；职位卡片/公司墙/故事全部单列或双列堆叠；hero 数据三栏改纵向。
- ≤640px：法务弹窗变全屏（100dvh 无圆角）；CTA 按钮纵排；页脚五栏改两列。
- 视差类效果本模板未使用；hover 动效在触屏上无副作用（tap 即 :hover 瞬时态）。
- 移动端横向溢出已核算：flex 子项统一 `min-width:0`，390px 下无横向滚动（已截图验证）。
