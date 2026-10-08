# 心屿 XINYU · 婚恋交友落地页模板

一家虚构婚恋交友平台「心屿」的完整落地页：暖白底 + 深珊瑚红点缀 + 墨黑文字，中文真实感文案。可交互的 profile 卡片堆叠 Hero（点心动/不感兴趣真实滑动），配对流程三步、功能亮点、成功故事墙、手机号表单 CTA，纯 CSS/SVG 程序化视觉，零外部依赖。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

**Hinge / Bumble（hinge.co / bumble.com）**——只学布局结构和交互编排，未复制其源码、文案、图片、商标。具体学到的 5 个布局点：

1. **卡片式 profile Hero**：Hinge 式档案卡片（头像区 + 姓名年龄 + 兴趣标签 + 开放式提问），本模板做成手机框内的可交互堆叠，点「心动」卡片右飞、点「不感兴趣」左飞，心动计数实时扣减。
2. **配对流程三步**：Bumble 式「三步讲清怎么玩」横排步骤卡，本模板配虚线连接线与数据小贴士（档案平均 214 字、配对后 7 日开聊率 83%）。
3. **深色功能亮点带**：整块墨黑反白区块放 4 个功能（真人三重认证 / 每天 5 位 / 语音先行 / 约会安全中心），语音条做成跳动均衡器 micro-visual。
4. **成功故事墙**：三栏故事卡（配对天数 + 引言 + 署名），顶部配纯 SVG 双剪影插画。
5. **下载 CTA + 页脚三件套**：手机号留资表单（校验+成功态）+ 双端扫码区；页脚隐私政策/服务条款/Cookie 弹窗 + 公司信息 SITE 变量 + 社交 SVG + 版权/备案行。

## 动效拆解

- **主视觉（整页唯一大动效）**：Hero 手机内 4 张档案卡片堆叠（z-index 排序错位旋转，禁用 preserve-3d 防 Chromium+blur 压平）。点心动/不感兴趣 → 卡片以 `cubic-bezier(.2,.9,.25,1.05)` 甩飞出屏 + 爱心迸发粒子，下一张升上来；4 张看完出现空态「明日 8 点上新」+ 重置按钮。心动按钮带 2.2s 心跳脉冲环。
- **Hero 入场编排**：loader（心跳）淡出后，badge → 标题（珊瑚下划线描画）→ 副标题 → 双 CTA → 备注 → 数据滚动（easeOutCubic 计数）→ 手机，按 `data-d` 阶梯点亮，`cubic-bezier(.16,.84,.3,1)` 快起慢收。
- **滚动 reveal**：IntersectionObserver（threshold 0.14）加 `.is-in`，`data-d` stagger 0.12s；4 秒安全网兜底 IO 漏报；`prefers-reduced-motion` 直接全显。
- **微交互**：按钮 hover 上浮 2px + 阴影（spring 曲线），步骤卡/故事卡 hover 上浮；导航滚动 24px 后透明→毛玻璃；CTA 区 14 颗爱心缓缓上升（linear 仅用于无限循环位移，主交互一律物理 easing）。
- **手工质感**：全页 SVG 噪点 + hero/深色区 radial 暗角 vignette；标题用宋体 serif 营造编辑感，与正文黑体形成层级。

## 配置参数

- **换品牌**：`src/main.js` 顶部 `const SITE = { name, phone, email, address, icp }`，页脚联系方式、版权行、`tel:`/`mailto:` 链接自动渲染。
- **换配色**：`styles.css` 顶部 `:root` 三个变量 `--cream` / `--coral` / `--ink`，全页深浅走透明度，一处即换。
- **换文案**：直接改 `index.src.html` 中文，改完重跑构建（见下）。
- **改推荐额度**：`src/main.js` 卡片逻辑段 `likesLeft = 5`；改档案卡：`.pcard` 文章块复制一份，SVG 头像换色即可。
- **法务文案**：三篇通用条款直接写在 `index.src.html` 底部三个 `.modal` 里，按真实产品替换。

