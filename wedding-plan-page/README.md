# 诺言 VOWS · 婚礼策划公司官网首页模板（wedding-plan-page）

婚礼策划公司整站首页模板 —— 花瓣飘落 hero + 婚礼拱门剪影 + 案例瀑布流 + 套餐三档 + 策划流程四步 + 新人评价墙 + 档期查询表单 + 法务三件套页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

> 注意：这是**婚礼策划**公司页（统筹/执行/预算管理），不是婚纱摄影页（fx-lab 另有 wedding-photo-page 婚摄模板）。

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：The Knot / WeddingWire 式婚礼服务站点。学到的布局点：

1. **导航**：左品牌印徽（圆形"诺"章 + 诺言 VOWS）、中（案例/套餐/流程/评价）、右"查档期"金钮；滚动 40px 后毛玻璃（`backdrop-filter: blur` + 象牙白半透明）。
2. **浪漫 hero**：衬线大标题两行（"婚礼那天，你只需要当主角。"）+ 一句副标题 + 双 CTA（实心金钮"查档期" + 幽灵钮"看看婚礼"）+ 三个数字背书（1200+ 场 / 9 年 / 40+ 场地）。
3. **婚礼案例瀑布流**：CSS columns 三列 masonry，6 张程序化占位（渐变底 + 金色/象牙线稿 SVG：草坪拱门/教堂/海浪/囍/极简/星空），hover 整卡上浮 + 内层 SVG 放大。
4. **策划套餐三档**：婚礼日执行 ¥9,800 / 半定制策划 ¥28,800（最多新人选·高亮）/ 全案定制 ¥58,800 起，服务清单 + "选这个档"自动带入表单意向套餐。
5. **策划流程四步**：初见聊聊 → 方案与预算 → 落地执行 → 婚礼日，虚线金线串联四步编号圆章，hover 圆章翻金。
6. **档期查询表单 + 页脚**：深色预约卡（左文案右表单，含婚期 date 选择、宾客数、意向套餐；提交校验 + 成功态咨询编号）→ 页脚（品牌/导航/联系/法务三件套弹窗/社交图标/版权+备案占位）。

## 动效拆解

1. **加载态**：象牙白全屏 loader（"诺"印徽 + 金色进度线），`window.load` 后最短 700ms 淡出；3.5s 兜底必放行（完成态必达）。
2. **主视觉动效**：hero 花瓣 canvas（26 片，贝塞尔花瓣形，金/香槟/象牙三色，`requestAnimationFrame` 物理更新：下落速度 + 正弦摇摆 + 自转，`prefers-reduced-motion` 下只画静止一帧）+ 婚礼拱门 SVG 剪影（右侧半透明，vignette 暗角压住）。
3. **hero**：大标题两行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→none`，逐行 stagger .10/.24s，`cubic-bezier(.22,1,.36,1)`）；滚动提示线循环下落。
4. **导航**：滚动 40px 切换 `.scrolled` 毛玻璃；链接 hover 下划线生长；移动端汉堡 → 右侧抽屉（X 动画，链接点击自动关闭）。
5. **滚动 reveal**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`；无 JS 时不隐藏（选择器带 `html.js` 前缀），`prefers-reduced-motion` 下直达终态。
6. **卡片 hover**：案例卡上浮 6px + SVG 放大 1.07；套餐卡上浮 + 金边点亮；评价卡上浮；步骤圆章翻金放大。按钮 hover 上浮 + 金色阴影（`cubic-bezier(.34,1.4,.44,1)` 微弹）。
7. **手工细节**：全页 SVG `feTurbulence` 纸纹噪点（`multiply` 混合）；hero vignette 暗角；表单聚焦金色光环；成功态对勾 `pop` 弹入 + 咨询编号（`VOWS-年份-4位随机`）。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` —— 滚动 reveal 触发阈值。
- `CFG.loaderMin = 700` —— 加载态最短展示（ms）。
- `CFG.loaderMax = 3500` —— 加载态兜底放行（ms）。
- `CFG.petalCount = 26` —— hero 花瓣数量。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / phone / phoneHref / wechat / address / icp`。页脚与正文电话/微信/地址/备案行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组），改文案只改这里。

## 法务三件套（弹窗实现）

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）。
- 关闭三通道：右上 X、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为真实感中文通用条款（隐私 5 条 / 服务 5 条 / Cookie 5 条，覆盖档期改期、定金分期、不可抗力、照片使用授权），无 Lorem。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个主视觉动效（hero 花瓣飘落 + 拱门剪影），其他区块只有克制微交互（hover 上浮/描边点亮），不堆砌视差/3D/粒子。
2. **配色定死 3 色**：象牙白 #faf7f0 + 墨黑 #1c1a17 + 香槟金 #c6a15b 全页统一，无彩虹渐变；深色区块（套餐/预约/页脚）只用墨黑 + 金色线条。
3. **字体讲究**：衬线（宋体栈）大标题字距 .06–.18em、行高 1.32–1.45 有呼吸感；正文字距 .04–.2em；英文小字（VOWS）字距 .34–.5em 做装饰。
4. **无 Lorem、无 emoji**：文案全部真实感中文短句（"我妈在后台哭着跟策划师说谢谢""下暴雨改室内只用了 40 分钟"）；社交图标为 inline SVG 线稿。
5. **手工细节**：vignette 暗角、纸纹噪点、加载态、按钮微弹、卡片 hover 标题浮现、表单聚焦光环、成功态咨询编号。
6. **easing 物理感**：`cubic-bezier(.22,1,.36,1)`（out-expo 系）做入场，`cubic-bezier(.34,1.4,.44,1)` 微弹做按钮/弹窗/对勾，不过度弹跳；花瓣用 rAF 物理积分，不用 CSS linear。

## 源码结构

```
wedding-plan-page/
├── index.src.html   # 源码 HTML（打包输入，勿直接改 index.html）
├── index.html       # 打包产物：单文件，可直接双击打开/交付
├── styles.css       # 源码样式（打包时内联）
├── src/main.js      # 源码脚本：SITE/LEGAL/CFG 配置 + 交互（打包时内联）
└── README.md        # 本文件
```

无 vendor 目录：本套纯原生 CSS/JS/Canvas 实现，零外部库、零外部请求（案例占位图为 CSS 渐变 + inline SVG 程序化线稿，花瓣为 canvas 程序化绘制）。

## 重建方式

```bash
cd ~/workspace/fx-lab/wedding-plan-page
cp index.src.html index.html            # 从源码复制出打包底
python3 ~/workspace/bin/fx-singlefile.py wedding-plan-page
```

- `fx-singlefile.py` 为一次性单向打包器：改源码后从 `index.src.html` 重建，**禁止**对已打包的 `index.html` 再跑一次。
- 打包后校验：`grep -o 'https\?://' index.html` 应只有 `http://www.w3.org/2000/svg`（SVG 命名空间字面，非外链）。

## 移动端说明

- ≤1024px：瀑布流 2 列；评价 2 列；流程 2×2（金线隐藏）；预约卡上下堆叠；页脚 2 列。
- ≤760px：导航收起为汉堡抽屉；瀑布流/套餐/评价/流程单列（高亮套餐置顶）；表单单列；法务弹窗全屏式；页脚单列。
- 移动端 hero 拱门缩小半透明、数据条允许换行；抽屉菜单链接点击后自动关闭。
