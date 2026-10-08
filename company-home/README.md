# Hexabase · 云基础设施公司官网首页

虚构云厂商 Hexabase 的完整官网首页模板：导航下拉、hero 代码窗口打字机、客户墙、指标带、全球节点地图、开发者终端 CTA、支持区、肥页脚（含法务三件套弹窗）。开箱即用，可直接换文案交付客户上线。

`huafire3d fx-lab — original implementation`

## 参考来源（Stripe，只学布局结构与交互编排，代码/文案/商标全部原创）

学的 6 个布局点，逐一对应实现：

1. **顶部导航 hover 下拉面板** —— 产品/解决方案/开发者/公司四组菜单，hover（140ms 意图延时）展开多列面板，带小箭头、图标+双行文案、底部快捷入口；键盘 focus 可开、ESC 可关。
2. **Hero 左文右码** —— 左侧大标题+副标题+双 CTA（免费试用/联系销售），右侧深色代码窗口；代码为打字机逐字符打出（语法着色），播完状态行变"部署完成"。
3. **客户 logo 墙** —— 一行 8 个纯文字 logo（虚构公司），灰度 + 5 种字体风格区分，hover 回黑上浮。
4. **数据指标带** —— 深海军蓝横带，4 个数字滚动：99.99% 可用性 / 42 可用区 / 190+ 国家地区 / 12ms 平均延迟，配进度条。
5. **全球化区块** —— 左侧程序化点阵世界地图（椭圆大陆块光栅化，540 点）+ 6 个脉冲节点 + 弧线动画；右侧 6 个区域列表（东京/新加坡/法兰克福/悉尼/弗吉尼亚/圣保罗）带延迟徽标。
6. **开发者 CTA + 肥页脚** —— 终端风格卡片（`hexabase deploy` 打字演示）+ 四列链接页脚，底部状态行"所有系统运行正常"。

## 动效拆解

- **Hero 光斑**：3 团紫/蓝径向光斑 `blur(90px)`，GSAP yoyo 怠速漂移（9–15s sine.inOut）+ 鼠标视差（quickTo 作用在 `.blobs` 容器，与单团漂移不打架）；另有一层径向点阵网格。
- **代码窗口打字机**：token 级队列（关键字/字符串/注释/函数/数字五色），26ms/字符、注释 14ms/字符，行尾光标闪烁；播完 foot 状态点变绿。右上"重新播放"可重播。`prefers-reduced-motion` 下直接渲染全文。
- **下拉面板**：opacity + translateY(10px→0) + scale(.98→1)，弹簧 easing `cubic-bezier(.34,1.56,.64,1)`，0.28–0.32s。
- **数字滚动**：IntersectionObserver 触发，`easeOutExpo` 1.7s，`tabular-nums` 防抖动；进度条同步 1.6s 铺满。
- **区块 reveal**：IO 加 `.in`，translateY(28px)→0，0.7–0.8s，`i%4`  stagger 70ms。
- **地图**：节点 pulse 环（2.2s ping）、弧线 `stroke-dasharray` 流动画、区域卡片 hover 右滑 6px。
- **按钮**：primary 有光泽扫过（::after skew 扫光），hover 上浮 2px + 阴影加深；ghost 同理。
- **噪点**：全页 fixed SVG feTurbulence 暗纹，opacity .05，不抢戏只提质感。
- **加载态**：logo 脉冲 + 三点弹跳，`load` 后双 rAF 关闭，2.5s 强制兜底。

## 配置参数

- **`src/main.js` 顶部 `SITE` 变量**（公司信息唯一真实来源，改一处全站生效）：
  ```js
  var SITE = { name, address, email, phone, icp }
  ```
  页脚联系行、支持 CTA 区（mailto:/tel: 自动拼接）、弹窗内邮箱、底部 `京ICP备xxxxxx号` 全部走 `data-site` / `data-site-href` 属性自动渲染。
- **颜色**：`styles.css :root` → `--brand:#635BFF`、`--ink:#0A2540`、`--wash:#F6F9FC`、`--navy:#0A2540`。换主题只改这几个变量。
- **打字机文案**：`src/main.js` → `CODE`（hero 代码窗口）、`TERM`（开发者终端），token 数组 `{t, c}` 即改即生效。
- **地图节点**：`src/main.js` → `buildMap` 内 `NODES`（网格坐标）/`ARCS`（弧线对）；大陆块 `LAND` 椭圆数组。
- **指标**：HTML `.metric` 的 `data-count` / `data-dec`。

