# 造宅 · 全案整装落地页模板（interior-page）

装修公司整站首页模板 —— hero + 案例瀑布流 + 装修流程四步 + 报价计算器 + 设计师团队 + 预约 CTA + 页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点（只学布局结构，代码/文案/图片全部原创）

参考：Houzz（装修案例与找设计师心智）。学到的布局点：

1. **案例瀑布流**：CSS columns masonry，卡片 = 程序化 SVG 室内示意 + 风格标签 + 小区名/面积/户型/工期/全案造价；hover 整卡上浮 + 图内放大。
2. **装修流程 4 步**：横向四步（免费量房 → 设计签约 → 施工交付 → 售后质保），数字圆徽 + 赭石虚线连接线，移动端改单列。
3. **报价计算器**：面积滑杆 + 户型 chips + 档次三档（1299/1899/2699 元/㎡）→ 右侧深色面板大数字滚动出总价（万元），附硬装/主材/软装拆分条。
4. **设计师团队**：四人卡片 = 几何抽象头像 + 职称/年限徽 + 擅长/代表作一句话。
5. **顶部导航**：左品牌（「宅」印徽 + 造宅/全案整装·12年）、中锚点链接、右「免费量房」CTA；滚动 40px 后毛玻璃。

## 动效拆解（整页一个核心动效体系：数字滚动 + 卡片放大 + 滚动 stagger）

1. **加载态**：暖灰全屏 loader（「宅」印徽呼吸 + 赭石进度条），`window.load` 后最短 650ms 淡出，再加 `body.ready` 触发 hero 入场；load 迟迟不来有 4s 兜底。
2. **hero 入场**：大标题两行遮罩升起（`overflow:hidden` 块 + 内层 `translateY(112%)→0`，`cubic-bezier(.19,1,.22,1)`，stagger .12/.24s）；副标题/CTA/眉题/四项数据递进淡入上浮；右侧场景卡延迟浮现 + 两枚悬浮 chip 上下漂浮。
3. **报价计算器（核心）**：滑杆/户型/档次任一变化 → GSAP `power3.out` 补间数值，总价以"万元"滚动（保留 1 位小数），拆分条宽度同步过渡；**只补间 textContent，不碰 transform**（避 GSAP 百分比位移坑）。
4. **案例/成员卡 hover**：整卡上浮 8px + 阴影漫开，卡内 SVG `scale(1.06–1.07)` 缓放；触屏无 hover 时不触发。
5. **滚动 stagger**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`，`--d` 自定义属性做 stagger 延迟。
6. **手工细节**：全页 SVG `feTurbulence` 纸纹（`multiply` 5.5%）；hero 径向暗角；滑杆赭石填充随值联动；按钮 hover 上浮 + 阴影；`prefers-reduced-motion` 下全部动画跳过直达终态。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` —— 滚动 reveal 触发阈值。
- `CFG.loaderMin = 650` —— 加载态最短展示（ms）。
- `CFG.numDuration = 0.8` —— 报价数字滚动时长（s）。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / address / phone / phoneHref / email / mailtoHref / hours / icp / year`。页脚与联系区的电话/邮箱/地址/营业时间/备案行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组），改文案只改这里。
- 计算器常量：档次费率写在 HTML `data-rate` 上（1299/1899/2699），户型系数写在 `data-mult` 上（0.94/1/1.06/1.12），拆分比例硬装 55% / 主材 30% / 软装 15% 在 `paint()` 里。

## 法务三件套（弹窗实现）+ SITE 配置变量

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）；CTA 区的隐私政策文字链共用同一弹窗。
- 关闭三通道：右上 ✕、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为装修公司 flavor 的真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖量房预约、报价说明、增项赔付、工地直播、质保等），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/小红书/抖音，几何抽象线稿），hover 变赭石色上浮。
- 版权行：`© {year} {name} ｜ {icp}` 由 SITE 渲染，`icp` 默认为 `沪ICP备xxxxxxxxxx号-1` 占位。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"签约价=结算价"一个信任状，动效只有升起/滚动/数字三板斧，不堆砌。
2. **配色定死**：暖灰 `#2E2A26` / 亚麻 `#EFE9DD` / 赭石 `#C17A3D` 三色全页统一（深色区块用暖灰底、亚麻字），无彩虹渐变。
3. **字号字距层级**：大标题 `clamp(44px,6.2vw,84px)` 宋体 .04em 字距；眉题 13px .34em 字距；总价 `clamp(56px,6vw,84px)` 等宽数字；案例价 26px 赭石。
4. **文案真实感**："万科·翡翠滨江 128㎡ 三居 32.8万""96 年老公房翻新，水电全改零返工""灯光一开，朋友圈问爆了'哪家装的'"。无 Lorem、无 emoji 符号列表。
5. **手工细节**：纸纹噪点、hero 暗角、悬浮 chip、滑杆填充联动、步骤圆徽 hover 反转、头像几何抽象。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），漂浮 chip 用 `ease-in-out` 往返。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="vendor/gsap.min.js">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/各区块/弹窗/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL 配置 + 程序化 SVG 场景生成（客厅/卧室/厨房/餐厅/书房/卫浴 6 种 + 4 款几何头像）+ loader + 导航 + 汉堡菜单 + reveal + 计算器（GSAP 数字滚动）+ 预约表单（前端演示，不发网络请求）+ 法务弹窗
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，非空壳；文件头许可证注释含官网 URL，零网络请求）

## 重建方式

```bash
cd ~/workspace/fx-lab/interior-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py interior-page   # 一次性单向，禁重复跑
```

验收（2026-10-05）：无头 console 零错误零告警；20/20 `.reveal` 滚动后 opacity 全为 1；hero 两行大字 transform 归零；计算器滑杆 150㎡→28.5万、切豪装→40.5万；隐私/服务/Cookie 三弹窗开合（X/遮罩/ESC）与移动端全屏态通过；预约表单校验+成功态通过；汉堡抽屉开合通过；零真实外部 URL。

## 移动端说明

- `≤1020px`：hero 单列、案例瀑布流 2 列、流程 2×2、计算器上下结构、设计师 2 列。
- `≤680px`：汉堡菜单（全屏亚麻 overlay，链接 stagger 浮现）；案例/流程/设计师/页脚全部单列；档次三档改单列；法务弹窗全屏式；CTA 表单全宽。
- 触屏无 hover，卡片放大只在可 hover 设备生效；`prefers-reduced-motion` 下漂浮/滚动动画静止。
- 渐进增强：无 JS 时所有文字内容直接可见（隐藏态只在 `html.js` 下生效，`<head>` 内联脚本第一时间加类）；另有 `<noscript>` 隐藏 loader。
