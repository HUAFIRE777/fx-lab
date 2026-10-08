# 浪里 WAVELANE · 恒温室内游泳馆官网首页模板（swim-page）

恒温室内游泳馆「浪里 WAVELANE」官网首页单文件模板：深海蓝底 + 青色点缀，
hero 气泡粒子 + 波浪分隔线，课程表三档 tab（少儿/成人/私教）、教练墙、
票卡三档（次卡/月卡/年卡）、场馆设施六宫格、免费体验课预约表单。

## 参考来源（只学布局结构与交互编排，源码/文案/图片全部原创）

- 参考站点：Speedo 官网（课程分类 tab + 教练介绍卡片节奏）、大众点评运动馆
  详情页（票卡三档比价 + 场馆设施清单的信息密度）。
- 布局点：hero 左文 + 气泡 canvas + 底部波浪 SVG 分隔；课程表 tab 切换三档
  课程行（时间/余位实时感）；教练墙四卡（头像 SVG 圈 + 教龄标签 + 一句话）；
  票卡三档中间"最多人选"高亮；设施六宫格图标卡；CTA 左文右表单；页脚三列。
- 原创：气泡粒子、波浪线 SVG、教练头像圈、全部文案手写，无外部图片/字体。

## 动效拆解

1. **hero 入场编排（GSAP）**：标题/副文案/按钮/数据条 stagger 上浮
   （`power3.out`，stagger .13s），播完加 `is-in` 并 `clearProps` 交棒给 CSS
   完成态（`html.js .reveal.is-in`），无头/降级路径直接加类。
2. **气泡粒子 canvas**：hero 内气泡缓慢上浮 + 透明度呼吸，低耗 rAF。
3. **滚动 reveal**：`.reveal` 经 IntersectionObserver（threshold .14）加 `.is-in`，
   淡入 + 上移 28px，`data-d="1..5"` 做错峰延迟；另有 4s 安全网兜底 IO 漏报。
4. **数字滚动**：hero 数据条（50米/28℃/12位/4.9分）进入视口后 easeOutCubic
   countUp，1600ms 物理感缓出。
5. **课程 tab 切换**：少儿/成人/私教三档，切换时课程行淡入错峰。
6. **导航毛玻璃**：滚动超 24px 加 `.scrolled`，背景模糊 + 阴影。
7. **加载态**：波浪线 SVG 呼吸动画 + "正在为你热好池水…"，window.load/兜底放行，
   noscript 直接隐藏。

## 配置参数（`src/main.js` 顶部，买家只改这里）

- `SITE` —— 站点名/电话/邮箱/地址/ICP 备案号，`data-site` 占位自动渲染，
  电话/邮箱自动拼 `tel:`/`mailto:`。
- 课程数据：`COURSES` 三档数组（课程名/年龄段/时间/余位），tab 渲染只读这里。
- `COACHES` —— 教练数组（姓名/头衔/教龄/标签/一句话），教练墙渲染只读这里。
- `TICKETS` —— 票卡三档（次卡/月卡/年卡：价格/单位/权益列表/高亮位）。

## 法务三件套（弹窗实现）

- 页脚"法务"区三个按钮：**隐私政策 / 服务条款 / Cookie 政策**，对应三个独立
  modal（`#mPrivacy/#mTerms/#mCookie`，`role=dialog aria-modal`）。
- 三通道关闭：右上 ✕ / 遮罩（`data-close`）点击 / ESC 键；打开锁滚动并记焦点，
  关闭焦点归位。
- 文案为游泳馆场景真实感条款（体验课信息用途、退卡规则、水质公示承诺），无 Lorem。

## "看起来不像 AI 写的"六项自查

1. 克制：整页只讲"下班游两圈再回家"，动效集中在气泡 + 入场编排。
2. 配色：深海蓝 `#0a2a3c` + 白 + 青 `#35c4b5` 三色统一，无彩虹渐变。
3. 字号层级：hero 56px / 区块 36px / 卡片 20px，英文小标字距 `.3em`。
4. 文案真实感："先买次卡试试水，游上瘾了再续年卡""孩子哭着来，笑着走，是我的 KPI"，
   无 Lorem、无 emoji 列表（星级/图标全 SVG）。
5. 手工细节：全页噪点、波浪分隔线、教练"（老K）"花名、场馆"水质维护闭馆"真实
   营业备注、表单"提交即表示同意电话联系"细则。
6. easing：GSAP `power3.out` + countUp `easeOutCubic`，物理感缓出；完成态交棒 CSS。

## 源码结构

```
swim-page/
├── index.html        # 打包产物（单文件，123KB，GSAP 已内联）
├── index.src.html    # 打包源（HTML 骨架）
├── styles.css        # 打包源（样式，完成态选择器带 html.js 前缀）
├── src/main.js       # 打包源（GSAP 入场 + IO reveal + tab/表单/弹窗）
├── vendor/
│   └── gsap.min.js   # GSAP 3 真品（72KB，非空壳）
└── README.md
```

零外部请求（仅 `http://www.w3.org/2000/svg` 命名空间字面量）。

## 重建方式

```bash
cd ~/workspace/fx-lab/swim-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py swim-page   # 内联 styles.css + vendor/gsap.min.js + src/main.js
```

禁止对已打包的 `index.html` 重复跑打包器；改源文件后按上式从源重建。

## 移动端说明

- ≤760px：导航收进汉堡抽屉（右滑面板 + 遮罩，点击/ESC/✕ 关闭）；
  教练墙/票卡/设施六宫格全部单列；课程行时间余位换行不断裂；
  表单两列变单列；页脚三列变单列。
- `prefers-reduced-motion` 下 reveal 直接显示、气泡停跑、数字直接落位。
- 移动端截图 `shots/swim-page-mobile.png`（390×844）。
