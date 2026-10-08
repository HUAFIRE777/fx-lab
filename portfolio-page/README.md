# 独立设计师作品集落地页

Awwwards 风格的个人作品集整站模板：宣言式 hero、6 件精选作品、服务列表、关于、巨型邮箱 CTA，可直接换文案上线卖给客户。

`huafire3d fx-lab — original implementation`

## 参考来源（布局学习，代码全部重写）

参考对象：Awwwards 获奖的**顶级设计师个人作品集站**这一类型。只学布局结构和交互编排，不复制任何源码、文案、图片。本模板学了下面 6 个布局点：

1. **极简导航**：左名字（陈维 Wei Chen）、右（作品/关于/联系）+ Hire me 胶囊按钮；滚动后导航加毛玻璃 + 细分割线。
2. **宣言式 hero**：巨型 statement 大字三行（"设计，/ 让好想法 / 被看见。"），每行遮罩内升起揭示。
3. **精选作品 6 件**：编辑式不对称大图网格（7/5 错列）；封面全部 CSS/SVG 几何构图（茶山日出、快门光圈、咖啡拱门、雨线波浪、书脊阵列、声波同心圆），每件不同构图但统一在米白/墨黑/朱砂三色内；hover 时墨色标题条从底部滑出 + 封面 1.06 缩放 + 鼠标视差。
4. **服务列表**：品牌视觉 / 网页设计 / 动效设计三行；hover 时墨色面板从底部漫上来整行反白，标题右滑、箭头变朱砂。
5. **关于我**：几何头像（同心圆 + 朱砂浮点）+ 三段简介 + 三个数字（8 年 / 40+ 品牌 / 12 奖项）。
6. **联系大 CTA + 极简页脚**：巨型邮箱字（clamp 30–112px）点击复制 + toast 反馈；页脚只留版权、联系方式、法务三件套、社交图标。

## 动效拆解

- **加载态**：名字 + 朱砂进度条，最短展示 800ms；`window.load` 或 3.5s 硬兜底后淡出，无 JS 时 `<noscript>` 直接隐藏。
- **hero 大字**：每行包在 `overflow:hidden` 遮罩里，`translateY(112%) → 0`，1.05s `cubic-bezier(.16,1,.3,1)`，三行 stagger 0.11s；loader 走后 `body.ready` 触发。
- **滚动 stagger**：IntersectionObserver（threshold 0.12）给 `.rv` 加 `.in`；`data-stagger` 容器内按顺序写 `--d` 延迟（0.09s 步进）。
- **封面 hover**：三层结构 `.px`（JS 鼠标视差 ±16px）> `.zoom`（CSS scale 1.06）> SVG；标题条 `translateY(102%) → 0`。
- **服务行反白**：`::before` 墨色面板 `scaleY(0→1)` 从底部展开，文字同步转米白。
- **Hire me 轻磁吸**：`pointer:fine` 下按钮跟随光标小幅偏移，松开回弹（`--spring`）。
- **纸纹噪点**：内联 SVG feTurbulence 全屏覆盖，opacity 0.055，零网络请求。
- **法务弹窗**：居中卡片式（移动端全屏），`translateY+scale` 入场；打开锁背景滚动，X / 遮罩 / ESC 三种关闭，焦点返回触发按钮。
- 全站 easing 只有三档：`--ease(.16,1,.3,1)`、`--ease-io`、`--spring(.34,1.4,.64,1)`，无 linear。

## 配置参数

- `src/main.js` 顶部 **`SITE`**：`email` / `phone` / `city` / `icp`（备案占位，上线前替换真实号）。联系 CTA 巨型邮箱、复制文案、页脚联系行、版权备案行全部引用它——**改一处全站生效**。
- `src/main.js` 顶部 **`LEGAL`**：隐私政策 / 服务条款 / Cookie 政策三篇文案（各 5 条，个人站口径中文通用条款）+ `DOC_DATE` 更新日期。
- 作品数据：直接改 `index.src.html` 里 6 个 `.card`（标题、分类标签、年份、SVG 封面构图）。
- 服务三行：改 `.svc` 的标题/描述；增减行数无需改 JS。
- 社交图标：页脚 `.social` 内联 SVG（Behance / Dribbble / Instagram / 微信），`href="#"` 占位，上线替换真实链接。

