# Flowbase 帮助中心 · 文档知识库首页

虚构工作流自动化产品 Flowbase 的帮助中心首页：居中搜索 hero、六格分类卡、热门文章列表、社区/支持双 CTA。搜索框输入可真实过滤文章（纯前端 JS，无后端）。

`huafire3d fx-lab — original implementation`

## 参考来源（布局结构与交互编排学习，代码与文案全部原创）

1. **Stripe Docs 首页**：顶部"左 logo、中文档导航、右搜索+CTA"导航结构；居中大搜索框 hero；分类卡片网格。学的是"搜索优先"的首页信息架构——用户进来第一眼就是搜。
2. **Notion 帮助中心首页**：热门搜索 chips 紧跟搜索框；文章列表"标题+分类标签+阅读时长"三件套；社区/支持双 CTA 收尾。学的是"chips 降低搜索门槛"与"文章元信息一眼可读"的编排。

复现的交互（实现均为原创）：搜索框聚焦展开动画、输入实时过滤文章列表（带空态）、分类卡点击跳锚点+按分类过滤、卡片 hover 上浮+边框高亮、滚动导航加底边线。

## 动效拆解

- **入场揭示**：`[data-intro]` 元素 GSAP stagger 0.06s 逐个 `expo.out` 0.85s 浮现；播完 `clearProps` 清行内 transform，避免覆盖 hover 上浮。GSAP 缺失/异常时直接加 `.is-in` 类，2.5s 强制兜底。
- **搜索框聚焦展开**：`:focus-within` 触发 `scale(1.015) translateY(-2px)` + 蓝色光环阴影，`cubic-bezier(.22,.9,.28,1.12)` 带轻微过冲的物理感。`/` 快捷键全局聚焦。
- **实时过滤**：input 事件 120ms 防抖，标题+分类+关键词三字段匹配；结果数变化时文章 `back.out(1.6)` 回弹 stagger；零结果显示空态卡（"没有找到相关文章"+清除按钮）。
- **分类卡**：hover `translateY(-6px)` + 边框变蓝 + 阴影；图标块同步放大微转并反白。点击回弹 `back.out(2.2)`，滚动到文章区并按分类过滤。
- **导航**：scroll > 8px 加底边线（rAF 节流）；文章行 hover 箭头右移变蓝。
- **质感**：全站 SVG feTurbulence 噪点叠层（opacity .035，pointer-events 关闭）；配色只用白/浅灰蓝/蓝三色，无渐变色块。

## 法务三件套（弹窗实现）+ SITE 配置变量

- **页脚三件套**：隐私政策 / 服务条款 / Cookie 政策三个链接，点击弹模态弹窗。关闭三通道：右上 X、点击遮罩、ESC；打开时 `body.modal-open` 锁定背景滚动；关闭后焦点回到触发按钮。
- **文案位置**：`src/main.js` 顶部 `LEGAL` 对象（privacy/terms/cookies），每篇 4–6 条要点，覆盖数据跨境、安全合规、SLA、Cookie 分类，真实感中文通用条款，无 Lorem。
- **SITE 配置变量**（`src/main.js` 顶部，一改全改）：`{ name, address, email, phone, icp, statusText }`。页脚公司信息行、版权行（`© 2026 {name} · {icp}`）、系统状态行（`● {statusText}`）全部由 JS 渲染；`icp` 当前为 `京ICP备xxxxxx号` 占位，买家填真实备案号即可。
- **社交图标**：X / LinkedIn / GitHub / YouTube 四枚 inline SVG，hover 变蓝上浮。
- **移动端弹窗**：≤560px 时弹窗为全屏式（`100dvh`、无圆角），内容区独立滚动。

## 配置参数

- `src/main.js` 顶部无全局配置对象；文章数据直接写在 HTML 的 `.article` 卡上（`data-cat` 分类、`data-keywords` 匹配关键词）。
- 加文章：复制一段 `.article`，改标题/`data-cat`/`data-keywords`/阅读时长即可，过滤逻辑自动生效。
- 加分类：复制 `.cat-card` 并给 `data-cat` 与某篇文章的 `data-cat` 同名，点击自动过滤。
- 热门搜索 chips：`.chip` 的 `data-q` 即填充进搜索框的关键词。
- 过滤防抖：`applyFilter` 前的 `setTimeout(..., 120)`；入场 stagger 间隔 `0.06`。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"帮你找到答案"一件事——搜索、分类、文章、求助四段式，无多余装饰。
2. **配色**：白主底 `#FFFFFF` + 浅灰蓝 `#F6F9FC` 区块 + 蓝 `#2563EB` 点缀，三色定死，禁彩虹渐变。
3. **字体**：系统字体栈（-apple-system / PingFang SC / Microsoft YaHei），无外部字体；大标题 52px 字重 800、字距 -0.025em，有呼吸感。
4. **文案**：真实感中文短句（"如何创建第一条自动化流程 · 5 分钟""工作日 2 小时内响应"），无 Lorem、无 emoji 符号列表。
5. **手工细节**：噪点叠层、搜索框 kbd `/` 提示、分类图标 hover 反白微转、文章箭头右移、空态虚线卡。
6. **easing**：GSAP `expo.out` 入场、`back.out` 回弹，hover 用带过冲的 cubic-bezier，无 linear。

## 源码结构

- `index.src.html` —— 开发源码（`<link styles.css>` + classic 脚本引用）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，CSS/GSAP/业务 JS 全内联）
- `styles.css` —— 全部样式（导航/hero/分类/文章/CTA/页脚/响应式）
- `src/main.js` —— classic 脚本：入场揭示、导航底边线、搜索过滤、分类锚点、chips、汉堡菜单（无 ES module、无 three.js）
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，从 cart-fly-3d 拷贝，打包前已验 `>2KB` 且头部版本声明完整）

## 模型说明

零外部依赖、零网络请求：图标全部 inline SVG，无图床、无 CDN、无 Google Fonts。GSAP 与业务 JS 打包进单文件，断网双击可开。

## 重建命令

```bash
cd ~/workspace/fx-lab/docs-home
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py docs-home   # 单向，禁对已打包文件重复跑
# 验收
ls -la vendor/                                        # 每个 .js 必须 >2KB
grep -oE 'https?://[^"'"'"' )]+' index.html | grep -v 'gsap.com' | sort -u   # 外链白名单（GSAP license 注释除外，应为零）
NODE_PATH=/tmp/hcshot/node_modules timeout 120 node /tmp/probe-docs.js "file:///home/hatch/workspace/fx-lab/docs-home/index.html"
```

## 完成态可达性审计（无头靠读代码）

- `[data-intro]` 隐藏样式限定在 `html.js` 下——只有 main.js 成功跑到第一行才会隐藏元素；JS 完全不跑时页面全可见。
- `revealAll()` 在 GSAP 成功/失败/异常三条路径都被调用，外加 2.5s `setTimeout` 强制兜底；探针断言全部 `[data-intro]` 最终都有 `.is-in`。
- `prefers-reduced-motion` 下强制全部可见、过渡近乎关闭。
- 搜索空态：`noResult.hidden` 与 `articleList.hidden` 互斥切换，无"列表消失又无提示"状态；清除按钮恢复 5 篇全显。

## 移动端说明

≤900px：导航中链接与 CTA 收进汉堡菜单（展开为下拉列表），分类 3 列→2 列，CTA 双卡上下堆叠，页脚列左对齐换行。≤560px：分类卡改为横向单列（图标+文字一行），hero 标题 clamp 缩放，搜索框全宽。截图 `shots/docs-home-mobile.png`（390x844）已验。
