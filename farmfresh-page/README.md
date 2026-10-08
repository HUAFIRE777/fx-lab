# 田集 TIÁNJÍ · 农产品生鲜订阅落地页模板（farmfresh-page）

农产品生鲜品牌「田集 TIÁNJÍ」完整落地页 —— 当季菜箱 hero（菜叶飘落 + 木箱开箱）+ 本周 8 样菜品网格 + 农场直供故事 + 订阅三档 + 配送范围 + 首单 8 折预约表单，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：Farmbox Direct 式农产品订阅站。学到的布局点：

1. **导航**：左品牌徽 + 中部四菜单（菜箱/农场/订阅/配送）+ 右订阅 CTA；滚动 40px 后透明→毛玻璃；移动端汉堡→深绿全屏抽屉（clip-path 圆形展开）。
2. **当季菜箱 hero**：左侧大标题 + 双 CTA + 信任背书行（合作农户/覆盖城市/复购率），右侧主视觉菜箱（原站用摄影图，本模板用程序化 SVG 木箱 + canvas 菜叶粒子）。
3. **本周菜品网格**：4×2 卡片（No.编号徽 + 程序化蔬菜插画 + 菜名 + 一句描述 + 价格/产地 + 加箱钮），清单每周更新制造新鲜感。
4. **农场直供故事**：深绿反白区，农户语录卡 + 三步供应链（凌晨采摘→产地直装→次晨到家）+ 数据条，原站多为英文农场介绍，本模板写成中文农户口述。
5. **订阅三档**：价格卡（试吃/月度/季度），热门档深绿反白 + 放大突出 +「最受欢迎」徽。
6. **配送范围**：城市胶囊 chips + 三卡说明（配送时间/验货/缺货替换）。
7. **首单优惠 CTA**：深绿大色块 + 首单 8 折 + 预约表单（姓名/手机/城市/档位），提交后成功态（预约号）。

## 动效拆解

整页**只讲一个核心动效**：hero「菜叶飘落 + 木箱开箱」。其余全部是微交互。

1. **加载态**：米白全屏（旋转双叶苗徽 + 「田集」字 + 泥土棕进度条 + 「正在从田间装箱…」），`window.load` 后最短 700ms 淡出，再触发 hero 入场；4s 兜底放行。
2. **hero 核心动效**：
   - canvas 菜叶粒子（18–46 片）：叶形路径（quadraticCurve 叶瓣 + 中脉），重力下落 + 正弦风摆 + 自旋，深绿/棕两色系，`requestAnimationFrame`，切后台自动暂停；
   - 程序化 SVG 木箱开箱：箱盖以铰链为轴 `rotate(0→-30deg)`，`cubic-bezier(.34,1.56,.64,1)` 弹簧 easing，箱内探出番茄/胡萝卜/菜叶；
   - 大标题两行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，逐行 .12s 递进）；眉题/副文案/CTA/信任行淡入上浮 stagger；
   - 木箱后棕色光晕 7s 呼吸；hero 四周 vignette 收暗。
3. **导航**：滚动 40px 切 `.scrolled` 毛玻璃（`backdrop-filter:blur(14px)`）；链接 hover 下划线生长；移动端汉堡→深绿全屏抽屉，链接 stagger 浮现。
4. **滚动 reveal**：`IntersectionObserver`（阈值 .12），同行卡片按 `data-d` 0/.12/.24s 递进；reveal 完成后清 `transition-delay`（否则 hover 被拖慢）。
5. **微交互**：菜品卡/价格卡/配送卡 hover 上浮 8–10px + 阴影漫开，菜品插画微转 -4°；「加入本周箱」点击变「已加入本周箱」；农场步骤卡 hover 右移 8px；城市 chips hover 反白上浮；滚动提示线循环下落。
6. **手工细节**：全页 SVG `feTurbulence` 纸纹（`multiply` 5%）；hero vignette；光晕呼吸；箱身「田集」烫印字；「出身卡」「带露水下地」等行业黑话。

## 配置参数（`src/main.js` 顶部）

- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / en / slogan / phone / phoneHref / email / mailtoHref / address / hours / icp / year`。页脚电话/邮箱/地址/营业时间/备案行/版权行均由 `data-site` / `data-site-href` 属性自动渲染；`document.title` 也由 SITE 生成。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组，`[小标题, 正文]`），改文案只改这里。
- `VEGS` —— 本周菜品数组（`no / name / desc / price / unit / from / art`），增删改一行即换菜；`art` 对应 8 种程序化蔬菜插画（leaf/carrot/tomato/corn/pumpkin/cabbage/redcabbage/kale）。
- `CITIES` —— 配送城市数组，同时渲染配送 chips 与表单城市下拉。
- 菜叶粒子：数量 `Math.min(46, W/30)`，速度/尺寸/透明度在 `spawn()` 内调。

## 法务三件套（弹窗实现）+ SITE 配置变量

- 页脚「网站政策」区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）。
- 关闭三通道：右上 ✕、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为生鲜订阅真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖首单优惠规则、配送迟到补偿、订阅取消退款、生鲜售后 24 小时拍照），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/抖音/小红书，几何抽象线稿），hover 变米黄底上浮。
- 备案/版权行：`© {year} {name} · 从田间到你家，只隔一夜 ｜ {icp}` 由 SITE 渲染，`icp` 默认为 `浙ICP备xxxxxxxxxx号-1` 占位。

## 表单（校验 + 成功态）

首单预约表单：姓名（≥2 字）、手机号（`^1[3-9]\d{9}$`）、城市（必选）、档位三选一（默认月度订阅；价格卡按钮跳转可预选对应档位）。校验失败逐项红框 + 行内错误文案；通过后表单隐藏 → 成功态（✓ 动画 + 预约号 `TJ-YYYYMMDD-xxxx` + 所选档位/城市）。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲「每周二的菜箱」一件事，动效只有飘落/开箱/升起/上浮，不堆砌。
2. **配色定死**：米白 `#FAF5EC` / 深绿 `#1F3D26` / 泥土棕 `#8A5A33` 三色全页统一（深浅变化只用同色系透明度），无彩虹渐变。
3. **字号字距层级**：大标题 `clamp(46px,6.2vw,84px)` 宋体 .1em 字距；眉题 13px .34em 字距；价格 52px 宋体；农户引言 21px 宋体 1.9 行高。
4. **文案真实感**：「叶子脆得能听见响」「甜得像水果」「早上开门菜还在"睡觉"」。无 Lorem、无 emoji 符号列表（序号用 No.01–08 徽 / 01–03 数字章）。
5. **手工细节**：纸纹噪点、vignette、光晕呼吸、木箱烫印字、出身卡/预冷/冰袋等行业黑话、农户署名「陈建国 · 安吉基地」。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），开箱盖用弹簧 `cubic-bezier(.34,1.56,.64,1)`，光晕呼吸用 `ease-in-out` 往返；禁用 linear（除 loader 苗徽自转与进度条）。

