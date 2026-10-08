# 转转乐 RESALE · 二手交易平台落地页模板

一套商用级二手交易平台落地页模板（虚构品牌「转转乐 RESALE」）：透明→毛玻璃导航 / 搜索 hero + 漂浮商品卡 / 品类磁贴 / 今日捡漏商品流（价格+成色标签+类目筛选）/ 验机保障区 / 发布闲置 CTA（含表单校验弹窗）/ 页脚法务三件套，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

**eBay / 转转 App 首页**：只学了布局结构，代码全部原创重写。

学到的布局点（实现均为原创代码）：
① 搜索 hero（大搜索框 + 热搜词，下面直接跟商品流，对应二手平台"搜了就买"的路径）
② 品类磁贴行（图标+在售件数，对应二手平台按类目分流的逛法）
③ 商品信息流卡片（价格 + 成色标签 + 地区/时间，对应二手商品"成色"是核心决策信息）
④ 卖家保障横区（验机/退货/赔付承诺，对应二手平台信任状区块）

## 动效拆解

整页只有一个核心动效体系：**hero 漂浮商品卡**，其余为入场/反馈类微动效。

- **hero 漂浮商品卡**：4 张程序化商品卡（iPhone / ThinkPad / 沙发 / 冲锋衣），GSAP 入场 `back.out(1.6)` stagger 弹出 → 完成后挂 `sine.inOut` yoyo 无限漂浮（y ±10–19px + 轻微旋转，2.6–4.1s 交错）。初值全部由 `gsap.set` 在 JS 里下发，CSS 不写 transform 初值，天然避开百分比位移坑；`window.gsap` 缺失时兜底直接显示。
- **标题升起**：两行 `translateY(112%)→none` 逐行升起（CSS transition，`cubic-bezier(.22,1,.36,1)`，第二行延迟 .14s）；`body.loaded` 加完成态覆盖规则 + 3s 兜底，完成态永远可达。
- **搜索框**：placeholder 每 2.6s 轮换热搜词；focus 时芥末黄光环。
- **滚动 reveal**：IntersectionObserver（threshold .12），`opacity 0→1 + y 30→0`，同行按 `--d` stagger；3 秒兜底强制全部 `.in`。
- **卡片 hover**：`translateY(-8px)` + 阴影加深（`cubic-bezier(.22,1,.36,1)`）；磁贴图标 hover 旋转 -8° 变黄底；商品图 hover 放大 1.1。
- **加载态**：品牌幕布（深蓝底 + logo，首屏就绪退场 + 3s 兜底）。
- **手工细节**：SVG 噪点颗粒（opacity .05）、hero 底部 vignette、按钮 active 缩放 .96、表单错项抖动 + toast、抽屉/弹窗 ESC 关闭、toast `aria-live`。
- **easing**：全部 `cubic-bezier(.22,1,.36,1)` / `sine.inOut` / `back.out`，禁用 linear；`prefers-reduced-motion` 直接降级（卡片静态显示）。

## 配置参数

`src/main.js` 顶部 `SITE` / `CATS` / `DEALS` / `TRUST` / `HOTWORDS`：

- `SITE`：`brand` / `brandEn` / `organizer` / `phone` / `email` / `address` / `icp`——页脚联系方式、版权行 `© 2026 <organizer>`、备案号、法务弹窗内电话/地址全部引用变量渲染，换主体只改一处（当前均为虚构示例值：电话 400-820-2026、邮箱 service@zhuanzhuanle.example.com、地址上海市杨浦区黄兴路2005弄2号）
- `CATS`：8 个品类（name / en / kind 图型键 / 在售件数 / 一句话卖点）——换品类只改这里；`kind` 对应 `art()` 的程序化 SVG 插画（phone/earbuds/laptop/laptop2/desk/sofa/jacket/jacket2/tablet/book/camera/gamepad）
- `DEALS`：8 件捡漏商品（cat 归属类目 / kind / 中文名 / 价格 / 原价 / 成色 / 是否手慢无 / 地区·时间）——换商品只改这里
- `TRUST`：4 条保障（标题 / 描述 / icon 键）
- `HOTWORDS` / `PLACEHOLDERS`：热搜词与搜索框轮换文案

