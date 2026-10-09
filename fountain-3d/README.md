# fountain-3d · 水乐喷泉

夜色池面上，中央水炮与三环喷嘴随程序化节拍起舞——kick 托起中央水柱、bass/lead/hat 各管一环，水下灯环与点光源随灯光模式联动编排；三档节奏一键切换，水柱高度随手可调。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：拉斯维加斯 Bellagio 音乐喷泉实拍（水柱随鼓点起伏 + 水下彩灯编排）、国内音乐喷泉广场的夜间灯光秀。
- **学的三个手法**：① 分区编排——不同鼓组（kick/bass/lead/hat）各管一圈喷嘴，水柱高低错落才有"舞蹈感"，而不是整体一起喷；② 水下灯先行——灯光颜色变化永远比水柱快半拍，观众先看到光、再看到水，节奏感翻倍；③ 中央水炮压轴——kick 鼓点只给最粗的中央水柱，低频=力量感，视觉锚点稳。
- **代码原创声明**：以上只学手法。三档节奏的 16 步进音序器、WebAudio 实时合成鼓组（kick/bass/lead/hat 全程序化合成，无音频文件）、GPU 粒子水柱 shader（抛物线 + 通道包络）、水面涟漪/倒影光弧 shader、水下灯环三模式编排逻辑全部手写原创，未复制任何现成喷泉/音频可视化代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 节奏音序器 | 16 步进 × 4 通道（kick/bass/lead/hat）；三档曲目：夜潮 92BPM / 涌泉 120BPM / 霓虹 138BPM，各有独立鼓组 pattern 与 bass/lead 半音走向；视觉与音频共用同一走带时钟 |
| 合成节拍 | WebAudio 实时合成：kick（正弦 150→40Hz 滑音）、bass（锯齿波 + 低通）、lead（三角波五声音阶）、hat（噪声 + 高通）；零音频文件、零外部请求；默认静音走带，点"声音"才出声 |
| 水柱粒子 | 单个 THREE.Points（约 5600 粒）GPU 驱动：vertex shader 里算抛物线 `y=v·t-4.9t²`、通道包络 `uH0–uH3` 缩放柱高、相位循环；颜色按高度青→紫渐变，additive 混合 |
| 通道包络 | 每通道触发后指数衰减 `exp(-dt·4.2)`，叠加待机呼吸（无触发时不熄火）；点击水面触发爆发，包络 ×(1+1.7·衰减) |
| 灯光三模式 | 流光（双色在色相环追逐）、呼吸（青紫固定 + 缓慢呼吸 + 节拍点缀）、爆闪（平时压暗、kick 来时白光爆闪）；颜色 lerp 过渡，水下灯环/池沿光环/三盏点光源同步 |
| 水面 | 全屏 shader：同心涟漪 + 两道旋转光弧（水下灯倒影）+ 中央泡沫随 kick 呼吸 + 点击爆发的扩散环；边缘没入夜色 |
| 水雾光晕 | 程序化 canvas 径向渐变纹理的 additive 精灵，随 kick 包络缩放/明灭 |
| 相机 | 0.05rad/s 缓慢环绕 + 鼠标视差（lerp 2.2/s）+ 高度呼吸 |
| 交互 | 点击水面 raycast → 爆发 + 扩散环；hint 在首次交互/14s 后淡出 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `TRACKS` | main.js | 3 档 | 曲目定义：bpm/root/四通道 16 步 pattern；加曲目照格式追加即可 |
| `RINGS` | main.js | 1+8+12+16 | 喷嘴布局：半径/数量/绑定通道；改数量需同步 `PER` 粒子配额 |
| `PER` | 水柱粒子 | [240,150,150,150] | 每喷嘴粒子数；低端机可整体减半 |
| 包络衰减 | `animate` | `exp(-dt·4.2)` | 触发后水柱回落速度；越大越"脆" |
| 待机呼吸 | `animate` | 0.22±0.10 | 无触发时的最低水位，保证画面不熄火 |
| 水柱滑杆 | 面板 | 100% | 范围 40%–160%，直接乘包络 |
| 灯光过渡 | `tickLights` | `1-exp(-dt·5)` | 模式切换时颜色 lerp 速度 |
| loader 兜底 | main.js | 4500ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--night:#040A15` 夜蓝 / `--cyan:#3FE3FF` 霓虹青 / `--violet:#8A5CFF` 霓虹紫 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——音乐喷泉。星空/地面仅作氛围底，无多余装饰模块。
2. **配色**：严格 3 色（#040A15 / #3FE3FF / #8A5CFF），禁用彩虹渐变；"流光"模式是双色在色相环上追逐，不是全彩跑马灯；暖色零出现。
3. **字体**：中文标题宋体系衬线（Songti SC/STSong/SimSun 系统栈），英文小字大字距（.44em），kick/标题/副标题三级字号字距拉开；零外部字体。
4. **文案**：真实感短句（"水与光的交响""点击水面，唤醒浪花""正在蓄水"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 2px + 霓虹光晕；滑杆拇指 hover 放大；hint 交互后/14s 后淡出；loader 进度条青→紫渐变。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 160ms；灯光颜色用指数 lerp 过渡、水柱包络指数衰减，有物理感。

## 源码结构

```
fountain-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：音序器/WebAudio/水柱粒子/水面shader/灯光/交互/loader
├── vendor/
│   └── three.module.js # three 真品 652KB（从 pagoda-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/fountain-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py fountain-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题缩小上移，控制面板贴底全宽换行，hint/右下 credit 隐藏（触屏直接点）。
- 触屏：点水面用 `pointerdown`，`touch-action:manipulation` 防双击缩放；滑杆/按钮均为触屏友好尺寸。
- 像素比上限 2；低端机可减 `PER` 粒子配额或降像素比上限。
- 无头注意：本机 headless Chromium 用 SwiftShader 软件渲染，页面定时器/rAF 会被拖慢约 8 倍——loader 消退与 intro 入场在真机上是秒级，无头截图需加长等待；不代表页面有问题。