## 源码结构

```
farmfresh-page/
├── index.src.html      # 源码模板（改这里，再打包）
├── index.html          # 成品单文件（fx-singlefile.py 一次性打包生成，勿重复打包）
├── src/
│   ├── styles.css      # 全站样式（纯手写，无框架）
│   └── main.js         # 全站脚本（SITE/LEGAL/VEGS/CITIES + 粒子 + 交互，零依赖）
├── README.md           # 本文件
└── vendor/             # 空：本模板零外部依赖，无需 vendor
```

## 重建方式

```bash
cd ~/workspace/fx-lab/farmfresh-page
# 1. 改源码（index.src.html / src/styles.css / src/main.js）
# 2. 覆盖打包（一次性单向：先 cp 再跑，禁止对已打包的 index.html 重复跑）
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py farmfresh-page
# 3. 验收：console 零错误 / 零外部请求 / reveal 完成态 / 双端截图
```

## 移动端说明

- ≤1000px：hero 改单列（主视觉置顶）、菜品 2 列、农场/计划/配送改单列。
- ≤640px：导航收起为汉堡→深绿全屏抽屉；菜品卡片 2 列紧凑；法务弹窗全屏式；页脚单列。
- 触屏无 hover，上浮只在可 hover 设备生效；`prefers-reduced-motion` 下粒子/开箱/呼吸全部静止直达终态。
- 渐进增强：无 JS 时所有内容直接可见（`.js` 类由脚本添加，隐藏态只在有 JS 时生效）；另有 `<noscript>` 兜底隐藏 loader。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` 全程监听，file:// 打开等待 6s，桌面+移动双端）。
2. URL 扫描：成品 `index.html` 内零 `http(s)` 外部 URL（仅 SVG data-URI 与 favicon 内的 `w3.org` 命名空间字面）；无 Google Fonts/picsum/unpkg/jsdelivr。
3. 截图：`shots/farmfresh-page.png`（1280×800 hero）/ `shots/farmfresh-page-mobile.png`（390×844）亲眼核对；另抽查菜箱/农场/订阅/CTA 四区截图，无裁切无乱码。
4. 隐藏元素完成态：hero 两行大字 transform 归零、木箱盖稳定 -30°（8/12/16s 三次复测一致）、29 个 `.reveal` 逐段滚动后全部 `.in`；loader 隐藏。
5. 法务弹窗：隐私/服务条款/Cookie 三个分别打开验证（标题 + 6/6/5 条要点 + 背景滚动锁定），关闭三通道（✕/遮罩/ESC）逐个验证通过；移动端弹窗全屏式。
6. SITE 渲染：页脚电话/邮箱/地址/营业时间/备案行/标题均为变量渲染，改 `SITE` 即全改。
7. 表单：非法输入（姓名 1 字/手机号 123/城市未选）3 项错误齐现；合法提交 → 成功态 + 预约号 `TJ-20261005-xxxx`。
8. 文案：无 Lorem/emoji 列表；菜名价格描述均为真实感中文短句。

## 真 bug 记录

1. **preJS 时机坑**：hcshot 的 preJS 经 `Page.addScriptToEvaluateOnNewDocument` 在文档创建时执行，DOM 尚不存在导致 `querySelector(...).scrollIntoView()` 抛错、滚动截图全是空白。改法：滚动类验收一律用自写 CDP 脚本（load 后再滚），不用 hcshot 的 preJS 做滚动。
2. **平滑滚动丢帧**：`html{scroll-behavior:smooth}` 下步进滚动（每 400px 停 120ms）会跳过中间 reveal，误报 8 个未完成。验收脚本里先关平滑再步进，29/29 全过。
3. **`pkill -f` 误杀自己**：pattern 出现在本 shell 命令行里会把自己杀掉（exitSignal 15）。改法：pattern 用字符类断开（如 `1944[4]`）。
4. **node fetch 走代理**：`NODE_USE_ENV_PROXY=1` 时 node fetch 对 127.0.0.1 也走 egress 代理导致 CDP 连不上。验收脚本统一 `NODE_USE_ENV_PROXY=0`。
