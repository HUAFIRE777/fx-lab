# dark-cinema-3d · 暗黑电影风 3D 模板

一句话：深空暗场里的粒子星云 + 远景发光圆环，配 30 秒循环的缓慢电影运镜与强对比中文排印——把网页做成电影。

## 参考与借鉴点

- 参考对象：**Active Theory**（科技品牌 3D 交互的"安全牌天花板"）。
- 借鉴的手法（只学手法，代码全部原创重写）：
  1. Cinematic dark：纯黑底 + 单一电光蓝点缀的克制配色；
  2. 大面积缓慢漂浮的粒子星云做氛围底，additive 发光；
  3. 远景一个巨大的发光几何剪影当视觉锚点；
  4. 全自动缓慢运镜（dolly + 轻微 pan）叠加鼠标视差；
  5. 超大排印 + 关键词高亮，滚动驱动的章节式叙事。
- 未借鉴：Active Theory 的具体模型、文案、布局与任何代码。

## 动效拆解

| 模块 | 实现 |
|---|---|
| 粒子星云 | 两套 `THREE.Points`（大 900 / 小 2400，移动端 260/800），球壳分布，additive 混合，蓝白随机配色；`opacity = base + 0.16·sin(t·0.55+phase)` 呼吸明暗；星云组整体 0.008 rad/s 极慢旋转 |
| 发光圆环 | 双层 `TorusGeometry` wireframe（外环 r=30 / 内环 r=21），置于 z=-150，电光蓝 0.09–0.14 透明度 + 0.035 振幅微光呼吸，z 轴 0.02 rad/s 自转 |
| 电影运镜 | 30 s 循环：dolly z 摆动 ±2.6、pan x/y 不同周期正弦叠加；鼠标/触摸视差 ±2.4/±1.6，阻尼系数 0.045（物理惯性感）；章节越深机位越近（每章 -1.1） |
| 章节呼吸推近 | 切换章节时 `pushT:1→0`，相机 z 叠加 `-3.4·sin(pushT·π)`——推进再回落，一次呼吸 |
| clip reveal | 标题按行 `overflow:hidden` 包裹，`translateY(112%)→0`，`cubic-bezier(.19,1,.22,1)` 1.15s，逐行 0.12s 延迟 |
| 加载态 | 黑屏中央电光蓝细线 + 百分比（1.5s easeOutCubic）；完成后线展开成 hero 标题下划线（`scaleX` 展开动画） |
| 后期 | CSS radial vignette + canvas 噪点 grain（160×90 每 130ms 重绘，opacity .07，pointer-events none） |
| hover | 能力矩阵 4 格：边框变电光蓝 + 外发光 + 上浮 4px；CTA 按钮蓝底从左展开填充 |

## 配置参数

`src/main.js` 顶部 `CONF`：

- `dprMax`：桌面 2 / 移动 1.5
- `big` / `small`：粒子数量、尺寸、分布半径、基础透明度
- `grainEvery`：噪点刷新间隔（桌面 130ms / 移动 220ms）
- 运镜周期：dolly 30s、pan x 43s、pan y 37s（`cinematicPose` 内）
- 章节深度：每章机位推进 1.1（相机 z 表达式内）

## 六项自查

1. 克制：整页只讲"暗黑电影感"一个核心动效（星云+运镜），不堆砌——通过。
2. 配色：全页 3 色——纯黑 `#050507`、电光蓝 `#4D7CFE`、白字 `#f4f6ff`，禁用彩虹渐变——通过。
3. 字体：系统字体栈，字号/字距/层级分明，大标题 `clamp(52px,9.5vw,132px)` 有呼吸感——通过。
4. 文案：中文短句，无 Lorem ipsum、无 emoji——通过。
5. 手工细节：vignette + film grain + 加载态 + hover 微交互齐全——通过。
6. easing：reveal 用 `cubic-bezier(.19,1,.22,1)`，运镜用阻尼 lerp，加载/推近用 easeOutCubic 与正弦包络，有物理感，不用 linear——通过。

## 源码结构

```
dark-cinema-3d/
├── index.src.html   # 开发入口：importmap(three→vendor) + module src/main.js + 内联样式
├── index.html       # 打包成品（fx-singlefile.py 一次性生成，勿手改）
├── src/main.js      # 全部逻辑：星云/圆环/运镜/章节/reveal/加载/噪点
├── vendor/
│   └── three.module.js  # 本地 three（禁网络下载，从 product-launch-hero-3d 复制）
└── README.md
```

## 重建方式

```bash
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py dark-cinema-3d   # 一次性单向打包
```

- 打包前先过 esbuild：`/tmp/esb/node_modules/.bin/esbuild src/main.js --bundle --external:three --format=esm`
- headless 验收：`node ~/workspace/bin/hcshot.js "file://$PWD/index.html" out.png 1600 900 0`，console 零错
- **不要对已打包的 index.html 重复跑打包器**（importmap 已是 data:URL、JS 已内联）

## 移动端

- 粒子降档：大 900→260、小 2400→800；DPR 上限 1.5；噪点刷新 130ms→220ms
- 触摸视差：`touchmove` 同样驱动相机视差目标
- 能力矩阵 2 列→1 列；隐藏章节导航点；`prefers-reduced-motion` 时运镜停为固定机位
- 零外部请求：无 CDN、无字体、无图片，file:// 双击可开
