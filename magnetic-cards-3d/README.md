# magnetic-cards-3d · 磁吸卡片

huafire3d fx-lab — original implementation。深空灰底上的六张 SaaS 功能卡：随鼠标做弹簧物理 3D 倾斜、高光扫过、边缘光强化，整组带轻微视差层级，外加一颗会被光标吸住的磁吸按钮。

## 参考与借鉴点

- **对标对象**：Linear / Stripe 官网式的功能卡交互（卡片跟随鼠标 3D 倾斜 + 高光扫过）。
- **学的手法（只学手法）**：① 卡片以中心为轴随光标倾斜；② 高光斑随光标位置在卡面扫过；③ 卡片边缘 1px 光随光标走；④ CTA 按钮的磁吸偏移。
- **代码原创声明**：以上手法全部用原生 JS + CSS 重新实现（自写欠阻尼弹簧积分器、CSS 变量驱动 radial-gradient），未复制任何原站源码、未引用任何第三方库。本模板 vendor/ 为空。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 卡片 3D 倾斜 | mousemove 算卡片归一化坐标 → 目标 rotateX(±11°) / rotateY(±13°) → 自写弹簧（stiff 170 / damp 13，欠阻尼）逐帧积分，离场回弹带轻微过冲 |
| 2 | 高光扫过 | `--gx/--gy` CSS 变量驱动 `.card::before` 的 radial-gradient（电光蓝 20% → 透明），hover 时淡入 |
| 3 | 边缘光强化 | `.card-shell` 用 padding:1px + radial-gradient 背景做"光边"，光斑中心同样跟 `--gx/--gy` |
| 4 | 整组视差 | 光标驱动网格漂移（±16px/±10px），每卡按 `data-depth`（0.55–1.0）差异化位移 + z-index 分层；未用 preserve-3d，避开 blur 压平坑 |
| 5 | hover 浮起 | 倾斜同时 `lift` 弹簧推 translateY(-9px)，shell 阴影加深 + 蓝色外发光 |
| 6 | 磁吸按钮 | 光标进入 160px 半径按 `(1-d/R)` 比例吸附偏移（最大约 67px），label 反向 0.3 倍视差；离场弹簧回位（stiff 120 / damp 11，更弹） |
| 7 | 点击涟漪 | 点击处生成 span.ripple，scale 扩散 + 淡出，animationend 移除 |
| 8 | 加载态 | `html.js .reveal` 初始下沉 52px 透明，JS 按 95ms stagger 加 `.on` 升起（expo 缓动）；无 JS 时 `.js` 类不存在，内容直接可见 |

## 配置参数

在 `src/main.js` 顶部 / 对应位置可调：

- `170 / 13` — 卡片倾斜弹簧（刚度/阻尼），阻尼 < 2√k 即有过冲
- `11° / 13°` — 最大倾斜角（rx/ry）
- `-9` — hover 浮起像素
- `DEPTHS` — 六卡视差深度系数 `[0.55, 1.0, 0.7, 0.85, 0.6, 1.0]`
- `16 / 10` — 网格整体视差幅度（px）
- `160` — 磁吸按钮吸附半径（px）；`0.42` — 吸附强度
- `120 / 11` — 按钮回位弹簧
- `120 + i*95` ms — 加载 stagger 节奏
- `CARDS` — 六卡文案/标签/背面说明/SVG 图标

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只有一个主视觉动效（磁吸倾斜体系）；磁吸按钮是同一体系的延伸，无第二套大动效。
2. **配色**：严格三色 `#0B0D10` / `#4D8DFF` / `#F5F7FA`，所有辉光/高光均为电光蓝不同透明度，无彩虹渐变。
3. **字体**：标题 clamp(38px,6.2vw,76px)、字距 .06em、行高 1.18；kicker 用等宽字体 + .42em 大字距做呼吸感；正文 2 倍行高。
4. **文案**：原创中文短句（"改错了，一键回到任意一个昨天"），无 Lorem ipsum、无 emoji 列表；图标为手写 SVG 线稿。
5. **手工细节**：vignette + SVG 噪点（0.05 透明度白噪点，steps 跳动）、加载逐张升起、hover 浮起+阴影加深、按钮涟漪、卡片背面（移动端 tap 翻转可见）。
6. **物理感**：全部位移走欠阻尼弹簧积分（倾斜/浮起/视差/磁吸四组不同刚度阻尼），加载用 `cubic-bezier(0.16,1,0.3,1)`；无 linear。

## 源码结构

```
magnetic-cards-3d/
├── index.src.html   # 开发版：全部 CSS + 结构，<script src="src/main.js">
├── src/main.js      # 全部逻辑：卡片数据/弹簧物理/倾斜/视差/磁吸/涟漪/翻转
├── vendor/          # 空（本模板零第三方库，原生实现）
├── README.md        # 本文件
└── index.html       # 打包成品（单文件，最后生成）
```

## 重建方式

```bash
cd ~/workspace/fx-lab/magnetic-cards-3d
# 1. 改 index.src.html / src/main.js（开发）
# 2. 复制为打包入口
cp index.src.html index.html
# 3. 单文件打包（一次性单向；改源码后从第 2 步重来，禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py magnetic-cards-3d
# 4. 截图验证
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/magnetic-cards-3d/index.html" ~/workspace/fx-lab/shots/magnetic-cards-3d.png 1280 800 0
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/magnetic-cards-3d/index.html" ~/workspace/fx-lab/shots/magnetic-cards-3d-mobile.png 390 844 1
```

## 移动端说明

- 触摸设备（`pointer:coarse`）自动降级：关闭倾斜/视差/磁吸（避免误触与性能浪费）。
- 卡片 tap 翻转：点击卡片翻到背面看"适用版本/配额"说明，再点任意卡片收回；保证信息可用。
- 网格变单列，perspective 关闭；磁吸按钮保留点击涟漪。
- `prefers-reduced-motion`：关闭倾斜与噪点跳动，加载态直接显示。