## 法务三件套（弹窗实现）

个人站页脚保持极简，隐私政策 / 服务条款 / Cookie 政策做成**模态弹窗**不占篇幅：

- 打开：点页脚三个小字链接，`LEGAL` 文案注入同一弹窗壳。
- 关闭：右上 ×（hover 旋转 90°）/ 点击遮罩 / ESC；打开时 `body overflow:hidden` 锁背景滚动，关闭恢复。
- 移动端 ≤640px：弹窗变全屏式（无圆角、通顶通底）。
- 文案：真实感中文通用条款，每篇 5 条（联系表单数据用途、Cookie 仅匿名统计等个人站口径），无 Lorem ipsum。
- 无 JS 时按钮无动作，页脚其余信息正常显示（渐进增强）。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"作品集"一件事；动效只有揭示/hover/弹窗三类，无装饰动画。
2. **配色**：米白 `#F4F1EA` + 墨黑 `#141414` + 朱砂 `#E4572E` 三色定死；封面渐变只用同色系暗角，无彩虹渐变。
3. **字体**：系统字体栈，大标题 clamp(64px,12.5vw,188px)、字距 -0.025em、行高 1.04，有呼吸感；数字 tabular-nums。
4. **文案**：真实感中文短句（"山外山茶室品牌视觉""不追风格，追准确"），无 Lorem、无 emoji 列表。
5. **手工细节**：纸纹噪点、档期呼吸点、坐标小字、印章红方块、toast 反馈、按钮 active 缩放。
6. **easing**：全部三档物理感 cubic-bezier，无 linear；`prefers-reduced-motion` 下动效全关。

## 源码结构

- `index.src.html` —— 开发源码（link styles.css + classic `<script src="src/main.js">`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，35KB，零外部请求）
- `styles.css` —— 全部样式（含响应式断点 900px / 640px）
- `src/main.js` —— vanilla JS：SITE/LEGAL 配置、loader、导航、汉堡菜单、IO 揭示、封面视差、磁吸按钮、邮箱复制、法务弹窗、页脚
- 无 `vendor/` —— 本模板未用 GSAP（CSS easing 已够），无空壳风险

## 重建方式

改完源码后（**禁止对已打包的 index.html 重复跑 singlefile**）：

```bash
cd ~/workspace/fx-lab/portfolio-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py portfolio-page
```

单向流程：源码永远是 `index.src.html` + `styles.css` + `src/main.js` 三件；`index.html` 是构建产物。

## 移动端说明

- ≤899px：导航收进汉堡 → 全屏大字菜单（链接 stagger 入场）；作品网格单列；服务行改为紧凑两列排版；关于区上下堆叠。
- ≤640px：法务弹窗全屏式；巨型邮箱字 word-break 换行；页脚双行堆叠。
- 触屏无 hover：封面标题条常驻下方 meta 区可见（标题信息不依赖 hover）；弹窗/菜单/复制均为点击交互。

## 验收记录（2026-10-05）

- CDP 无头：console 零报错、零 exception；`https://` 外链 grep 零命中。
- 完成态：loader 移除、`body.ready`、三行大字 transform=none；滚动到底 23/23 `.rv` 全部 `.in`。
- hover 真机事件验证：封面标题条滑出（transform none）+ 缩放 1.06；服务行反白（::before scaleY(1)，标题转米白）。
- 法务弹窗：三篇分别打开（5 条/篇、滚动锁定）→ X / 遮罩 / ESC 三种关闭均恢复滚动；390px 移动端弹窗全屏（390×844）。
- 截图：`shots/portfolio-page.png`（1440×900 hero）、`shots/portfolio-page-work.png`、`shots/portfolio-page-hover.png`、`shots/portfolio-page-contact.png`、`shots/portfolio-page-footer.png`、`shots/portfolio-page-modal.png`、`shots/portfolio-page-mobile.png`（390×844）、`shots/portfolio-page-mobile-menu.png`、`shots/portfolio-page-modal-mobile.png`。
- 待真机：GPU 肉眼终验（动效节奏、移动端手感）。
