# beauty-clinic-page · 医美诊所完整落地页模板

虚构品牌「昕妍医疗美容」的整站首页模板：导航 → Hero → 项目分类 → 医生团队 → 案例对比 → 机构资质 → 咨询表单 → 页脚，开箱即卖。

## 参考与原创声明

- **参考站点**：国内一线医美机构官网（如美莱 / 华美系机构官网）。只学了**布局结构与交互编排**，代码、文案、视觉全部原创重写，未复制对方任何源码、文案与图片。
- **学的 4 个布局点**：
  1. 项目分类导航（皮肤 / 塑形 / 抗衰三大 Tab，陈列项目卡）；
  2. 医生团队墙（照片 + 职称 + 擅长方向的卡片矩阵）；
  3. 案例前后对比滑块（拖拽看治疗前后）；
  4. 在线咨询悬浮 CTA（滚动一段后右下角常驻）。
- 另补了参考站常见的"机构资质数字"与"医疗广告合规提示行"，文案按《医疗广告管理办法》口径自写（不承诺效果、提示风险）。

## 动效拆解

- **主视觉动效**：案例前后对比拖拽滑块。原生 `input[type=range]` 驱动 CSS 变量 `--pos`，治疗后图层用 `clip-path: inset(0 0 0 var(--pos))` 裁剪，手柄跟随——零库、纯 CSS 机制，键盘方向键同样可拖。
- **Hero**：双行大标题遮罩式逐行升起（`overflow:hidden` 行容器 + `translateY(112%)→0`，easing `cubic-bezier(.22,1,.36,1)`）；4 片 SVG 花瓣 CSS 关键帧缓缓飘落；统计数字区顶部细线收束。
- **滚动微交互**：全站 `.reveal` 元素 IntersectionObserver 触发上浮淡入，按 `data-d`  stagger 延迟；完成态三重保障——IO 触发 / 无 IO 或减弱动效偏好时直接显示 / 3 秒兜底全量补 `is-in`，内容不可能永久隐藏。
- **医生卡片**：hover / 键盘聚焦时 3D 翻转（`rotateY(180deg)`，`preserve-3d`，无 blur 叠加，避开 Chromium 压平坑），背面是医生简介 + 预约入口。
- **项目卡片**：鼠标视差 3D 倾斜（`perspective + rotateX/rotateY`，JS 计算，离开复位）+ 顶部蔷薇粉进度条扫入。
- **手工细节**：SVG 噪点全页覆盖（opacity .055）、径向暗角 vignette、加载态花瓣呼吸动画（window load 后淡出 + 4 秒强制兜底）、按钮悬停上浮、导航滚动 40px 后透明→毛玻璃、表单聚焦粉色光环、移动端抽屉菜单。

## 配置参数（SITE 变量）

买家只改 `src/app.js` 顶部 `SITE` 对象，重建即全站生效：

| 字段 | 说明 | 用到哪里 |
|---|---|---|
| `brand` | 机构名称 | 页脚版权行 |
| `phone` | 咨询电话 | 顶部导航 / 移动端抽屉 / 页脚，三处自动同步，`tel:` 链接自动生成 |
| `address` | 机构地址 | 页脚"联系我们" |
| `hours` | 营业时间 | 页脚"联系我们" |
| `icp` | ICP 备案号 | 页脚版权行；留空则自动隐藏该段 |

重建后用 `python3 ~/workspace/bin/fx-singlefile.py beauty-clinic-page` 重新打包。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效（对比滑块），其余全是滚动微交互与 hover 细节，不堆砌。
2. **配色定死 3 色**：柔雾白 `#FAF7F2`、蔷薇粉 `#C98A9D`、深咖 `#2E2623` 全页统一（含 alpha 混合版），无彩虹渐变，卡片用纸色 + 细线分隔而非另起颜色。
3. **字体讲究**：标题用宋体系 serif（`Songti SC` 优先）大字号 + 宽字距（`letter-spacing:.14em`），正文用苹方/微软雅黑系 sans，字号层级 13/14.5/16/19/25/46 拉开。
4. **无 Lorem ipsum、无 emoji 列表**：文案全是真实感中文短句（"午休 40 分钟，做完直接回公司""换季干到起皮？一次水光顶一周面膜""下颌线模糊了，提回来"），医生简介写接诊风格而非头衔堆砌。
5. **手工细节**：噪点 + 暗角、加载态、按钮/卡片 hover 微交互、表单聚焦光环、抽屉菜单，全部手写。
6. **easing 有物理感**：全局 `--ease: cubic-bezier(.22,1,.36,1)`，翻转/倾斜/抽屉用 .45–.8s 长缓动，不用 linear。

## 源码结构

```
beauty-clinic-page/
├── src/
│   ├── index.html   # 源码 HTML（含 <link href="styles.css"> 与 <script src="src/app.js"> 引用）
│   └── app.js       # 源码 JS：SITE 配置 + 全部交互（vanilla，零依赖）
├── styles.css       # 源码 CSS（打包时内联）
├── index.html       # 单文件交付物（打包器生成，禁止二次打包/手改）
└── README.md        # 本文件
```

无 `vendor/` 目录：本套零外部库（无 GSAP/Tailwind/Three.js），纯手写 CSS + vanilla JS，故无需 vendor。

## 重建方式

```bash
cp src/index.html index.html   # 从源码恢复打包入口（index.html 是生成物，改源码后重建）
python3 ~/workspace/bin/fx-singlefile.py beauty-clinic-page
```

注意：`fx-singlefile.py` 是一次性单向打包器，禁止对已打包的 `index.html` 再跑一次；改源码后永远从 `src/` 重建。

## 移动端说明

- 断点 960px：导航收起为汉堡抽屉菜单（右滑入，带遮罩，点击遮罩/链接关闭）；项目卡 3→2 列；医生卡 4→2 列；咨询卡上下堆叠。
- 断点 600px：全部单列；医生卡高度 340px；Hero 标题 `clamp()` 自适应；悬浮 CTA 缩小贴边。
- 对比滑块 `touch-action: pan-y`，移动端纵向滑动页面不冲突，横向拖滑块正常工作。
- 截图：`~/workspace/fx-lab/shots/beauty-clinic-page.png`（1280×800）与 `beauty-clinic-page-mobile.png`（390×844）。
