# launch-countdown-3d · 新品发布倒计时 3D 模板

<!-- huafire3d fx-lab — original implementation -->

新品发布倒计时页：中央 3D 产品（本地模型）缓慢旋转 + 翻牌时钟倒计时（天/时/分/秒，CSS 3D 翻页）；倒计时归零即揭幕——2400 粒子爆发 + 镜头推进 + "IT'S HERE." 揭幕 + CTA 浮现。示例产品 AURA X1 虚构旗舰耳机。双击 `index.html` 即可看。

## 参考声明（诚实版）

本模板为**原创设计**，未复制任何具体网站的源码或视觉稿。动效手法来自对发布类落地页通用语言的理解，用自己重写的代码实现：

| 复现的手法 | 我的实现 |
|---|---|
| 分体翻牌时钟（上半页先落、下半页跟上，两段式 3D 翻页） | `src/countdown.js`：CSS 3D transform，ease-in 接 ease-out，有机械物理感 |
| 归零揭幕（粒子爆发 + 产品放大 + 标题切换 + CTA） | `src/scene.js` 自写 ShaderMaterial 粒子（加色混合）+ `src/main.js` 编排时序 |
| 悬浮产品（缓慢转台 + 正弦浮动 + 呼吸边缘光） | `src/scene.js`：turntable + bob + rim light pulse |
| 胶片质感（颗粒 + 暗角） | 运行时生成的 canvas 噪点 + CSS radial vignette，无外部资源 |

## 快速预览

- `?demo=<秒>`：倒计时设为 N 秒后归零，快速验证揭幕动画（例：`index.html?demo=8`）
- 目标时间在 `src/config.js` 的 `launchAt`（ISO 8601 含时区）

## 参数说明（`src/config.js`，换产品只改这里）

- `brand / product / productFull / tagline / price` — 品牌 / 产品名 / 全称 / 标语 / 价格文案
- `launchAt` — 倒计时目标时间；`?demo=` 覆盖它
- `model.url / targetHeight / initialYaw` — 模型地址 / 归一化高度 / 初始角度
- `scene.*` — 背景色、曝光、转速、浮动幅度、相机位、边缘光颜色/强度
- `burst.count / power` — 揭幕粒子数量 / 爆发力度
- `copy.*` — 全部文案（eyebrow / 预约占位符 / 揭幕标题 / CTA / fine print）

## 无障碍与性能

- `prefers-reduced-motion`：数字直接切换（无翻页）、无转台、无粒子爆发，揭幕只做淡入
- 移动端：`matchMedia("(pointer: coarse)")` 或窄屏自动降画质（像素比 ≤1.5、粒子减半、关闭抗锯齿）
- WebGL 不可用：显示占位文案，倒计时照常工作

## 源码结构

```
launch-countdown-3d/
├── index.html            # 单文件成品（1373KB，零外部依赖，模型在本地 models/ 目录）
├── index.src.html        # 源码母版（改这里）
├── build.py              # 构建脚本：母版 → 内联 → 打包（可重复跑）
├── src/
│   ├── config.js         # 中央参数
│   ├── countdown.js      # 翻牌时钟
│   ├── scene.js          # Three.js 场景 + 粒子爆发 + 揭幕镜头
│   ├── main.js           # 编排：加载 → 倒计时 → 揭幕 → 订阅表单
│   └── draco-inline.gen.js # Draco 解码（WASM 内联，单文件无外部请求）
├── vendor/               # Three.js r160 本地（three.module.js + addons）
└── README.md
```

构建：`cd launch-countdown-3d && python3 build.py`
（不要对已打包的 `index.html` 直接跑 `fx-singlefile.py`——它是单向的，会破坏可重复构建。）

## 质量自查（fx-lab 交付铁律）

① 克制：整页只讲"倒计时 → 揭幕"一件事；② 配色 3 色：近黑 `#060607` / 暖白 `#f4f1e8` / 琥珀 `#ffb454`；
③ 字体层级：大标题 800 粗 + 宽字距 tracking，翻牌数字字号分明；④ 无 Lorem ipsum、无 emoji，文案全是真实发布短句；
⑤ 手工细节：vignette 暗角、胶片颗粒、加载进度条、按钮 hover 微浮；⑥ easing 有物理感（翻页/爆发均不用 linear）。
