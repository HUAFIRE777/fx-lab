# product-viewer-lite · 轻量 3D 商品查看器

<!-- huafire3d fx-lab — original implementation -->

独立站商品详情页里的**内嵌小 3D 查看器**——不是整页，是一个可复用的 Web Component
`<product-viewer>`，丢进任何页面即用。

## 一句话用法

```html
<product-viewer src="https://你的CDN/耳机.glb" auto-rotate background="#141414">
  <button data-hotspot data-pos="0.48,-0.31,0"
    data-title="40mm 镀钛动圈" data-desc="低频下潜深，人声不闷。">1</button>
</product-viewer>
```

## 它做什么 / 不做什么

- 做：拖拽旋转（带阻尼惯性）、滚轮 / 双指缩放、自动旋转、2–3 个热点卖点卡。
- 不做：后期特效、粒子、阴影烘焙。多实例共存，首屏外不初始化，滚出视口停渲染。

## 轻量手段

| 手段 | 说明 |
|---|---|
| 按需渲染 | 相机静止即停 rAF；`document.hidden` / 滚出视口直接停 |
| 懒初始化 | IntersectionObserver，首屏外实例不建 WebGL 上下文 |
| 低端降级 | `hardwareConcurrency<=4` 或 `deviceMemory<=4` 时 DPR=1、关抗锯齿 |
| 自研轨道 | 手写 80 行旋转/缩放，不引 OrbitControls |
| draco 内联 | 解码器 wasm 打包进文件，draco 压缩模型零配置即播 |

## 参数

| 属性 | 说明 |
|---|---|
| `src` | GLB 地址（必填，需允许跨域，见下） |
| `auto-rotate` | 出现即自动旋转；拖动后 2.5s 缓恢复；卖点卡打开时暂停 |
| `rotate-speed` | 转速（度/秒，默认 14） |
| `background` | 底色，任何 CSS 颜色；`transparent` 得透明底 |
| `poster` | 封面图：无 WebGL / 加载失败时降级显示 |
| `alt` / `exposure` | 无障碍描述 / ACES 曝光（默认 1.0） |
| `data-hotspot` | 热点按钮：`data-pos="x,y,z"`（归一化模型坐标，最长轴为 [-1,1]，中心为原点）、`data-title`、`data-desc` |

JS API：`viewer.ready`（首帧 Promise）、`viewer.addHotspot({pos,title,desc})`、
`viewer.setAutoRotate(bool)`；模块导出 `CONFIG` 可改全局默认（`rotateSpeed`、`dracoWorkers` 等）。

## 如何嵌入已有页面

**路线一：拿走单文件（推荐）。** 先打包：

```bash
python3 ~/workspace/bin/fx-singlefile.py product-viewer-lite
```

得到单文件 `index.html`（Three.js、draco 解码器、组件、样式全内联）。
从里面复制三段进你的页面：`<style>`（演示样式，可删）、importmap 那段、
`<script type="module">`（组件本体，整站放一次），然后任意位置放
`<product-viewer>` 标签。

**路线二：用源码版。** 把 `src/` 和 `vendor/` 原样拷进站点（保持相对位置），页面加：

```html
<script type="importmap">{ "imports": { "three": "./vendor/three.module.js" } }</script>
<script type="module" src="src/main.js"></script>
```

（组件样式在影子 DOM 内自带，不依赖 `src/styles.css`，那是演示页样式。）

**注意**：如需把模型换到自己的 CDN，记得给 CDN 配 `Access-Control-Allow-Origin` 跨域头，否则浏览器会拦截 GLB 加载。默认本地 `models/` 目录无此问题。

## 目录

```
product-viewer-lite/
├── index.html          # 演示页（打包后的单文件，点开即看）
├── poster.jpg          # 降级封面（无 WebGL 时显示）
├── build.sh            # 从模板重建单文件（packer 单向，勿对已打包文件重跑）
├── README.md
├── src/
│   ├── index.template.html  # 演示页源码模板
│   ├── product-viewer.js    # <product-viewer> 本体
│   ├── main.js              # 演示页入口（注册组件 + API 示例）
│   └── styles.css           # 演示页样式
└── vendor/
    ├── three.module.js      # three r160（MIT）
    ├── GLTFLoader.js        # three r160（MIT，改了一行相对路径）
    ├── DRACOLoader.js       # three r160（MIT）
    ├── BufferGeometryUtils.js
    ├── RoomEnvironment.js   # three r160（MIT，环境反射）
    ├── draco-wrapper-text.js# draco wasm wrapper 内联（MIT）
    └── draco-wasm-b64.js    # draco decoder wasm base64 内联（MIT）
```

## 验收记录（2026-10-05）

- headless Chromium（SwiftShader）实测：3 实例全部 `ready=true`，热点数 3/0/2 正确，
  点击热点卖点卡正常浮出（标题"40mm 镀钛动圈"），console 零报错。
- 真机待验：手势旋转/双指缩放的跟手度、弱网加载进度条（headless 下 data: URL 不触发
  progress 事件，真实 https 会正常显示百分比）。

## 红线

只学通用手法（Web Component、IntersectionObserver 懒加载、球面轨道阻尼），
未复制任何现有网站代码。第三方库均为 MIT（three.js r160）。
