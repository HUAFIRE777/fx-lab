# hologram-3d · 全息展台

`huafire3d fx-lab — original implementation`

一句话介绍：中央台座投射出一副纯程序化几何拼成的全息耳机——扫描线滚动、投影闪烁、底座光环旋转、粒子光点上升，点击部件弹出虚构参数标签，可切换青/品红两档全息色。

## 参考与借鉴点

- 对标对象：科幻作品里的全息 UI 展台（如科幻电影中的投影台、游戏里的全息通讯器）——只学视觉手法，不抄任何代码。
- 借鉴的 3 个手法：① 横向扫描线在投影体上滚动；② 投影整体闪烁 + 偶发撕裂抖动（表现"不稳定"）；③ 台座多层光环旋转（一正一反）+ 环上彗星光点。
- 代码原创声明：本模板所有代码（Three.js 场景搭建、GLSL 全息 shader、交互逻辑、CSS）均为原创重写，未复制、未反编译任何原站源码；three.js 与 GSAP 使用官方发行版本地 vendor。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 全息耳机 | Torus 头梁 + Cylinder 耳罩 + Torus 耳垫 + Sphere 铰链，全部基础几何体，零外部模型 |
| 2 | 全息材质 | 自研 GLSL：additive blending + fresnel 边缘光 + 扫描线 + 纵向扫光带 + 闪烁 + 上下边缘淡出 |
| 3 | 扫描线滚动 | shader 内 `sin(worldY * 密度 + time * 速度)`，密度可调 |
| 4 | 投影不稳定 | shader 偶发撕裂/闪烁 + JS 层随机短促位移抖动 burst |
| 5 | 底座光环 | 两层细光环反向旋转 + 环上彗星光点 + 边缘光环呼吸 + canvas 手绘刻度环 |
| 6 | 粒子上浮 | 150 点 additive 粒子在投影柱内循环上升 |
| 7 | 投影光锥 | 台座到耳机之间的半透明光锥，fresnel 淡化 |
| 8 | 交互 | 拖动旋转（阻尼跟随）、点击部件弹出参数标签（9 秒自动收起）、相机鼠标视差 |

## 配置参数

| 参数 | 位置 | 说明 |
|------|------|------|
| 旋转速度 | 底部 dock 滑杆 | 0–100 → 0.05–1.75 rad/s，默认 42（0.8） |
| 扫描线密度 | 底部 dock 滑杆 | 0–100 → 24–194 线/单位，默认 48（96） |
| 颜色档 | 右上 青/品红 | 同一时间只出现一种，切换时全场景统一替换 + 呼吸脉冲 |
| `P_COUNT` | src/main.js | 粒子数量，默认 150 |
| `COLORS` | src/main.js | 两档色值：青 `#00F0FF` / 品红 `#FF2ED1` |

虚构参数标签（点击部件弹出）：耳罩单元「50mm 动圈单元 / 阻抗 32Ω · 频响 8Hz–42kHz」、
头梁「碳纤维弓梁 / 整机 198g · 记忆棉内衬」、铰链「多轴折叠铰链 / 5 万次开合寿命测试」、
耳垫「蛋白皮耳垫 / 被动降噪 −28dB」——均为演示用虚构参数。

## "看起来不像 AI 写的"六项自查

1. 克制：整页只有一个主视觉动效（全息投影），UI 只有标题、两档颜色、两个滑杆、一句提示。
2. 配色：深黑底 + 单一全息色（青/品红二选一），文字只用白/灰中性色，无彩虹渐变。
3. 字体：大标题 44–78px、字距 0.3em 有呼吸感；层级 eyebrow 11px / 标题 / 副标题 13px / 控件 11px，字号字距逐级讲究。
4. 文案：真实感中文短句（"投影校准中…"、"拖动旋转 · 点击耳机部件查看参数"），无 Lorem ipsum、无 emoji 符号列表。
5. 手工细节：底座 canvas 手绘刻度环、投影随机抖动 burst、vignette + SVG 噪点、"投影校准中"加载态、滑杆自定义发光拇指、按钮 hover 光晕、标签弹出小圆点连接线。
6. easing：旋转用阻尼跟随、标签弹出 `back.out(1.8)`、颜色切换 `elastic.out(1,0.45)` 呼吸脉冲、加载条 `cubic-bezier(.45,0,.55,1)`，无默认 linear。

## 源码结构

```
hologram-3d/
├── index.src.html   # 开发版：内联 CSS + importmap(three→vendor) + classic gsap + ESM 入口
├── src/
│   └── main.js      # 全部逻辑：场景/全息 shader/台座/耳机/粒子/交互/控制
├── vendor/
│   ├── three.module.js  # three.js 官方发行版（本地）
│   └── gsap.min.js      # GSAP 3.12.5 官方发行版（本地，72KB 真品）
├── index.html       # 打包成品（fx-singlefile.py 生成，单文件离线可看）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab
cp index.src.html index.html          # 从开发版复制
python3 ~/workspace/bin/fx-singlefile.py hologram-3d   # 一次性单向打包
```

- 打包器做三件事：classic `<script src="vendor/gsap.min.js">` 内联；`src/main.js` 经 esbuild 打包内联为 `<script type="module">`（three 保持 external）；importmap 里 three 换成 base64 data: URL。
- 改源码后从 `index.src.html` 重新 cp 再跑，**禁止对已打包的 index.html 重复跑**。
- 截图验证：`node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/hologram-3d/index.html" ~/workspace/fx-lab/shots/hologram-3d.png 1280 800 0`

## 移动端说明

- 390×844 布局：标题缩小、dock 改为纵向全宽、提示文字居中换行、页脚隐藏。
- 交互：点击（tap）部件弹出参数标签，无 hover 依赖；滑杆为原生 input range，触摸可用。
- 画布 `touch-action:none`，拖动旋转手势与页面滚动不冲突（单屏无滚动）。
- 像素比上限 2，粒子 150 点，低端机可流畅运行。
