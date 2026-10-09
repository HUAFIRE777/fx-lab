# satellite-3d · 星环轨道

四颗卫星沿各自轨道环绕一颗程序化地球：夜半球城市灯火点点、晨昏线带着暖橙色余晖缓慢推演，信号波束自星体向地面下行闪烁——为航天科普 / 卫星互联网品牌 hero 而生的深空一页。huafire3d fx-lab — original implementation。

## 参考站点及借鉴点

- **对标对象**：NASA Visible Earth「蓝色弹珠」夜景拼图（昼夜分界 + 城市灯光）与 stuffin.space 式卫星轨道可视化（轨道环 + 星下点波束）。
- **学的三个手法**：① 夜半球城市灯光——灯火只出现在陆地上、成团聚集，是"夜景"的可信度来源；② 晨昏线暖带——昼夜分界不是硬切，日侧边缘一抹暖色过渡；③ 轨道环可视化——细线圆环 + 倾角/升交点各异，一眼读出轨道面差异。
- **代码原创声明**：以上只学手法。值噪声大陆生成、昼夜 shader、云层纹理、大气辉光、卫星/波束/相机控制、真实开普勒周期换算全部手写原创，未复制任何现成地球/卫星特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 程序化地球 | 1024×512 双画布纹理：值噪声 fbm 大陆掩膜（经度 cos/sin 映射无缝）+ 极冰盖；昼纹理深蓝海洋→地球蓝陆地高程，夜纹理 150 团暖橙城市灯火 |
| 昼夜晨昏线 | 自定义 ShaderMaterial：`smoothstep(-0.06,0.22,dot(N,sun))` 混合昼夜，晨昏线处 `exp(-(d/0.16)²)` 叠信号橙暖带，夜侧加微光 |
| 云层 | 512×256 脊状 fbm alpha 纹理独立球壳，比地球自转快 1.35 倍 |
| 大气辉光 | 1.07 倍球 BackSide additive fresnel，边缘地球蓝光晕 |
| 星空 | 1500 点球壳，双色温（少量暖星），sizeAttenuation 关 |
| 卫星 ×4 | 舱体 + 双太阳能板 + 橙色信标精灵（正弦闪烁）；轨道倾角/升交点/半径各异，视觉周期按真实周期比换算（GEO 明显慢） |
| 信号下行波束 | holder `lookAt(地心)`，锥体由星体向地面张开（上窄下宽），additive 橙色呼吸透明度 + 地面落点光斑脉动 |
| 相机 | 自研球面相机：自由环绕（0.045rad/s 自动 + 拖拽 + 滚轮缩放）/ 跟随卫星 / 极轴俯视，三模式指数 lerp 平滑过渡 |
| 点击卫星 | pointerdown/up 位移 <7px 判点击，raycast 热区球 → 右下角信息卡（高度/倾角/速度/周期均为真实开普勒换算），选中轨道环变橙 |
| 时间加速 | 滑杆 ×1–×120，驱动卫星角速度 + 地球自转 + 晨昏线推演，默认 ×24 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `SATS` | main.js | 4 颗 | 天枢一号 550km/53°、天璇二号 1150km/87.9°、天玑三号 20180km/55°、玉衡四号 35786km/0.4°（alt/inc/node/r/sig） |
| `timeScale` | main.js / 滑杆 | 24 | ×1–×120；周期/速度卡片数字是真实物理值，不随滑杆变 |
| 视觉周期 | `Tvis` | 90s×周期比 | 90 秒为 550km 卫星在 ×1 下的视觉周期，其余按真实周期比换算 |
| 地球自转 | `animate` | 140s/圈 | ×1 下自转周期；晨昏线推演 700s/圈 |
| loader 兜底 | main.js | 4500ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--space:#04060C` 深空黑 / `--earth:#2E7CF6` 地球蓝 / `--signal:#FF8A1E` 信号橙 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——卫星环绕地球。无多余装饰模块，信息卡只在点击后出现。
2. **配色**：严格 3 色（#04060C / #2E7CF6 / #FF8A1E），禁用彩虹渐变；橙色只出现在信号/波束/选中态/按钮，蓝色只出现在地球/轨道/文字。
3. **字体**：中文标题宋体系衬线（Songti SC/STSong/SimSun 系统栈，大字距 .24em），英文小字大字距（.4em），层级分明；零外部字体。
4. **文案**：真实感短句（"程序化地球夜景 · 晨昏线推演 · 信号下行"），卫星数据为真实开普勒换算值；无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 2px + 橙光晕；滑杆 thumb 橙色发光、hover 放大；hint 交互后/14s 后淡出；选中卫星信标加亮。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 160ms；相机/波束/信标全部用指数 lerp 或正弦呼吸，有物理感。

## 源码结构

```
satellite-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：噪声/纹理/地球shader/卫星/波束/相机/交互/loader
├── vendor/
│   └── three.module.js # three 真品 652KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/satellite-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py satellite-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题缩小、副标题隐藏；视角切换按钮移到底部面板上方居中横排；控制面板贴底全宽；信息卡变为底部抽屉（bottom:176px）；hint 隐藏（触屏直接点）。
- 触屏：点击/拖拽/缩放全用 pointer 事件统一处理，`touch-action:none` 由相机接管手势。
- 像素比上限 2；纹理生成为一次性 CPU 开销（约 1–3s），loader 覆盖。
