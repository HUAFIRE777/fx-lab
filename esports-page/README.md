# esports-page — 燃点 IGNITE · 24小时电竞馆整站

市中心 24 小时电竞馆「燃点 IGNITE」的整站落地页：旗舰设备配置、包间明码标价、赛事活动日历、在线锁位预订一页讲完。

## 参考站点及布局点

- **电竞馆/电竞酒店官网**（如网鱼电竞、贰拾电竞馆类站点）：hero 场馆氛围大视觉 + 核心数据条（机位数/刷新率/延迟）、设备配置矩阵（CPU/GPU/显示器/外设逐项公示）、包间价格表（大厅/双人/五黑/豪华四档 + 通宵一口价）、赛事活动列表（水友赛/城市赛/观赛派对/包场定制）。
- 布局点：hero 左文案右机房阵列主视觉 → 设备配置六宫格 → 价格四卡（五黑对战房高亮"约得最多"）→ 赛事时间线列表 → 预订表单（锁位逻辑）→ 页脚。只学布局编排，文案配色代码全部原创。

## 动效拆解

- **Hero 霓虹扫描线（本页唯一主视觉动效）**：GSAP timeline 无限循环，一条霓虹青扫描线 3.4s（`power2.inOut`）从左扫过 10×6 机房阵列，被扫到的列逐个点亮青色描边（`tl.call` 按列时序挂 `.lit`），扫完熄灯留 0.9s 呼吸；另有一路 2.4s 间隔的随机机位闪烁做点缀，不抢戏。
- **标题入场**：loader 结束后两行大标题逐行上滑（`yPercent:112→0`，`power3.out`，0.14s 阶梯）。
- **滚动 reveal**：IntersectionObserver（threshold 0.12，rootMargin 底部 -8%）逐节加 `.in`，同级元素按 0.08s 阶梯 delay；**4 秒安全网**兜底（防 IO 漏报，未点亮的一律点亮，完成态必达）；另有 `<noscript>` 样式兜底。
- **导航栏**：滚动超 24px 加 `.scrolled`，透明 → 毛玻璃（`blur(14px)`）+ 底部分隔线。
- **移动端抽屉**：汉堡按钮 → 右侧菜单滑入（`translateX`，`--ease`），body 锁定滚动，点链接/遮罩自动关闭。
- **预订表单**：逐字段校验（手机号 `/^1\d{10}$/`），错误态红框 + 聚焦首个错误项；提交后按钮转菊花 → 成功面板（预订码 `IGN-xxxx` + 房型/日期/时段/尾号）→ "再订一间"可重置。
- **法务弹窗**：隐私/条款/Cookie 三文档同一弹窗壳切换，按钮+遮罩+ESC 三通道关闭，焦点管理（打开聚焦关闭钮，关闭返回原焦点）。

## 配置参数（`src/main.js` 顶部）

| 变量 | 说明 |
|---|---|
| `SITE.name / phone / phoneHref / email / emailHref / address / hours / icp / year` | 买家改这里，一改全站：页脚联系方式、版权行、ICP 备案号、版权年份（`data-site` 属性绑定） |
| `CFG.loaderMin / navOffset / revealThreshold / safetyMs / rigCols / rigRows` | loader 最短展示、锚点偏移、reveal 阈值、安全网毫秒、机房阵列行列数 |
| `LEGAL.privacy / terms / cookie` | 法务三文档的标题 + 条款数组，改文案只动这里（含未成年人上网合规提示） |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效——hero 霓虹扫描线扫过机房阵列；其余全是克制的信息呈现，无堆砌。
2. **配色**：纯黑 `#060609` + 电紫 `#a06bff` + 霓虹青 `#3ae2ff` 三色定死，无彩虹渐变；价格卡"约得最多"用电紫反白标签点缀。
3. **字体**：大标题 clamp(52px,9vw,108px)/1.12 行高 breathing room，kicker 小字 tracking 0.32em，层级分明。
4. **文案**：零 Lorem ipsum、零 emoji 列表；"发现配置不符，当小时免费。""赢了整队免单 2 小时，输了也有一杯冰美式。"——真实口语短句。
5. **手工细节**：loader 点亮进度条 + tip 轮播；vignette 暗角 + SVG 噪点；spec-card hover 上浮描边发光；按钮 loading 菊花态；成功对勾 pop 动画。
6. **easing**：GSAP `power2.inOut` / `power3.out`，CSS 用自定义 `--ease`（cubic-bezier(.22,.9,.28,1)），无默认 linear。

## 源码结构

```
esports-page/
├── index.src.html    # 源码 HTML（语义化 section）
├── styles.css        # 全部样式（CSS 变量定主题色）
├── src/main.js       # 交互逻辑（SITE / CFG / LEGAL 配置区在顶部）
├── vendor/
│   └── gsap.min.js   # GSAP 3.12.5（72KB 本地 vendored，无 CDN，非空壳）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/esports-page
# 改源码三件套：index.src.html / styles.css / src/main.js
cp index.src.html index.html            # 从源码复制，禁止直接改已打包的 index.html
python3 ~/workspace/bin/fx-singlefile.py esports-page   # 单向打包，CSS/JS/GSAP 全内联
```

打包器为一次性单向：禁止对已打包的 `index.html` 重复跑（GSAP 会被双重内联）。永远从 `index.src.html` 重新复制再打包。

## 移动端说明

- 860px 以下：导航收起为汉堡抽屉（右侧滑入，可开合，点链接自动关闭）；赛事卡片从三列改为单列堆叠。
- 560px 以下：设备矩阵/价格表/表单日期行全部单列；hero 数据条 2×2；机房阵列改为 6 列（纯视觉密度调整）。
- 表单、弹窗、抽屉在 390×844 下逐项点过：校验、成功态、ESC 关弹窗均正常。
