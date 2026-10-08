# 新能源汽车落地页 · 霆驰 ET7

特斯拉车型页式纯电轿跑整站模板：全屏 hero + 滚动叙事三屏 + 参数对照表 + 车主评价 + 预约试驾表单 + 法务三件套页脚，曜石黑/电光蓝/纯白三色，可直接换品牌文案交付客户上线。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点（手法学习，代码/文案/视觉全部原创）

参考对象：特斯拉（Tesla）官网车型页面。只学**布局结构和交互编排**，未复制任何源码、文案、图片、商标。学的 6 个布局点：

1. **极简顶部导航**：左品牌 logo、右锚点菜单（车型/续航/智能/安全/预约）+ 醒目 CTA"预约试驾"；滚动后透明→毛玻璃吸顶。
2. **全屏车型 hero（一屏一款）**：车型名大标题 + 核心参数行（续航/零百/快充）+ 双 CTA（预约试驾/了解价格）+ 车型大视觉。
3. **滚动叙事三屏**：长续航电池 / 智能座舱 / 主被动安全，每屏一句话卖点 + 关键数字，右侧粘性视觉随滚动切换。
4. **参数对照表**：本车 vs 两款竞品，关键行（续航/零百/快充）高亮。
5. **预约试驾表单 CTA 区块**：姓名/电话/城市/日期四字段，提交后成功态。
6. **企业页脚标配**：隐私政策/服务条款/Cookie 三件套 + 公司信息 + 社交图标 + 版权行。

虚构品牌：霆驰（车型 ET7 纯电轿跑，预售价 ¥29.98 万起）。文案为真实感中文短句，无 Lorem ipsum、无 emoji 符号列表。

## 动效拆解

- **主视觉（车型剪影）**：手绘 SVG 轿跑侧影（腰线灯带/呼吸光束/速度线/旋转轮毂/底盘光晕），入场 stagger 渐显 + 7s 悬浮循环；滚动时随 scrollY 下沉视差，鼠标移动微偏移（GSAP set，无百分比位移坑）。
- **加载态**：黑屏 + 闪电标 + 进度条，保底 3.5s 强制消失，永不卡死。
- **滚动叙事**：三屏文本逐屏揭示（IO 阈值 0.18，stagger 0.1–0.34s）；右侧粘性面板按"屏中心最接近视口中线"切换三个视觉——续航环（stroke-dashoffset 1.8s 画满）、座舱声浪条（8 柱 stagger 升起）、安全盾（双脉冲扩散环）。
- **数字滚动**：700 / 3.8 / 28 等 `data-count` 用 rAF + easeOutQuart 1.5s 逐数，tabular-nums 防抖动。
- **导航**：scrollY>40 切毛玻璃（backdrop-filter blur 18px）；当前锚点下划线高亮；移动端汉堡→全宽毛玻璃抽屉（ESC/点选关闭）。
- **表单**：校验失败整表 elastic 抖动 + 红色提示；成功后表单隐藏、成功卡片 spring 弹出（`.show` 类，非 `[hidden]` 属性）。
- **手工细节**：SVG feTurbulence 噪点全屏（data URI，零外部请求）、radial 暗角 vignette、按钮 hover 上浮 + active 缩放、表格行 hover 高亮、滚动提示线生长动画、社交图标 hover 上浮变色。
- **easing**：全部 `cubic-bezier(.2,.8,.2,1)` / easeOutQuart / spring(`.34,1.45,.44,1`)，无 linear（轮毂旋转/速度线循环属机械运动例外）。
- **降级**：全部隐藏态只在 `html.js` 下生效（head 内一行内联脚本加类），无 JS 时内容直接可见；`prefers-reduced-motion` 下停用全部位移动画。

## 配置参数

