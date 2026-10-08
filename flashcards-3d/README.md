# 抽认卡 · 3D 翻卡记忆

点一下卡片，它在你面前翻过去露出释义；觉得记住了点"记得"，卡片就飞走叠进右边的掌握堆，纸堆肉眼可见地变厚——8 张全部刷完，直接告诉你一遍记住了几个。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **Anki / Quizlet 抽认卡**：先翻卡看答案、再按"记得/忘记"打分，没记住的卡片自动回到待复习队列。学的是"翻转 → 自评 → 队列轮转"的记忆循环结构。
2. **Quizlet 的卡片翻转**：CSS 3D `rotateY(180deg)` 翻面，正反面用 `backface-visibility` 隔离。学的是翻转的空间感，本模板加了 `cubic-bezier(.25,.8,.3,1.15)` 的过冲 easing，更有纸感。

复现的手法（实现均为原创）：背景两摞纸卡是真实 Three.js 几何体（`BoxGeometry` 薄盒 + 手工错位堆叠），"记得"时顶部纸卡沿正弦弧线飞入掌握堆并落定回弹，"忘记"时待复习堆顶部纸卡上浮摇摆表示"收回"，堆顶红色对勾（两片薄盒拼成）随掌握数出现/移动，标签用每帧投影定位跟随堆顶。

## 动效拆解

- **翻卡**：`preserve-3d` + `rotateY(180deg)`，0.75s，过冲 easing；正面暖纸、背面墨底，对比强烈的"另一面"感。
- **记得**：DOM 卡片 `power2.in` 飞向掌握堆投影坐标（缩小+旋转+淡出，0.62s）→ 3D 纸卡沿弧线飞入（0.72s，顶点抬高 1.7）→ 落定 `easeOutBack` 回弹 → 掌握环 +1/8，待复习堆变薄。
- **忘记**：卡片 x 轴五段衰减抖动（-14→12→-8→5→0）→ 飞回待复习堆 → 堆顶纸卡上浮 0.42 回弹摇摆 → 卡片重排队尾。
- **待机**：相机 ±0.16 微幅漂移，纸堆标签每帧投影跟随；rAF 常驻（单小场景，开销可忽略）。
- **结算**：一遍记住率圆环 + 双 chip（"一遍记住 x/8""多刷了 y 张次"）+ 分档寄语。

## 配置参数

- `src/config.js`：`CARDS`（word / phon / pos / meaning / eg / egCn），`DONE_LINES`（按一遍记住数分档的标题+寄语）。换主题：改数组即可，堆数量/圆环按 `CARDS.length` 自适应。
- 颜色：`index.template.html` `:root` → `--paper: #fff9f0`、`--ink: #1a1a1a`、`--red: #e5484d`。
- 纸堆间距/相机：`src/stacks3d.js` → `resize()`（按 aspect 三档：<0.75 / <1.1 / 其他）。

## "看起来不像 AI 写的"六项自查

1. **克制**：一页只讲"翻卡 → 飞入纸堆"一个核心动效，背景纸堆是动效的记分牌，不是装饰。
2. **配色**：暖纸 #FFF9F0 / 墨 #1A1A1A / 红 #E5484D 三色定死，无渐变堆砌。
3. **字体**：单词 45px 加粗、释义 27px、例句 15.5px/1.7，层级分明；按钮字距 0.34em。
4. **文案**：8 张真实单词卡（serendipity、ephemeral、resilient、ubiquitous、meticulous、nostalgia、pragmatic、luminous），释义例句译文全是人话，无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暖灰暗角 + SVG 噪点、加载态三点弹跳、卡片 hover 阴影加深、按钮 6px 实色底边（按下去陷落感）、纸堆手工错位堆叠。
6. **Easing**：翻转过冲 `cubic-bezier(.25,.8,.3,1.15)`、弹簧 `back.out`、GSAP `power2.in/out`，无一处 linear。

## 完成态可达审计（CSS 先隐藏、等 JS 显示的元素）

- `#loader.hide`：init 末尾无条件注册（双 rAF 主路径 + 1500ms 定时兜底，有互斥 flag），无头抖动下已验证必达。
- 打分按钮 `disabled→enabled`：每次 `renderCard` 重置为禁用，`flip()` 必解禁（不翻卡不给打分是 Anki 式设计）。
- `#doneView`：牌堆抽空必达；`#retryBtn` 洗牌重开（`resetStacks` 重建纸堆）。

## 源码结构

- `index.template.html`：开发版，全部 CSS + DOM 骨架，`<script type="module" src="src/main.js">`。
- `src/config.js`：卡片与结算文案。
- `src/main.js`：翻卡/打分流程、牌堆队列、结算、标签投影跟随。
- `src/stacks3d.js`：Three.js 背景纸堆（双堆 + 红色对勾 + 飞入/收回 tween + 待机微动），纯程序化几何。
- `vendor/`：three.module.js、gsap.min.js（构建时内联）。
- `index.html`：单文件发行版（构建产物，勿手改）。

## 重建方式

```bash
cd ~/workspace/fx-lab/flashcards-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py flashcards-3d
# 验收
NODE_PATH=/tmp/hcshot/node_modules timeout 100 node /tmp/pageprobe.js "file:///home/hatch/workspace/fx-lab/flashcards-3d/index.html" 12 2>&1 | tail -25
grep -oE 'https?://[^"'\'' ]+' index.html | sort -u
```

注意：`fx-singlefile.py` 是一次性单向打包器，禁止对已打包的 `index.html` 重复跑；改源码后从 `index.template.html` 重新 `cp` 再跑。

## 移动端说明

- 560px 以下断点：单词 38px、卡片内边距收窄。
- 纸堆按 aspect 自适应三档间距（窄屏相机拉远到 z=12.4），标签投影定位始终跟随堆顶。
- `devicePixelRatio` 上限 2；`prefers-reduced-motion`：翻转/飞行降为瞬时，解析直接呈现。
