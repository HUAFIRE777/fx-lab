# 驰轮 VELOCE · 自行车品牌落地页

一套商用级自行车品牌落地页模板（虚构品牌「驰轮 VELOCE」）：导航 / 公路车 hero / 三车型矩阵 / 参数对比表 / 车架几何可视化 / 骑行故事 / 配件区 / 门店试骑表单 / 页脚，全响应式，GSAP 内联打包、其余零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点（只学布局结构与交互编排，文案/图片/商标全部原创）

1. **Specialized 官网**：黑底红字强对比的硬核运动品牌语言；车型按"公路/山地/电助力"分类陈列，一车一张大图 + 核心参数 + 价格 + 试骑 CTA；"几何"概念用示意图+参数表讲透选车。
2. **Trek 官网**：顶部"预约试骑"常驻 CTA；车型对比表（重量/变速/材质/轮胎/刹车/价格横向拉通）；骑行故事区用真实车主引言做信任背书；门店/服务信息进页脚。

学到的布局点（实现均为原创代码）：①黑底 hero 左文右车 + 红色速度线 ②三车型卡片矩阵（公路/山地/电助力各一张）③全参数横向对比表 ④车架几何 SVG 示意图 + S/M/L 尺码切换 ⑤悬停参数↔图上标注联动 ⑥门店试骑预约表单 ⑦页脚企业标配 + 法务三件套。

## 动效拆解

- **hero 主视觉（整页唯一核心动效）**：纯手绘 SVG 公路车（双轮辐条、车架、曲柄、座管全部程序化绘制）+ 红色 glow 光晕 + 三组速度线循环掠过；车轮 CSS 动画持续转动（`prefers-reduced-motion` 自动停转）；鼠标移入 hero 车身微偏移（GSAP quickSetter，±26px/±14px），滚动时车身随下沉 `y = scrollY×0.12`；文案三行错峰升起入场。
- **滚动揭示**：IntersectionObserver（阈值 .15），同行 `.rv` 元素按兄弟索引 stagger 0.09s 递进上浮（上限 .36s），动画后 `unobserve` 一次到位。
- **数字滚动**：98家 / 23,000+ 等数据 rAF 驱动 `easeOutQuart`（1.5s）滚到终值，中文千分位格式化。
- **车架几何联动**：hover 左侧参数行 → 右侧 SVG 对应标注线发光（`.lit` 类）；S/M/L 尺码切换刷新 Stack/Reach/头管角/座管角/五通下沉五个数值，并带一次 yoyo 微抖（`clearProps` 清理）。
- **试骑表单**：提交失败整表 elastic 抖动 + 红色错误文案（姓名≥2字 / 11位手机号 / 城市 / 车型四档校验）；成功后表单淡出、`#ride-ok` 成功面板升起，文案拼入门店/电话/车型；"返回"可复位。
- **全局**：红色 marquee 循环跑马灯；按钮 hover 上浮 + 阴影；easing 全 `power2.out/power3.out` 与 CSS `cubic-bezier(.22,1,.36,1)`，禁用 linear。

## 配置参数（`src/main.js` 顶部）

- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`brand / brandEn / phone / email / address / icp / year`。页脚电话（自动拼 `tel:` 去横线）/邮箱（`mailto:`）/地址/备案行均由 `data-site` 属性自动渲染。
- `LEGAL` —— 法务三件套文案（`privacy / terms / cookie`，每篇 `title + body` HTML），改文案只改这里（`cookie` 键名故意与页脚 `data-legal="cookie"` 对齐）。
- `GEO` —— 车架几何数据（S/M/L 三档：stack / reach / head / seat / bb），换车架尺寸只改这里；表格联动 `data-k` 键名。
- 车型矩阵与对比表：纯 HTML 区块（`#models` / 参数表），增删车型改 HTML 即可；成功面板文案在 `ride-form` submit 回调里拼装。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲「选车 → 试骑」一条线；唯一主视觉动效是 hero 骑车视差，其余全是微交互，无多余装饰动画。
2. **配色定死**：黑 `#0A0A0B` + 亮红 `#E50012` + 白三色全页统一（卡片用白 4%–8% 透明度衍生）；红色只出现在 CTA/价格/速度线/高亮，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(56px,7.4vw,104px)、字距 -0.02em、行高 1.1，有呼吸感；参数数字用 tabular-nums 对齐。
4. **文案真实感**：「重量精确到小数点后一位，价格就是标价，没有"咨询客服"」「试骑免费，需本人带身份证」「演示模板，文案数据为虚构」。无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：SVG 噪点颗粒、hero 红色径向 vignette、红色跑马灯、车型卡 hover 红线扫过、几何标注线手绘感、提交抖动 elastic、法务弹窗 X 旋转。
6. **easing**：`power2.out / power3.out / easeOutQuart / cubic-bezier(.22,1,.36,1)` 全覆盖物理感，无 linear。

## 法务三件套（模态弹窗实现）+ SITE 配置变量

- **触发**：页脚底部「隐私政策 / 服务条款 / Cookie 说明」三个胶囊按钮（`.legal-btn`，`data-legal="privacy|terms|cookie"`，与 LEGAL 键一一对应）。
- **关闭四通道**：右上角 X / 遮罩点击 / ESC / 抽屉联动关闭；打开时 `body` 锁滚动并记录焦点，关闭后恢复焦点；`aria-hidden` 同步。
- **文案**：试骑口径真实中文条款（预约试骑身份证要求、标价口径说明、信息 90 天删除、未成年人须陪同等），无 Lorem ipsum。
- **SITE 配置变量**（`src/main.js` 顶部）：`brand / brandEn / phone / email / address / icp / year`——页脚联系方式与版权行 `© {year} {brand} · {icp}` 全部引用变量渲染，换主体只改一处。
- **社交图标**：inline SVG（微信/微博/小红书/抖音抽象线稿，页脚品牌列下），点击 `preventDefault` 不跳转（演示页）。
- **移动端**：弹窗占满视口宽度（左右 16px 边距）、内容可滚动。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / vendor/gsap.min.js / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含响应式断点 1024/768/560；`prefers-reduced-motion` 降级：停转车轮）
- `src/main.js` —— classic 脚本：SITE/LEGAL/GEO 配置 + loader + 导航抽屉 + reveal + 数字滚动 + hero 视差 + 几何联动 + 试骑表单 + 法务弹窗
- `vendor/gsap.min.js` —— GSAP 3.12.5 真品（72KB，© GreenSock；打包时内联，无 CDN；JS 里 `window.gsap &&` 守卫——缺 GSAP 页面照样跑，只是没视差）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab/bike-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py bike-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤1024px：hero 改单列（文案居中、车缩小）；车型卡 3→1 列；几何区改纵排；对比表横向滚动。
- ≤768px：中部菜单收进汉堡抽屉（顶部下滑 + 车身 X 变形动画）；试骑表单单列；页脚 4→2 列。
- ≤560px：hero 标题 `clamp` 自适应；抽屉链接大字；法务弹窗全屏式。390×844 已截图验证。
- 抽屉链接点击后自动收起；ESC 同时关抽屉与法务弹窗；`prefers-reduced-motion` 下车轮停转、reveal 直达终态。

## 外链白名单

成品 `index.html` 零 `https` 外部 URL：GSAP 内联 vendor、车架/自行车全程序化 SVG、字体走系统栈。`http` 字面仅出现在：① SVG data-URI 的 `xmlns='http://www.w3.org/2000/svg'`；② JS `createElementNS('http://www.w3.org/2000/svg')`；③ `http://www.w3.org/1999/xhtml` 命名空间字面。验证：`grep -o 'https\?://[^"'"'"' >()]*' index.html | sort -u` 只有上述 w3.org 命名空间。
