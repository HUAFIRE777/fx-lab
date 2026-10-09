# iceberg-3d · 冰山漂浮

极夜北极海中一座程序化冰山缓缓漂浮旋转：displaced 二十面体冰山 + 冰裂纹 emissive 三档发光、海面 shader 波浪与 44 块浮冰随波起伏、远山剪影与天际极光余晖——为环保 / 探险品牌 hero 而生。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：极夜北极海冰山延时摄影（arctic iceberg timelapse）。
- **学的三个手法**：① 冰山形态——水上尖峭、水下宽大的不对称体，裂缝沿冰体谷底走；② 极夜光感——深蓝主调里冰面只吃冷色高光，水面几乎不反光、只留暗色倒影；③ 极光余晖——地平线附近的低透明绿幕，舞动缓慢不抢戏。
- **代码原创声明**：以上只学手法。JS value-noise 位移、aCrease 裂缝属性、onBeforeCompile 注入的裂纹 emissive、倒影 shader、海面波浪 shader、极光 fbm shader、浮冰 instanced 起伏、交互逻辑全部手写原创，未复制任何现成冰山/海洋特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 冰山 | IcosahedronGeometry(9, 4) 按 fbm 噪声径向位移（±36%），底部加宽 taper、水下部分没入海面；flatShading |
| 冰裂纹发光 | 位移时同步算出 ridged 噪声谷底 → `aCrease` 属性；onBeforeCompile 在 `emissivemap_fragment` 后注入 `totalEmissiveRadiance += 冰蓝 × vCrease × uCrack`；带 2.1Hz 呼吸 |
| 水中倒影 | 同一几何体、scale.y=-0.92 镜像，自定义 shader：顶点按深度加波浪抖动，片元从冰蓝灰向深海渐隐、alpha 同步衰减 |
| 海面 | PlaneGeometry 100×100 段，onBeforeCompile 顶点注入三正弦波浪 + `vWave`；波峰处 diffuse 叠加冰蓝高光；透明度 0.88 让倒影透出 |
| 浮冰 | 44 块 InstancedMesh（displaced icosahedron 压扁），JS 侧用与 shader 同式的 `waveH()` 逐帧算高度 + 轻微摇摆 |
| 远山剪影 | 两层 seeded 山脊 Shape（#060d1a / #040a14），雾里拉开纵深 |
| 极光余晖 | 远处大平面 fbm 幕布 shader：curtain 带 × 垂直衰减 × 光丝正弦，#7DFFB2，alpha 上限 0.8×0.5，additive |
| 天空/星 | BackSide 穹顶渐变 shader（地平线微亮 → 天顶近黑）+ 320 颗静态星点 |
| 相机 | 持续 0.05rad/s 极慢环绕 + 鼠标/触屏视差（lerp 跟随，系数 2.5） |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| 冰裂纹三档 | 面板按钮 Ⅰ/Ⅱ/Ⅲ 或点击冰山 | Ⅰ | `uCrack` = 0.12 / 0.7 / 1.6，带呼吸系数 |
| `雾浓度` | 滑杆 0–100 | 38 | `FogExp2` density = v/100×0.02（0–0.02） |
| `FLOE_COUNT` | main.js | 44 | 浮冰 instanced 数量 |
| `ORBIT_R` / 环绕速度 | main.js | 31 / 0.05rad/s | 相机轨道半径与角速度 |
| bobbing | `tick()` | — | y=1.4+sin(t×0.55)×0.45，pitch/roll ±0.02，自转 0.03rad/s |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态（与 700ms 正常路径幂等） |
| 配色 | CSS 变量 | — | `--bg:#0A1628` 极夜蓝 / `--ink:#BFE9FF` 冰晶 / `--aurora:#7DFFB2` 极光绿点缀 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——漂浮的冰山。无多余装饰模块。
2. **配色**：严格 3 色（#0A1628 / #BFE9FF / #7DFFB2），禁用彩虹渐变；极光绿只出现在 kicker、极光幕布、读数点缀位。
3. **字体**：中文标题系统衬线栈（Songti SC 优先），英文小字大字距（.44em），层级分明；零外部字体。
4. **文案**：真实感短句（"在融化之前，先被看见""海面正在结冰"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 + 光晕；滑杆 thumb hover 放大；点击提示首次切换裂纹后淡出。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 150ms。

## 源码结构

```
iceberg-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/冰山/海/浮冰/极光/交互/loader
├── vendor/
│   └── three.module.js # three r160 真品 667KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/iceberg-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py iceberg-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题下移避开右上读数，控制面板贴底全宽，footer 隐藏；点击提示移到面板上方。
- 触屏：`touchmove` 视差 + `pointerup` 点选冰山（位移 <8px 才算点击，防误触）；`touch-action:manipulation` 防双击缩放。
- 像素比上限 2，海面 100×100 段 + 44 浮冰逐帧矩阵更新在中端机无压力；低端机可降 `FLOE_COUNT`。

## 踩坑记录

1. **倒影不跟自转**：初版倒影挂在 bobGroup 下、冰山自转挂在 iceberg 上，两者脱节。修法：加 `spinGroup` 中间层，冰山与倒影同为子节点一起转，镜像 scale.y=-0.92 自动把旋转方向也镜像掉。
2. **浮冰首帧跳变**：初始矩阵用的随机 x/z 缩放与 update 里重算的不一致，loader 消失瞬间轻微跳一下。修法：缩放因子存进 floe 对象，update 只复用。
3. **`prefers-reduced-motion` 下交互无回显**：静止首帧后点裂纹按钮只改 uniform 不渲染。修法：`renderOnce()` 在交互回调里补一帧。
