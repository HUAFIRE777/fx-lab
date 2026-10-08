# 目屿 MUYU — 眼镜品牌落地页模板

一句话：虚构眼镜品牌「目屿 MUYU」的单页落地模板，核心卖点是可拖动的镜框 360° 旋转展示，附带系列横滑、在家试戴三步骤、验光预约表单与完整法务弹窗。

## 参考站点及布局点

参考 Warby Parker（只学布局结构与交互编排，代码、文案、图片全部原创重写）：

1. **居中大字 hero + 镜框主视觉** — 大标题居中，镜框作为 hero 绝对主角；本页把主视觉升级为可交互的 360° 旋转。
2. **镜框系列横滑陈列** — 横向 scroll-snap 卡片带，左右箭头 + 触屏滑动，Warby Parker 式的产品陈列节奏。
3. **在家试戴流程 3 步骤** — 01/02/03 编号三步走（选 5 副 → 包邮到家 → 7 天试戴），虚线连接。
4. **验光预约表单** — 姓名/手机/城市/日期/时段 + 提交后成功态，对应 Warby Parker 的 book-an-eye-exam。

## 动效拆解

- **核心动效（整页唯一）：镜框 360° 旋转**。纯程序化 SVG 镜框 × 5 层 `translateZ(-10/-5/0/5/8px)` 挤出伪厚度，`preserve-3d` 的 rotor 做 `rotateY`。rAF 驱动 26°/s 自动旋转；pointer 拖动直接 scrub 角度，松手 2.8s 后恢复自动转。高光层随角度余弦呼吸（正面最强）、投影椭圆同步缩放、右上刻度盘实时显示 0–359°。开场用自研 tween 做 easeOutBack 从 -28° 甩入。
- **各区块 stagger 入场**：`.rv` + IntersectionObserver，`translateY(30px)→0` 配 `cubic-bezier(.22,1,.36,1)`，卡片带 `--d` 递延。
- **hero 标题遮罩揭示**：两行大字 `translateY(112%)` 藏在 `overflow:hidden` 遮罩后，JS 加 `.is-in` 逐行升起（完成态 `.is-in` 下强制 `transform:none`，见"已知坑"）。
- **微交互**：导航滚动透明→毛玻璃、按钮 hover 上浮、卡片 hover 上浮 + 镜框放大微转、法务弹窗 spring 入场、预约成功 ✓ 弹性弹出、噪点 7s 步进抖动、暗角、加载态品牌脉冲。
- **easing**：全部物理感曲线（easeOutExpo / easeOutBack / easeOutElastic / easeOutQuart），无一处 linear。

## 配置参数（SITE 变量说明）

`src/main.js` 顶部 `SITE` 对象集中配置，一改全改，页面中所有 `[data-site="key"]` 元素自动渲染：

| key | 说明 | 当前值 |
|---|---|---|
| `brand` | 品牌名 | 目屿 MUYU |
| `phone` / `phoneHref` | 客服电话 / tel 链接 | 400-088-2026 |
| `address` | 门店地址 | 上海市静安区南京西路 1266 号 2 层 L201 |
| `email` | 客服邮箱 | hello@muyu-eyewear.com |
| `hours` | 营业时间 | 每日 10:00 – 22:00 |
| `icp` | 备案号 | 沪ICP备2026000000号-1 |

法务文案在 `LEGAL` 对象（privacy/terms/cookies），改文案只改这一处。试戴款式在 `FRAMES` 数组（名称/编号/版型/颜色/价格/标签）。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"旋转看镜框"一个核心动效；其余全部是 stagger/hover 级别的微交互，无堆砌。
2. **配色**：全页三色死守 —— 墨黑 `#1A1A1A` / 暖灰 `#E8E2D8` / 琥珀 `#D9A441`，其余均为三色的 rgba 衍生；零彩虹渐变（唯一的 radial 只是琥珀光晕）。
3. **字体**：系统字体栈；中文大标题 `clamp(52px,9vw,118px)` 紧字距，eyebrow 全大写 0.34em 字距，数字用 tabular-nums，三级标题字号阶梯分明。
4. **文案**：零 Lorem ipsum、零 emoji 列表。短句真实感："戴出门、拍照、问朋友""近视度数先不填，试戴的是版型""损坏不用赔"。
5. **手工细节**：SVG 噪点颗粒（7s 步进抖动）+ 全页暗角 + 品牌脉冲加载态（含 4.5s CSS 兜底自动消退）+ 卡片 hover 镜框微转 + 滚动提示呼吸。
6. **easing**：自研 tween 库四种物理曲线；旋转开场 easeOutBack 甩入、刻度盘 easeOutElastic 扫圈、弹窗 easeOutBack-spring。

## 源码结构

```
eyewear-page/
├── index.html          # 打包成品（单文件，双击即开）
├── index.src.html      # 打包源（结构/文案）
├── styles.css          # 打包源（样式）
├── src/
│   └── main.js         # 打包源（交互：SITE/旋转/横滑/表单/法务/抽屉）
├── vendor/
│   └── tween.js        # 自研补间库（4.3KB，真实被 main.js 调用，非空壳）
└── README.md
```

## 重建方式（fx-singlefile.py，一次性单向）

```bash
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py eyewear-page
```

打包器把 `styles.css`、`vendor/tween.js`、`src/main.js` 全部内联进 `index.html`。**禁止对已打包的 index.html 二次打包**：改源码（`index.src.html` / `styles.css` / `src/main.js`）后重新执行上面两行。

## 移动端说明

- 断点 960px / 760px：booking 双栏→单栏、三步骤→单列、横滑箭头隐藏（纯触屏滑动）。
- 导航 ≤760px 收起为汉堡按钮 → 右侧深色抽屉（含链接/CTA/客服电话），backdrop + × + Esc 三种关闭。
- 旋转舞台 `touch-action:pan-y`：横向拖动旋转镜框，纵向照常滚动页面，不抢滚动。
- 表单 `field-row` 单列、时段 pills 纵排；input 16px 级字号防 iOS 自动缩放。
- `prefers-reduced-motion`：关闭自动旋转与全部过渡，`.rv` / 标题直接可见。
