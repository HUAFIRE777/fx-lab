# 御湖湾 · 房地产楼盘落地页模板

虚构高端住宅品牌「御湖湾」的完整楼盘落地页：深墨绿 + 香槟金 + 米白三色，纯 CSS/SVG 程序化湖景 hero，户型 tab 翻转切换、配套距离矩阵、预约表单成功态，开箱即卖。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**贝壳 / 链家楼盘详情页**——只学布局结构和交互编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **楼盘子导航锚点**：概况 / 户型 / 配套 / 动态 / 预约五个锚点，滚动到对应区块；本模板做成顶部固定导航 + 平滑滚动。
2. **Hero 全景大图区**：楼盘名大标题 + 卖点副标题 + 双 CTA（预约看房 / 查看户型）；本模板用纯 SVG/CSS 画湖景日落（无外部图片），保留"大标题+双CTA"编排。
3. **户型 Tab 切换**：两房 / 三房 / 四房切换，户型示意 + 面积 + 朝向信息联动；本模板户型平面图为 JS 生成的 SVG 示意图，切换带翻转过渡。
4. **配套设施图标矩阵**：教育 / 商业 / 交通 / 生态四类图标 + 距离标注；本模板做成四宫格卡片，每项标步行距离。
5. **预约看房表单**：姓名 / 电话 / 意向户型三字段 + 提交成功态；本模板加了手机号格式校验与个性化成功文案。

## 动效拆解

- **主视觉动效：Hero 湖景视差**：SVG 场景分 5 层（天空/远山/楼宇/湖面/前景），滚动时按 `data-depth` 差速位移（只用 px `translate3d`，不用百分比——GSAP 百分比位移坑），桌面端鼠标移动带惯性插值跟手；波浪线 CSS 动画错峰起伏。
- **Hero 入场编排**：loader（三点呼吸）淡出后，kicker → 标题 → 副标题 → 双 CTA → 备注按 GSAP timeline 阶梯点亮（`power3.out`）；无 GSAP 时降级为 CSS stagger，无 JS 时全显。
- **滚动 reveal**：IntersectionObserver（threshold 0.16）+ `data-d` stagger 延迟；4 秒安全网兜底 IO 漏报；`prefers-reduced-motion` 直接全显。CDP 已验证 12 秒后零残留隐藏。
- **户型切换翻转**：点击 tab → 卡片 `rotateY` 7° 翻转 0.62s，中途（200ms）替换 SVG 平面 + 参数；无 `preserve-3d`（避开 Chromium blur 压平坑，本页无 blur 3D）。
- **微交互**：按钮 hover 上浮 2px + spring 曲线、active 缩放 .97；配套卡 hover 浮起；输入框 focus 金色光环；成功态对勾描画动画。
- **手工质感**：全页 SVG 噪点 + hero radial 暗角 vignette；easing 全用物理感 cubic-bezier / power3，无 linear。

## 配置参数

- **换文案**：直接改 `index.src.html` 里的中文（标题/副标题/户型参数/配套距离/动态/页脚），改完重跑构建（见下）。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--ink` / `--gold` / `--cream`；全页深浅走透明度，换主色只改三处。
- **换户型**：`src/main.js` → `UNITS` 对象（u2/u3/u4：name/tagline/specs/desc/svg），`room(x,y,w,h,名,副,阳台)` 画房间；增删户型同步改 `index.src.html` 的 `.tab` 按钮与 `unitOrder`。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name, address, email, phone, icp }`：

- 页脚联系方式（售楼热线/项目地址/电子邮箱）与底部版权行（`© 2026 <name> · <icp>`）凡带 `data-site="address|email|phone|name|icp"` 的元素，JS 启动时统一用 SITE 渲染（含 `mailto:`/`tel:` 链接自动生成）。
- 弹窗文案里的品牌名（`MODAL_DOCS` 副标题）同样走 SITE。
- 买家上线：只改 SITE 五个值 + 三篇法务文案（`MODAL_DOCS`），即完成品牌替换。
- `icp` 默认占位 `京ICP备xxxxxx号`，上线后替换真实备案号。

## 法务三件套（弹窗实现）

