# meteor-3d · 星陨

流星雨撞击夜空：拖着火尾的流星随机划过天际，撞击地面激起冲击波扩散、尘埃爆发与永久撞击坑——点击天空可亲手召唤一颗。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：流星雨延时摄影（meteor shower timelapse）与灾难片撞击镜头。
- **学的三个手法**：① 流星形态——头部高亮火球 + 渐隐橙红拖尾，斜向切入大气；② 撞击三段式——先闪光、再环形冲击波扩散、最后尘埃升腾，地面留下焦黑弹坑；③ 夜空纵深——穹顶渐变 + 稀疏星点 + 远山剪影三层。
- **代码原创声明**：以上只学手法。夜空 shader、流星拖尾粒子、冲击波/尘埃/弹坑、昼夜过渡、交互逻辑全部手写原创，未复制任何现成流星/粒子特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 夜空穹顶 | 大球体内翻 ShaderMaterial：顶部/地平线双色渐变，`dayF` uniform 昼夜插值 |
| 星点 | 700 粒子 Points（上半球随机分布），透明度随昼夜淡入淡出 + 轻微闪烁 |
| 山脊剪影 | 两层 ShapeGeometry 程序化山脊（正弦叠加），远近双色，雾中透视 |
| 流星 | 精灵火球头 + 实心火核短线 + 90 粒拖尾 Points（additive，头亮尾暗）；斜向高速切入 |
| 撞击闪光 | 共用 PointLight 橙光脉冲 + 地面辉光贴片扩散淡出 |
| 冲击波 | 双 RingGeometry 环（快薄/慢宽），easeOutCubic 扩散 + 透明度衰减 |
| 尘埃 | 130 粒/次 CPU 粒子：径向初速 + 重力 + 落地反弹衰减，additive 橙色余烬 |
| 撞击坑 | canvas 径向渐变纹理（焦黑中心 + 橙红辉光边缘），永久保留，上限 26 个轮转 |
| 相机 | 持续 ±0.9 缓慢横漂呼吸感 + 撞击震屏（随机抖动指数衰减） |
| 昼夜 | 夜/昼两档按钮，`dayF` 指数阻尼过渡：天空/雾/地面/山脊/星空/灯光/拖尾亮度联动 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `freq` | 流星频率滑杆 1–10 | 4 | 生成间隔 `lerp(4.2s→0.45s)`，滑杆填充色联动 |
| 夜/昼 | 分段按钮 | 夜 | `dayF` 0↔1 阻尼过渡（lambda 2.4） |
| `MAX_CRATERS` | main.js | 26 | 撞击坑保留上限，超限移除最旧 |
| `TRAIL` | main.js | 90 | 单颗流星拖尾粒子数 |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态 |
| 开场 | main.js | 3 颗 | 0.35/1.15/1.95s 先行流星，第一屏即有戏 |
| 配色 | CSS 变量 | — | `--bg:#050914` 深蓝夜空 / `--ink:#CFE4FF` 月白 / `--fire:#FF6A2A` 橙红撞击辉光 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——流星雨撞击。无多余装饰模块。
2. **配色**：严格 3 色（#050914 / #CFE4FF / #FF6A2A），禁用彩虹渐变；橙色只出现在 kicker、滑杆、撞击特效与读数点缀位。
3. **字体**：中文标题 Noto Serif SC 衬线 + 大字距英文 kicker（.42em），层级分明；字号 52/13.5/12/11 四档。
4. **文案**：真实感短句（"把星空砸进大地""点击夜空任意处，在该处附近召唤一颗流星"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 + 橙光晕；滑杆 thumb hover 放大 1.3；提示丸首次召唤后淡出；撞击计数实时读数。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 120ms；冲击波用 easeOutCubic 物理感扩散；昼夜/震屏用指数阻尼。

## 源码结构

```
meteor-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：夜空/流星/撞击/尘埃/昼夜/交互/loader
├── vendor/
│   └── three.module.js # three 真品 667KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/meteor-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py meteor-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题上移避开右上读数（top:88px），提示丸贴面板上方，控制面板贴底全宽，footer 隐藏。
- 触屏：点击夜空召唤用 `click` 事件，移动端可直接点；`touch-action:manipulation` 防双击缩放。
- 像素比上限 2；粒子池（拖尾 90/颗、尘埃 130/次）桌面移动共用，低端机可降 `TRAIL`。

## 踩坑记录

1. **无头 rAF 只有 ~1.3fps**：本机 headless Chromium（--disable-gpu）在该页 rAF 约 12 帧/9 秒——不是代码 bug，是软件光栅化慢。调试结论：`dt` 按墙钟走所以逻辑正确，只是仿真时间按 0.065x 流速；截图改用加长等待（40–60s）+ 频率拉满抓拍。真机 60fps 下正常。
2. **"hits=0" 误报排查**：初版 console 检查 6 秒 hits=0，疑似撞击链路 bug；注入 rAF 计数探针后证实是第 1 条的无头慢帧所致，真机时序下撞击/冲击波/尘埃/弹坑链路一次跑通（截图实测 14 次撞击）。
3. **合成点击验证召唤链路**：`dispatchEvent(new MouseEvent('click',{clientX,clientY}))` 在 canvas 监听器上可用（handler 只读 clientX/Y），截图 preJS 用它验证了"点击天空召唤"链路真实触发。
4. **hint 丸与 intro transform 冲突**：`html.js [data-intro]` 的 `transform:translateY(18px)` 会覆盖 hint 自身的 `translateX(-50%)` 居中——加了 `html.js .hint.is-in` 显式恢复 `translateX(-50%)`，完成态必居中。