## SITE 配置变量（一改全改）

`src/main.js` 顶部 `const SITE = { name:'心屿', phone:'400-880-6666', email:'hello@xinyu.love', address:'上海市长宁区延安西路 889 号 12 层', icp:'沪ICP备2026000000号-1' }`：

- 页脚联系方式（电话/邮箱/地址）与底部版权行（`© 2026 <name>` / `<icp>`）凡带 `data-site="phone|email|address|name|icp"` 的元素，JS 启动时统一渲染（含 `tel:`/`mailto:` 自动生成）。
- 买家上线：只改 SITE 五个值 + 三篇法务文案，即完成品牌替换。

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只有一个主视觉动效（卡片堆叠），其余区块只做 reveal + hover 微交互；CTA 上升爱心是氛围，不抢戏。
2. **配色**：暖白 #FFF8F1 / 深珊瑚红 #D43F4C / 墨黑 #1C1512 三色定死，无渐变色带、无彩虹；深色区块用纯墨黑反白。
3. **字体层级**：大标题宋体 serif（字号 clamp 40–68px、字距 .05em、行高 1.32 有呼吸感），正文黑体，kicker 小字距 .32em 全大写英文点缀。
4. **真实文案**：无 Lorem ipsum、无 emoji 列表；「凌晨四点的佘山，看城市醒来」「800 公里，视频了三个月」等具体短句；表单报错说人话（「这个手机号好像少了几位」）。
5. **手工细节**：SVG 噪点 overlay、双 vignette、加载心跳、按钮 spring easing、语音均衡器、二维码 hover 微转、故事卡 hover 轻微旋转。
6. **物理 easing**：交互一律 `cubic-bezier` 快起慢收 / 回弹，禁用默认 linear（无限循环的爱心上升除外）。

## 源码结构

```
dating-page/
├── index.src.html   # 源码 HTML（改这里，重跑构建）
├── index.html       # 成品单文件（fx-singlefile.py 一次性打包生成，勿二次打包）
├── styles.css       # 全站样式（:root 换色）
├── src/main.js      # 交互逻辑（SITE 配置 + 卡片堆叠 + 表单 + 弹窗）
├── vendor/          # 空（本模板零依赖，无需任何库）
└── README.md        # 本文件
```

## 重建方式

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py dating-page
```

打包器把 `styles.css` 与 `src/main.js` 内联为单文件 `index.html`。**一次性单向**：改源码后重建一律从 `index.src.html` 复制覆盖再打包，禁止对已打包的 `index.html` 重复跑。

验收（构建员自检清单）：

```bash
# 1. console 零错误（CDP 抓 6 秒）
# 2. 零外部请求
grep -o 'https\?://[^"'\'' >]*' index.html | grep -v 'www.w3.org' | sort -u
# 3. reveal 全亮：滚动到底后 .reveal:not(.is-in) 计数为 0（CDP evaluate）
# 4. 截图
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file:///home/hatch/workspace/fx-lab/dating-page/index.html \
  ~/workspace/fx-lab/shots/dating-page.png 1280 800 0
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file:///home/hatch/workspace/fx-lab/dating-page/index.html \
  ~/workspace/fx-lab/shots/dating-page-mobile.png 390 844 1
```

## 移动端说明

- ≤760px：导航收起为汉堡抽屉（右滑入 + 遮罩，点击遮罩/链接/ESC 关闭）；Hero 改单列，手机舞台居中；步骤/功能/故事全部单列；表单改为纵向（输入框 + 全宽按钮）；页脚四栏变单列。
- 触摸：卡片堆叠按钮 ≥62px 触摸区；弹窗全屏化（92vw）；`overflow-x:hidden` 防横滑。
- 性能：零外部请求、零第三方库，首屏只有 CSS+SVG；`prefers-reduced-motion` 下关闭脉冲/上升/视差类动效。
