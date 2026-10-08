# 净驰 SHINEGO · 汽车美容连锁官网首页模板（carwash-page）

汽车美容连锁「净驰 SHINEGO」官网首页单文件模板：深海军蓝底 + 柠檬黄点缀，
泡沫粒子 canvas 开场，三种洗法明码标价、会员卡三档、38 家门店城市筛选、
车主评价、预约表单，全部真实感中文文案。

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

- 参考站点：途虎养车门店页（服务价目三卡 + 门店列表信息密度）、京东养车预约流
  （留车牌/车型/时间三步表单）、海底捞式服务承诺（"洗不干净重洗"当面验车）。
- 布局点：hero 左文右剪影车形 + 泡沫粒子 canvas；价目三卡（普洗/精洗/镀晶，
  中间卡高亮"最多人选"）；会员卡三档深色反白卡；门店城市 chip 筛选 + 12 家门店
  网格；评价三星卡（4.5 星半星）；预约三步说明 + 表单；页脚四列 + 法务三件套。
- 原创：SVG 汽车剪影、泡沫粒子物理、全部文案手写，无任何外部图片/字体/CDN。

## 动效拆解

1. **泡沫粒子 canvas（hero）**：约 90 个气泡从底部上浮，带左右摇摆（正弦相位）
   与透明度呼吸；hero 离开视口或标签页隐藏时停跑省电，返回继续。
2. **hero 逐行揭示**：`.rl` 包裹行，`.rl-in` 逐行 `translateY(112%)→0`，delay 递增
   （.05/.18/.34/.5/.66s），easing 带回弹感的 `--ease-out`。
3. **滚动 reveal**：`.reveal` 经 IntersectionObserver（threshold .12）加 `.in`，
   淡入 + 上移 34px，`transition-delay: var(--d)` 做区块内错峰。
4. **门店城市筛选**：chip 点击重渲染门店网格，卡片淡入错峰。
5. **按钮 hover**：上浮 2px + 阴影扩散；会员卡 hover 边框亮黄。
6. **加载态**：深色全屏 + 黄色水滴 logo + 进度线，window.load/3.5s 兜底必放行。

## 配置参数（`src/main.js` 顶部，买家只改这里）

- `SITE` —— 站点名/标语/地址/电话/营业时间/ICP 备案号/年份，页脚与预约区
  `data-site` 占位自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + en +
  updated + points` 二维数组），改文案只改这里。
- `STORES` —— 12 家门店数组（`city / name / addr / tag`），`CITIES` 派生筛选 chip。
- `CFG` —— reveal 阈值、loader 最短/最长展示、泡沫数量上限。

## 法务三件套（弹窗实现）

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态
  弹窗（单弹窗壳 + JS 按 key 灌文案，`title/en/updated/points` 结构化渲染）。
- 三通道关闭：右上 ✕ 按钮 / 遮罩点击 / ESC 键；打开时锁 body 滚动并记住焦点，
  关闭后焦点回到触发按钮。
- 三篇文案均为真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖
  车牌信息收集、洗不干净重洗、会员卡退费、镀晶质保），无 Lorem。

## "看起来不像 AI 写的"六项自查

1. 克制：整页只讲"洗得干净看得见"一个核心卖点，动效集中在 hero 泡沫 + 揭示。
2. 配色：墨蓝 `#0b1526` + 白 + 柠檬黄 `#ffd60a` 三色全页统一，无彩虹渐变。
3. 字号层级：hero 64px 粗黑 / 区块标题 40px / 卡片标题 20px，字距 `.12em` 英文小标。
4. 文案真实感："普洗 39 元起""洗不干净重洗""门口扫码排队，到店基本不用等"，
   无 Lorem ipsum、无 emoji 符号列表（星级用 SVG 星）。
5. 手工细节：全页噪点颗粒、泡沫粒子呼吸摇摆、会员卡"最多人选/回本最快"角标、
   半星评价、预约表单占位示例（"如：沪A·88888"）。
6. easing：`--ease-out: cubic-bezier(.22,1,.36,1)` 物理感缓出，按钮 hover 带回弹。

## 源码结构

```
carwash-page/
├── index.html        # 打包产物（单文件，附件发出即完整可看）
├── index.src.html    # 打包源（HTML 骨架）
├── styles.css        # 打包源（样式，完成态选择器带 html.js 前缀）
├── src/main.js       # 打包源（零依赖 classic 脚本：SITE/LEGAL/STORES/动效）
└── README.md
```

无 vendor、无外部请求（仅 `http://www.w3.org/2000/svg` SVG 命名空间字面量）。

## 重建方式

```bash
cd ~/workspace/fx-lab/carwash-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py carwash-page   # 内联 styles.css + src/main.js
```

禁止对已打包的 `index.html` 重复跑打包器（CSS/JS 已内联，二次跑会跳过/错位）；
改 `index.src.html` / `styles.css` / `src/main.js` 后按上式从源重建。

## 移动端说明

- ≤760px：导航收进汉堡抽屉（右滑面板 + 遮罩，点击/ESC 关闭）；
  价目三卡/会员卡/门店网格/评价卡全部单列；"最多人选"卡置顶；
  表单字段单列；页脚四列变单列。
- 泡沫粒子按宽度降量（`W/16` 上限 90），低端机不卡；`prefers-reduced-motion`
  下 reveal 直接显示、粒子停跑。
- 移动端截图 `shots/carwash-page-mobile.png`（390×844）。
