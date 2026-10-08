# 充电桩品牌落地页 · 驰电 CHIDIAN

充电桩品牌「驰电」完整落地页模板：找桩地图式 hero、充电三步、家用/商用方案 tab、加盟合作表单 + 法务三件套页脚，深空灰 × 荧光绿 × 白三色科技能源风，可直接换品牌文案交付客户上线。

`huafire3d fx-lab — original implementation`

## 参考站点及借鉴点

参考对象：ChargePoint / 特来电官网。只学**布局结构和交互编排**，未复制任何源码、文案、图片、商标。学的 6 个布局点：

1. **透明→毛玻璃吸顶导航**：左 Logo、右锚点菜单 + 醒目 CTA；滚动 40px 后切毛玻璃。
2. **找桩式 hero**：一句话卖点 + 双 CTA + 核心数据行，配一个"充电中"主视觉动效。
3. **站点列表找桩入口**：城市筛选 chips + 搜索框，卡片展示距离/枪位/价格。
4. **充电三步**：扫码→插枪→结算，三卡横向编排，编号大字装饰。
5. **家用/商用方案 tab**：两个 tab 切换整块内容（参数/价格/CTA 各异）。
6. **加盟合作 CTA + 意向表单**：左侧卖点三条，右侧表单收集线索；企业页脚标配。

虚构品牌：驰电（充电桩品牌，演示数据）。文案为真实感中文短句，无 Lorem ipsum、无 emoji 符号列表；页脚有"演示模板·文案与数据为虚构"拟真脚注。

## 动效拆解

- **Hero 入场**：纯 CSS 过渡驱动（墙钟确定性，无头/慢环境也准时完成）：脚本执行 950ms 后（loader 渐隐时）给 hero 元素加 `.in`，`transition-delay` 按索引 stagger 110ms，电量环延迟 420ms；GSAP 仅做鼠标视差增强（`quickTo` 跟随，hover 设备限定）。
- **主视觉（充电电流粒子）**：hero 全屏 canvas，约 90 个粒子自下而上流动并向电量环方向收拢，带拖尾；旁置 SVG 电量环，SOC 数字 0→96% 用 easeOutQuart 2.6s 滚动、环 stroke-dashoffset 同步绘制，完成后状态文案切"已充满，随时出发"。整页只此一处主视觉动效。
- **加载态**：深空灰全屏 + 闪电标呼吸 + 进度条，load 后 0.9s 消失，保底 3.5s 强制消失，永不卡死。
- **滚动揭示**：IntersectionObserver 阈值 0.12，同级元素按索引 stagger（transition-delay 最大 450ms），`--out` 曲线；hero 区由 GSAP 入场接管，IO 主动跳过防打架。
- **数字滚动**：hero 三个统计 `data-count` 用 rAF + easeOutQuart 1.5s 逐数，tabular-nums 防抖动。
- **导航**：scrollY>40 切毛玻璃（backdrop-filter blur 18px）；当前锚点下划线高亮；移动端汉堡→右侧毛玻璃抽屉（汉堡/遮罩/ESC/点选四通道关闭）。
- **找桩筛选**：城市 chips 单选 + 搜索框实时过滤，无结果时卡片区留空（演示数据）。
- **方案 tab**：切换整块 panel，`panelIn` 0.55s 入场；aria-selected/role 完整。
- **表单**：校验失败整表 shake 抖动 + 红色行内提示（手机号 `^1[3-9]\d{9}$`）；成功后表单隐藏、成功卡片 spring 弹出（`.sent`/`.show` 类，非 `[hidden]` 属性），手机号中间四位脱敏回显。
- **法务弹窗**：关闭按钮 / 遮罩点击 / ESC 三通道关闭，open 时 body 锁滚动。
- **手工细节**：SVG feTurbulence 噪点全屏（data URI，零外部请求）、radial 暗角 vignette、按钮 hover 上浮 + active 缩放、卡片 hover 上浮描边、滚动提示线、社交图标 hover 上浮变色、步骤图标 hover 旋转放大。
- **easing**：全部 `cubic-bezier(.2,.8,.2,1)` / easeOutQuart / spring(`.34,1.45,.44,1`)，无 linear（粒子循环/进度条属氛围循环例外）。
- **降级**：全部隐藏态只在 `html.js` 下生效（head 内一行内联脚本加类），无 JS 时内容直接可见；GSAP 缺失时 hero 入场直接显示；`prefers-reduced-motion` 下停用位移动画、粒子静止。

## 配置参数

