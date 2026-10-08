# 启航教育 · K12 课外辅导机构官网首页

虚构教培品牌「启航教育」的完整官网首页模板：招生 hero、课程分类 tab（语文/数学/英语翻转卡）、师资墙、提分榜（滚动数字+学员故事轮播）、学习保障、免费试听预约表单、法务三件套弹窗页脚。开箱即用，换掉 SITE 变量即可交付客户上线。

`huafire3d fx-lab — original implementation`

## 参考来源（国内头部 K12 教培机构官网，只学布局结构与交互编排，代码/文案/图片全部原创）

参考对象：学而思、高途课堂这类头部教培机构的官网首页。学的 5 个布局点，逐一对应实现：

1. **课程分类 tab** —— 语文/数学/英语三 tab 切换课程卡；卡片正面是课程名+年级+价格，悬停翻转变背面看"这学期解决什么"大纲+预约按钮（桌面 hover 翻转，移动端点击预约）。
2. **师资墙** —— 4 位老师卡片：姓氏头像 + 教龄 + 毕业院校 + 教学理念一句话，hover 上浮。
3. **学员提分榜** —— 顶部 4 个滚动数字（提分率/人均提分/提分 30+ 人数/满意度），下方学员故事卡轮播（自动 5.2s + 圆点切换 + hover 暂停）。
4. **试听预约表单** —— 左侧卖点（免费试听+测评+规划建议）+ 右侧表单（姓名/电话/年级/科目），手机号正则校验，提交后本地成功态。
5. **肥页脚 + 法务三件套** —— 四列（品牌/快速入口/联系/法务），隐私政策/服务条款/Cookie 以弹窗呈现，底部版权行 + 办学许可证编号占位。

## 动效拆解

- **主视觉：提分数字滚动** —— IntersectionObserver 触发，`easeOutExpo` 1.8s，`tabular-nums` 防抖动；千分位逗号 + 不换行空格后缀（`&#160;` 防"1,240 人"断行）。
- **Hero 波浪** —— 3 层 SVG 波浪（橙 22%/橙 14%/白 5%）`translateX` 往复漂移 11–19s + 6 颗橙色圆点 `floaty` 上下浮动，纯 CSS，`ease-in-out` 物理感。
- **课程卡翻转** —— `perspective:1200px` + `rotateY(180deg)`，0.7s `cubic-bezier(.22,1,.36,1)`；tab 切换时卡片 `panelIn` stagger 80ms 入场。注意：翻转区未使用 `filter:blur()`，避开 Chromium preserve-3d 压平坑。
- **区块 reveal** —— `.js` 门控（无 JS 时内容直接可见），`translateY(30px)→0` 0.8s，`i%4` stagger 70ms；3s 兜底强制 `.in`，保证完成态永远可达。
- **故事轮播** —— `translateX(-100%)` 0.65s 出场 easing，圆点变宽指示。
- **按钮** —— primary 有斜切扫光（`::after` skew 扫过），hover 上浮 2px + 弹簧 easing；ghost 描边按钮同理。
- **质感层** —— 全页 fixed SVG `feTurbulence` 噪点（opacity .055）+ 径向 vignette，不抢戏。
- **加载态** —— 海军蓝全屏 + 品牌帆形 logo 脉冲 + 三点弹跳，`load` 后双 rAF 关闭，2.5s 强制兜底。

## 配置参数

- **`src/main.js` 顶部 `SITE` 变量**（机构信息唯一真实来源，改一处全站生效）：
  ```js
  var SITE = { name, phone, address, email, license }
  ```
  页脚联系行、抽屉电话、试听区电话（`tel:` 自动拼接）、邮箱（`mailto:`）、底部版权 `办学许可证编号` 全部走 `data-site` / `data-site-tel` / `data-site-mail` 属性自动渲染。
- **颜色**：`styles.css :root` → `--navy:#1B2A4A`、`--orange:#FF7A1A`、`--white:#FFFFFF`（另有同色系加深 `--navy-deep` 用于页脚、`--orange-dark` 用于 hover）。全页只用这三色系，禁彩虹渐变。
- **课程/师资/故事文案**：直接改 `index.src.html` 对应区块；提分数字改 `.count` 的 `data-count` / `data-dec` / `data-suffix`。
- **轮播间隔**：`src/main.js` → `setInterval(..., 5200)`。

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只有一个主视觉动效（提分数字滚动+故事轮播），hero 只有波浪+圆点两层，不堆砌。
2. **配色**：死守深海军蓝/活力橙/纯白三色，无彩虹渐变；橙色只用在 CTA、数字、点缀线。
3. **字体**：系统字体栈，H1 `clamp(46px,7.2vw,96px)` + `letter-spacing:.1em` 大字距呼吸感；数字 `tabular-nums` 防跳动。
4. **文案**：真实感短句——"数学 87 分到 132 分，他用了 4 个月""老师把我的错题本翻了三遍，比我自己还清楚我哪儿弱"；零 Lorem ipsum、零 emoji 列表（✓/✕ 用 CSS/SVG 绘制）。
5. **手工细节**：噪点+vignette、按钮扫光、输入框 focus 光晕、卡片 hover 上浮、表单错误红框+行内提示、select 自定义箭头。
6. **Easing**：出场统一 `cubic-bezier(.22,1,.36,1)`，按钮/卡片用轻弹簧 `cubic-bezier(.34,1.45,.44,1)`，无默认 linear/ease。

## 源码结构

```
edu-academy-page/
├── index.src.html   # 源码 HTML（改这里）
├── index.html       # 打包产物（单文件，勿手改；改源码后重建）
├── styles.css       # 源码样式
├── src/main.js      # 源码交互（含 SITE 配置）
└── README.md
```

无 `vendor/` 目录：本套为纯原生 JS/CSS 实现，零外部依赖、零外链。

## 重建方式

```bash
cd ~/workspace/fx-lab/edu-academy-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py edu-academy-page
# 验收
grep -oE 'https?://[^"'"'"' )]+' index.html | grep -v 'w3.org' || echo "外链干净"
```

注意：`fx-singlefile.py` 是一次性单向打包器，禁止对已打包的 `index.html` 重复跑；改源码后从 `index.src.html` 重新 `cp` 再跑。

## 移动端说明

- ≤1020px：导航收起为汉堡抽屉（右侧滑入，电话直拨）；课程 tab 2 列；师资/保障/提分数字 2 列；试听区单列。
- ≤600px：H1 46px 起、CTA 全宽按钮、课程/师资/保障全部单列、年级+科目选择器上下排、法务弹窗 94vw。
- `prefers-reduced-motion`：全部动画降为 0.01ms，数字直接渲染终值，轮播停止自动播放，reveal 直接显示。
