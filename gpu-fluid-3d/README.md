# gpu-fluid-3d · GPGPU 粒子流体

指尖搅动深海 —— 20 万粒子在 GPU 里做流体模拟，鼠标划过之处皆起涟漪。

`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **参考对象**：大阪世博"数字水体"（2025 巴黎 three.js 大会爆点作品）——GPGPU 粒子物理、全 GPU 模拟渲染。
- **借鉴的手法**（实现均为原创重写）：
  1. ping-pong 双浮点 RenderTarget：位置纹理 / 速度纹理各两张，逐帧交替读写，CPU 零参与；
  2. fragment shader 内做 curl 噪声平流（值噪声 fbm → 势场 → 中心差分求旋度），无散场天然像流体；
  3. 顶点 shader 从位置纹理取点渲染（vertex texture fetch），20 万粒子一次 draw call；
  4. 屏幕空间交互：粒子经 projView 矩阵投影到 NDC，鼠标径向力再沿相机右/上轴还原为世界方向，相机环绕时交互不错位。

## 动效拆解

- **水**：青蓝色，curl 平流主导，高速粒子泛起泡沫白。
- **烟**：灰白色，curl 减弱 + 上升浮力 + 高阻尼，袅袅上升。
- **星尘**：深紫蓝色，绕 Y 轴旋涡 + 向心引力，银河式旋转。
- **搅动**：鼠标/触屏移动在速度场加径向力，力度随指针速度变化，松手后指数衰减。
- **爆发**：点击处释放一圈扩散的脉冲环（半径随时间扩大、强度指数衰减）。
- **模式切换**：速度场清零重置 + 颜色/参数指数趋近过渡，无跳变。
- **相机**：缓慢环绕 + 轻微俯仰浮动；粒子按速度三段着色（底色→主色→泡沫白），additive 叠加发光。

## 配置参数

`src/main.js` 顶部 `MODES` 数组即全部可调参数：

| 参数 | 含义 |
|---|---|
| curl | curl 平流强度（水 2.3 / 烟 0.9 / 星尘 1.1） |
| damp | 速度阻尼（指数衰减系数） |
| buoy | 上升浮力（烟 0.55） |
| swirl / grav | 绕 Y 轴旋涡强度 / 向心引力（星尘 1.7 / 0.35） |
| freq / flow | 噪声空间频率 / 时间流速 |
| stir | 鼠标搅动力系数 |
| size | 点精灵基础尺寸 |
| maxSpeed | 速度钳制上限 |
| colorA / colorB | 低速底色 / 高速主色（高速段再向泡沫白过渡） |

粒子预算：`particleBudget()` —— 桌面 200000 / 移动（coarse pointer 或小屏）40000；硬件并发 ≤4 再减半；dpr > 2.5 的桌面端 ×0.75。帧率 EMA 低于 40（预热 8 秒后）自动减半重建，最多降两档、下限 25000。

调试：`?mode=0|1|2` 直接进指定模式（截图用）；`?n=16384` 覆盖粒子数（低端机/软件光栅调试用）；`?forcetype=byte` 强制字节纹理（无浮点 FBO 环境的管线验证，位置量化、只看编译与调度）；`window.__fluid.setMode(i)` / `window.__fluid.info()`。

## 六项自查

1. **克制**：整页只讲"流体"一个核心动效，无多余装饰层。
2. **配色**：全页 3 色定死 —— 深海 `#04121F` + 水青 `#38E1C6` + 泡沫白 `#F4FBFA`（星尘模式的紫蓝只出现在粒子本身，UI 层不动）。
3. **字体**：系统字体栈，大标题字距 `.14em`、副标题 `.28em`，层级分明。
4. **文案**：中文短句（"指尖所至，皆起涟漪""移动搅动流体 · 点击释放爆发"），无 Lorem ipsum、无 emoji。
5. **手工细节**：CSS 径向暗角、加载扫描条、按钮 hover 上浮 + 按压缩放、active 态辉光。
6. **easing**：CSS 用 `cubic-bezier(.22,1,.36,1)`；模式参数用指数趋近（`1-exp(-3.2dt)`，物理感的 ease-out）；标题入场 `.9s` rise 动画 `forwards` 定格，完成态必达。

## 源码结构

- `index.src.html` —— 页面骨架：importmap（`three` → `vendor/three.module.js`）、标题/模式按钮/底部小字/加载态/降级层、全部样式
- `src/main.js` —— 唯一逻辑文件：GLSL（值噪声 fbm / curl 场 / 位置-速度双 sim / 点精灵渲染）+ JS（ping-pong 调度、交互、模式、自适应预算）
- `vendor/three.module.js` —— Three.js（本地，不走网络）
- `index.html` —— `fx-singlefile.py` 打包成品（单文件，零外部请求）
- `README.md` —— 本文件

## 重建方式

```bash
cd ~/workspace/fx-lab
cp gpu-fluid-3d/index.src.html gpu-fluid-3d/index.html
python3 ~/workspace/bin/fx-singlefile.py gpu-fluid-3d
```

打包器做三件事：esbuild 打包 `src/main.js`（three 保持 external）内联为 module script；importmap 的 `three` 换成 base64 data URL；输出单文件 `index.html`。**一次性单向**：不要对已打包的 `index.html` 重复跑，改 `src/` 后重新 `cp` 再打包。

验证：`/tmp/esb/node_modules/.bin/esbuild src/main.js --bundle --format=esm --external:three --minify` 通过；headless Chromium 打开打包页 console 零报错（无 WebGL 时走降级分支，同样零报错）。

## 移动端

- 粒子预算自动降到 40000（`pointer:coarse` 或窄屏判定），低端机（硬件并发 ≤4）再减半。
- 触屏拖动即搅动流体（pointer 事件统一处理），点按触发爆发脉冲。
- 模式按钮移到底部中央、横向排列，标题字号缩小；`user-scalable=no` 防双击缩放误触。
