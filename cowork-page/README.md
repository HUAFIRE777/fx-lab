# 合座 COBASE · 共享办公品牌落地页模板

一家虚构共享办公品牌「合座 COBASE」的完整落地页：暖白纸面 + 炭黑 + 芥黄三色定死，SVG 手绘空间插画零外部图片，核心动效是「空间图 hover 切换」与「方案卡 3D 倾斜」，城市 tab、预约表单、法务三件套弹窗开箱即用。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点

**WeWork 官网（wework.com）**——只学布局结构与交互编排，未复制其源码、文案、图片、商标。具体学到的 4 个布局点：

1. **空间大图 hero**：首屏一张大空间图 + 短标题 + 双 CTA（预约参观 / 先看空间）+ 数据条（城市数/空间数/会员/续租率）。
2. **城市/位置选择区**：城市 tab（上海/北京/深圳/杭州）切换，下方空间卡（地址/地铁/价格/备注）stagger 换入。
3. **会员方案三档**：灵活工位 ¥680 / 专属工位 ¥1,480 / 独立办公室 ¥2,880 起，中间档高亮「最多人选」。
4. **预约参观表单**：姓名/手机/城市/日期/方案 + 提交校验 + 成功 toast，表单旁配三条参观承诺。

## 动效拆解

- **核心动效① · 空间图 hover 切换**：4 张缩略图（开放式工位/静音电话亭/会议室/咖啡水吧），mouseenter/focus/click 切换主舞台，`opacity .55s` 交叉淡入淡出 + 标题/描述/meta 同步更新；桌面端绝对定位叠层 crossfade，移动端（≤1020px）改为静态流式切换（修复了绝对定位塌陷事故）。
- **核心动效② · 方案卡 3D 倾斜**：GSAP `quickTo` 驱动 `rotationX(±10°)` / `rotationY(±14°)` 跟手，`power3.out` 0.6s；仅 `(pointer:fine)` 且非 reduced-motion 时启用，无 GSAP/触屏时 CSS hover 阴影兜底，卡片照常完整。不用百分比位移，不用 `preserve-3d + blur` 组合。
- **滚动 reveal**：IntersectionObserver（threshold 0.14）+ `data-d` stagger（110ms 阶梯）；4 秒安全网兜底 IO 漏报；`prefers-reduced-motion` 直接全显；无 JS（`html.js` 未加）时全显。
- **Hero 入场**：loader（三点呼吸）淡出后，badge → 标题 → 副标题 → 双 CTA → 备注 → 插画按 `data-d` 阶梯点亮，`cubic-bezier(.16,.84,.3,1)`。
- **导航**：滚动 >24px 透明 → 毛玻璃（`backdrop-blur` + 细边框）；移动端汉堡 → 右侧抽屉（veil 遮罩、Esc 关闭、点链接自动收）。
- **手工质感**：全页 SVG 噪点 + radial 暗角 vignette；hero 吊灯 hover 轻晃；按钮 spring 上浮 + active 缩放；卡片 hover 上浮 + 芥黄描边。

## 配置参数（SITE 变量说明）

`src/main.js` 顶部 `const SITE = { name, address, phone, email, icp }`：

