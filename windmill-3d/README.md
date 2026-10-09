# windmill-3d · 风车田野

荷兰式风车立于郁金香花海：四叶风轮随风速旋转、数千株郁金香花浪起伏、云影掠过田野，白昼/暮色两档光照——为旅游 / 农业品牌 hero 而生的田野场景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：荷兰库肯霍夫花田风车明信片构图（风车居中、花海前景、云层纵深）。
- **学的三个手法**：① 风车剪影层次——主风车近景实体 + 远处第二座小风车雾中剪影，拉出纵深；② 花浪起伏——整片花海按正弦相位差摇摆，模拟风掠过花田的波浪；③ 云影掠过——大面积柔和阴影贴地漂移，给静态田野加时间感。
- **代码原创声明**：以上只学手法。风车程序化建模、郁金香 lathe 花杯 + instanced 摆动 shader、云影 canvas 纹理、昼暮光照插值、视角切换阻尼全部手写原创，未复制任何现成风车/花田特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 风车 | 程序化建模：锥形塔身 + 腰箍 + 顶盖 + 四叶风轮（格栅帆面带 0.16 兜风倾角）；转速带惯性（指数趋近目标），无风渐停 |
| 风轮联动 | 风速滑杆 0–10 → 目标角速度 `0.35 + w*0.24 rad/s`；读数实时显示转/分 |
| 郁金香花海 | 3600 实例：lathe 花杯 + 茎 + 叶合并为单几何体，顶点色区分茎叶/花瓣；`onBeforeCompile` 注入摆动——相位取实例世界坐标，花冠处振幅最大；振幅联动风速 |
| 云 | 9 组球体云，x 向漂移 + 越界回卷，速度联动风速 |
| 云影 | canvas 生成 46 团柔和径向阴影纹理，340×340 平面贴地，uv 偏移漂移，速度联动风速 |
| 天空 | 穹顶渐变 shader + 太阳辉光；白昼/暮色两档，`envMix` 指数插值过渡（光强/色温/雾色/穹顶同步） |
| 远景 | 第二座 0.62 缩放风车剪影 + 远山丘，雾中淡化 |
| 相机 | 点击风车 raycast → 远景/近景目标位，`1-exp(-3.2dt)` 阻尼跟随，物理感 |
| loader | 3.2s 进度条 + "正在等风来"；首 3 帧渲染后进完成态，4s 兜底 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `wind` | 风速滑杆 0–10 | 4 | 联动：风轮转速 / 花浪振幅 `0.015+w*0.022` / 云速 / 云影速 |
| 昼/暮 | 白昼·暮色按钮 | 白昼 | `envMixTarget` 0/1，指数插值过渡全部光照参数 |
| `TULIP_COUNT` | main.js | 3600 | 郁金香实例数 |
| `windToRotor` | main.js | — | `w<=0?0:0.35+w*0.24` rad/s |
| loader 兜底 | main.js | 4000ms | 超时强制进入完成态 |
| 配色 | CSS 变量 + 场景 | — | `--sky:#DCEEF5` 晨雾蓝 / `--wood:#8A6B4F` 风车木棕 / `--tulip:#E4574F` 郁金香红；其余均为三色明度衍生 |
| `prefers-reduced-motion` | main.js | — | 命中则风速默认 2、转速×0.35、摆动≈0.02、云速×0.2 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——风车与花海。无多余装饰模块。
2. **配色**：严格 3 色（#DCEEF5 / #8A6B4F / #E4574F），禁用彩虹渐变；帆布米白/土路浅棕/雾蓝均为三色明度衍生，无第 4 色相。
3. **字体**：中文标题宋体系衬线，英文小字大字距（.42em），层级分明；系统栈，零字体请求。
4. **文案**：真实感短句（"四叶风轮转起来的时候，整片花海都在替它数拍子""正在等风来"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮；滑杆 thumb hover 放大；hint 可点、切换视角后淡出。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 120ms；相机/风轮/光照全部指数阻尼，无线性跳变。

## 源码结构

```
windmill-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/风车/花海/云影/交互/loader
├── vendor/
│   └── three.module.js # three 真品 652KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/windmill-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py windmill-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题下移避开右上读数，控制面板贴底全宽，footer 隐藏。
- 触屏：点击风车切换视角用 pointerdown/up 位移 <6px 判定，拖拽不误触；`touch-action:manipulation` 防双击缩放。
- 竖屏（aspect<0.8）远景机位自动拉远至 (38,15,52)，保证风车与花海同框。
- 像素比上限 2；低端机可降 `TULIP_COUNT`。

## 踩坑记录

1. **lathe 花杯法线**：LatheGeometry 的 profile 必须从轴心附近起笔（x≈0.001），否则底部留洞；杯口收分两段点制造花瓣尖感。
2. **实例摆动相位**：`begin_vertex` 注入时 `transformed` 还是局部坐标，相位必须取 `instanceMatrix[3]` 的世界 xz，否则整片花海同相摇摆像果冻。
3. **云影与阴影叠加**：云影平面用 MeshBasicMaterial + transparent，不参与光照，避免和 DirectionalLight 阴影双重变暗；y=0.06 防 z-fighting。
4. **实时阴影贴图在 SwiftShader 下崩溃**：本机无头 Chromium（纯软渲染）下，`PCFSoftShadowMap` + 2048 让页面加载约 4 秒后 renderer 被 SIGKILL；降到 `PCFShadowMap` + 1024 后加载存活，但 `Page.captureScreenshot` 时再次把 renderer 搞死（软光栅回读 MSAA 帧缓冲疑似触发 OOM）。最终方案：**彻底不用实时阴影**，风车接地改用烘焙式 radial blob 阴影（canvas 纹理平面），云影本就是贴地纹理——与本波 coral-reef-3d 等模板做法一致，真机与无头表现统一。
