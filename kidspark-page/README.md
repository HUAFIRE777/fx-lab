# 泡泡岛 BUBBLE ISLAND · 儿童乐园整站首页模板

一套商用级室内儿童乐园落地页模板（虚构品牌「泡泡岛」）：透明→毛玻璃导航 / 泡泡升腾 hero / 游乐项目矩阵（6 张程序化 SVG 插画卡）/ 票价三档（深蓝高亮主推）/ 生日派对套餐 + 三步流程 / 深蓝安全须知手风琴 / 预约表单（日期+人数+手机号校验+成功态）/ 页脚法务三件套弹窗，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

**室内儿童乐园官网通用编排**（如奈尔宝 / Mellon 乐园类站点的公开页面结构）：只学了布局结构，代码全部原创重写。

学到的布局点（实现均为原创代码）：
① 游乐项目矩阵（多卡片 + 程序化插画 + 年龄标签，对应乐园站"项目介绍"区的矩阵陈列逻辑）
② 票价三档（次票 / 畅玩票 / 年卡，中间档高亮主推，对应乐园站"票价"区的三档锚定编排）
③ 生日派对独立区块（套餐卡 + 服务流程步骤，对应乐园站派对业务的"套餐+流程"双栏布局）
④ 安全须知手风琴（入场/消毒/走失/外食四问，对应乐园站"安全承诺"区的问答式呈现）

## 动效拆解

整页只有一个核心动效：**hero 泡泡升腾**，其余为入场/反馈类微动效。

- **hero 泡泡升腾**：JS 生成 16 个泡泡（14–80px 随机大小，40% 为黄色泡泡），CSS `bubbleRise` keyframes 从底部升到视口外（9–18s 随机时长，负延迟保证首屏半空已有泡泡），中途轻微左右漂移；easing 用默认 keyframes 插值 + 上升段微加速感。纯 CSS animation，无 GSAP，天然避开百分比位移坑。
- **标题逐行升起**：`.line-inner translateY(112%)→0`（CSS transition，`cubic-bezier(.22,1,.36,1)` .9s，第二行延迟 .14s）；隐藏等 JS 模式，`body.is-in` 加完成态覆盖规则（`transform:none`），首屏双 rAF 即播，完成态永远可达。
- **滚动 reveal**：IntersectionObserver（threshold .12），`opacity 0→1 + y 30→0`，同行卡片按 `--d` stagger；3 秒兜底强制全部 `.in`。
- **卡片 hover**：上浮 8–10px + 阴影加深 + 插画 SVG 轻微放大旋转（.5s 同一 easing）；导航链接下划线从左展开；按钮 active 缩放 .96。
- **加载态**：深蓝品牌幕布（veil，泡泡上升 + 「泡泡岛」字，首屏就绪 350ms 退场 + 2.5s 兜底）。
- **手工细节**：SVG feTurbulence 全页噪点（opacity .05）、hero 底部 vignette、表单 focus 光环 + 报错抖动、票种 radio 胶囊选中态、toast 反馈、抽屉/弹窗 ESC 关闭。
- **easing**：全部 `cubic-bezier(.22,1,.36,1)` / `ease-in-out`，禁用 linear；`prefers-reduced-motion` 直接降级（reveal/标题/动画全关）。

## 配置参数

`src/main.js` 顶部 `SITE` / `LEGAL`：

- `SITE`：`brand` / `brandEn` / `organizer` / `phone` / `address` / `email` / `icp`——导航抽屉电话、票价备注电话、页脚联系方式、版权行 `© 2026 <organizer>`、备案号全部引用变量渲染，换主体只改一处（当前均为虚构示例值：电话 400-820-2026、邮箱 hello@bubbleisland.example.com、地址上海市闵行区星乐路 88 号 3 楼）
- `LEGAL`：`privacy` / `terms` / `cookie` 三件套标题 + HTML 正文——弹窗打开时渲染；含儿童安全条款（儿童信息特别说明、防走失手环、看护配比、6 岁以下须成人陪同），文案为真实感通用条款
- 表单规则内联在 `initForm`：姓名 2–10 字、日期 ≥ 今天（min 自动设）、手机号 `/^1[3-9]\d{9}$/`；成功态生成预约号 `KS-YYMMDD-XXXX` 并回显预约信息

