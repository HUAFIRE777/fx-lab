# lightning-3d · 闪电风暴

一场永不停歇的程序化雷暴：FBM 风暴云翻滚、中点位移闪电分叉、斜落雨幕，点击夜空即落雷——为户外 / 能源品牌 hero 而生的风暴场景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：暴风雨延时摄影（storm timelapse）。
- **学的三个手法**：① 闪电分叉形态——主干曲折下劈、中途向外斜劈 2–4 条次级分叉；② 云层体积感——多层 FBM 云前后错开、边缘羽化，透出云隙微光；③ 雨幕层次——远近两层雨速/透明度不同，风斜吹。
- **代码原创声明**：以上只学手法。GLSL FBM、中点位移放电、闪烁包络、雨粒子、交互逻辑全部手写原创，未复制任何现成闪电/天气特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 风暴云 | 两层大平面 + 5 阶 FBM fragment shader，`uTime` 缓慢平移翻滚；`uFlash` 在放电瞬间给云体染上电光蓝白 |
| 闪电主干 | 中点位移（7 次递归细分）从云底 (≈y24) 劈到地面，每段随机抖动，每次放电形态全新 |
| 闪电分叉 | 主干 20%–80% 处随机取 2–4 个点，向外 30°–60° 斜劈 4–10 米短枝 |
| 发光 | 每条折线 3 遍 additive 线条（外层辉光 #7FB2FF / 中层 #BFE3FF / 核心白）+ 8 个径向辉光精灵 + 落点冲击光斑 |
| 闪烁 | 双重回击包络：0→1→0.22→1→0.45→0.85→衰减，模拟真实闪电的回击闪烁 |
| 全局闪光 | 定向光强度 0.35→3.1 脉冲 + 云层 uFlash + 屏幕径向闪光层，三重同步 |
| 雨 | 4500 粒子 Points，速度 17–27/s，风斜吹 -4.2，落地/出界回卷顶部；雨滴为 canvas 生成的竖向渐变 streak 精灵 |
| 背景 | 夜空穹顶渐变 shader + 380 颗稀疏星点 + 两层山脊剪影 + 雾 |
| 相机 | 持续 ±1.6 缓慢横漂，呼吸感 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `level` | 风暴等级滑杆 1–10 | 5 | 放电间隔 `lerp(7.5s→0.8s)`，雨量 `lerp(500→4500)` |
| `auto` | 自动风暴按钮 | 开 | 关则只响应手动点击/按钮放电；`prefers-reduced-motion` 下默认关 |
| `RAIN_MAX` | main.js | 4500 | 雨粒子池上限 |
| 闪电时长 | `strike()` | 0.75–1.5s | 每次随机 |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--bg:#060913` 深蓝黑 / `--ink:#BFE3FF` 电光蓝白 / `--vio:#8E7BFF` 警示紫点缀 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——雷暴。无多余装饰模块。
2. **配色**：严格 3 色（#060913 / #BFE3FF / #8E7BFF），禁用彩虹渐变；紫色只出现在 kicker、滑杆、读数点缀位。
3. **字体**：中文标题 Noto Serif SC 衬线，英文小字大字距（.42em），层级分明。
4. **文案**：真实感短句（"把天气装进口袋""风暴等级越高，放电越频繁、雨幕越密"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 + 光晕；滑杆 thumb hover 放大；点击提示首次放电后淡出。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro  stagger 150ms。

## 源码结构

```
lightning-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/云/闪电/雨/交互/loader
├── vendor/
│   └── three.module.js # three 真品 667KB（从 vinyl-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/lightning-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py lightning-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题下移避开右上读数，控制面板贴底全宽，footer 隐藏。
- 触屏：点击夜空放电用 `click` 事件，移动端可直接点；`touch-action:manipulation` 防双击缩放。
- 像素比上限 2，雨粒子池与桌面共用，低端机可降 `RAIN_MAX`。

## 踩坑记录

1. **CDP 调试端口偶发连不上**：`hcshot.js` 系脚本 `spawn chrome` 后固定 sleep 3s 取 `/json/list`，chrome 启动慢即 `fetch failed`。修法：fetch 加 10 次×1s 重试；截图改轮询 `[data-intro].is-in` 数量代替固定 sleep，避免抓到 intro 半成品。
2. **pkill 误杀自己**：`pkill -f "chrom.*/opt/meta-chromium"` 的正则命中了执行命令自身的命令行（含该字串），exec 被 SIGTERM。教训：kill pattern 必须用 `[c]hrome` bracket 写法，命令里不出现可被字面命中的串。
3. **合成点击在截图脚本里时灵时不灵**：`dispatchEvent(new MouseEvent('click'))` 探针验证 handler 正常，但 strike-shoot 里多次未触发（计数不动）。未深究竞态根因——改走"滑杆拉到 10 级等自动放电"抓拍，自动链路稳定，问题绕过。教训：截图别依赖合成事件，优先用产品自身的自动机制。
4. **无头 file:// 下 ES module**：打包后 importmap 的 three 走 data:URL、main.js 已内联，无外部 module 请求，file:// 可正常跑，console 零错。但 WebGL 渲染细节仍以真机为准，无头只验"无报错 + 构图"。
