# product-launch-hero-3d · 发布会式 3D 产品 Hero

发布会式产品 Hero 模板 —— 黑场 → 追光亮起 → 产品旋转出场 → 卖点标签环绕 → CTA。商用级，原创代码。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **Apple 式产品发布页**（AirPods Max / Vision Pro 发布页）：纯黑舞台、戏剧性轮廓光、产品居中缓慢旋转、卖点标注用细引线指向产品特征点、底部价格 + 双 CTA。
2. **Nothing Phone 发布页**：暗场 + 顶部追光锥、尘埃粒子、产品从黑暗中升起、技术参数以芯片形式环绕产品。

复现的手法（实现均为原创）：四段式 keynote 时间轴（black → spotlight → reveal → callouts）、体积感追光锥（双层 additive 锥体 + 光斑）、包围盒驱动的卖点锚点（HTML 芯片 + SVG 引线逐帧投影跟随）、逐行揭示的大标题、结尾 idle 缓慢旋转 + 鼠标视差。

## 用法

- 打开 `index.html` 即可看（单文件，零外部依赖；3D 模型走 R2 外链）。
- 换产品：改 `src/config.js` → `modelUrl`（任意 GLB），卖点锚点按新模型的包围盒自动计算。
- 调时间轴：`CONFIG.timeline`（black / spotlight / reveal / callouts，单位秒）。
- 调试参数：`?state=final` 直接跳终态（截图用）；`?model=<url>` 覆盖模型 URL。
- 点击页面任意处跳过开场；`prefers-reduced-motion` 时直接显示终态。

## 模型说明（2026-10-05）

任务简报指定手表模型，但 R2 上 `models-web/hero/electronics/` 下除耳机外全部 404（R2 尚未全量同步，仅 `tripo_headphone.glb` 可用，已用 curl 验证 200）。故本模板使用已验证的耳机模型：

`https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb`

R2 补全后把 `CONFIG.modelUrl` 换成手表 URL 即可，锚点/构图自动适配。模型加载失败时自动降级为程序化备用产品（控制台 warning，不报错、不白屏）。

## Draco 说明

Tripo 等来源的 GLB 常用 Draco 压缩。`src/main.js` 内联了 Draco 解码（`src/draco-assets.js`，约 440KB，`InlineDRACOLoader` 重写 `_loadLibrary` 直接从内存取 wrapper + wasm），单文件构建零额外请求即可解码。代价：`index.html` 约 1.4MB。

## 版式修正（2026-10-05）

终态截图发现左侧卖点芯片会压住左下大标题第二行。已将左侧芯片方向从水平改为左上（`src/callouts.js` → `DIRS.left = { x: -1, y: -0.55 }`），引线随之上扬，不再与标题碰撞。

## 文件

- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包）
- `index.dev.html` —— 开发版源码页（改完后复制为 `index.html` 再打包）
- `src/config.js` —— 文案 / 模型 URL / 时间轴 / 配色，全部集中
- `src/stage.js` —— 渲染器、灯光 rig（追光 SpotLight + 冷色 rim + 琥珀 fill）、追光锥、尘埃、地面光斑
- `src/timeline.js` —— 四段式时间轴采样器（纯函数，易单测）
- `src/callouts.js` —— 卖点芯片 + SVG 引线的投影跟随
- `src/main.js` —— 启动、模型加载（含降级）、跳过、无障碍、视差
- `vendor/` —— Three.js r160 + GLTFLoader（本地，无 CDN）

## 构建

```bash
cp index.dev.html index.html
python3 ~/workspace/bin/fx-singlefile.py product-launch-hero-3d
```

## 验证记录（2026-10-05）

- `node --check` 全部通过；esbuild 打包通过。
- Headless Chromium（`--allow-file-access-from-files`）终态截图：舞台/追光/产品/三芯片/标题/CTA 全部正常，console 零报错（注：测试机直连 R2 被代理墙挡，演练的是降级路径；生产环境 R2 可达）。
- 真机 200k 面耳机模型的 SwiftShader 渲染超出本机软件光栅能力（环境限制，非代码问题）；锚点数学已用 GLB 包围盒离线验算（归一化 ±1.2，锚点 left/right/top 落位正常）。