- 页脚「法律」栏：隐私政策 / 服务条款 / Cookie 政策三个按钮（`data-modal`），点击弹模态弹窗；表单下方"提交即代表同意《隐私政策》"同样可点开。
- 文案在 `src/main.js` → `MODAL_DOCS`（privacy/terms/cookie），每篇 6–7 条真实感中文要点（数据收集范围、保存期限、Cookie 用途、责任限制等），无 Lorem。
- 交互：右上 ✕ 关闭（hover 旋转 90°）/ 点击遮罩关闭 / ESC 关闭（优先于抽屉）；打开时 `body.modal-open{overflow:hidden}` 锁定背景滚动；焦点进 ✕ 按钮、关闭后回到触发点；`aria-hidden` 同步。
- 移动端（≤640px）：弹窗变全屏式（`inset:0`、无圆角、`100dvh`）。
- 社交图标：页脚品牌区 inline SVG 四个（微信 / 微博 / 抖音 / 小红书），hover 变金上浮。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"湖景住宅"一个核心卖点；动效只服务于 hero 视差和户型切换两个主角，无装饰性动画堆砌。
2. **配色**：`#0E3B2E` / `#C9A96A` / `#F7F4ED` 三色定死，深浅全走透明度；无彩虹渐变（CTA 区块只有一层金色光晕）。
3. **字体**：大标题 clamp(64px,11vw,138px)、字距 .22em、行高 1.18，有呼吸感；系统字体栈，零外部字体。
4. **文案**：真实感中文短句（"推窗见湖，三面采光""拌了嘴也有地方各自冷静"），无 Lorem、无 emoji 符号列表。
5. **手工细节**：vignette 暗角、SVG 噪点、卡片 hover 浮起、按钮 active 缩放、加载态三点呼吸、指南针"南"标识、波浪错峰动画。
6. **easing**：全部 `cubic-bezier(.16,.84,.3,1)` / spring / `power3.out`，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（引用 `styles.css` / `vendor/gsap.min.js` / `src/main.js`）
- `styles.css` —— 全页样式（含响应式断点 1020/720/640；注意：未覆盖 `[hidden]{display:none}`，抽屉显隐走 `.show` class）
- `src/main.js` —— 交互（classic script，无模块）：SITE 注入、户型 SVG 生成、视差、tab、表单、弹窗、抽屉
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72214 字节，已验头；从 saas-landing 拷贝，非空壳）
- `index.html` —— 构建产物（单文件，全内联，禁止手改、禁止重复打包）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/realestate-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py realestate-page
```

fx-singlefile.py 为一次性单向打包：`styles.css` → `<style>` 内联，`vendor/gsap.min.js` 与 `src/main.js`（classic）→ `<script>` 内联。**禁止对已打包的 index.html 重复跑**（script/css 已是内联态，重跑会坏）。改源码后从 `index.src.html` 重建。

## 移动端说明

- ≤720px：桌面菜单收起，汉堡按钮 + 右侧滑出抽屉（遮罩、Esc 关闭、点链接自动收）；CTA 按钮收起（抽屉内保留预约按钮）。
- 户型卡片单列堆叠；配套四宫格变单列；CTA 文案+表单单列；页脚四栏变单列。
- 视差与鼠标跟手仅在 `(pointer:fine)` 时启用，触屏不受影响；hero 标题 clamp 自适应。
- CDP 已验证 390px 下 `innerWidth=390`、无横向溢出；抽屉打开/ESC 关闭 PASS。

## 验收记录（2026-10-05）

- vendor 完整性：`gsap.min.js` 72214 字节，头含 `GSAP 3.12.5`，真品；`find -size -2k` 零空壳。
- CDP 无头抓 console：桌面 + 移动端全程零报错（CONSOLE-CLEAN）。
- 外链白名单：成品 `index.html` 零外部 URL（仅 GSAP 许可证注释里的 gsap.com 字面 + SVG data-URI 的 w3.org 命名空间声明，无真实请求）。
- 截图：桌面 `~/workspace/fx-lab/shots/realestate-page.png`（1280×800）、移动 `~/workspace/fx-lab/shots/realestate-page-mobile.png`（390×844）。
- 完成态可达：reveal 仅在 `html.js` 下隐藏；无 JS 全显；JS 下 hero 由入场编排点亮、其余由 IO + 4s 安全网点亮；12 秒后零残留隐藏已验证。
- 交互验证：户型 tab 三档切换（平面/参数联动）PASS；法务弹窗打开（标题/7 条要点/滚动锁定/`aria-hidden`）与三种关闭方式 PASS；表单空名/错号校验 PASS、成功态个性化文案 PASS；移动端抽屉打开/ESC 关闭 PASS。
