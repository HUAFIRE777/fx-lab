# 拾光婚礼影像 · 婚庆摄影工作室官网首页模板（wedding-photo-page）

婚庆摄影工作室整站首页模板 —— 大字品牌主张 hero + 作品瀑布流 + 套餐三档 + 档期日历 + 摄影师 + 预约表单 + 法务三件套页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：国际婚礼摄影工作室官网（如 Jose Villa 式 / Junebug Weddings 式站点）。学到的布局点：

1. **导航**：左品牌印徽（圆形"拾"章 + 拾光/婚礼影像）、中（作品/套餐/档期/关于）、右"预约档期"金钮；滚动后毛玻璃（`backdrop-filter: blur` + 象牙白半透明）。
2. **大字品牌主张 hero**：衬线大标题两行（"把那一天的光，妥善地留住"）+ 副标题一句 + 双 CTA（实心金钮"预约档期" + 幽灵钮"看看作品"）+ 三个数字背书（800+ 场 / 12 年 / 36 城）。
3. **作品瀑布流画廊**：CSS columns 三列 masonry，9 张程序化"照片"占位（渐变底 + 金色线稿 SVG），hover 整卡上浮放大 + 底部标题浮现。
4. **套餐三档并排**：纪实跟拍 / 婚纱旅拍（最多人选·高亮）/ 全案定制，明码标价 + 服务清单 + "选这个档"直达表单（自动带入套餐选项）。
5. **档期查询日历示意**：月份左右切换 + 可预约/已订/待定三态圆点，点击可预约日期直接填入表单婚期栏。
6. **预约档期表单 + 页脚**：深色预约卡（左文案右表单，提交成功态 + 预约编号）→ 页脚（品牌/导航/工作室信息/法务三件套弹窗/社交图标/版权行）。

## 动效拆解

1. **加载态**：象牙白全屏 loader（"拾"印徽 + 金色进度条），`window.load` 后最短 700ms 淡出，再触发 hero 入场；4 秒兜底放行（完成态必达）。
2. **主视觉动效**：hero 背景 5 颗金色光斑（bokeh orbs，`filter: blur` + 11–21s `drift` 缓慢漂移缩放，无限往返）+ 作品瀑布流滚动 stagger 入场（逐卡延迟 ≤0.5s，`cubic-bezier(.22,1,.36,1)`）。
3. **hero**：大标题两行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，逐行 stagger .16/.30/.44s）；CTA 组与数据条延迟淡入上浮；滚动提示线循环下落。
4. **导航**：滚动 40px 切换 `.scrolled` 毛玻璃；链接 hover 下划线生长；移动端汉堡 → 全屏抽屉（X 动画）。
5. **滚动 reveal**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`；无 JS 时不隐藏（`.js` 前缀），`prefers-reduced-motion` 下直达终态。
6. **作品卡 hover**：整卡上浮 6px + 阴影漫开，内层 SVG 放大 1.06，底部标题渐显上浮。
7. **手工细节**：全页 SVG `feTurbulence` 纸纹噪点（`multiply` 混合）；hero/预约卡 vignette 暗角；按钮 hover 上浮 + 金色阴影（`cubic-bezier(.34,1.4,.44,1)` 微弹）；成功态对勾 `pop` 弹入；日历可预约日期 hover 放大。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` —— 滚动 reveal 触发阈值。
- `CFG.loaderMin = 700` —— 加载态最短展示（ms）。
- `CFG.staggerMax = 0.5` —— 瀑布流 stagger 延迟上限（s）。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / phone / phoneHref / wechat / address / icp / year`。页脚与正文电话/微信/地址/备案行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组），改文案只改这里。

## 法务三件套（弹窗实现）

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）。
- 关闭三通道：右上 X、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为真实感中文通用条款（隐私 5 条 / 服务 5 条 / Cookie 5 条，覆盖预约取消、定金、改期、成片交付、照片使用授权），无 Lorem。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个主视觉动效（hero 金色光斑漂移 + 瀑布流 stagger 入场），不堆砌视差/3D/粒子。
2. **配色定死 3 色**：象牙白 #FFFDF7 + 墨黑 #1A1A1A + 香槟金 #C6A15B 全页统一，无彩虹渐变；深色区块（档期/预约/页脚）只用墨黑 + 金色线条。
3. **字体讲究**：衬线（宋体栈）大标题字距 .06–.3em、行高 1.32–1.55 有呼吸感；正文字距 .04–.14em；英文小字（RINGS/VEIL/DOCUMENTARY）字距 .42em 做装饰。
4. **无 Lorem、无 emoji**：文案全部真实感中文短句（"那天风很大，头纱飞起来的样子比摆拍好看""他手一直在抖，戒指戴了三次"）；社交图标为 inline SVG 线稿。
5. **手工细节**：vignette 暗角、纸纹噪点、加载态、按钮微弹、卡片 hover 标题浮现、日历圆点三态、成功态预约编号。
6. **easing 物理感**：`cubic-bezier(.22,1,.36,1)`（out-expo 系）做入场，`cubic-bezier(.34,1.4,.44,1)` 微弹做按钮/弹窗，不过度弹跳。

## 源码结构

```
wedding-photo-page/
├── index.src.html   # 源码 HTML（打包输入，勿直接改 index.html）
├── index.html       # 打包产物：单文件，可直接双击打开/交付
├── styles.css       # 源码样式（打包时内联）
├── src/main.js      # 源码脚本：SITE/LEGAL/CFG 配置 + 交互（打包时内联）
└── README.md        # 本文件
```

无 vendor 目录：本套纯原生 CSS/JS 实现，零外部库、零外部请求（作品占位图为 CSS 渐变 + inline SVG 程序化线稿）。

## 重建方式

```bash
cd ~/workspace/fx-lab/wedding-photo-page
cp index.src.html index.html            # 从源码复制出打包底
python3 ~/workspace/bin/fx-singlefile.py wedding-photo-page
```

- `fx-singlefile.py` 为一次性单向打包器：改源码后从 `index.src.html` 重建，**禁止**对已打包的 `index.html` 再跑一次。
- 打包后校验：`grep -o 'https\?://' index.html` 应只有 `http://www.w3.org/2000/svg`（SVG 命名空间字面，非外链）。

## 移动端说明

- ≤960px：导航收起为汉堡抽屉；瀑布流 2 列；套餐/摄影师单列；预约卡上下堆叠。
- ≤640px：瀑布流 1 列；表单单列；法务弹窗全屏式；页脚单列。
- 移动端 hero 数据条字号缩小、防挤压换行；抽屉菜单链接点击后自动关闭。
