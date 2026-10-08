# papercraft-3d · 纸间故事：一场纸上的散步

滚动驱动的纸雕绘本世界 —— 纸片小人阿纸沿小径行走，滚轮即脚步，穿过村庄、森林、湖泊三幕。

`huafire3d fx-lab — original implementation`

## 一句话

纸暖白 + 鼠尾草绿 + 陶土三色定死，所有贴图离屏手绘、几何顶点手抖，滚动驱动纸片小人走完三章绘本，章节切换时整页纸翻过去。

## 参考与借鉴点

**参考对象：Aimee's Papercraft World 式纸雕插画风 3D 世界**（2026"反抛光"审美回潮代表）。只学手法，不碰代码：

1. **手绘贴图烘焙到 3D 几何** —— 参考其"纸纹/蜡笔笔触长在模型上"的做法，本模板全部纹理用离屏 canvas 手绘生成（纸纹噪点、手抖多边形边缘、多层错位蜡笔圆），再贴到 flat-shaded 低多边形上。
2. **纸片角色沿路径行走** —— 参考其剪纸小人设定，阿纸由薄纸片拼成（头/身/四肢均为纸片盒），沿 `CatmullRomCurve3` 行走，腿摆相位由行走距离驱动。
3. **滚动驱动章节** —— 参考其章节式世界结构，一条小径穿村庄→森林→湖泊三幕，滚动进度即行走进度，章节切换配纸页翻动转场。

实现全部原创重写，无任何第三方代码复制。

## 动效拆解

- **滚动→行走**：`scrollY/最大滚动` 得目标进度，指数阻尼平滑（`smoothK=4.2`）营造纸的跟手感；小人位置/朝向由曲线 `getPointAt/getTangentAt` 采样，腿摆相位 = 累计行走距离 × 3.4。
- **相机跟随 + 手持晃动**：相机目标 = 小人位置 + 固定偏移，阻尼跟随（`camK=3.0`）；晃动是三组正弦叠加的伪噪声（1.7/3.1/5.3Hz），幅度 0.22 米，`prefers-reduced-motion` 时归零。
- **纸页翻动转场**：章节变化时整页纸色 plane 从左扫到右（`skewX` 微倾斜 + `cubic-bezier(.65,0,.35,1)`，720ms），字幕卡在转场 45% 处换文案。
- **字幕卡回弹**：`cubic-bezier(.34,1.56,.64,1)` easeOutBack 缩放进场，物理感。
- **印章**：hover 触发按压动画（放大→下压→回弹），纯 CSS keyframes。
- **环境生命**：炊烟循环上升、涟漪扩散、纸船摇晃、云漂移、纸屑飘落、近景纸花随鼠标视差（阻尼 4/s）。

## 配置参数

`src/main.js` 顶部 `CONFIG`：

| 参数 | 默认 | 说明 |
|---|---|---|
| `scrollVh` | 460 | 页面总高（视口倍数）= 散步路程 |
| `camOffset` | [2.4, 5.4, 13.0] | 相机相对小人的偏移 |
| `lookAhead` | [1.6, 1.9, 0] | 视线前瞻点 |
| `swayAmp` | 0.22 | 手持晃动幅度（米） |
| `smoothK` | 4.2 | 滚动阻尼系数 |
| `camK` | 3.0 | 相机跟随阻尼 |
| `dprDesktop/dprMobile` | 2 / 1.25 | 像素比上限（移动端降采样） |
| `wipeMs` | 720 | 纸页翻动时长（ms） |

章节文案在 `src/diorama.js` → `CHAPTERS`；三色在 `src/paper.js` 顶部。

## 六项自查

- [x] 克制：整页只讲一个核心动效（滚动→行走），环境动画均为配角
- [x] 配色：纸暖白 #F7F0E1 / 鼠尾草绿 #9CAF88 / 陶土 #C67B5C 三色定死，其余为三色明暗
- [x] 字体：系统字体（Songti/PingFang 衬线标题 + 黑体正文），字号层级分明
- [x] 文案：中文短句绘本语气，无 Lorem ipsum、无 emoji、无 AI 味排比
- [x] 手工细节：纸纹噪点罩层、暗角、加载态（裁纸·糊纸·晾干）、hover（印章按压/纸花视差）
- [x] easing：字幕 easeOutBack 回弹、滚动/相机指数阻尼、印章按压回弹，均有物理感

## 源码结构

```
papercraft-3d/
├── index.src.html      # 源码页（importmap + <script type=module src=src/main.js> + 全套 DOM/CSS）
├── index.html          # 打包成品（fx-singlefile.py 生成，一次性单向）
├── src/
│   ├── main.js         # 入口：滚动驱动、相机跟随+手持晃动、章节转场、印章、兜底
│   ├── paper.js        # 手绘贴图工具箱：纸纹/蜡笔/手抖多边形/顶点抖动 + 三色定义
│   ├── diorama.js      # 三幕场景：天空/远山/云/村庄/森林/湖泊/纸花/纸屑 + 路径曲线
│   └── walker.js       # 纸片小人阿纸：纸片拼装 + 行走相位动画
├── vendor/
│   └── three.module.js # Three.js r160（MIT，本地，无 CDN）
└── README.md
```

## 重建方式

```bash
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py papercraft-3d
```

打包器做三件事：`src/main.js` 经 esbuild 打包内联（`three` 保持 external）、importmap 的 `three` 换成 base64 data: URL、CSS 已在 `index.src.html` 内联。成品单文件、零外部请求，双击即看（断网可开）。

测试钩子（URL 参数，不进正式包逻辑）：`?nogl` 跳过 WebGL（验 DOM/场景搭建）、`?lowfx` 降质渲染、`?still=FW,FH,TX,TY,TW,TH` 分块摆拍视角、`?freeze` 只渲染一帧、`?clean` 隐藏 DOM 覆盖层、`?scrollfrac=0.x` 跳转滚动位置。

## 移动端

- 触屏滚动即章节推进（原生滚动，无需额外手势库）。
- `dprMobile=1.25` 降采样 + 小屏字幕卡/印章自适应布局（`@media max-width:768px`）。
- `prefers-reduced-motion`：手持晃动与翻页转场关闭，字幕直接切换。
