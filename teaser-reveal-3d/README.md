# 3D 新品预告揭晓（teaser-reveal-3d）

黑场中产品剪影缓慢旋转，访客按住拖拽"亲手撕开幕布"，露出产品真容 + 发布日期 + 邮箱订阅。商用级，原创代码。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **Nothing Phone 预告页**：暗场 + 发光剪影制造悬念，不直接给产品真容，用"要不要揭开"的交互吊胃口。
2. **Apple 式 teaser**：纯黑舞台、戏剧性轮廓光、发布日期大字体定格结尾。

复现的手法（实现均为原创）：旋转剪影的 2D 幕布层（指针擦除 + 网格计数判定揭开比例）、撕幕布后 3D 产品出场 + 发布信息逐行揭示、红色轮廓光/尘埃/胶片噪点营造悬念感、底部倒计时"距揭晓还有 X 天" + 邮箱订阅闭环。

## 动效拆解

1. **加载态**：黑底 + 品牌字 + 红色滑杆，`#loading.done` 渐隐移除（opacity 动画完成后从 DOM 移除）。
2. **黑场剪影**：2D canvas 幕布层盖住整个视口，程序化绘制耳机剪影（头梁圆弧 + 两耳罩 + 红色边缘光晕），以 0.12 rad/s 缓慢旋转。
3. **拖拽揭幕**：`pointerdown/move` 在幕布 mask 上用柔边戳擦除（`destination-out`）；48×30 计数网格实时算出揭开百分比，提示文案同步（"继续 — 已揭开 37%"）。
4. **自动揭晓**：揭开 ≥45% 时触发 `finishReveal()` —— 幕布整体 1.3s 淡出并移除，发布信息（眉题 → 大标题 → 日期 → 参数 → 订阅表单）逐行 `stagger 0.12s` 浮现。
5. **真容舞台**：3D 场景加载本地 Draco 压缩耳机模型（`models/electronics/tripo_headphone.glb`；失败/超时/无 WebGL → 程序化剪影兜底，首屏永远完整）；红色轮廓光 + 白色主光 + 产品后方红色光晕 + 130 颗红色悬浮微尘；idle 缓慢自转 + 呼吸浮动 + 相机微摆。
6. **订阅闭环**：邮箱正则校验，错误红边聚焦；提交成功表单隐藏、左侧红线成功态文案。

## 配置参数（`src/config.js`）

- `modelUrl` —— 本地耳机模型（Draco 压缩，`models/electronics/tripo_headphone.glb`）；换任意 GLB 地址即可。
- `countdownTarget` —— 倒计时目标（`2026-11-11T00:00:00+08:00`），页面自动算"距揭晓还有 X 天"。
- `revealThreshold` —— 揭开比例阈值（0.45）。
- `loadTimeoutMs` —— 模型加载超时（9000ms），超时即降级。
- `colors` —— 全页三色：纯黑 `#000` / 白 `#fff` / 红 `#e8341c`。
- 调试：`?state=open` 直接跳揭晓态（截图用）。

## Draco 说明

耳机 GLB 含 Draco 压缩。`src/main.js` 内联 Draco 解码（`src/draco-assets.js`，约 440KB，`InlineDRACOLoader` 重写 `_loadLibrary` 直接从内存取 wrapper + wasm），单文件构建零额外请求即可解码。`index.html` 约 1.47MB。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"撕幕布揭晓"一个动效，3D 只是被盖住的真容，不堆砌。
2. **配色定死**：黑/白/红三色全页统一，红色只出现在边缘光、CTA、倒计时数字、眉题。
3. **字号字距层级**：大标题 `clamp(56px,9vw,120px)` 字距 .1em；眉题 12px 字距 .4em；倒计时数字 26px 红色 tabular-nums。
4. **文案真实感**："按住并拖拽，亲手揭开它""距揭晓还有 37 天后揭晓""留下邮箱，发布当天提醒你""订阅成功。发布当天，第一时间发到你的邮箱。"无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角、SVG 胶片噪点、红色悬浮微尘、幕布上的噪点颗粒、加载滑杆、按钮 hover 上浮 + 红光阴影。
6. **easing**：统一 `cubic-bezier(.2,.8,.2,1)` / GSAP `power3.out`，幕布撕除 `power2.inOut`，物理感而非 linear。

## 源码结构

- `index.template.html` —— 开发模板（CSS 内联 `<style>`，importmap `"three": "./vendor/three.module.js"`）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止对它二次打包**，改源码后重新 `cp` 再跑）
- `src/config.js` —— 文案 / 模型 URL / 阈值 / 配色
- `src/main.js` —— 幕布层（剪影/擦除/计数/揭晓）+ 3D 舞台 + 模型加载降级 + 订阅表单
- `src/draco-assets.js` —— Draco 解码器内联资源
- `vendor/` —— `three.module.js` + `addons/loaders/{GLTFLoader,DRACOLoader}.js` + `gsap.min.js`（全部本地）

## 重建命令

```bash
cd ~/workspace/fx-lab/teaser-reveal-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py teaser-reveal-3d
```

## 移动端说明

- `matchMedia('(pointer: coarse)')` 降低像素比上限（1.5）省电；擦除半径按 `min(W,H)` 自适应；hint 文案改为"按住滑动，揭开幕布"。
- `<760px` 断点：倒计时/hint 上移避免遮挡、大标题字距收紧、表单内边距压缩。
- `prefers-reduced-motion`：剪影旋转/自转/微尘全部停止，仍可拖拽揭幕。
- 经验（2026-10-05）：`renderer.setSize(w,h,false)` 不写 canvas 行内尺寸，高 dpr 下 canvas 会按属性像素撑破布局 —— `#gl canvas` 必须 `width/height: 100%`（lead-magnet-3d 同修）。

## 验收记录（2026-10-05）

1. console 检测：零错误（模型本地加载；加载失败时走程序化剪影兜底，不报错）。
2. URL 扫描：模型为本地相对路径；gsap.min.js 注释内的 `gsap.com` 许可链接未被请求，无外部资源请求。
3. 截图：`shots/teaser-reveal-3d.png` —— 黑场红边耳机剪影 + hint + 倒计时 37 天；`?state=open` 揭晓态：兜底 3D 耳机 + 听澜 One 大标题 + 日期 + 参数 + 订阅表单，全部正常。
4. 文案：无 Lorem/emoji 列表。
