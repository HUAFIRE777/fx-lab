# 云汀度假酒店 · 酒店民宿官网首页模板（hotel-page）

滨湖度假酒店官网首页模板 —— 夜湖 hero + 预订引擎条 + 三档房型卡 + 设施画廊 + 住客评价 + 交通 + 会员领券 CTA + 法务三件套页脚，商用级，可直接改字上线。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

参考类型：万豪 / 洲际系酒店官网。学到的布局点：

1. **顶部预订引擎条**：入住日期 / 离店日期 / 房型选择 / 查询按钮四件套，直接放在 hero 里当第一交互；查询后给成功态（日期区间 + 房型 + 晚数 + 总价 + 致电锁定会员价）。
2. **房型三档卡片**：湖景大床 / 行政套房 / 独栋别墅三档，卡片 = 程序化视觉 + 价格 + 设施标签 + 规格行 + 预订按钮；"预订此房型"把房型回填进顶部引擎并滚回去。
3. **设施画廊**：泳池 / 餐厅 / SPA / 亲子四项图文卡，hover 视觉微放大。
4. **住客评价**：总分（4.9 分 · 2,314 条）+ 三条短评（星级 + 引用 + 人群标签 + 月份署名）。
5. **导航**：左 logo、中菜单（房型/设施/住客评价/交通）、右"立即预订" CTA；滚动后透明→毛玻璃。
6. **页脚法务三件套**：隐私政策 / 服务条款 / Cookie 政策弹窗 + 酒店信息 + 社交图标 + 版权行。

## 动效拆解

1. **加载态**：全屏深蓝 loader（波纹 logo + 沙金进度条），`window.load` 后最短 700ms 淡出再触发 hero 入场；4s 兜底必定消失。
2. **hero 主视觉**：Canvas 程序化夜湖 —— 远山剪影 + 月亮光晕 + 月影碎金（随时间抖动）+ 四层错峰正弦波纹（金/蓝交错）+ 两团漂移薄雾；离视口自动暂停，`prefers-reduced-motion` 下只画一帧静态。
3. **hero 入场**：眉题/大标题/副标题/预订条逐行 stagger 上浮（`cubic-bezier(.19,1,.22,1)`，.05/.18/.34/.46/.58s）。
4. **导航**：滚动 40px 切换 `.scrolled` 深蓝毛玻璃（`backdrop-filter: blur`）；链接 hover 沙金下划线生长。
5. **滚动 reveal**：`IntersectionObserver`（阈值 .12）给 `[data-reveal]` 加 `.in`，房型/设施/评价 stagger 递进上浮；隐藏态只在 `html.js` 下生效，无 JS 时内容直接可见。
6. **卡片 hover**：房型卡上浮 10px + 阴影漫开 + 视觉 SVG 放大；设施卡视觉旋转 1.5° 放大；评价卡上浮；按钮上浮 + 沙金阴影（均只在可 hover 设备生效）。
7. **手工细节**：全页 SVG `feTurbulence` 纸纹噪点（5%）；hero 顶部/底部 vignette；滚动提示线循环下落；CTA 区顶部沙金径向光。

## 配置参数（`src/main.js` 顶部）

- `CFG.navOffset = 40` —— 导航毛玻璃触发距离（px）。
- `CFG.revealThreshold = 0.12` —— 滚动 reveal 触发阈值。
- `CFG.loaderMin = 700` / `CFG.loaderMax = 4000` —— 加载态最短展示 / 兜底上限（ms）。
- `SITE` —— 站点信息变量（**买家改这里，一改全改**）：`name / phone / phoneHref / address / icp / year`。页脚与正文电话/地址/备案行均由 `data-site` / `data-site-href` 属性自动渲染。
- `LEGAL` —— 法务三件套文案对象（`privacy / terms / cookies`，每篇 `title + sections` 数组），改文案只改这里。
- 预订引擎价格表：`PRICE` 对象（湖景大床房 1288 / 行政套房 2388 / 独栋别墅 5888），改价只改这里。

## 法务三件套（弹窗实现）+ SITE 配置变量