## 法务三件套（弹窗实现）

页脚底部"隐私政策 / 服务条款 / Cookie 政策"为按钮，点击弹模态弹窗（非跳页）：

- **可关闭**：右上 ✕（hover 旋转 90°）、点击遮罩、ESC 三种；打开时 `body overflow:hidden` 锁定背景滚动，关闭恢复焦点。
- **文案**：真实感中文通用条款，无 Lorem ipsum —— 隐私政策 5 条（收集范围/用途/存储位置/用户权利/联系邮箱）、服务条款 6 条（账号安全/99.99% SLA/合理使用/计费欠费/API 使用条款/责任限制）、Cookie 政策 4 条（定义/必要型/分析型/第三方）。
- **移动端**：≤600px 弹窗变全屏式（`100dvh` 无圆角），CDP 实测 390×844 铺满无错位。

## "看起来不像 AI 写的"六项自查

1. **克制**：一页只讲"云厂商官网首页"一件事；hero 只放三团光斑+点阵，不堆 3D 场景。
2. **配色**：白主底 + 紫 #635BFF + 深蓝灰 #0A2540 定死（灰只做文字/描边中性色）；光斑均为紫/蓝同色系，无彩虹渐变。
3. **字体**：系统字体栈（无外部字体）；H1 64px/1.08 紧字距、副标题 18.5px/1.7、标签 12–13.5px 大字距，三级分明。
4. **文案**：全部真实感中文短句（"半夜也不用爬起来看监控""搞砸了删掉重来"），8 个虚构客户名，无 Lorem ipsum、无 emoji 列表（✓/→ 为排版符号）。
5. **手工细节**：SVG 噪点暗纹、加载三点弹跳、按钮扫光、logo 字体风格差异化、地图节点呼吸环、终端提示符配色。
6. **Easing**：弹簧 `cubic-bezier(.34,1.56,.64,1)`、GSAP `sine.inOut`/`power3.out`、`easeOutExpo` 数字滚动，无一处 linear（弧线流动除外，属循环装饰）。

## 完成态可达审计（CSS 先隐藏、等 JS 显示的元素）

- `#loader.hide`：`load` 后双 rAF 添加 + 2.5s 强制兜底，无提前 return 路径（CDP 实证已隐藏）。
- `.reveal.in`：IO 阈值 0.12，滚动实测 17/17 全部触发。
- `#codeFoot.done`：打字机播完 13 行后添加（CDP 实证"部署完成 · 1.8s"）。
- `.modal.active`：`data-modal` 点击添加；X/遮罩/ESC 三路关闭均实证。
- `#drawer.open`：汉堡按钮切换（移动端实证）。

## 源码结构

- `index.src.html`：开发版源码（改这里）。
- `styles.css`：全部样式（构建时内联）。
- `src/main.js`：交互逻辑（classic script；构建时内联）。顶部 `SITE` 配置变量。
- `vendor/gsap.min.js`：GSAP 3.12.5 真品（72,214 字节，已验非空壳；构建时内联）。
- `index.html`：单文件发行版（构建产物，勿手改）。
- `README.md`：本文件。

## 重建方式

```bash
cd ~/workspace/fx-lab/company-home
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py company-home
# 验收
grep -oE 'https?://[^"'"'"' )]+' index.html | grep -v -e 'w3.org' -e 'gsap.com' -e 'api.hexabase.io' || echo "外链干净"
```

注意：`fx-singlefile.py` 是一次性单向打包器，禁止对已打包的 `index.html` 重复跑；改源码后从 `index.src.html` 重新 `cp` 再跑。

## 移动端说明

- ≤1020px：导航收起为汉堡抽屉（右滑入，含 4 组手风琴）；hero 单列，代码窗口取消 3D 倾斜；全球化/开发者区单列；指标 2×2。
- ≤600px：H1 38px、CTA 全宽、logo 墙居中换行、页脚 2 列；法务弹窗全屏式。
- `prefers-reduced-motion`：全部动画降为 0.01ms，打字机/终端直接渲染全文，reveal 直接显示。
