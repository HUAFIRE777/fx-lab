# 贝安 BAYAN · 母婴品牌整站首页模板

一套商用级母婴品牌落地页模板（虚构品牌「贝安 BAYAN」）：透明→毛玻璃导航 / 云朵 hero / 分龄 tab 选购（0-1/1-3/3-6岁）/ 安全认证横带 / 明星单品横滑轮播 / 育儿知识卡片 / 新手礼包 CTA / 页脚法务三件套，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

**Carter's / 好孩子官网首页**：只学了布局结构，代码全部原创重写。

学到的布局点（实现均为原创代码）：
① 年龄段 tab 切换（0–1岁襁褓期 / 1–3岁学步期 / 3–6岁探索期三个产品区，对应母婴站按月龄分流的选购逻辑）
② 安全认证横带（A类面料 / 无荧光剂 / 双重质检 / 面料可追溯四徽章行，对应母婴站信任状横带）
③ 明星单品横滑轮播（scroll-snap 横滑 + 左右箭头，对应爆款推荐横滑区）
④ 育儿知识卡片区（三卡片内容流，对应母婴站育儿专栏）

## 动效拆解

整页只有一个核心动效体系：**hero 云朵漂浮 + 产品卡悬停上浮**，其余为入场/反馈类微动效。

- **hero 云朵漂浮**：3 朵 SVG 云 `drift`（ease-in-out，8–13s 交错 infinite alternate）+ 1 只气球 `balloonFloat`（7s 上下浮 + 轻微摇摆）；标题两行 `translateY(112%)→0` 逐行升起（CSS transition，`cubic-bezier(.22,1,.36,1)`，第二行延迟 .14s）。纯 CSS 实现，无 GSAP，天然避开百分比位移坑。
- **产品卡悬停上浮**：`translateY(-10px)` + 阴影加深（`cubic-bezier(.22,1,.36,1)` .35s）；「加入购物袋」下划线从左展开；知识卡配图 hover 放大 1.06。
- **滚动 reveal**：IntersectionObserver（threshold .12），`opacity 0→1 + y 30→0`，同行卡片按 `--d` stagger；3 秒兜底强制全部 `.in`，完成态永远可达。
- **加载态**：品牌幕布（veil，首屏就绪即退场 + 2.5s 兜底）+ 产品图骨架 shimmer（ease-in-out 1.4s，0.9s 后熄灭）。
- **手工细节**：SVG 噪点颗粒（opacity .055）、hero 底部 vignette、按钮 active 缩放 .96、表单 focus 光环 + 报错抖动、抽屉/弹窗 ESC 关闭、toast 反馈。
- **easing**：全部 `cubic-bezier(.22,1,.36,1)` / `ease-in-out`，禁用 linear；`prefers-reduced-motion` 直接降级。

## 配置参数

`src/main.js` 顶部 `SITE` / `CONFIG` / `PRODUCTS`：

- `SITE`：`brand` / `organizer` / `address` / `email` / `phone` / `icp`——页脚联系方式、版权行 `© 2026 <organizer>`、备案号全部引用变量渲染，换主体只改一处（当前均为虚构示例值：电话 400-880-2026、邮箱 service@bayan-mom.example.com、地址上海市静安区安和路88号）
- `CONFIG`：`revealThreshold`（滚动触发比例）/ `toastMs`（toast 停留）/ `fakeLoadMs`（产品图模拟加载）/ `railStep`（轮播步长）
- `PRODUCTS`：9 件商品（age 分龄 0/1/2 / kind 图型键 / 中文名 / 一句话描述 / 价格 / 旧价 / 标签）——换商品只改这里；`kind` 对应 `productSVG()` 的程序化插画（onesie/bottle/blanket/shoes/bib/sleepsack/set/towel/bear）
- `STARS`：轮播取 `PRODUCTS` 的下标数组

产品图、hero 云朵/气球、知识卡配图、认证徽章全部程序化绘制（SVG 几何 + 三色），零外部图床、零 Google Fonts。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲「母婴安心」一个主题；动效集中在云朵漂浮与卡片上浮，无多余装饰动画。
2. **配色**：米白 `#FAF6EF` / 雾蓝 `#A8C3D1` / 蜜桃 `#F4B8A0` 三色定死全页（文字用中性墨色）；点缀只出现在 CTA/价格/hover，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(46px,7.2vw,92px)、字距 -0.015em、行高 1.22，有呼吸感；价格数字加粗。
4. **文案**：真实感中文短句（「换尿布不用整件脱」「踢被子也不着凉」「不领白不领」），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：噪点颗粒、hero vignette、骨架加载态、按钮 active 缩放、表单 focus 光环与报错抖动、抽屉/弹窗 ESC 关闭、toast。
6. **easing**：物理感曲线全覆盖，无 linear。

## 法务三件套（模态弹窗实现）

页脚企业标配三件套做成模态弹窗：

- **触发**：页脚底部「隐私政策 / 服务条款 / Cookie 政策」三个按钮（`data-modal="privacy|terms|cookies"`），点击弹对应弹窗。
- **关闭三通道**：右上角 X（hover 旋转 90°）/ 遮罩点击 / ESC；打开时 `html` 锁滚动，关闭后恢复焦点；`role="dialog"` + `aria-modal` + toast `aria-live`。
- **文案**：贝安口径真实中文条款（隐私 5 条 / 服务 5 条 / Cookie 4 条）：7 天无理由退货、持牌支付不存卡号、48h 发出、营销短信回复 TD 退订、优惠券 7 天有效、无 Lorem ipsum。
- **社交图标**：inline SVG（微信/微博/小红书/抖音），hover 变蜜桃色 + 上浮 4px。
- **移动端全屏式**：≤560px 弹窗占满视口（padding 0、圆角 0、高 100%），方便小屏阅读。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含响应式断点 1024/860/560）
- `src/main.js` —— classic 脚本：SITE 注入、产品渲染、tab、轮播、导航/抽屉、法务弹窗、表单校验、动效
- `vendor/` —— 空（本页零重型依赖，纯 CSS/SVG/原生 JS，无空壳文件）
- `README.md` —— 本文件

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py baby-brand-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤860px：中部菜单收进汉堡抽屉（右滑入 + 遮罩，链接点击自动收起）；hero 改单列、数据行改纵排；产品/知识网格改单列；认证徽章 2 列；CTA 改单列；页脚单列。
- ≤560px：法务弹窗全屏式（占满视口、圆角 0）；产品描述不再固定最小高度。390 宽已截图验证。
- 抽屉与法务弹窗均支持 ESC 关闭；礼包表单手机号做 11 位校验（错号抖动 + toast）。

## 外链白名单

成品 `index.html` 零 `https` 外部 URL（图片全程序化、字体走系统栈、无第三方库）。验证：`grep -o 'https://[^"'"'"' ]*' index.html | grep -v w3.org | sort -u` 应无输出。