游乐项目卡片、票价档、派对套餐文案写在 `index.src.html` 里，改文案只动 HTML；6 张项目插画 + 2 张派对插画为 inline SVG（三色几何），零图床。

## 六项「看起来不像 AI 写的」自查

① **克制**：整页只讲一个主视觉动效（泡泡升腾），各区块只有 reveal + hover 上浮，无堆砌。
② **配色定死**：奶白 #FFF9EC / 活力黄 #FFB81C / 深蓝 #1D2A6E 三色全页统一，无彩虹渐变（hero 背景仅为奶黄径向淡晕，非多色渐变）。
③ **字体讲究**：标题 clamp(2.6rem,7vw,4.6rem) 逐级，字距 .02em，大标题 line-height 1.22 有呼吸感；kicker 字母间距 .28em 小字大距。
④ **无 Lorem/emoji**：文案全是真实感短句（"8 万颗食品级海洋球""考张泡泡岛驾照带回家贴冰箱"）；列表符号用 CSS 绘制对勾/圆点，不用 emoji。
⑤ **手工细节**：全页噪点、hero vignette、幕布加载态、按钮 active 缩放、表单报错抖动、抽屉滑入曲线。
⑥ **easing 物理感**：统一 `cubic-bezier(.22,1,.36,1)`（带过冲感的缓出），泡泡上升 9–18s 随机时长模拟真实浮力差异，禁用 linear。

## 源码结构

```
kidspark-page/
├── index.src.html   # 源码 HTML（语义结构 + 8 张 inline SVG 插画）
├── index.html       # 成品单文件（fx-singlefile.py 打包产物，勿手改/勿重复打包）
├── styles.css       # 全部样式（设计系统变量 + 响应式 + 动效）
├── src/main.js      # 全部交互（SITE/LEGAL 配置 + 泡泡/导航/抽屉/reveal/表单/弹窗）
├── vendor/          # 空（本模板零外部库，纯原生实现）
└── README.md        # 本文件
```

## 重建方式

```bash
cd ~/workspace/fx-lab/kidspark-page
cp index.src.html index.html            # 从源码复制（单向，勿对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py kidspark-page
# → index.html：50KB 单文件，styles.css + src/main.js 全内联，零外部请求
```

验收脚本：`/tmp/kidspark-console-check.js`（CDP 抓 console.error + exception，等 6 秒，分步滚动到底验证 38 个 `.rv` 全部可见，另验 hero 完成态/幕布/泡泡数/SITE 渲染）。

```bash
NODE_PATH=/tmp/hcshot/node_modules node /tmp/kidspark-console-check.js  # exit 0 = 全绿
```

截图：

```bash
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js file:///home/hatch/workspace/fx-lab/kidspark-page/index.html ~/workspace/fx-lab/shots/kidspark-page.png 1280 800 0
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js file:///home/hatch/workspace/fx-lab/kidspark-page/index.html ~/workspace/fx-lab/shots/kidspark-page-mobile.png 390 844 1
```

## 移动端说明

- 断点 960px / 640px：导航链接收进右侧汉堡抽屉（滑入 + 遮罩 + ESC 关闭，CTA 保留在抽屉内）；项目矩阵 3→2→1 列；票价三档堆叠（主推档保持深蓝高亮）；派对/预约双栏改单栏；hero 数据条改竖排；页脚四栏改单栏。
- hero 副标题的 `<br class="d-only">` 在 640px 下隐藏，避免窄屏出现单个字掉行的尴尬换行。
- 表单字段全宽，日期/人数堆叠，票种 radio 自动换行；弹窗宽 92vw、上限 82vh，内部可滚。
- 触摸无 hover，卡片上浮动效仅桌面生效，reveal 与表单校验逻辑与桌面一致。
