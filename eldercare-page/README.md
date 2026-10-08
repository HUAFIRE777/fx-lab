# 颐乐 EVERJOY · 高端养老社区落地页模板

一套商用级高端养老社区落地页模板（虚构品牌「颐乐 EVERJOY」）：透明→毛玻璃导航 / 晨光社区剪影 hero（SVG 云影漂移）/ 照护等级三档对比（自理颐养 / 协助照护 / 记忆照护）/ 纯 SVG 社区环境四宫格 / 入住流程四步 / 家属评价墙 / 预约参观表单（手机号校验 + 成功态）/ 页脚法务三件套弹窗，全响应式，零外部依赖，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考来源（只学布局结构与交互编排，文案/图片/商标全部原创）

**Brookdale Senior Living 类养老社区官网的公开页面编排**：只学了布局结构，代码全部原创重写。

学到的布局点（实现均为原创代码）：
① 温暖社区 hero（大标题 + 双 CTA + 社区实景感主视觉，对应养老站「社区第一印象」区的编排逻辑）
② 照护等级三档（自理 / 协助 / 记忆照护，中间档高亮主推，对应养老站「按需选照护」的三档锚定编排）
③ 社区环境画廊（花园 / 餐厅 / 活动 / 步道四宫格，对应养老站「社区生活」区的场景陈列逻辑）
④ 入住流程四步（参观→评估→方案→入住，对应养老站「降低决策门槛」的步骤式呈现）
⑤ 家属评价墙（对应养老站「口碑信任」区的评价陈列逻辑）
⑥ 预约参观表单（对应养老站核心转化入口的表单编排）

## 动效拆解

整页只有一个核心动效：**hero 晨光社区剪影**，其余为入场/反馈类微动效。

- **hero 主视觉（晨光 + 云影漂移）**：纯 SVG 分层场景——晨光渐变天空、太阳光晕 11s 缓慢呼吸（ease-in-out alternate）、三层云 64–92s 缓慢横向漂移（ease-in-out infinite alternate，物理感加速减速）、两团地面云影反向漂移、飞鸟轻微浮动。克制：只此一处大动效。
- **标题逐行升起**：`.h-line-inner translateY(112%)→none`（CSS transition，`cubic-bezier(.22,1,.36,1)` 1.05s，第二行延迟 .14s）；隐藏等 JS 模式，完成态选择器带 `html.js` 前缀（`html.js .hero.is-in .h-line-inner{transform:none}`），首屏 veil 退场后双 rAF 加类，完成态永远可达。
- **滚动 reveal**：IntersectionObserver（threshold .12），`opacity 0→1 + y 30→0`，同行卡片按 `--d` stagger；3 秒兜底强制全部 `.is-in`。
- **卡片 hover**：上浮 6–10px + 阴影加深 + 环境卡 SVG 轻微放大（.45–.6s 同一 easing）；步骤数字悬停放大旋转；导航链接下划线从左展开；按钮 active 缩放 .96。
- **加载态**：暖米色品牌幕布（veil：赭石圆点呼吸 + 「颐乐」字，load 后 350ms 退场 + 2.6s 兜底）。
- **手工细节**：SVG feTurbulence 全页噪点（opacity .05，data:URI 内联）、hero 底部 vignette、表单 focus 赭石光环 + 报错抖动、主推卡赭石描边 + 徽章、评价卡悬停微旋转、抽屉/弹窗 ESC 关闭。
- **easing**：全部 `cubic-bezier(.22,1,.36,1)` / `ease-in-out`，禁用 linear；`prefers-reduced-motion` 直接降级（reveal/标题/动画全关）。

## 配置参数

`src/main.js` 顶部 `SITE` 对象，换主体只改这里：

| 字段 | 说明 |
|---|---|
| `brand` / `brandEn` | 品牌中文 / 英文（颐乐 / EVERJOY） |
| `organizer` | 公司全称（页脚版权行） |
| `phone` / `phoneHref` | 展示电话 / tel: 链接用号码 |
| `address` / `email` | 地址 / 邮箱（页脚注入） |
| `icp` | 备案号（页脚备案占位行） |

法务三件套文案在 `LEGAL` 对象（privacy / terms / cookie），含养老场景条款（信息删除、合规声明：不做医疗疗效承诺）。

## 「看起来不像 AI 写的」六项自查

① **克制**：整页只讲一个核心动效（hero 晨光云影），其他区块只有 reveal + hover 微交互，不堆砌。
② **配色**：全页 3 色定死——暖米 `#f7f2e8`、深青 `#23403a`、赭石 `#c98a4b`（另有同色系浅 tint 做层次，无彩虹渐变）。
③ **字体**：标题用宋体系 serif（`Songti SC / STSong`），字号 clamp 层级（hero 42–84px / 区块 30–46px / 卡片 20–26px），大标题 `letter-spacing:.06em + line-height:1.28` 有呼吸感；正文字距行高 1.7。
④ **文案**：中文真实感短句（"三餐有人做，生病有人管，每天都有人陪着说话"），无 Lorem ipsum、无 emoji 符号列表；星级用 SVG，列表用 CSS 圆点/对勾 SVG。
⑤ **手工细节**：噪点 + vignette + 加载幕布 + focus 光环 + 报错抖动 + 评价卡悬停微旋转 + 步骤数字悬停效果。
⑥ **easing**：全部物理感 cubic-bezier / ease-in-out，无 linear；云影漂移用 alternate 往返模拟真实气流感。

## 源码结构

```
eldercare-page/
├── index.src.html   # 源码 HTML（打包入口）
├── styles.css       # 全部样式
├── src/
│   └── main.js      # 交互逻辑（SITE 配置 / 弹窗 / 表单 / reveal）
├── index.html       # 打包产物（单文件，fx-singlefile.py 生成，勿手改）
└── README.md
```

无 `vendor/` 目录：本模板零 JS 库依赖（纯 CSS 动画 + 原生 JS），无空壳文件。

## 重建方式

改完 `index.src.html` / `styles.css` / `src/main.js` 后，从源码重新打包（一次性单向打包器，禁止对已打包的 `index.html` 重复跑）：

```bash
cd ~/workspace/fx-lab/eldercare-page
# 改源码三件套：index.src.html / styles.css / src/main.js
cp index.src.html index.html            # 从源码复制，禁止直接改已打包的 index.html
python3 ~/workspace/bin/fx-singlefile.py eldercare-page   # 单向打包，CSS/JS 全内联
```

打包器为一次性单向：禁止对已打包的 `index.html` 重复跑。永远从 `index.src.html` 重新复制再打包。

产物为 `~/workspace/fx-lab/eldercare-page/index.html`，单文件双击即看，零外部请求。

## 移动端说明

- ≤700px：汉堡抽屉导航（毛玻璃遮罩外可点关闭区域为抽屉外整屏，ESC 可关）、hero 字号 clamp 自适应、三档/四宫格/评价墙/流程全部单列、表单字段单列、CTA 两栏变一栏。
- 抽屉打开时 body 锁定滚动；锚点跳转走 JS `scrollIntoView({behavior:'smooth'})`（CSS 不写 `scroll-behavior`，方便自动化验收滚动）。
- 截图：`~/workspace/fx-lab/shots/eldercare-page.png`（1280×800）与 `shots/eldercare-page-mobile.png`（390×844）。
