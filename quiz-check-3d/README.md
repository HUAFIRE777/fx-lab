# 随堂测 · 3D 答题反馈

点一个选项：答对了，绿色对勾在屏幕中央一笔一笔"画"出来，粒子炸开，卡片跟着弹一下；答错了，橙色错叉抖两下，正确答案开始呼吸发光，解析从下面展开。三道题，做完直接出分，可重来。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **Duolingo 答题反馈**：选完即时判对错——对的填绿、错的抖动、正确答案高亮、底部解析条上滑展开。学的是"即时反馈 + 解析紧跟"的节奏，和"做错了不骂人、给讲解"的语气。
2. **Duolingo 顶部进度指示**：细进度条随答题推进。学的是"轻量进度可视化"，本模板改成 SVG 圆环，更贴 3D 主题。

复现的手法（实现均为原创）：对勾/错叉用 TubeGeometry 沿 CatmullRom 曲线逐段绘制（`setDrawRange` 动画）、120 粒粒子从笔画向外爆发 + 冲击环扩散、卡片 `back.out` 弹性确认、错叉衰减正弦震动、正确项 `box-shadow` 呼吸脉冲、解析区 `grid-template-rows: 0fr→1fr` 无测量展开。

## 动效拆解

- **答对**：`playCorrect` —— 对勾 0.38s 逐段画出 → 120 粒绿色粒子爆发（初速 5.2、重力 3.2）→ 冲击环 0.65s 扩散 → 卡片 `scale 1→1.03` 弹性回弹 → 进度环推进 1/3 → 0.5s 后解析展开。WebAudio 合成上行双音点缀。
- **答错**：`playWrong` —— 两笔错叉先后画出 → 整组 `sin(t*52)·e^(-4.5t)` 衰减震动 0.7s → 55 粒橙色碎屑下落 → 正确选项无限呼吸高亮 → 0.9s 后解析展开。低频锯齿波提示音。
- **3D 叠加层**：全屏透明 canvas（`pointer-events: none`，z-index 60），爆发点取自卡片中心换算的 NDC 坐标；rAF 只在有效果时跑，无效果即停。
- **结算**：大圆环 1s 填充 + 百分比数字滚动；满分再来一次对勾爆发。

## 配置参数

- `src/config.js`：`QUESTIONS`（tag / text / options / answer / explain），`SCORE_LINES`（按得分档的标题+寄语）。加题：往数组 push 即可，进度环按 `QUESTIONS.length` 自适应。
- 颜色：`index.template.html` `:root` → `--green: #58cc02`、`--orange: #ff9600`、`--bg: #ffffff`。
- 粒子数/速度/重力：`src/fx3d.js` → `playCorrect` / `playWrong` 的 burst 配置对象。

## "看起来不像 AI 写的"六项自查

1. **克制**：一页只讲"答题反馈"一个核心动效，无多余装饰、无背景 3D 场景抢戏。
2. **配色**：白 #FFFFFF / 绿 #58CC02 / 橙 #FF9600 三色定死（灰色只做文字和描边中性色），无渐变堆砌。
3. **字体**：题干 25px/1.65 加粗、解析 15.5px/1.85、标签 12px 大字距，三级层级分明。
4. **文案**：三道真实小测题（光合作用场所、勾三股四弦五、英文 boring/bored 辨析），解析全是人话，无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 淡灰暗角 + SVG 噪点、加载态三点弹跳、选项 hover 时字母徽标旋转 -10° 放大、按钮 6px 实色底边（按下去有"陷下去"感）。
6. **Easing**：弹簧 `cubic-bezier(.34,1.56,.64,1)`、GSAP `power2/3.out`、`back.out`，无一处 linear。

## 完成态可达审计（CSS 先隐藏、等 JS 显示的元素）

- `#loader.hide`：`init` 末尾双 `requestAnimationFrame` 后无条件添加，无提前 return 路径。
- `.explain.open`：`onPick` 的 `setTimeout` 里添加，对/错两条分支都会走到。
- `#doneView`：答完第 3 题点"查看得分"必达；`#retryBtn` 可返回答题态。

## 源码结构

- `index.template.html`：开发版，全部 CSS + DOM 骨架，`<script type="module" src="src/main.js">`。
- `src/config.js`：题目与结算文案。
- `src/main.js`：答题流程、进度环、结算、WebAudio 合成音效。
- `src/fx3d.js`：Three.js 全屏叠加层（对勾/错叉笔画 + 粒子 + 冲击环），纯程序化几何。
- `vendor/`：three.module.js、gsap.min.js（构建时内联）。
- `index.html`：单文件发行版（构建产物，勿手改）。

## 重建方式

```bash
cd ~/workspace/fx-lab/quiz-check-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py quiz-check-3d
# 验收
NODE_PATH=/tmp/hcshot/node_modules timeout 100 node /tmp/pageprobe.js "file:///home/hatch/workspace/fx-lab/quiz-check-3d/index.html" 12 2>&1 | tail -25
grep -oE 'https?://[^"'\'' ]+' index.html | sort -u
```

注意：`fx-singlefile.py` 是一次性单向打包器，禁止对已打包的 `index.html` 重复跑；改源码后从 `index.template.html` 重新 `cp` 再跑。

## 移动端说明

- 560px 以下断点：题干 21px、卡片内边距收窄、选项字号 15.5px。
- 3D 叠加层按视口自适应（`resize` 重算 aspect），`devicePixelRatio` 上限 2。
- `prefers-reduced-motion`：全部动画降为 0.01ms，解析直接展开。
