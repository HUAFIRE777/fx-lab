# vinyl-3d · 黑胶机

一台会自己演奏的黑胶唱片机：点播放，唱臂摆过去、针尖落下，唱片转起来，72 根暖黄音纹光柱跟着程序化合成的 Lo-fi 和弦跳动。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：音乐品牌官网的黑胶播放器视觉（旋转唱片 + 唱臂 + 频谱环）——只学"唱片是主角、唱臂有落针仪式感、频谱围成一圈"这三个手法。
- **学了哪几个手法**：① 凹槽反光：同心环纹 + 两组正交高光条纹，随唱片一起转 ② 落针仪式感：播放→唱臂摆入→针尖落下→开始出声，四步状态机 ③ 频谱不做成条形图，做成环绕唱片的光环。
- **代码原创声明**：本模板所有代码（groove shader、唱臂几何、WebAudio 合成器、交互）均为原创重写，未复制任何原站源码；three.js 仅作为 WebGL 渲染器使用（vendor 本地文件）。

## 动效拆解

- **主视觉（唯一）**：黑胶唱片机。底座 + 转盘（24 颗频闪点）+ 黑胶（凹槽 shader）+ 三色标签 + 唱臂 + 72 柱音纹光环。
- **凹槽 shader**：极坐标 `sin(r*260)` 高频同心环；`pow(abs(dot(d,light)),90)` 两组正交反光条纹；死蜡区（r<0.35）无纹；外圈边缘高光；随机微闪点。条纹随唱片旋转——各向异性高光的物理行为。
- **唱臂四态**：parked（停靠）→ swing（摆入，偏航阻尼）→ drop（落针，升降阻尼）→ tracking（循迹，针尖半径 1.30→0.58 缓慢内移，一面 12 分钟，播完自动停机归位）。偏航角由枢轴位置 + 臂长经余弦定理反解，不是手调的角度。
- **转速**：33⅓（3.49 rad/s）/ 45（4.71 rad/s）两档，阻尼加速 + 皮带传动 wow 抖动（0.22%）；45 转时合成器 BPM 同比提速（92→124）。
- **音纹光环**：AnalyserNode 128 bins → 对数映射到 72 柱；攻击快（rate 0.0001）、释放慢（rate 0.02），有真实频谱的"呼吸感"；未播放时是待机微波纹，页面不死。
- **程序化音源**：Am–F–C–G 四和弦铺底（失谐三角波×4）+ 正弦贝斯 + 高通噪声镲片 + 五声音阶随机游走主音（反馈延迟）。零外部音频文件，点播放才建 AudioContext（浏览器自动播放策略）。
- **完成态**：首帧渲染 10 帧后 loader 淡出、`[data-intro]` 浮现（`html.js` 前缀选择器，无 JS 时默认可见）。
- **手工细节**：底座暖黄细边描边、转盘频闪点、标签环形文字（Canvas 程序化绘制）、唱臂停靠柱、红色唱头壳、vignette + SVG 噪点双层、加载态"针尖落下"。

## 配置参数

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| 转速 | src/main.js `RPM33/RPM45` | 33⅓→3.49, 45→4.71 rad/s | rad/s = rpm×2π/60 |
| 加速阻尼 | src/main.js tick | `damp(..., 0.03, dt)` | 皮带机式缓慢起速 |
| 唱臂偏航阻尼 | src/main.js tick | `damp(..., 0.008, dt)` | 摆入不机械 |
| 落针升降阻尼 | src/main.js tick | `damp(..., 0.004, dt)` | 比摆入更慢，有重量感 |
| 循迹时长 | `SIDE_SECONDS` | 720 s | 一面 12 分钟后自动停机 |
| 音柱数 | `NBARS` | 72 | 光环柱数 |
| 频谱映射 | tick | `pow(i/72,1.6)×100` | 对数映射，低频占更多柱 |
| BPM | `stepDur()` | 92（45 转时 124） | 和弦进行速度 |
| 配色 | CSS `:root` + JS 常量 | #0B0B0C / #FFD9A0 / #D64541 | 全页严格三色 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"黑胶机"一个主视觉；控制条只有播放/转速/音纹/换碟四组。
2. **配色**：黑 #0B0B0C＋暖黄 #FFD9A0＋标签红 #D64541 三色定死；实例色只做暖黄明度变化，无第四色。
3. **字体**：标题用宋体系（Songti SC / STSong / Noto Serif SC），字号 clamp、字距 0.3em，"黑胶机"三字留白呼吸；控制条 12px 系统黑体。
4. **无 Lorem、无 emoji**：文案是中文短句（"唱针落下的那一秒，客厅就回到了 1974。"）；按钮全是文字，无 emoji 图标。
5. **手工细节**：频闪点、死蜡区、标签环形字、唱头壳红色点缀、待机呼吸波纹、点唱片也可播放/暂停。
6. **easing 物理感**：转速/偏航/升降/循迹/音柱/相机视差全部帧率无关阻尼逼近；音柱攻击快释放慢；无 linear。

## 源码结构

```
vinyl-3d/
├── index.src.html   # 开发版（样式/DOM/文案内联；importmap 指向 vendor）
├── src/main.js      # 全部逻辑：three 场景、groove shader、唱臂状态机、WebAudio 合成器、音纹光环
├── vendor/
│   └── three.module.js  # three@0.183.0（667KB；打包时走 data:URL importmap）
├── index.html       # 打包成品（单文件，验收以此为准）
└── README.md
```

唱臂偏航反解：`yawForRadius(r)`——枢轴 P、臂长 L 固定，针尖半径 r → 余弦定理求枢轴-针尖夹角 γ → 针尖方位角 → 偏航角。标签三张：Canvas 512² 程序化绘制（底色＋双细环＋环形字＋RPM 字＋轴孔），淡出→换图→淡入。

## 重建方式

```bash
cd ~/workspace/fx-lab/vinyl-3d
cp index.src.html index.html   # 永远从 src 重新生成，不对手动改成品
python3 ~/workspace/bin/fx-singlefile.py vinyl-3d
```

打包前确认 `/tmp/esb`（esbuild）与 `/tmp/three.module.min.js` 存在；缺失则 `cd /tmp && npm i esbuild ws`，three min 用 esbuild 从 `vendor/three.module.js` 压缩生成。打包器单向：绝不对手动改过的 index.html 重复打包。

截图验收：

```bash
cd ~/workspace/fx-lab
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file://$PWD/vinyl-3d/index.html shots/vinyl-3d.png 1280 800 0
NODE_PATH=/tmp/hcshot/node_modules node ~/workspace/bin/hcshot.js \
  file://$PWD/vinyl-3d/index.html shots/vinyl-3d-mobile.png 390 844 1
```

## 移动端说明

- 390×844 竖屏：控制条自动换行收纳（`flex-wrap`），标题字号 clamp 收缩，右上转速铭牌隐藏（信息已在控制条），hint 行隐藏。
- 触屏：canvas `touch-action:none`，点唱片切换播放/暂停（pointerup + 350ms 内判定，拖拽不算点击）；按钮 `min-height 44px`、`touch-action:manipulation`，无 300ms 延迟。
- 视差：`pointermove` 驱动，移动端手指划过同样生效；`prefers-reduced-motion` 时关闭。
