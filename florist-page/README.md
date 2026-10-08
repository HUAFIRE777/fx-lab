# 花叙 BLOOMTALE · 花艺订阅落地页模板（florist-page）

鲜花订阅品牌「花叙 BLOOMTALE」完整落地页 —— 订阅 hero + 三档包月 + 本周花束网格 + 花语故事 + 企业定制 + 首单半价 CTA，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：Bloom & Wild / UrbanStems 式花艺订阅站。学到的布局点：

1. **导航**：左品牌花徽 + 中部四菜单（订阅/花束/企业/花语）+ 右订阅 CTA；滚动 40px 后透明→毛玻璃。
2. **订阅模式 hero**：左侧大标题 + 首单优惠 CTA + 信任背书行，右侧主视觉花束（原站用摄影图，本模板用程序化 SVG 花束绽放 + canvas 花瓣粒子）。
3. **包月三档**：价格卡（月/季/年）+ 权益对比表，热门档深色反白突出。
4. **本周花束网格**：3×2 卡片（编号徽 + 插画 + 花名 + 一句描述 + 价格 + 加购钮），每周更新、下架制造稀缺感。
5. **花语故事区**：三栏引言卡（花名 + 一句真实感纸条 + 署名），原站多为英文引言，本模板写成中文收花人纸条。
6. **企业定制**：深色区块三项服务（前台周花/开业花篮/活动布置）+ 合作 logo 墙，本模板用汉字徽代替真实 logo。
7. **首单半价 CTA**：粉色大色块 + 5 折徽章 + 细则小字，原站同类首单优惠多用弹窗，本模板做成整段 CTA。

## 动效拆解

整页**只讲一个核心动效**：hero「花瓣飘落 + 花束绽放」。其余全部是微交互。

1. **加载态**：米白全屏（旋转四瓣花徽 + 「花叙」字 + 樱粉进度条），`window.load` 后最短 700ms 淡出，再触发 hero 入场；4s 兜底放行。
2. **hero 核心动效**：
   - canvas 花瓣粒子（≤46 片）：泪滴形花瓣，重力下落 + 正弦风摆 + 自旋，樱粉/浅粉/米白三色，`requestAnimationFrame`，切后台自动暂停；
   - 程序化 SVG 花束绽放：9 枝扇形花束，每朵花头 `scale .2→1 + opacity 0→1`，`cubic-bezier(.19,1,.22,1)`，随机 stagger 延迟；
   - 大标题两行遮罩升起（`overflow:hidden` + 内层 `translateY(112%)→0`，逐行 .12s 递进）；CTA/背书行淡入上浮；
   - 花束后粉色光晕 7s 呼吸；vignette 四周收暗。
3. **导航**：滚动 40px 切 `.scrolled` 毛玻璃；链接 hover 下划线生长；移动端汉堡→墨绿全屏抽屉，链接 stagger 浮现。
4. **滚动 reveal**：`IntersectionObserver`（阈值 .12），同行卡片按 `data-d` 0/.12/.24s 递进；reveal 完成后清 `transition-delay`（否则 hover 被拖慢）。
5. **微交互**：价格卡/花束卡 hover 上浮 8–10px + 阴影漫开，花束插画微转 2.5°；加购钮点击变「已加入花篮」；故事卡 hover 微倾 -0.6°；滚动提示线循环下落。
6. **手工细节**：全页 SVG `feTurbulence` 纸纹（`multiply` 5%）；hero vignette；CTA 区角落花瓣水印；按钮 hover 上浮 + 深色阴影。

## 配置参数（`src/main.js` 顶部）

- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / address / phone / phoneHref / email / mailtoHref / hours / icp / year`。页脚电话/邮箱/地址/营业时间/备案行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + points` 数组，`[小标题, 正文]`），改文案只改这里。
- 花瓣粒子：数量 `Math.min(46, W/26)`，速度/尺寸/透明度在 `spawn()` 内调。
- 花束生成器：`bouquetSVG(seed, {stems, spread, bloom})`，换 `seed` 即换一束（本周花束卡用 seed 1–6）。