- **公司信息一改全改**：`src/main.js` 顶部 `SITE = { brand, phone, address, icp, year }`，页脚/联系区用 `data-site="…"` 占位自动渲染；电话链接由 JS 拼 `tel:`。买家只需改 SITE 五个值。
- 换车型名/价格：`index.src.html` 内 `霆驰 ET7` / `¥29.98万` 全文替换（导航、hero、表格、页脚、title/meta）。
- 换三屏文案：`#range` / `#cabin` / `#safety` 三个 `.screen` 的 `h2` + `p` + `.stat` 数字（`data-count` 自动滚动）。
- 对照表：`#specs` 的 `table` 增删行；关键行加 `class="hl"` 即高亮。
- 车主评价：`.cards` 内 3 个 `figure.card` 增删。
- 法务文案：`src/main.js` 底部 `LEGAL` 对象（privacy/terms/cookie 三段真实感通用条款）。
- 配色：`styles.css` → `:root` 三色 `--bg #0B0B0C / --blue #2E7CF6 / --white #FFFFFF`（半透明只用白/蓝 alpha，不新增色相）。
- 动效幅度：`src/main.js` → `parallax`（车 x ±26px / y 随滚 0.12）；`styles.css` → `.car` 各 keyframes 时长。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"一款纯电轿跑的销售叙事"一件事；动效只有入场、揭示、叙事切换、数字四种，无装饰动画。
2. **配色**：曜石黑 #0B0B0C + 电光蓝 #2E7CF6 + 纯白三色定死，无彩虹渐变（光晕仅用蓝色径向淡出）。
3. **字体**：系统字体栈（无 Google Fonts，国内可访问性）；大标题 clamp(58px,9.5vw,128px)、字重 200、字距 .14em、行高 1.08，有呼吸感；数字 tabular-nums。
4. **文案**：真实感中文短句（"700 公里，一口气从上海开到杭州，打个来回。""提车三个月，充电只去过两次快充桩。"），无 Lorem、无 emoji 列表；页脚有"演示模板·文案与数据为虚构"拟真脚注。
5. **手工细节**：vignette 暗角、SVG 噪点、车灯呼吸、轮毂旋转、速度线、按钮弹簧反馈、滚动提示线、锚点高亮下划线、表单 elastic 抖动。
6. **easing**：全部物理感曲线，无 linear（机械循环例外）。

## 源码结构

- `index.src.html` —— 开发源码（link styles.css / classic script 引入 vendor + src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 112KB，**单向生成，不可重复打包**）
- `styles.css` —— 全部样式（三色变量、响应式断点 900/640px）
- `src/main.js` —— 全部交互（classic script，无 ES module，无 three.js；GSAP 可选增强，无则原生 transform 兜底）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72190 字节；头部为版权注释，无 http 外链）
- `README.md` —— 本文件

## 重建命令

```bash
cd ~/workspace/fx-lab/car-ev-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py car-ev-page   # 单向，只跑一次
# 验收
node /tmp/probe-carev.js                                # 无头 console 零错误 + 交互探针
grep -oh 'https\?://[^"'"'"' )<>]*' index.html | sort -u  # 只应剩 w3.org 命名空间
node /tmp/vpshot.js "file:///home/hatch/workspace/fx-lab/car-ev-page/index.html" ~/workspace/fx-lab/shots/car-ev-page.png 1280 800 0
node /tmp/vpshot.js "file:///home/hatch/workspace/fx-lab/car-ev-page/index.html" ~/workspace/fx-lab/shots/car-ev-page-mobile.png 390 844 1
```

**vendor 完整性必查**（打包前）：`ls -la vendor/`，每个 .js 必须 >2KB 且是真实库内容——本页 gsap.min.js 72190 字节，头部为 `GSAP 3.12.5` 版权声明，空壳=事故（前车之鉴见第三波 cart-fly-3d 返修）。

**已知坑规避**（本页均已处理）：
- 未用 `preserve-3d` + `filter:blur()` 组合（无 3D 场景，无压平风险）。
- GSAP 只用 `gsap.set` 做 px 位移，未用百分比位移（无 yPercent 残留坑）。
- 本机 headless 禁 file:// ES module——本页无 ES module、无 three.js，无头验证只抓 console 错误。
- CSS 未覆盖 `[hidden]{display:none}`；隐藏等 JS 的元素（loader/.rv）只在 `html.js` 下隐藏，loader 保底 3.5s 强制消失，无 JS 时内容直接可见。

## 移动端说明

- ≤640px：导航收起为汉堡菜单（全屏下拉毛玻璃面板，ESC/点选关闭）；hero 双 CTA 纵向全宽堆叠；叙事区改单列（视觉面板 order:-1 置顶、relative 布局，取消 sticky）；参数表横向滚动；评价卡单列；表单单列。
- 已验 390×844：hero、汉堡开关、抽屉、车型剪影、参数、CTA 均正常（见 `shots/car-ev-page-mobile.png`）。
