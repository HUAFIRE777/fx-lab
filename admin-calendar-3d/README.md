# admin-calendar-3d · 3D 翻转月历日程

Cron（Notion Calendar）式深色日程模板：整张月历是一张 3D 卡片，切换月份时翻转 180°；日期格悬停浮起；事件点按类型着色；点击日期右侧滑出当日日程。纯 CSS 3D + 原生 JS，零第三方库。所有代码原创手写，可直接卖。

`huafire3d fx-lab — original implementation`

## 参考来源与复现手法

参考了 **Cron / Notion Calendar 的排期美学**（深蓝灰底色、青色强调、日期格点阵、右侧日程抽屉）。**没有下载或复制任何一方源码**，以下手法均为独立实现的原创代码：

1. **双面卡片翻月** — 月历是 preserve-3d 双面卡（正/背面 `backface-visibility: hidden`），切月时新月份先渲染到背面，整卡 rotateY 翻 180°（cubic-bezier(.16,1,.3,1)，0.72s），翻完把背面内容搬回正面、瞬时复位（`main.js: flipTo()`）
2. **日期格 hover 浮起** — 格子在 preserve-3d 网格里 `translateZ(18px)` 上浮 + 青色光晕阴影，有真实纵深（CSS `.cell:hover`）
3. **事件点三色点阵** — 会议青实心 / 个人白 / 提醒灰，每格最多 3 点，类型一目了然（`main.js: renderFace()`）
4. **日程抽屉滑入** — 点日期右侧面板滑出，当日事件按时间排序、stagger 滑入；空日子给一句"享受难得的空闲吧"（`main.js: openDrawer()`）
5. **跨月格直达** — 灰色跨月日期可点，点即翻到对应月份并选中（`main.js: selectDate()`）
6. **演示数据自洽** — 日程围绕"今天"种子生成（hash 确定性），今天/明天固定有内容，刷新不穿帮（`main.js: seed()`）

## 参数（`src/main.js` 顶部）

换数据只改这几处，整页跟着变：

| 段 | 说明 |
|---|---|
| `POOL` | 日程模板池：[类型, 标题, 时间]，真实感中文短句 |
| `seed()` 锚点 | 今天/明天固定日程（产品周例会 / Q4 评审会…），演示必有内容 |
| `TYPE_LABEL` | 三类标签文案（会议/个人/提醒） |
| `flipTo()` | 翻转时长 0.72s、easing、transitionend 兜底 900ms |

## 质量自查（六项铁律）

- ① 克制：整页只讲一个核心动效（月历 3D 翻转），浮起/抽屉都是配角
- ② 配色：锁死深蓝灰 #10141c + 青 #57d0ff + 白，事件点用青/白/灰三档明度区分，无彩虹渐变
- ③ 字体：系统字体栈，日期数字 tabular-nums，星期标签字距 .4em，大标题"10 月"留白
- ④ 文案：真实中文日程（"Q4 评审会""和投资人喝咖啡""牙医预约"），无 Lorem ipsum、无 emoji 列表
- ⑤ 手工细节：vignette 暗角 + SVG 噪点、加载态（转圈+进度语）、今天日期青色辉光、格子入场 stagger
- ⑥ easing：全站 cubic-bezier(.16,1,.3,1)，翻转/滑入/浮起一致，无 linear

## 构建与验证

```bash
# 开发：直接用 file 打开 index.template.html（纯原生，无需构建）
# 打包单文件（一次性，不可重复跑；改源码后先 cp 再打包）：
cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py admin-calendar-3d
```

- 单文件约 21KB，零外部依赖（无 Three.js、无 CDN），断网双击可开
- 已验证：桌面端渲染正常、console 零报错、翻月/选日/抽屉链路完整；移动端（≤860px）侧栏隐藏、日历全宽、抽屉改底部半屏；`prefers-reduced-motion` 下翻转为瞬时切换
- 文件：`index.html`（单文件成品）+ `index.template.html`（开发模板）+ `src/main.js`