- 页脚「联系我们」栏（地址/电话/邮箱）与底部版权行（`© 2026 <name> · <icp>`）凡带 `data-site="address|phone|email|name|icp"` 的元素，JS 启动时统一渲染；电话自动生成 `tel:` 链接、邮箱自动生成 `mailto:` 链接。
- 买家上线：只改 SITE 五个值 + `MODAL_DOCS` 三篇法务文案，即完成品牌替换。
- `icp` 默认占位 `沪ICP备2026000000号-1`，上线后替换真实备案号。
- 换城市/空间数据：改 `CITIES` 对象（城市 key → 空间卡数组）；换房间插画/文案：改 `ROOMS` 对象；倾斜强度：tilt 段 `ry(dx * 14)` / `rx(-dy * 10)` 改系数。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 4 节真实感中文条款（数据收集范围、门禁影像保留、退租押金、Cookie 用途等），无 Lorem。
- 交互：右上 X 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 X 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲「空间图 hover 切换 + 方案卡 3D 倾斜」两个核心动效 + 各区块 stagger 入场，无装饰性动画堆砌。
2. **配色**：`#FAF7F2` / `#22211F` / `#E3A82B` 三色定死，深浅全走透明度；无彩虹渐变（只有一层芥黄光晕点缀 CTA）。
3. **字体**：大标题 clamp(46px,6.4vw,84px)、字距 -.02em、行高 1.12，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（「好光、好椅、好咖啡，以及准时到账的发票」「椅子合不合身你说了算」），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、吊灯 hover 轻晃、卡片 hover 浮起、按钮 active 缩放、加载态三点呼吸、badge 呼吸点。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / spring / `power3.out`，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `vendor/gsap.min.js` / `src/main.js`）
- `styles.css` —— 全页样式（含响应式断点 1020/900/640；移动端 stage 改静态流式）
- `src/main.js` —— 交互（classic script，无模块）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72214 字节，已验头）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/cowork-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py cowork-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`vendor/gsap.min.js` 与 `src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（已是内联态，重跑会坏）。

## 移动端说明

- ≤900px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（veil 遮罩、Esc 关闭、点链接自动收）。
- Hero：单列堆叠，插画 caption 的"hover"提示保留（桌面端功能）；`.br-desktop` 换行在 ≤1020px 隐藏。
- 空间画廊：舞台改为静态流式（`position:static` + `display:none/grid` 切换），缩略图 2×2 网格；hover 切换在触屏上由 tap 触发（click 绑定）。
- 城市卡/方案卡/页脚全部单列堆叠；方案卡 3D 倾斜在触屏上自动禁用（`(pointer:fine)` 门控）。
- 预约表单：双列变单列；弹窗 ≤640px 全屏式；抽屉与按钮均为 44px+ 触控友好尺寸。

## 验收记录（2026-10-05）

- vendor 完整性：`gsap.min.js` 72214 字节，头含 `GSAP 3.12.5`，真品，无空壳。
- CDP 无头抓 console：零报错（file:// 下 classic script 正常执行）。
- 外链白名单：成品 `index.html` 零外部 URL（仅 w3.org 命名空间与 GSAP 许可证注释）。
- 功能实测（CDP evaluate，7/7 PASS）：缩略图 hover 切换舞台（caption/面板/thumb 三同步）/ 城市 tab 切深圳（2 卡，南山智园店）/ 法务弹窗打开（标题+243 字正文+aria）/ ESC 关闭 / 表单坏手机号报错 / 表单成功 toast / 抽屉开合。
- 截图：桌面 `~/workspace/fx-lab/shots/cowork-page.png`（1280×800）、移动 `~/workspace/fx-lab/shots/cowork-page-mobile.png`（390×844）、弹窗 `~/workspace/fx-lab/shots/cowork-page-modal.png`。
- 完成态可达：reveal 元素仅在 `html.js` 下隐藏；无 JS 时全显；JS 下 hero 由入场编排点亮、其余由 IO + 4s 安全网点亮；`prefers-reduced-motion` 全显。
- **移动端 stage 塌陷事故（已修）**：≤1020px 时 `.stage-inner` 失去 aspect-ratio 而面板仍绝对定位 → 舞台高度塌为 0、移动端画廊只剩缩略图。修法：该断点下 `.stage-panel{position:static;display:none}` + `.is-active{display:grid}`，高度自然流式。教训：绝对定位叠层在响应式断点切换时必须同步给容器高度兜底。
- **截图竞态误报（已排除）**：首版桌面全页截图 hero 大片空白，复查为截图早于 reveal stagger 完成（3.5s 等待 vs stagger+transition 约 1.7s + load 延迟的边界抖动），非页面 bug；CDP 诊断确认 hero 7/7 点亮、opacity 1。
