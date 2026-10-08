# admin-dashboard-3d · 暗黑 3D 数据总览后台

管理系统首页模板：深色主题，KPI 卡片行 + Three.js 3D 柱状营收图 + 3D 地球实时流量 + 右侧实时动态流。所有代码原创手写，可直接卖。

`huafire3d fx-lab — original implementation`

## 参考来源与复现手法

参考了 **Stripe / Linear 式深色数据美学**（官网数据页与后台的通用设计语言：近黑底色、玻璃拟态卡片、靛蓝强调色、表格数字、实时徽章）。**没有下载或复制任何一方源码**，以下手法均为独立实现的原创代码：

1. **Stagger 入场编排** — 侧边导航 → KPI 卡 → 图表面板按 90ms 间隔依次浮现（`ui.js: reveal()`，CSS `.rise` + cubic-bezier(.16,1,.3,1)）
2. **easeOutExpo 数字滚动** — KPI 数值从 0 缓动到目标值（`ui.js: countUp()`），非线性，有物理感
3. **3D 柱生长** — 柱状图每根柱子按高度着色、stagger 从地面长起（`chart3d.js: build()`）
4. **Hover 跨联动** — 柱子 hover 高亮 → 对应 KPI 卡片描边发光；KPI hover 反向提示（`main.js: chart.onHover → linkKPI()`）
5. **Feed 滑入** — 新事件从顶部滑入、超量自动裁剪（`ui.js: startFeed()`）
6. **环境地球** — Fibonacci 点阵球 + 稀疏弧线生长/淡出循环 + 脉冲标记，故意做"安静"，不抢主图风头（`globe.js`）

## 参数（`src/config.js`）

换数据只改 CONFIG，整页跟着变：

| 段 | 说明 |
|---|---|
| `theme` | 主色/涨跌语义色 |
| `nav` | 侧边导航项 |
| `kpis` | 卡片：label / value / format(money0·int·pct2) / delta / spark(迷你柱数据) / invert(涨跌反转) |
| `revenue` | 3D 柱状图：months / current / previous；**空数组自动显示空数据态** |
| `ranges` | 时间范围按钮（6M 切片会重播生长动画） |
| `regions` / `funnel` | 地区条 / 转化漏斗 |
| `feedTemplates` | 实时动态文案模板（`<b>` 高亮，无 emoji） |
| `motion` | 开屏/间隔/滚动时长/feed 间隔 |
| `gl` | 像素比上限、自动旋转开关 |

## 质量自查（六项铁律）

- ① 克制：整页只讲一个核心动效（3D 柱状图），地球只是环境伴奏
- ② 配色：锁死靛蓝 #6e6bff + 紫 #a855f7，涨跌绿/红仅作语义色，无彩虹渐变
- ③ 字体：系统字体栈，tabular-nums 大数字，标签字距 .09em，大标题留白
- ④ 文案：真实中文短句（"API 调用额度""深圳某科技公司完成注册"），无 Lorem ipsum、无 emoji 列表（图标均为手绘 SVG）
- ⑤ 手工细节：vignette 暗角 + SVG 噪点、地球每颗点随机明度、骨架加载态、卡片 hover 上浮、柱子 hover 放大
- ⑥ easing：全站 cubic-bezier(.16,1,.3,1) / easeOutExpo，无 linear

## 构建与验证

```bash
# 开发：直接用本地 server 或 file 打开 index.html（importmap 指向 vendor/three.module.js）
# 打包单文件（一次性，不可重复跑）：
python3 ~/workspace/bin/fx-singlefile.py admin-dashboard-3d
```

- 单文件约 903KB，零外部依赖（Three.js 已打进 data: URL importmap），断网双击可开
- 已验证：桌面端渲染正常、console 零报错；移动端（390px）自动堆叠、图表降画质；`prefers-reduced-motion` 下退化为静态
- 文件：`index.html`（单文件成品）+ `src/`（config/ui/chart3d/globe/main）+ `styles.css` + `vendor/three.module.js`
