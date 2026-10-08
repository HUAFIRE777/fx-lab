# 山涧 SHANJIAN · 高山现泡茶饮品牌落地页模板（tea-brand-page）

高山现泡茶饮品牌整站首页模板 —— 当季新品 hero（茶叶飘落粒子 + 视差）+ 六款产品系列网格 + 门店查找（可搜索）+ 会员 CTA + 完整页脚（含法务三件套弹窗），商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：喜茶 HEETEA 官网。学到的布局点：

1. **当季新品大图 hero**：整屏氛围首屏，主推一款季节限定（本页：春·雾岭白毫），左文案（眉题/大标题/定位语/双 CTA/三数据徽）+ 右产品视觉（茶杯 SVG + 茶叶粒子）。
2. **产品系列网格陈列**：3 列卡片阵列，每款 = 图形示意 + 系列标签 + 名称/英文 + 一句描述 + 价格/规格，hover 整卡浮起。
3. **门店查找区块**：城市关键词搜索框（真实过滤）+ 门店卡片（地址/营业时间/电话/一句话特色）。
4. **会员 CTA**：深色反转区块，三档会员（青芽/云叶/山主）+「最多人选」徽 + 免费加入按钮。

## 动效拆解

1. **加载态**：全屏米白 loader（「山」印徽呼吸 + 进度条 + 「正在沏茶…」），`window.load` 后最短 650ms 淡出再触发 hero 入场；4s 兜底不卡死；head 内联脚本另有 4.5s 强制兜底（main.js 未执行也能直达完成态）。
2. **核心动效·茶叶飘落粒子**：Canvas 程序化绘制（46 片，贝塞尔叶形 + 叶脉），下落 + 正弦摇摆 + 自转 + 边缘淡入淡出；hero 离开视口 / 标签页隐藏时自动停跑，省电。
3. **核心动效·hero 视差**：`data-plx` 五层（光盘 0.10 / 文案 0.06 / 茶杯 -0.06 / 叶子 0.12–0.22），rAF 节流随滚动错速位移；hero 滚出视口即停算。元素自带 transform（居中/旋转）用 PLX_BASE 前缀保留，不覆盖。
4. **hero 入场**：标题/副标/定位语/按钮逐行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→none`，`cubic-bezier(.22,1,.36,1)`，stagger .05→.37s）。
5. **滚动 reveal**：`IntersectionObserver`（阈值 .12）给 `.reveal` 加 `.in`，各区块子元素用 `--d` stagger 递进上浮。
6. **hover 微交互**：产品卡/门店卡/会员档上浮 8–10px + 阴影漫开 + 茶叶图标微旋转；导航链接下划线生长；按钮上浮 + 阴影（`cubic-bezier(.34,1.56,.64,1)` 轻微过冲）；弹窗关闭钮 hover 旋转 90°。
7. **法务弹窗**：单弹窗壳 + JS 按 key 灌文案（LEGAL 对象）；打开上浮 scale .98→1；关闭三通道（右上 ✕ / 遮罩 / ESC）；`body.lock` 锁背景滚动；焦点进关闭钮、关闭后回到原焦点。
8. **汉堡抽屉**（≤640px）：全屏深茶绿 overlay（clip-path 展开），链接 stagger 浮现；ESC / 点链接关闭；汉堡变 ✕ 动画。
9. **完成态可达验证**：所有「CSS 先隐藏等 JS 显示」的规则，隐藏态只在 `html.js` 下生效（无 JS 直接可见 + `<noscript>` 兜底 + head 4.5s 强制兜底）；完成态选择器（`.js .reveal.in`、`.hero.enter .rl-in`）只用 class 切换、**不清行内 transform**（studiofreight 坑已避）；`prefers-reduced-motion` 下粒子静置、全部直达终态。

## 配置参数（`src/main.js` 顶部）

- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / address / addr1 / phone / phoneHref / email / emailHref / hours / year`。页脚联系区、门店卡电话、版权行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `en + title + updated + sections` 数组），改文案只改这里。
- 导航毛玻璃触发：滚动 40px（`onScrollNav` 内常量）。
- reveal 阈值 0.12；loader 最短 650ms，4s 兜底。

## 法务三件套（弹窗实现）

- 页脚「网站政策」区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗，可打开可关闭。
- 文案为真实感通用条款（收集什么/怎么用/你的权利/会员规则/Cookie 开关等），无 Lorem ipsum。

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个核心动效（茶叶飘落粒子 + 卡片 hover 浮起），不堆砌；会员区只做三档，不搞复杂表格。
2. **配色定死**：全页只用深茶绿 `#2E4B3F` / 米白 `#F7F3EA` / 竹青 `#9DB89A` 三色，无彩虹渐变（hero 底为同色系纵向过渡，非多彩渐变）。
3. **字体讲究**：中文标题用宋体系（Songti SC/STSong）+ 字距 .06–.42em 层级拉开；眉题 12px 大字距，hero 标题 clamp(54–104px)。
4. **禁用 Lorem ipsum / emoji**：文案全部真实感短句（「把山里的雾，泡进这一杯」「一年只卖四十天，卖完就等明年」）；图标全部手绘 inline SVG，无 emoji 符号列表。
5. **手工细节**：hero 径向 vignette、会员区 SVG 噪点纹理、加载态「正在沏茶…」、按钮弹簧 easing、关闭钮 hover 旋转、门店搜索真实过滤、会员按钮点击变「欢迎加入，山记得你了」。
6. **easing 有物理感**：入场 `cubic-bezier(.22,1,.36,1)`、hover `cubic-bezier(.34,1.56,.64,1)` 轻微过冲、叶子 `ease-in-out` 浮动，全页无默认 linear（除 loader 进度条循环）。

## 源码结构

```
tea-brand-page/
├── index.src.html   # 源码 HTML（语义结构 + SVG 符号库 + 内联兜底脚本）
├── styles.css       # 源码样式（打包时内联）
├── src/
│   └── main.js      # 源码脚本：SITE/LEGAL 配置 + 粒子 + 视差 + reveal + 弹窗（打包时内联）
├── vendor/
│   └── NOTE.md      # 零外部依赖说明（无第三方库）
├── index.html       # 打包成品（单文件，由 fx-singlefile.py 生成，勿手改）
└── README.md
```

## 重建方式

源码改完后，一次单向打包（禁止对已打包的 `index.html` 二次打包）：

```bash
cd ~/workspace/fx-lab/tea-brand-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py tea-brand-page
```

`fx-singlefile.py` 会把 `styles.css`、`src/main.js` 内联进 `index.html`，成品即单文件完整可看。

## 移动端说明

- ≤640px：导航收起为汉堡抽屉（全屏深绿 overlay，链接 stagger 浮现）；hero 文案与视觉上下堆叠（视觉在上）；产品/门店/会员网格 3→2→1 列；页脚四列变单列。
- 截图验收：桌面 1280×800 与移动 390×844，均用 `~/workspace/bin/hcshot.js` 直连 headless Chromium 拍摄。
- 触摸设备无 hover：卡片浮起仅在 hover 能力设备生效，内容本身不受影响；`prefers-reduced-motion` 下动效全部直达终态。
