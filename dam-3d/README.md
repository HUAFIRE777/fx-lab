# dam-3d · 大坝泄洪

混凝土大坝横跨山谷，三孔泄洪闸门抬起后，巨量水流沿抛物线倾泻而下——水舌、落点水花、弥漫雾气三层粒子叠加，泄洪量滑杆 / 闸门开关 / 慢动作三组控制实时改变水势。为水利 / 基建 / 能源品牌 hero 而生的泄洪场景。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：水电站泄洪航拍（spillway discharge aerial footage）与三峡泄洪纪录片镜头。
- **学的三个手法**：① 三层水体叠加——实心"水舌"曲面打底 + 飞溅粒子给质感 + 落点泡沫与雾气收尾，单靠粒子撑不起水量感；② 抛物线弹道——水不是垂直掉下去的，是带着初速被"扔"出去的，落点在坝脚前方；③ 闸门机械感——钢闸板匀速升降，水势跟着开度走，关闸时水流是"收回去"而不是凭空消失。
- **代码原创声明**：以上只学手法。坝体/闸门/边墩/栏杆程序化几何、水舌抛物线曲面、三态粒子系统（水舌/水花/雾）、混凝土 canvas 纹理、泡沫/雾团 canvas 纹理全部手写原创，未复制任何现成水利特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 坝体 | BoxGeometry 主体 + canvas 程序化混凝土纹理（水渍条纹 / 施工缝 / 噪点），PCFSoft 阴影 |
| 闸门 | 3 孔钢闸板，`gateT` 0→1 匀速升降（0.55/s），位置/水势/泡沫全部挂同一开度 |
| 水舌曲面 | 按弹道预计算抛物线（`y=LIP-4.9t²+0.6t, z=8.6+5.8t`）的 26 段 ribbon，canvas 竖条纹纹理滚动，透明度跟开度 |
| 水粒子 | 单一 Points（11000 池，SoA）三态：水舌（抛物线+重力）→ 落水转水花（上抛+扩散）→ 死亡转雾团（膨胀+上升）；自定义 Shader 圆点柔边 |
| 落点泡沫 | 每孔一 CircleGeometry，canvas 泡沫纹理，缓慢旋转，透明度跟泄洪量 |
| 雾气 | 大尺寸低透明度粒子 + 页面级 `.haze` 径向罩（纯 z-index 层，不用 blur，避开压平坑） |
| 环境 | canvas 天空渐变 + Fog + 6 座 flat-shading 锥体远山 + 6 朵漂移云精灵 + 上下游水面 |
| 相机 | 基位 ±1.4 缓慢呼吸漂移，lookAt 锁坝体中部 |
| 慢动作 | `timeScale` 1 ↔ 0.22，粒子/纹理/闸门/相机（相机不跟慢动作）统一走 dt 缩放 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| 泄洪量滑杆 | 0–100% | 70% | 每孔发射率 = 泄洪量 × 开度 × 620/s；水舌透明度/泡沫同步 |
| 闸门开/关 | `#gateBtn` | 开 | `gateTarget` 0/1，`gateT` 以 0.55/s 匀速趋近；关闸后水流收回 |
| 慢动作 | `#slowBtn` | 关 | `timeScale=0.22`，看清水滴弧线 |
| `MAX_FLOW` | main.js | 14800 | 三孔全开 100% 标称流量 m³/s，右上仪表实时显示 |
| `PMAX` | main.js | 11000 | 粒子池上限；全开约 9700 存活 |
| `GATE_W` / 孔数 | main.js | 7m / 3 孔 | 泄洪口净宽与数量 |
| 落差 | — | 26m | 唇缘 -3.4m → 下游水面 -26m，面板标注 |
| loader 兜底 | main.js | 4000ms | 超时强制完成态 |
| 配色 | CSS 变量 | — | `--concrete:#AEB6BC` 混凝土灰 / `--water:#6FC3F2` 水蓝 / 白（严格 3 色） |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——泄洪。远山/云/栏杆都是 context，无多余装饰模块。
2. **配色**：严格 3 色（混凝土灰 / 水蓝 / 白），禁用彩虹渐变；天空渐变只走蓝白两端。
3. **字体**：中文标题系统衬线栈（Songti SC / STSong / SimSun），英文小字大字距（.42em），数字 tabular-nums；零 Google Fonts。
4. **文案**：真实感短句（"闸门抬起来那一刻，水就有了自己的意志""能听见混凝土在低鸣"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层；混凝土纹理含施工缝与水渍；按钮 hover 上浮 + 光晕；滑杆 thumb hover 放大；闸门按钮有 `.on` 激活态。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 130ms，闸门匀速丝杠感，慢动作 0.22 物理感。

## 源码结构

```
dam-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/坝体/闸门/水舌曲面/三态粒子/控制/prewarm
├── vendor/
│   └── three.module.js # three 真品 667KB（从 submarine-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/dam-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py dam-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。打包前确认 `/tmp/esb`（esbuild）与 `/tmp/three.module.min.js` 存在——VM 重置会清空 /tmp，缺失时：`npm i esbuild` 进 /tmp/esb，`cp vendor/three.module.js /tmp/three.module.min.js`。

## 移动端说明

- 390×844 布局：标题压缩至顶部（h1 33px），流量仪表右上缩小，控制面板贴底全宽（tip 隐藏），footer 隐藏。
- 触屏：滑杆/按钮均为原生控件可直接操作；`touch-action:manipulation` 防双击缩放。
- 像素比上限 2；`prefers-reduced-motion` 下相机呼吸与云漂移关闭、模拟降速。

## 踩坑记录

1. **无头截图水幕未成型**：headless Chromium rAF 被限到约 1fps，3.5 秒等待只跑几帧，粒子场稀疏。修法：`boot()` 里 `prewarm()` 同步推进 240 步（4 秒模拟），第一帧即为成型水幕；截图另用 preJS 强制 `loader.display='none'` + `[data-intro]` 补 `is-in`。
2. **闸板黑塔问题**：闸板金属度 0.65 在阴影里近乎纯黑、开启位高出坝顶太多，像三座黑塔。修法：颜色提亮到 #9AA4AB、金属度降到 0.35、开启高度从 +5.6m 降到 +4.4m。
3. **file:// 下 ES module**：打包后 importmap 的 three 走 data:URL、main.js 已内联，无外部 module 请求，file:// 可正常跑，console 零错（仅 SwiftShader 性能 warning，环境侧）。
4. **VM 重置清 /tmp**：打包中途 esbuild 与 three.module.min.js 被清空导致 FileNotFoundError。修法：按"重建方式"一节重装后重打；vendor 真品在仓库内不受影响。
