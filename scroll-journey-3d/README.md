# scroll-journey-3d · 远望：从深空到黎明

一句话介绍：整页是一次 600vh 的滚动旅程——滚动即时间轴，相机沿样条穿越星云、虫洞、月面、晶洞、云海五个连续场景，从深空回到黎明。

## 参考对象与借鉴点

- 参考对象：AETHERIS（2026 年 Awwwards 长叙事站点的标配形态——"滚动驱动相机穿越连续场景"的长卷叙事）。
- 借鉴点（只学手法，不抄代码）：
  1. "滚动 = 时间轴"：页面总高约 600vh，滚动进度 p∈[0,1] 映射到整段旅程，滚动可前后 scrub；
  2. 相机沿一条连续样条穿越多个场景，而非场景硬切；
  3. 章节式 HUD：左侧细进度轨道 + 大标题章节切换。
- 代码全部原创重写：五个场景的几何、shader、相机样条、淡化逻辑均为本模板手写，未复制任何第三方源码（除 three.js 库本身）。

## 动效拆解

1. **相机旅程**：`THREE.CatmullRomCurve3` 串起 9 个控制点，`getPointAt(p)` 取位，lookAt 样条前方 2.5% 处；Y 轴叠加 `sin(t*0.5)*1.2` 呼吸浮动。
2. **惯性 scrub**：滚动只写 `targetP`，每帧 `curP = lerp(curP, targetP, 1 - 0.002^dt)` 指数跟随——滚得快有拖尾感，停手后相机缓缓"刹车"。
3. **场景交叉淡化**：每场景以中心进度 `p_i=(i+0.5)/5` 为峰，两侧 0.13 宽 smoothstep 淡入淡出；所有材质 `opacity = base × easeOutExpo(fade)`，`visible` 在 fade<0.01 时关闭省 drawcall；`FogExp2` 密度按章节值插值，雾里完成过渡。
4. **章节 HUD**：p×5 取整得当前章节，大标题 `titleIn` 动画（上浮 26px + 模糊散去，cubic-bezier(.22,1,.36,1)）；左侧轨道填充高度 = p；节点逐个点亮。
5. **场景动画**：星云自转、虫洞 shader 条纹流动、晶柱浮沉、太阳呼吸，全部走 `group.userData.update(t)`。

## 配置参数

| 参数 | 位置 | 说明 |
|---|---|---|
| `NEBULA_COUNT` | src/main.js | 星云粒子数：桌面 30000 / 移动 10000（总 Points ≤ 60000 / ≤ 15000） |
| `DPR` | src/main.js | pixelRatio 上限：桌面 2 / 移动 1.5 |
| `spline` 控制点 | src/main.js | 相机路径；改点即改运镜 |
| 章节 `z` / `fog` | src/main.js `chapters` | 场景落位与雾密度 |
| 淡化窗口 | src/main.js | `smoothstep(pi-.20, pi-.07, …)` 两侧宽度 |
| 跟随惯性 | src/main.js | `1 - Math.pow(.002, dt)`，越小越"黏" |
| 三色 | index.src.html `:root` | `--ink:#0B1026` `--cyan:#67E8F9` `--amber:#F59E0B` |

## "看起来不像 AI 写的"六项自查

1. 克制：整页只讲一件事——"从深空回到黎明"的一次旅程，无多余组件。
2. 配色定死三色：深靛蓝底 + 青色 + 收尾琥珀，禁彩虹渐变（穹顶 shader 也只在三色内混合）。
3. 字体讲究：大标题字号 clamp(34px,6vw,64px)、字距 .18em–.5em，短句分行有呼吸感。
4. 禁 Lorem ipsum / emoji：文案为虚构品牌"远望"的中文短句（"把目光抬高三万光年/所有喧嚣都安静下来"）。
5. 手工细节：radial vignette 暗角、canvas 程序化噪点（overlay 7%）、加载态旋转环 + "远望号正在升空"、轨道节点 hover 发光。
6. easing 有物理感：标题 `cubic-bezier(.22,1,.36,1)`、淡化 `easeOutExpo`、相机指数惯性跟随，无 linear。

## 源码结构

```
scroll-journey-3d/
├── index.src.html   # 开发源码入口（样式 + 5 章节文案 + HUD + importmap）
├── src/
│   ├── main.js      # ESM 入口：渲染器 / 样条 / 惯性滚动 / 交叉淡化 / HUD
│   ├── scenes.js    # 5 场景构建（星云 / 虫洞 / 月球 / 晶洞 / 日出），全程序化几何
│   └── utils.js     # 种子随机 / easing / 程序化辉光纹理
├── vendor/three.module.js  # three@0.183.0（本地复制，零网络）
├── README.md
└── index.html       # 打包成品（fx-singlefile.py 生成，单向，不可二次打包）
```

## 重建方式

```bash
cd ~/workspace/fx-lab
cp scroll-journey-3d/index.src.html scroll-journey-3d/index.html
python3 ~/workspace/bin/fx-singlefile.py scroll-journey-3d
```

- 一次性单向打包：禁止对已打包的 `index.html` 再次跑打包器；改源码后从 `index.src.html` 重新 `cp` 再打包。
- 打包器用 esbuild 把 `src/main.js`（three 保持 external）bundle 内联，importmap 的 three 替换为 base64 data URL——成品零外部请求。
- 本机 headless Chromium 禁 `file://` ES module：直接打开 `index.src.html` 会黑屏，这是环境限制不是 bug；验收以打包后 `index.html`（内联 module 无 import）+ console 零错为准。

## 移动端说明

- 触屏滚动即驱动旅程（原生滚动，无需手势库），`scroll` 监听 `passive:true`。
- 小屏自动降级：星云粒子 30000 → 10000（总 Points ≤ 15000），pixelRatio 上限 1.5。
- HUD 适配：轨道左移 12px、高度 30vh，标题字号 clamp 下限 26px。
