# pagoda-3d · 宝塔夜景

夜色中七层宝塔飞檐翘角，檐下灯笼随风轻摆、逐层点亮，明月高悬、湖面镜像倒影，萤火虫点点——为文旅 / 中式品牌 hero 而生的东方夜景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：江南园林夜游实拍（宝塔亮灯 + 湖面倒影长曝光）。
- **学的三个手法**：① 飞檐翘角——檐口四角上翘外张的剪影是宝塔的"魂"，程序化生成时必须做角部抬升；② 灯笼阵列——暖光点沿每层檐口等距排布、明暗随层递减，是夜景的呼吸感来源；③ 湖面倒影——真实镜像比"画一个倒影"可信得多，用平面反射一次渲染解决月亮/塔/灯全部倒影。
- **代码原创声明**：以上只学手法。飞檐锥体顶点位移、灯笼摆动、平面反射镜像相机、涟漪 shader、月相画布纹理、萤火虫粒子全部手写原创，未复制任何现成宝塔/水面特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 宝塔塔身 | 7 层程序化堆叠：每层方体塔身（向上收分）+ 四棱锥飞檐；檐体顶点位移——底圈四角抬升 0.52×檐高、外张 1.12，次圈抬升 0.18，算出自然翘角曲线 |
| 檐角风铃 | 每层 4 角 ×7=28 枚：细杆 + 小锥铃，深铜色，静置（风只摆灯笼，铃是剪影） |
| 灯笼阵列 | 每层每面中点 1 盏 ×4×7=28 盏：球体灯 + additive 光晕精灵；每盏独立相位正弦摆（x/z 轴 ±0.09rad），风感 |
| 逐层点亮 | 点击塔身/按钮：light 0→7→0；每层目标亮度 lerp（3.2/s），灯体 opacity/光晕/窗光/3 盏暖点光同步跟随 |
| 湖面倒影 | 512 RT 平面反射：镜像相机（位置/视线/up 全反射）先渲染，纹理矩阵 bias×proj×view×lakeWorld，fragment 做投影除法采样 |
| 涟漪 | 点击湖面 raycast 落点 → 8 槽位 uniform 数组；shader 里扩散环 `exp(-((r-t·2.6)·1.6)²)·exp(-t·1.2)`，同时扰动反射 UV、叠加暖色亮环 |
| 明月/云 | 画布纹理三月相（满/半/牙，夜色遮罩画出缺口）+ 光晕精灵；两团薄云在月前正弦漂移，"云遮月"开关控制显隐 |
| 远山 | 两层 ShapeGeometry 锯齿剪影（伪随机山脊），雾中递进 |
| 萤火虫 | 130 粒子 CPU 漂移（正弦游走）+ 整体呼吸明灭，暖色 additive |
| 相机 | 0.045rad/s 缓慢环绕 + 鼠标视差（lerp 2.5/s，±2.4/±1.1）+ 高度呼吸 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `TIERS` | main.js | 7 | 宝塔层数，改动需同步按钮文案 |
| 点亮速度 | `lightUp` lerp | 3.2/s | 每层亮度追踪目标的速度 |
| `RT` | 镜像湖面 | 512 | 反射分辨率；低端机可降 256 |
| 涟漪槽位 | `uRip[8]` | 8 | 同时存在的涟漪上限，超了循环覆盖 |
| 涟漪寿命 | shader | 4s | `age>4` 停止计算 |
| 环绕速度 | `animate` | 0.045rad/s | 关则只剩视差+呼吸 |
| 灯笼摆幅 | `animate` | ±0.09rad | 随风摆动幅度 |
| loader 兜底 | main.js | 4500ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--night:#0D0F16` 墨夜 / `--lantern:#FFB45E` 灯笼暖 / `--moon:#E8EDF5` 月白 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——宝塔夜。无多余装饰模块。
2. **配色**：严格 3 色（#0D0F16 / #FFB45E / #E8EDF5），禁用彩虹渐变；暖色只出现在灯笼/光晕/按钮 hover，月白只出现在月亮/宝刹/标题。
3. **字体**：中文标题宋体系衬线（Songti SC/STSong/SimSun 系统栈），英文小字大字距（.4em），层级分明；零外部字体。
4. **文案**：真实感短句（"七层灯火次第点亮，湖心一月两相望"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 2px + 暖光晕；hint 交互后/12s 后淡出。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 160ms；点亮用指数 lerp 有物理感。

## 源码结构

```
pagoda-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：宝塔/灯笼/湖面反射/月相/萤火虫/交互/loader
├── vendor/
│   └── three.module.js # three 真品 652KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/pagoda-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py pagoda-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题缩小上移，控制面板贴底全宽横排，hint 隐藏（触屏直接点）。
- 触屏：点塔/点湖都用 `pointerdown`，移动端可直接点；`touch-action:manipulation` 防双击缩放。
- 像素比上限 2，反射 RT 固定 512，低端机可降 `RT` 到 256 或减萤火虫数。
