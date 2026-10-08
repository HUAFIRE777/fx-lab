# scriptmurder-page — 谜屿 MYSTERY ISLE · 剧本杀馆整站

沉浸式剧本杀馆「谜屿 MYSTERY ISLE」的整站落地页：钥匙孔微光 hero（雾效画布 + 打字机悬疑文案）/ 剧本题材 tab 筛选矩阵 / DM 主持人墙 / 玩家评价 / 组局预约四步表单（日期/场次/剧本/人数/联系方式）/ 开业拼团 CTA / 页脚法务三件套弹窗，全响应式，零 JS 库依赖（原生 JS），零外部请求，单文件即发即用。

`huafire3d fx-lab — original implementation`

## 参考站点及布局点

**头部剧本杀馆 / 密室逃脱品牌官网的公开页面编排**：只学了布局结构，文案配色代码全部原创。

学到的布局点（实现均为原创代码）：
① 悬疑氛围 hero（钥匙孔主视觉 + 打字机文案 + 双 CTA，对应剧本杀站「氛围先行」开场的编排逻辑）
② 剧本矩阵 tab 筛选（全部/悬疑/情感/机制/恐怖，对应剧本杀站「按题材选本」的筛选编排）
③ DM 主持人墙（对应剧本杀站「DM 是核心资产」的人物陈列逻辑）
④ 玩家评价（对应剧本杀站「口碑信任」区的评价陈列逻辑）
⑤ 组局预约四步表单（选日期→选场次→选剧本与人数→留联系方式，对应剧本杀站核心转化入口的步骤式编排）
⑥ 开业拼团 CTA（4 人同行 1 人免单 / 学生证 8 折 / 首单立减 30，对应剧本杀站「新店获客」的拼团编排）

## 动效拆解

整页只有一个核心动效：**hero 迷雾钥匙孔**，其余为入场/反馈类微动效。

- **hero 主视觉（迷雾画布 + 钥匙孔微光）**：canvas 程序化雾团缓慢漂移（无外部资源）；钥匙孔 SVG 微光跟随鼠标（`mousemove` 视差，46×36px 范围，克制）；打字机逐字打出悬疑文案（95ms/字，`prefers-reduced-motion` 下直接显示全文）。
- **标题入场**：loader 结束后大标题淡入上滑；隐藏等 JS 模式，完成态选择器带 `html.js` 前缀，3s 保底。
- **滚动 reveal**：IntersectionObserver（threshold .12，rootMargin 底部 -6%），`opacity 0→1 + y 30→0`，`data-delay` 做 stagger；4 秒安全网兜底；tab 筛选切换时手动重触发入场（先清 transform 防位移坑）。
- **剧本 tab 筛选**：题材 tab 切换，卡片 `hide` 类过滤 + 重新入场动画。
- **卡片 hover**：上浮 + 暗金描边提亮；DM 卡头像光晕；按钮 hover 加深。
- **加载态**：钥匙孔呼吸 loader（"正在推开谜屿的门…"），load 后 450ms 退场 + 3s 兜底。
- **手工细节**：雾效画布、打字机光标、钥匙孔微光跟随、表单逐字段校验 + 手机号正则、提交后"锁定这局"成功态、抽屉/弹窗 ESC 关闭。
- **easing**：CSS 自定义 `--ease`（cubic-bezier 物理感），禁用 linear；`prefers-reduced-motion` 直接降级（reveal/打字机/动画全关）。

## 配置参数

`src/main.js` 顶部 `SITE` 对象，换主体只改这里：

| 字段 | 说明 |
|---|---|
| `name` / `en` | 品牌中文 / 英文（谜屿剧本杀馆 / MYSTERY ISLE） |
| `phone` | 电话（页脚注入） |
| `address` | 地址（页脚注入） |
| `hours` | 营业时间（页脚注入） |
| `wechat` | 微信号（页脚注入） |
| `icp` | 备案号（页脚备案行） |

法务三件套为页脚 `data-modal="mPrivacy/mTerms/mCookie"` 三个独立弹窗壳（隐私政策 / 服务条款 / Cookie 政策），文案在 HTML 弹窗体内，含未成年人参与合规提示（恐怖主题建议 16 岁以上）。

## 「看起来不像 AI 写的」六项自查

① **克制**：整页只讲一个核心动效（hero 迷雾钥匙孔），其他区块只有 reveal + hover 微交互，不堆砌。
② **配色**：全页 3 色定死——暗紫黑 `#14101c`、米白 `#efe9dc`、暗金 `#c9a24b`（无彩虹渐变）。
③ **字体**：大标题宋体 serif 营造悬疑刊物感，字号 clamp 层级（hero 56–96px / 区块 34–52px / 卡片 18–24px），kicker 小字 tracking .35em，大标题字距疏朗有呼吸感；正文字距行高 1.7。
④ **文案**：中文真实感短句（"有些秘密，只敢在灯灭之后说出口。"、"本可以随便玩，DM 不能随便选。"），无 Lorem ipsum、无 emoji 符号列表；难度用 ★ 符号、列表用 CSS 圆点。
⑤ **手工细节**：雾效画布 + 噪点 + 打字机 + 钥匙孔微光跟随 + tab 筛选重入场 + 预约四步表单 + 成功态。
⑥ **easing**：全部物理感 cubic-bezier / ease-in-out，无 linear；雾团漂移缓慢往返模拟真实雾气。

## 源码结构

```
scriptmurder-page/
├── index.src.html    # 源码 HTML（打包入口，含三法务弹窗体）
├── styles.css        # 全部样式（CSS 变量定主题色）
├── src/
│   └── main.js       # 交互逻辑（SITE 配置 / 雾效 / 打字机 / tab / 表单 / 弹窗 / 抽屉 / reveal）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

无 `vendor/` 目录：本模板零 JS 库依赖（canvas + 原生 JS），无空壳文件。

## 重建方式

改完 `index.src.html` / `styles.css` / `src/main.js` 后，从源码重新打包（一次性单向打包器，禁止对已打包的 `index.html` 重复跑）：

```bash
cd ~/workspace/fx-lab/scriptmurder-page
# 先改源码；改 JS 后建议先 node --check src/main.js
cp index.src.html index.html            # 从源码复制，禁止直接改已打包的 index.html
python3 ~/workspace/bin/fx-singlefile.py scriptmurder-page   # 单向打包，CSS/JS 全内联
```

产物为 `~/workspace/fx-lab/scriptmurder-page/index.html`，单文件双击即看，零外部请求。

## 移动端说明

- ≤700px：汉堡抽屉导航（右侧滑入，遮罩/×/链接/ESC 四通道关闭；抽屉打开时汉堡被遮罩盖住，属正常层叠设计）、hero 字号 clamp 自适应、剧本矩阵单列、DM 墙 2 列、评价单列、预约表单单列、拼团三卡单列。
- 抽屉打开时 body 锁定滚动；CSS `scroll-behavior` 仅在 `prefers-reduced-motion` 外生效（验收时在测试副本里关闭）。
- 截图：`~/workspace/fx-lab/shots/scriptmurder-page.png`（1280×800）与 `shots/scriptmurder-page-mobile.png`（390×844）。