- 页脚"网站政策"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，点击弹模态弹窗（单弹窗壳 + JS 按 key 灌文案）。
- 关闭三通道：右上 ×、点击遮罩、ESC；打开时 `body overflow:hidden` 锁定背景滚动；焦点自动进关闭钮，关闭后回到原焦点。
- 移动端（≤640px）弹窗为全屏式（无圆角、撑满视口）。
- 三篇文案均为真实感中文通用条款（隐私 5 节 / 服务 5 节 / Cookie 3 节，覆盖预订取消、信息保存、Cookie 用途等），无 Lorem。
- 社交媒体图标：inline SVG 四枚（微信/微博/小红书/抖音，几何抽象线稿），hover 变沙金上浮。
- 备案/版权行：`© {year} {name} · {icp}` 由 SITE 渲染。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"夜湖"一个氛围，动效只有波纹/升起/上浮三板斧，不堆砌。
2. **配色定死**：深海蓝 `#0C2340` / 沙金 `#C8A96A` / 纯白 `#FFFFFF` 三色全页统一（分区 tint 均为沙金低透明叠加，无第四色），无彩虹渐变。
3. **字号字距层级**：店名 `clamp(58px,11vw,124px)` 宋体 .14em 字距；眉题 13px .42em 字距；房价 32px 宋体；评价引用 17.5px 宋体。
4. **文案真实感**："推开窗，湖面比床先醒""当天的鱼，不隔夜""按完这一个钟，肩膀会谢你""孩子放电，大人充电"。无 Lorem、无 emoji 符号列表（星级/图标全用 inline SVG）。
5. **手工细节**：纸纹噪点、vignette、月影碎金、滚动提示线、加载态品牌进度条、房型徽章（最受欢迎/仅 6 栋）。
6. **easing**：统一 `cubic-bezier(.19,1,.22,1)`（快出慢收物理感），波纹用正弦时间函数自然错峰。

## 源码结构

- `index.src.html` —— 开发源码（`<link href="styles.css">` + `<script src="src/main.js">` classic 引入）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止二次打包**，改源码后重新 `cp` 再跑）
- `styles.css` —— 全部样式（变量/导航/hero/各区块/弹窗/响应式）
- `src/main.js` —— classic 脚本：SITE/LEGAL 配置 + loader + 导航 + 抽屉 + reveal + 夜湖 Canvas + 预订引擎 + 领券 + 法务弹窗（无依赖，不用 GSAP/three.js）
- 无 `vendor/` —— 本模板零外部依赖、零外部 URL（唯一 `http` 字面是 SVG data-URI 内的 `w3.org` 命名空间标识，不产生网络请求）

## 重建命令

```bash
cd ~/workspace/fx-lab/hotel-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py hotel-page
```

## 移动端说明

- `≤900px`：汉堡菜单（全屏深蓝 overlay，链接 stagger 浮现）；房型/设施/评价/页脚全部单列；预订条 2 列。
- `≤640px`：预订条单列全宽；法务弹窗全屏式；CTA 表单纵排；hero 字号 `clamp` 自适应。
- 触屏无 hover，卡片上浮只在可 hover 设备生效；夜湖动画在 `prefers-reduced-motion` 下静止为单帧。
- 渐进增强：无 JS 时所有内容直接可见（`.js` 类由脚本添加，隐藏态只在有 JS 时生效）。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（CDP `Runtime.consoleAPICalled` + `exceptionThrown` + `Log.entryAdded` 全程监听，含滚动/弹窗开合全路径）。
2. URL 扫描：零外部 URL（仅 SVG data-URI 内的 `w3.org` 命名空间字面）；无 picsum/CDN/Google Fonts。
3. 状态断言：loader 消失 ✓ / hero 入场 ✓ / 21 个 reveal 终态全部可达 ✓ / 法务弹窗开合 ✓ / SITE 电话渲染 ✓ / Canvas 有像素 ✓。
4. 截图：`shots/hotel-page.png`（1280×800 hero 夜湖）/ `shots/hotel-page-mobile.png`（390×844）/ 另有房型区与评价区滚动截图亲眼核对（/tmp 临时），无裁切无乱码。