商品图、品类图标、保障图标、CTA 插画全部程序化绘制（SVG 几何 + 三色），零外部图床、零 Google Fonts、零 CDN。

## 六项「看起来不像 AI 写的」自查

1. **克制**：整页只讲「二手好货放心买」一个主题；动效只集中在 hero 漂浮卡，无多余装饰动画。
2. **配色**：深蓝 `#16305C` / 芥末黄 `#E9B23B` / 白与纸色三色定死全页（文字用墨色 `#1A2333`）；点缀只出现在 CTA/价格/hover，禁彩虹渐变。
3. **字体**：系统字体栈；hero 大标题 clamp(44px,6.4vw,86px)、字距 -0.015em、行高 1.18，有呼吸感；价格数字加粗。
4. **文案**：真实感中文短句（「自用两年的 ThinkPad」「搬家了，沙发带走」「家里那件落灰神器」），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：噪点颗粒、hero vignette、品牌幕布、按钮 active 缩放、表单错项抖动、搜索框 focus 光环、抽屉/弹窗 ESC 关闭、toast 反馈。
6. **easing**：物理感曲线全覆盖（back.out 入场 / sine.inOut 漂浮 / cubic-bezier(.22,1,.36,1) 交互），无 linear。

## 法务三件套（模态弹窗实现）

页脚「法务」列做成模态弹窗：

- **触发**：页脚「隐私政策 / 服务条款 / Cookie 政策」三个按钮（`data-modal="privacy|terms|cookies"`），点击弹对应弹窗。
- **关闭三通道**：右上角 X（hover 旋转 90°）/ 遮罩点击 / ESC；打开时 `html` 锁滚动，关闭后恢复焦点；`role="dialog"` + `aria-modal`。
- **文案**：转转乐口径真实中文条款（隐私 5 条 / 服务 5 条 / Cookie 4 条）：56 项验机、7 天无理由退、假一赔三、资金托管、营销短信回复 TD 退订，无 Lorem ipsum。
- **社交图标**：inline SVG（微信/微博/小红书/抖音），hover 变黄 + 上浮 4px。
- **移动端全屏式**：≤560px 弹窗占满视口（圆角 0、高 100%），方便小屏阅读。

## 源码结构

- `index.src.html` —— 开发源码（外链 styles.css / vendor/gsap.min.js / src/main.js）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，一次性单向，禁止重复跑）
- `styles.css` —— 全部样式（含 `[hidden]{display:none!important}` 显隐规则、响应式断点 1024/860/560）
- `src/main.js` —— classic 脚本：SITE 注入、品类/商品/保障渲染、搜索过滤、类目 tab 筛选、导航/抽屉、法务弹窗、发布表单校验、hero 漂浮卡
- `vendor/gsap.min.js` —— GSAP 3.12.5 真实完整文件（72KB，无空壳）
- `README.md` —— 本文件

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py resale-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器）。

## 移动端说明

- ≤860px：中部菜单收进汉堡抽屉（右滑入 + 遮罩，链接点击自动收起）；hero 改单列、漂浮卡舞台限高；品类/商品/保障网格改 2 列；CTA 改单列（插画隐藏）；页脚单列。
- ≤560px：法务/发布弹窗全屏式（占满视口、圆角 0）；商品网格保持 2 列紧凑排布。390 宽已截图验证。
- 抽屉、法务弹窗、发布弹窗均支持 ESC 关闭；发布表单做 11 位手机号校验（错项抖动 + toast）。
- 无头 console 零报错已验证；外链白名单：仅 GSAP 许可证注释（gsap.com）与 w3.org 命名空间字面。
