# sportswear-page — 锐行 RUSHLINE · 运动品牌整站

城市跑步品牌「锐行 RUSHLINE」的整站落地页：碳板竞速跑鞋 hero 主视觉（程序化 SVG 跑鞋 + 速度线粒子画布）/ 新品横滑轮播 / 装备翻转矩阵 / 训练课程 tab / 跑者故事墙 / 会员表单（手机号校验 + 会员码成功态）/ 页脚法务三件套弹窗，全响应式，GSAP 本地 vendored，零外部请求，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点

**Nike / adidas 类运动品牌官网的公开页面编排**：只学了布局结构，文案配色代码全部原创。

学到的布局点（实现均为原创代码）：
① hero 左文案右大产品主视觉（对应运动站「一件镇场单品」的编排逻辑）
② 卖点跑马灯（对应运动站「信任状横滚条」的编排逻辑）
③ 新品横滑轮播（对应运动站「新品首发」的横滑陈列逻辑）
④ 装备翻转矩阵（对应运动站「参数党」区的规格翻转卡编排）
⑤ 训练课程 tab（跑步/力量/瑜伽/篮球四 tab，对应运动站「社区课程」的分类编排）
⑥ 跑者故事墙（对应运动站「普通人代言」的口碑编排）
⑦ 会员 CTA 大色块 + 表单（对应运动站核心转化入口的编排）

## 动效拆解

整页只有一个核心动效：**hero 速度线粒子画布**，其余为入场/反馈类微动效。

- **hero 主视觉（速度线粒子）**：canvas 64 条速度线（`CFG.lines`），22% 为电光橙、其余白色，`requestAnimationFrame` 无限右移循环，页面不可见时自动暂停；主视觉跑鞋为手写 SVG 路径（程序化生成，6 款配色变体），悬浮呼吸 `y:-14`（2.6s `sine.inOut` yoyo）+ 鼠标视差（`power2.out`，仅 fine pointer）。
- **标题逐行升起**：GSAP `yPercent:112→0`（`power3.out` 1.1s，0.14s 阶梯）；设值前先 `el.style.transform='none'` 清掉 CSS 初值（防 GSAP 百分比位移坑）；隐藏等 JS 模式，完成态选择器带 `html.js` 前缀（`html.js.intro-done .rl-mask .rl-line{transform:none}`），timeline onComplete 加类 + 头部内联脚本 3s 保底，完成态永远可达。
- **滚动 reveal**：IntersectionObserver（threshold .12，rootMargin 底部 -8%），`opacity 0→1 + y 30→0`，4 秒安全网兜底；`<noscript>` 样式兜底。
- **翻转矩阵**：`preserve-3d` 卡片，hover `rotateY(180deg)`（.75s `--ease`），背面橙底白字列硬参数。
- **训练 tab**：四 tab 切换课程面板（`fadeup` 入场）；跑马灯 CSS 无限横滚。
- **加载态**：品牌 loader（RUSHLINE 字标 + 进度条 + "正在系紧鞋带…"），最短展示 900ms（`CFG.loaderMin`）。
- **手工细节**：导航滚动毛玻璃、按钮 hover 上浮、价格删除线、卡片徽章、表单报错红框 + 聚焦首错项、提交后"正在生成会员码…"→ 会员码成功面板。
- **easing**：GSAP `power3.out` / `sine.inOut` / `power2.out`，CSS 自定义 `--ease`，禁用 linear；`prefers-reduced-motion` 降级。

## 配置参数

`src/main.js` 顶部三个对象，换主体只改这里：

| 变量 | 说明 |
|---|---|
| `SITE.name / phone / email / address / hours / icp / year` | 品牌名、电话、邮箱、地址、营业时间、备案号、版权年份（`data-site` 属性绑定） |
| `CFG.loaderMin / revealThreshold / safetyMs / lines` | loader 最短展示、reveal 阈值、安全网毫秒、速度线粒子数 |
| `LEGAL.privacy / terms / cookie` | 法务三文档的标题 + 条款数组，改文案只动这里 |
| `PRODUCTS / MATRIX / TRAIN / STORIES / MQ` | 新品、矩阵、课程、故事、跑马灯数据 |

## 「看起来不像 AI 写的」六项自查

① **克制**：整页只讲一个核心动效（hero 速度线 + 跑鞋），其他区块只有 reveal + hover 微交互，不堆砌。
② **配色**：全页 3 色定死——墨黑 `#0a0a0a`、白 `#ffffff`、电光橙 `#ff4d00`（另有中性灰 `#9a9a9a` 做辅助文字，无彩虹渐变）。
③ **字体**：大标题超粗黑体、字号 clamp 层级（hero 64–120px / 区块 36–56px / 卡片 16–20px），kicker 小字 tracking .3em，大标题 `line-height:1.05` 有压迫感；正文字距行高 1.7。
④ **文案**：中文真实感短句（"我们不做'看起来很快'的鞋"、"山里没有 KPI，只有下一座山"），无 Lorem ipsum、无 emoji 符号列表；强度用条形 indicator，列表用 CSS 圆点。
⑤ **手工细节**：手写 SVG 跑鞋/服饰（6 变体）、速度线粒子、翻转卡背面、会员码成功态、跑马灯、导航毛玻璃。
⑥ **easing**：GSAP 物理感 easing 全套，无 linear；跑鞋呼吸用 `sine.inOut` 模拟悬浮感。

## 源码结构

```
sportswear-page/
├── index.src.html    # 源码 HTML（打包入口）
├── styles.css        # 全部样式（CSS 变量定主题色）
├── src/
│   └── main.js       # 交互逻辑（SITE / CFG / LEGAL / 数据 / 渲染 / 动效）
├── vendor/
│   └── gsap.min.js   # GSAP 3.12.5（72KB 本地 vendored，无 CDN，非空壳）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

## 重建方式

改完 `index.src.html` / `styles.css` / `src/main.js` 后，从源码重新打包（一次性单向打包器，禁止对已打包的 `index.html` 重复跑）：

```bash
cd ~/workspace/fx-lab/sportswear-page
# 先改源码；改 JS 后建议先 node --check src/main.js
cp index.src.html index.html            # 从源码复制，禁止直接改已打包的 index.html
python3 ~/workspace/bin/fx-singlefile.py sportswear-page   # 单向打包，CSS/JS/GSAP 全内联
```

产物为 `~/workspace/fx-lab/sportswear-page/index.html`，单文件双击即看，零外部请求。

## 移动端说明

- ≤760px：汉堡抽屉导航（遮罩可点关闭、ESC 可关、点链接自动关）、hero 鞋图缩小置于文案下方、新品轮播横滑、矩阵 2 列→1 列、训练课程单列、故事墙单列、CTA 表单单列。
- 抽屉打开时 body 锁定滚动；锚点跳转 CSS `scroll-behavior:smooth`（验收时在测试副本里关闭）。
- 截图：`~/workspace/fx-lab/shots/sportswear-page.png`（1280×800）与 `shots/sportswear-page-mobile.png`（390×844）。
