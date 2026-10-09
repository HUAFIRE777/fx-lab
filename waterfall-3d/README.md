# waterfall-3d · 瀑布 FALLS

程序化悬崖 + GPU 粒子瀑布：数千水粒子从崖顶倾泻而下（位置更新全在 vertex shader，curl 式双层扰动），底部撞击出水花与雾气，水面波纹法线扰动 + 泡沫扩散环；相机缓慢自动环绕，可拖拽视角、滚轮推拉。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：旅游/矿泉水品牌官网常用的水流 hero（纵向大面积水流 + 底部雾化 + 深色背景衬托水光）。
- **学的手法**（只学思路，不抄代码）：
  1. 粒子轨迹不走 CPU，每粒子只存 4 个种子属性（横向位置/相位/速度倍率/随机），下落、扩散、扰动全在 vertex shader 里按时间解析计算，数千粒子零 CPU 开销；
  2. 水流纵向拉丝感用 point sprite 的 fragment 程序化竖条纹理（高斯收窄 + 上下柔化），而非贴图；
  3. 底部"撞击—溅射—雾化"三层结构（水花抛物线粒子 + 大 soft sprite 雾气 + 水面泡沫环）是这类 hero 的通用做法。
- **代码原创声明**：悬崖置换函数（fbm + 中央水道凹陷）、瀑布/curl 扰动公式、水花抛物线参数、水面四层方向波偏导、昼暮 lerp 体系、自研轨道相机（拖拽+惯性+自动环绕）均为本模板独立编写；未接触任何原站源码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 悬崖 | `PlaneGeometry(17,12.5,150,100)` CPU 一次性置换：value-noise fbm 起伏 + 中央水道 U 形凹陷（瀑布由此流下）+ 两侧峭壁外推纵深；顶点色按"湿润带/崖顶受光/山脊"混入流光蓝；分 8 帧消化，不阻塞加载 |
| 瀑布粒子 | GPU Points（桌面 6500/移动 2600），`t=fract(time·spd+phase)`，`y=top−t²·H` 重力加速；两层反向旋转正弦做 curl 式扰动（强度随 t 增大）；fragment 竖条高斯纹理；AdditiveBlending |
| 水量 | 滑杆 5–100 → `uFlow 0.15–1.6`：同时控制下落速度、扩散宽度、水花强度与粒子休眠比例（`step(rnd·1.7, uFlow)`），目标值指数趋近（物理感） |
| 水花 | 1100 点，撞击点向外抛物线溅射 `y=h·sin(πt)`，alpha 按 `(1−t)^1.6` 衰减，尺寸同步收缩 |
| 雾气 | 42 个大 soft sprite，缓慢上升循环，alpha 按 `sin(π·rise)` 淡入淡出；暮时浓度提升 |
| 水面 | ShaderMaterial：四层方向波解析偏导求法线 → fresnel 流光蓝 + 镜面高光；撞击点泡沫扩散环（`sin(d·8−t·4.2)` 行波 + 高频碎裂）；远处混入雾色 |
| 相机 | 自研轨道：拖拽改目标方位角/俯仰角（指数跟随惯性），滚轮推拉 9–20；自动环绕 0.055rad/s，可一键开关 |
| 昼/暮 | `uDayMix 0↔1` 指数过渡：背景/雾色/雾距/半球光/方向光/瀑布亮度/泡沫强度七参数联动 lerp；暮 = 雾更浓、光压暗、瀑布提亮 28% 制造对比 |
| 加载 | 构建任务分帧队列（悬崖 8 块 + 粒子/水花/雾/水面），进度条实时更新；完成后 loader 淡出 → `html.js.is-in` 标题/控制条 reveal |

## 配置参数

| 参数 | 位置 | 说明 |
|---|---|---|
| `CFG.falls/splash/mist` | `src/main.js` | 粒子数：桌面 6500/1100/42，移动 2600/450/20 |
| `CFG.topY/halfW` | `src/main.js` | 崖顶出水口高度 6.3 / 瀑布半宽 1.85 |
| 水量滑杆 | 页面底部 | 5–100，默认 65；速度/扩散/休眠比例联动 |
| 自动环绕 | 页面底部 | 开关，默认开（`prefers-reduced-motion` 下默认关） |
| 昼/暮 | 页面底部 | 两档切换，七参数 lerp 过渡约 1.5s |
| 配色 | `index.src.html :root` | 深渊蓝 `#04121a` / 流光蓝 `#38bdf8` / 泡沫白 `#f0f9ff`（严格三色） |
| 相机 | `src/main.js` | fov 42 / 目标 (0,2.9,0) / 半径 14（滚轮 9–20） |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只有一个主视觉（瀑布水流），其余只有标题淡入、滑杆、开关等微交互；无多余装饰元素。
2. **配色**：全页严格三色（深渊蓝/流光蓝/泡沫白），无彩虹渐变；岩体明暗全部由顶点色 + 光照算出，水光由 shader 算出。
3. **字体**：标题宋体栈、字号 clamp(52px,7.2vw,104px)、字距 .12em，大标题有呼吸感；层级 kicker → h1 → 描述 → 控制条四档分明。
4. **文案**：真实感中文短句（"三千尺白练，一滑到底。" / "凝水成形"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：vignette + SVG 噪点颗粒（1.1s steps 跳动）、崖顶水舌流动亮带、泡沫扩散行波、水道湿润带顶点色、暮时瀑布提亮对比。
6. **easing**：easeInOutCubic/easeOutExpo（reveal/过渡）、指数趋近（水量/昼暮/相机惯性）；全站无 linear。

## 源码结构

```
waterfall-3d/
├── index.src.html   # 开发版：结构 + 全部 CSS + importmap（three → vendor）
├── src/main.js      # 全部逻辑（ESM）：噪声/相机/悬崖/水舌/瀑布/水花/雾/水面/昼暮/加载
├── vendor/
│   └── three.module.js  # 本地 three r160（约 1.2MB）
├── index.html       # 打包成品（单文件，fx-singlefile.py 生成，勿手改）
└── README.md
```

`src/main.js` 内部分节：配置/缓动/噪声 → 渲染器/场景 → 轨道相机 → uniforms → 悬崖 → 水舌 → 瀑布粒子 → 水花 → 雾气 → 水面 → 昼暮 → UI → 分帧加载 → 主循环。

## 重建方式

```bash
cd ~/workspace/fx-lab/waterfall-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py waterfall-3d
# 输出 index.html：single-file OK（esbuild 打包 main.js 内联 + three 走 data: URL importmap）
```

- 打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在。
- 单向打包：改源码后从 `index.src.html` 重新 cp 再跑，禁止对已打包的 `index.html` 重复跑。
- 验证：`NODE_PATH=/tmp/hcshot/node_modules node /tmp/waterfall-shot.js <out.png> <w> <h> <mobile>`（等 loader hidden 后截图 + 断言 console 零错误、零 http(s) 外链）。

## 移动端说明

- 断点 640px：标题字号收至 clamp(44px,13vw,64px)、控制条换行居中（滑杆缩至 110px、分隔线隐藏）。
- 性能降级：粒子数减半（瀑布 2600/水花 450/雾 20）、pixelRatio 上限 1.5（桌面 2）；shader 零噪声函数调用（纯解析正弦）。
- 触摸：canvas `touch-action: none`，pointer 事件统一处理拖拽视角；滚轮推拉在触屏无对应手势，默认半径 14 已取景完整。
- 安全区：标题与控制条含 `env(safe-area-inset-*)`；`prefers-reduced-motion` 下自动环绕默认关闭、粒子时间冻结。
