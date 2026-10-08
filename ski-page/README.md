# 雪线 SNOWLINE · 滑雪装备落地页

一套商用级滑雪装备品牌落地页模板（虚构品牌「雪线 SNOWLINE」）：导航 / 雪山视差 hero / 装备矩阵 / 雪场指南 / 滑手社区 / 早鸟券 CTA / 页脚，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

1. **Burton 官网**：雪山大 hero「品牌主张大字 + 双 CTA」的信息层级；装备按品类分块陈列（雪板/雪服/配件三矩阵）；雪场/社区内容区讲生活方式。
2. **Salomon 官网**：顶部公告条（促销信息）+ 滚动后毛玻璃导航；产品卡「标签 + 程序化视觉 + 价格」结构；页脚多列（品牌/装备/支持/联系）+ 法务三件套。

学到的布局点（实现均为原创代码）：①滚动透明→毛玻璃导航 ②雪山 hero 大字逐行升起 ③装备三分类矩阵（雪板/雪服/配件）④雪场指南卡（难度点/雪深条/气温）⑤滑手故事引用卡 ⑥早鸟券 CTA 票券视觉 ⑦页脚企业标配 + 法务弹窗。

## 动效拆解

- **hero 主视觉（整页唯一核心动效）**：Canvas 2D 程序化绘制——4 层雪山剪影（远→近颜色由浅入深、峰顶戴程序化雪帽）+ 星空闪烁 + 月亮光晕 + 3 团漂移云 + 170 粒飘雪（大小/速度/相位随机，风摆正弦）+ 索道缆车剪影。鼠标视差（远层位移小、近层大）+ 滚动视差（各层下沉速率不同）+ hero 文案随滚动上浮淡出。离屏/切后台自动暂停 rAF。
- **hero 入场**：标题 5 行 `yPercent:112→0` 逐行升起（stagger 0.12s，`power3.out`）；先有 shimmer 加载态，首帧渲染后淡出再播入场。注意坑：CSS 初值 `translateY(112%)` 必须 `el.style.transform='none'` 清掉再交给 GSAP，否则百分比被烘成 px 残留；播完给 `html` 加 `hero-in` 类兜住完成态再 `clearProps`，另有 4 秒兜底强制可达。
- **区块 reveal**：IntersectionObserver + `opacity 0→1 / y 34→0`（`power3.out` 0.8s，同行 stagger 0.08s）；雪场卡片 reveal 后雪深条 `width 0→x%`（`power2.out`）。
- **hover 微交互**：产品卡上浮 8px + 冰蓝描边 + 柔阴影，卡内 SVG 放大 1.06 微旋转；票券 hover 回正放大；社交图标上浮变冰蓝底。
- **早鸟券**：手机号校验（错则抖动 + 红字提示），成功生成 `SNOW-XXXXXX` 券码填进票券，票券 `back.out(2)` 回弹。
- **全局**：SVG 噪点颗粒（opacity .045）、hero 径向 vignette、滚动指示器（ease-in-out 非 linear）。
- **easing**：全部 `power3.out` / `power2.out` / `back.out` / `cubic-bezier(.22,1,.36,1)`，禁用 linear。`prefers-reduced-motion` 直接降级。

## 配置参数

`src/main.js` 顶部 `CONFIG`：

- `heroStagger`：hero 逐行间隔（秒，默认 0.12）
- `revealMs`：区块 reveal 时长（毫秒，默认 800）
- `PRODUCTS`：8 件商品（boards 3 / apparel 2 / accessories 3），字段 name / desc / price / old / tag / art——换商品只改这里
- `RESORTS`：4 个雪场（name / loc / level / dots / depth / temp / cond）
- `STORIES`：3 条滑手故事（who / where / text）
- `SITE`：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——页脚联系方式与版权行集中一处，换主体只改这里（均为占位示例值）

产品图与 hero 全部程序化绘制（Canvas 山体 / SVG 装备示意），零外部图床、零 Google Fonts。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲「滑雪装备品牌页」一个主题；唯一主视觉动效是 hero 雪山视差，其余全是微交互，无多余装饰动画。
2. **配色**：冰蓝 `#7FCBE8` + 深藏青 `#0C2237` + 白三色定死（山体/卡片用藏青明度衍生）；点缀冰蓝只出现在 CTA/价格/雪深条/hover，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(48px,8.2vw,118px)、字距 -0.01em、行高 1.14，有呼吸感；价格数字加粗 tabular。
4. **文案**：真实感中文短句（「板子是借的，勇气是自己的」「缆车上穿它，排队不哆嗦」），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：噪点颗粒、hero vignette、加载 shimmer、按钮 active 缩放、票券虚线撕边、法务弹窗 X 悬停旋转 90°、手机号输错抖动提示。
6. **easing**：物理感曲线全覆盖，无 linear。

## 法务三件套（模态弹窗实现）+ SITE 配置变量

页脚企业标配三件套做成模态弹窗：

- **触发**：页脚底部「隐私政策 / 服务条款 / Cookie 政策」三个按钮（`data-modal="privacy|terms|cookies"`）。
- **关闭三通道**：右上角 X（hover 旋转 90°）/ 遮罩点击 / ESC；打开时 `body` 锁滚动，关闭后恢复焦点；`role="dialog"` + `aria-modal`。
- **文案**：雪线口径真实中文条款（隐私 5 条 / 服务 5 条 / Cookie 4 条）：30 天雪场实测退换、早鸟券规则、滑雪高风险提示等，无 Lorem ipsum。
- **SITE 配置变量**（`src/main.js` 顶部）：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——页脚联系列与版权行 `© 2026 <organizer> · <icp>` 全部引用变量渲染，换主体只改一处。
- **社交图标**：inline SVG（微信/微博/小红书/抖音，页脚品牌列下），hover 冰蓝底 + 上浮。
- **移动端全屏式**：≤560px 弹窗占满视口（padding 0、圆角 0、高 100%）。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / vendor/gsap.min.js / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含响应式断点 1100/900/560；含 `[hidden]{display:none}` 兜底与 `hero-in` 完成态覆盖规则）
- `src/main.js` —— classic 脚本：CONFIG / 渲染 / hero Canvas / 导航抽屉 / reveal / 早鸟券 / 法务弹窗
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，© GreenSock；打包时内联，无 CDN）
- `README.md` —— 本文件

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py ski-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤900px：中部菜单收进汉堡抽屉（左滑入 + 遮罩）；装备网格 3→2 列；故事单列；CTA 票券改纵排；页脚 4→2 列。
- ≤560px：hero CTA 全宽；装备/雪场单列；早鸟券表单纵排；页脚单列；法务弹窗全屏式。390×844 已截图验证。
- 抽屉链接点击后自动收起；法务弹窗 X / 遮罩 / ESC 三通道关闭。

## 外链白名单

成品 `index.html` 零 `https` 外部 URL（GSAP 内联、视觉全程序化、字体走系统栈）。验证：`grep -o 'https://[^"'"'"' ]*' index.html | sort -u` 应无输出。
