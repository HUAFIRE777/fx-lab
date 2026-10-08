# campgear-page — 野宿 FIELDSTAY · 露营装备整站

露营装备品牌「野宿 FIELDSTAY」的整站落地页：星空帐篷 hero（SVG 山影 + 程序化星点）/ 装备四分类 / 营地指南三卡 / 租赁三档（先租后买）/ 玩家故事墙 / 首单立减 CTA（手机号领取优惠）/ 页脚法务三件套弹窗，全响应式，零 JS 库依赖（原生 JS），零外部请求，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点

**Snow Peak / Coleman 类户外装备品牌官网的公开页面编排**：只学了布局结构，文案配色代码全部原创。

学到的布局点（实现均为原创代码）：
① 星空夜营 hero（大标题 + 双 CTA + 山影帐篷主视觉，对应户外站「向往感开场」的编排逻辑）
② 装备四分类（帐篷/睡眠/炊具/灯具，对应户外站「按场景选装备」的分类编排）
③ 营地指南三卡（月亮湖/黑松林/云海垭口，对应户外站「目的地种草」的内容编排）
④ 租赁三档（体验装/周末装/整季会员，中间档高亮主推，对应户外站「先租后买降低门槛」的定价编排）
⑤ 玩家故事墙（对应户外站「真实玩家」口碑编排）
⑥ 首单立减 CTA + 手机号表单（对应户外站核心转化入口的编排）

## 动效拆解

整页只有一个核心动效：**hero 星空夜营**，其余为入场/反馈类微动效。

- **hero 主视觉（星空 + 山影）**：SVG 分层夜空——星点闪烁（CSS animation，随机延时）、三层山影剪影、帐篷暖光呼吸（`ease-in-out` alternate）。克制：只此一处大动效。
- **标题逐行升起**：`.hl-line translateY(112%)→0`（CSS transition，物理感 easing，第二行延迟 .14s）；隐藏等 JS 模式，完成态选择器带 `html.js` 前缀（`html.js .hero.in .hl-line`），双 rAF 加 `.in`，完成态永远可达。
- **滚动 reveal**：IntersectionObserver（threshold .14），`opacity 0→1 + y 28→0`，`data-d` 做 stagger 延迟；3.5 秒安全网兜底。
- **数字滚动**：合作营地/注册玩家/好评率三数字， entering 视口后 `easeOutCubic` 1.4s 滚动到目标值。
- **卡片 hover**：上浮 + 阴影加深 + 描边提亮（.45s 同一 easing）；租赁主推卡赭石描边 + "最多人选"徽章；导航链接下划线从左展开。
- **加载态**：深绿品牌 loader（帐篷线稿 SVG + "正在搭帐篷…" + 进度条），load 后 500ms 退场 + 3s 兜底。
- **手工细节**：SVG feTurbulence 全页噪点、hero 底部 vignette、表单 focus 赭石光环、按钮 active 缩放、抽屉/弹窗 ESC 关闭。
- **easing**：全部 `cubic-bezier` 物理感 / `ease-in-out` / `easeOutCubic`，禁用 linear；`prefers-reduced-motion` 降级。

## 配置参数

`src/main.js` 顶部 `SITE` / `LEGAL` 两个对象，换主体只改这里：

| 变量 | 说明 |
|---|---|
| `SITE.name / brand / address / phone / phoneHref / email / emailHref / hours` | 公司全称、品牌名、地址、电话（含 tel: 链接）、邮箱（含 mailto:）、客服时间 |
| `LEGAL.privacy / terms / cookies` | 法务三文档的标题 + 条款数组，改文案只动这里 |

## 「看起来不像 AI 写的」六项自查

① **克制**：整页只讲一个核心动效（hero 星空夜营），其他区块只有 reveal + hover 微交互，不堆砌。
② **配色**：全页 3 色定死——深墨绿 `#0e1a14`、米白 `#f5f0e6`、赭石 `#c67c3c`（另有同色系深浅做层次，无彩虹渐变）。
③ **字体**：大标题粗黑体字号 clamp 层级（hero 48–88px / 区块 32–48px / 卡片 20–24px），kicker 小字 tracking .3em，大标题 `line-height:1.25` 有呼吸感；正文字距行高 1.7。
④ **文案**：中文真实感短句（"今晚，住进星空里。"、"四样东西，装下整个山野"、"只发券，不打扰。退订随时。"），无 Lorem ipsum、无 emoji 符号列表；评分用 SVG 星，列表用 CSS 对勾。
⑤ **手工细节**：噪点 + vignette + 星空闪烁 + 帐篷暖光呼吸 + 数字滚动 + focus 光环 + 主推卡徽章。
⑥ **easing**：全部物理感 cubic-bezier / ease-in-out / easeOutCubic，无 linear；帐篷暖光用 alternate 往返模拟真实呼吸感。

## 源码结构

```
campgear-page/
├── index.src.html    # 源码 HTML（打包入口）
├── styles.css        # 全部样式（CSS 变量定主题色）
├── src/
│   └── main.js       # 交互逻辑（SITE / LEGAL 配置 / 弹窗 / 表单 / reveal / 计数器）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

无 `vendor/` 目录：本模板零 JS 库依赖（纯 CSS 动画 + 原生 JS），无空壳文件。

## 重建方式

改完 `index.src.html` / `styles.css` / `src/main.js` 后，从源码重新打包（一次性单向打包器，禁止对已打包的 `index.html` 重复跑）：

```bash
cd ~/workspace/fx-lab/campgear-page
# 先改源码；改 JS 后建议先 node --check src/main.js
cp index.src.html index.html            # 从源码复制，禁止直接改已打包的 index.html
python3 ~/workspace/bin/fx-singlefile.py campgear-page   # 单向打包，CSS/JS 全内联
```

产物为 `~/workspace/fx-lab/campgear-page/index.html`，单文件双击即看，零外部请求。

## 移动端说明

- ≤700px：汉堡抽屉导航（遮罩可点关闭、ESC 可关、点链接自动关）、hero 字号 clamp 自适应、装备四卡/营地三卡/租赁三档/故事墙全部单列、CTA 表单单列、页脚单列。
- 抽屉打开时 body 锁定滚动；CSS 不写 `scroll-behavior:smooth`（方便自动化验收滚动）。
- 截图：`~/workspace/fx-lab/shots/campgear-page.png`（1280×800）与 `shots/campgear-page-mobile.png`（390×844）。