## 法务三件套（弹窗实现）+ SITE 配置变量

- 页脚「网站政策」区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）。
- 关闭三通道：右上 ✕、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为花艺店真实感中文通用条款（隐私 6 条 / 服务 6 条 / Cookie 5 条，覆盖枯萎包赔、配送迟到、订阅取消、首单半价规则），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/小红书/抖音，几何抽象线稿），hover 变粉底上浮。
- 备案/版权行：`© {year} {name} · 花开有时，准时送达 ｜ {icp}` 由 SITE 渲染，`icp` 默认为 `沪ICP备xxxxxxxxxx号-1` 占位。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲「每周一束花」一件事，动效只有飘落/绽放/升起/上浮，不堆砌。
2. **配色定死**：米白 `#FBF6EF` / 樱粉 `#F0A6BC` / 墨绿 `#1F3A2C` 三色全页统一（深浅变化只用同色系透明度），无彩虹渐变。
3. **字号字距层级**：大标题 `clamp(46px,6.4vw,88px)` 宋体 .06em 字距；眉题 13px .4em 字距；价格 52px 宋体；故事引言 21px 宋体 1.9 行高。
4. **文案真实感**：「厄瓜多尔粉玫瑰，温柔得不讲道理」「浴室挂一束，洗澡都香」「俗得真诚」。无 Lorem、无 emoji 符号列表（序号用 No.1–6 徽）。
5. **手工细节**：纸纹噪点、vignette、光晕呼吸、花瓣水印、养护卡片/枯萎包赔等行业黑话、汉字企业徽。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），光晕呼吸用 `ease-in-out` 往返；禁用 linear（除 loader 花徽自转）。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/各区块/弹窗/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL 配置 + 花瓣粒子 + 花束 SVG 生成器 + loader + 导航 + 汉堡 + reveal + 加购 + 法务弹窗（零依赖，不用 GSAP/three.js）
- 无 `vendor/` —— 本模板零外部依赖（花瓣用 canvas、花束用程序化 SVG，不需要三维库；此前验证过 GSAP 真品 72KB，但本模板纯 CSS/canvas 动效，不需要）

## 重建命令

```bash
cd ~/workspace/fx-lab/florist-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py florist-page
```

## 移动端说明

- `≤1020px`：hero 改单列（文案居中、花束缩小）；订阅/花束/故事/企业网格 2 列。
- `≤900px`：汉堡菜单（墨绿全屏抽屉，链接 stagger 浮现）；桌面导航隐藏。
- `≤640px`：全部单列；权益对比表隐藏（卡片已含权益）；法务弹窗全屏式；CTA 字号 `clamp` 自适应。
- 触屏无 hover，上浮只在可 hover 设备生效；`prefers-reduced-motion` 下粒子/绽放/呼吸全部静止直达终态。
- 渐进增强：无 JS 时所有内容直接可见（`.js` 类由脚本添加，隐藏态只在有 JS 时生效）；另有 `<noscript>` 兜底隐藏 loader。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` 全程监听，file:// 打开等待 6s）。
2. URL 扫描：成品 `index.html` 内零 `https` 外部 URL（仅 SVG data-URI 与 favicon 内的 `w3.org` 命名空间字面）；无 Google Fonts/picsum/unpkg/jsdelivr。
3. 截图：`shots/florist-page.png`（1280×800 hero）/ `shots/florist-page-mobile.png`（390×844）亲眼核对无裁切无乱码。
4. 隐藏元素完成态：hero 两行大字 transform 归零、`.bloom` opacity 全为 1、18 个 `.reveal` 滚动后全部 `.in`；loader 隐藏。
5. 法务弹窗：隐私/服务条款/Cookie 三个分别打开验证（标题 + 6/6/5 条要点 + 背景滚动锁定），关闭三通道（✕/遮罩/ESC）逐个验证通过；移动端弹窗全屏式。
6. SITE 渲染：页脚电话/邮箱/地址/营业时间/备案行均为变量渲染，改 `SITE` 即全改。
7. 文案：无 Lorem/emoji 列表；花名价格描述均为真实感中文短句。
8. 真 bug 记录：见下节。
