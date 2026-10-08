# 麦浪 BREWAVE · 精酿啤酒品牌官网首页模板（craftbeer-page）

精酿啤酒品牌「麦浪 BREWAVE」官网首页单文件模板：深棕黑底 + 琥珀 + 奶油三色，
hero 酒杯 SVG + 气泡粒子 canvas，酒款矩阵六款、酿造四步、风味 tab 筛选、
三家门店、会员俱乐部三档 CTA，页脚含"理性饮酒"提示行。

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

- 参考站点：BrewDog 官网（酒款矩阵 ABV/IBU 标签密度、酿造故事时间线、
  门店 taproom 列表）、拳击猫等本土精酿（会员俱乐部三档）。
- 布局点：hero 右酒杯视觉 + 左文案（BrewDog 式大标题）；酒款矩阵六卡
  （酒精度/苦度/风味标签三件套）；酿造四步横向时间线；风味 tab 按心情筛选；
  门店三卡（地址/电话/营业时间）；俱乐部三档会员 CTA 面板。
- 原创：酒杯/麦穗/迷你酒杯全套手绘 SVG、气泡粒子、全部文案手写，
  无任何外部图片/字体/CDN。

## 动效拆解

1. **hero 遮罩升起入场**：`.rl` 遮罩 + `.rl-in` 从 `translateY(112%)` 升起
   （1.1s `--ease-out`），由 `.hero.enter` 触发；CTA/统计/酒杯舞台错峰淡入。
2. **酒杯气泡粒子 canvas**：46 个气泡在杯体内上浮 + 正弦摇摆 + 透明度随机，
   杯口消散；酒杯离开视口/标签页隐藏时停跑。
3. **酒杯扫光**：`.sheen` 斜向高光带 6s 循环扫过杯体。
4. **滚动 reveal**：`.reveal` 经 IntersectionObserver（threshold .12）加 `.in`，
   淡入 + 上移 28px，`--d` 行内变量错峰；4s 安全网兜底。
5. **数字滚动**：hero 统计（18 款 / 3 家 / 12000+ 会员）进入视口后 easeOutCubic
   countUp，1600ms。
6. **风味 tab 筛选**：果香/深烘/清爽三档过滤酒款卡，`.hide` 切换 + 空态提示。
7. **加载态**：麦穗 logo 呼吸 + "正在醒酒…" + 进度线，window.load/3.5s 兜底必放行，
   noscript 直接隐藏。

## 配置参数（`src/main.js` 顶部，买家只改这里）

- `SITE` —— 站点名/标语/地址/电话/邮箱/营业时间/ICP 备案号，`data-site` 占位
  自动渲染，电话/邮箱自动拼 `tel:`/`mailto:`。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + en +
  updated + points`），含未成年人/理性饮酒/退会条款，改文案只改这里。

## 法务三件套（弹窗实现）

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态
  弹窗（单弹窗壳 + JS 按 key 灌文案，`title/en/updated/points` 结构化渲染）。
- 三通道关闭：右上 ✕ 按钮 / 遮罩点击 / ESC 键；打开时锁 body 滚动并记住焦点，
  关闭后焦点回到触发按钮。
- 三篇文案均为精酿场景真实感条款（隐私 5 条 / 服务 5 条 / Cookie 4 条，覆盖
  未成年人查验、理性饮酒代驾、会员退会折算），无 Lorem。

## "看起来不像 AI 写的"六项自查

1. 克制：整页只讲"把秋天倒进杯子里"，动效集中在酒杯 + 遮罩入场。
2. 配色：深棕黑 `#17100a` + 琥珀 `#e09a2b` + 奶油 `#f3e9d2` 三色统一，无彩虹渐变。
3. 字号层级：hero 60px 衬线 / 区块 38px / 卡片 22px，英文小标字距 `.32em`。
4. 文案真实感："像一块 85% 的黑巧在舌头上化开""小心，它后劲不小"，
   无 Lorem ipsum、无 emoji 列表（图标全手绘 SVG）。
5. 手工细节：全页噪点颗粒、酒杯扫光、迷你酒杯六色酒液、"理性饮酒 · 未满 18 岁
   请勿饮酒 · 酒后请勿驾车"页脚提示行、风味空态"问问酿酒师，他有私藏"。
6. easing：`--ease-out: cubic-bezier(.22,1,.36,1)` 物理感缓出；完成态选择器
   全部带 `html.js` 前缀，无 JS 时内容直接可见。

## 源码结构

```
craftbeer-page/
├── index.html        # 打包产物（单文件，附件发出即完整可看）
├── index.src.html    # 打包源（HTML 骨架）
├── styles.css        # 打包源（样式，完成态选择器带 html.js 前缀）
├── src/
│   ├── index.src.html  # 源备份（与顶层 index.src.html 同步）
│   ├── styles.css      # 源备份（与顶层 styles.css 同步）
│   └── main.js         # 打包源（零依赖 classic 脚本：SITE/LEGAL/交互/粒子）
└── README.md
```

无 vendor、无外部请求（仅 `http://www.w3.org/2000/svg` SVG 命名空间字面量）。

## 重建方式

```bash
cd ~/workspace/fx-lab/craftbeer-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py craftbeer-page   # 内联 styles.css + src/main.js
```

禁止对已打包的 `index.html` 重复跑打包器；改源文件后按上式从源重建
（`src/` 下两份源备份记得同步）。

## 移动端说明

- ≤920px：酒杯视觉移到文案上方（`order:-1`），门店/会员三档单列；
  ≤640px：酒款/风味/步骤单列，hero CTA 纵向全宽堆叠（防文字换行挤压），
  scroll-hint 隐藏，页脚单列。
- 导航收进汉堡抽屉（链接 stagger 入场动画，点击/ESC 关闭并解锁滚动）。
- `prefers-reduced-motion` 下 reveal/遮罩直接显示、气泡停跑、扫光隐藏。
- 移动端截图 `shots/craftbeer-page-mobile.png`（390×844）。