- **公司信息一改全改**：`src/main.js` 顶部 `SITE = { brand, phone, address, email, icp, year }`，页脚/联系区用 `data-site="…"` 占位自动渲染。买家只需改 SITE 六个值。
- 换品牌名：`index.src.html` 内 `驰电` / `CHIDIAN` 全文替换（导航、hero、页脚、title/meta）。
- 换 hero 数据：`.hero-stats` 三个 `data-count` 数字 + 文案。
- 找桩站点：`#stationCards` 内 `article.card` 增删（`data-city` / `data-name` 参与筛选）。
- 方案 tab：`#panel-home` / `#panel-biz` 两块内容独立改，tab 按钮 `data-tab` 对应。
- 法务文案：`src/main.js` 底部 `LEGAL` 对象（privacy/terms/cookie 三段真实感通用条款）。
- 配色：`styles.css` → `:root` 三色 `--bg #0C0F12 / --green #8CFF57 / --white #FFFFFF`（半透明只用白/绿 alpha，不新增色相）。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"一个充电品牌的可信度"一件事；主视觉只有一个（电流粒子+电量环），其余全是揭示/筛选/tab/表单微交互。
2. **配色**：深空灰 #0C0F12 + 荧光绿 #8CFF57 + 纯白三色定死，无彩虹渐变（光晕仅用绿色径向淡出）。
3. **字体**：系统字体栈（无 Google Fonts，国内可访问性）；大标题 clamp(46px,7.2vw,96px)、字重 800、字距 .1em、行高 1.16，有呼吸感；数字 tabular-nums。
4. **文案**：真实感中文短句（"出门前，先看一眼桩""谷电低至 3 毛一度""有空车位，就有生意"），无 Lorem、无 emoji 列表；页脚有"演示模板·文案与数据为虚构"拟真脚注。
5. **手工细节**：vignette 暗角、SVG 噪点、闪电呼吸、粒子拖尾、按钮弹簧反馈、滚动提示线、锚点高亮下划线、表单 shake 抖动、手机号脱敏回显。
6. **easing**：全部物理感曲线，无 linear（氛围循环例外）。

## 源码结构

- `index.src.html` —— 开发源码（link styles.css / classic script 引入 vendor + src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，**单向生成，不可重复打包**）
- `styles.css` —— 全部样式（三色变量、响应式断点 900/640px）
- `src/main.js` —— 全部交互（classic script，无 ES module，无 three.js；GSAP 仅用于 hero 电量环鼠标视差增强，缺失可跳过）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72190 字节；头部为版权注释，无 http 外链）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/evcharge-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py evcharge-page   # 单向，只跑一次
# 验收
node /tmp/probe-ev.js                                     # 无头 console 零错误 + reveal 全显探针
grep -oh 'https\?://[^"'"'"' )<>]*' index.html | sort -u  # 只应剩 w3.org 命名空间
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/evcharge-page/index.html" ~/workspace/fx-lab/shots/evcharge-page.png 1280 800 0
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/evcharge-page/index.html" ~/workspace/fx-lab/shots/evcharge-page-mobile.png 390 844 1
```

**vendor 完整性必查**（打包前）：`ls -la vendor/`，每个 .js 必须 >2KB 且是真实库内容——本页 gsap.min.js 72190 字节，头部为 `GSAP 3.12.5` 版权声明，空壳=事故（前车之鉴见第三波 cart-fly-3d 返修）。

**已知坑规避**（本页均已处理）：
- 未用 `preserve-3d` + `filter:blur()` 组合（无 3D 场景，无压平风险）。
- GSAP 只用 `gsap.from` 做 px/透明度/缩放位移，未用百分比位移（无 yPercent 残留坑）；hero 入场 onComplete 补 `.in` 类，clearProps 后 CSS 兜底选择器不接管。
- GSAP 只用于 hero 电量环鼠标视差（`quickTo` 事件驱动短 tween，不参与任何可见性门控）；hero 入场/揭示/弹窗/表单全部 CSS 过渡，无 ticker 速度依赖（无头环境 GSAP ticker 约 0.3x 慢速，evcharge-page 实测确认）。
- 本机 headless 禁 file:// ES module——本页无 ES module、无 three.js，无头验证只抓 console 错误。
- CSS 显式补了 `[hidden]{display:none}`；隐藏等 JS 的元素（loader/.rv）只在 `html.js` 下隐藏，loader 保底 3.5s 强制消失，无 JS 时内容直接可见。
- 表单成功态/弹窗用 `.show`/`.open` 类切换，不依赖 `[hidden]` 属性。

## 移动端说明

- ≤640px：导航收起为汉堡菜单（右侧毛玻璃抽屉，汉堡/遮罩/ESC/点选关闭）；hero 改单列居中、电量环置于文案下方；找桩卡片单列；三步卡单列；方案 panel 单列；表单单列；页脚单列。
- 已验 390×844：hero、汉堡开关、抽屉、电量环、找桩筛选、tab 切换、表单均正常（见 `shots/evcharge-page-mobile.png`）。
