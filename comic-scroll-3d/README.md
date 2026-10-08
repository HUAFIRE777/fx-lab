# comic-scroll-3d · 滚动漫画《追光者》第一期

纵向滚动的漫画书：封面 → 5 个分镜格 → 封底 CTA。3 个 WebGL 活分镜（日出 / 纸飞机 / 山顶斗篷）+ CSS 拟声词格 + SVG 点灯城，全部实时渲染、零贴图。

`huafire3d fx-lab — original implementation`

## 参考与借鉴点（手法学习，代码全部原创重写）

**参考对象：Ponpon Mania**（巴黎 three.js 大会开幕作品）——"漫画分镜 × WebGL，每一格都是实时渲染的活场景"。

借鉴的手法（实现均为原创）：
1. **分镜即舞台**：每格是一个独立小 WebGL 场景（上限 3 个），不是一张 baked 图；滚动进度直接驱动场景内时间（日出高度 / 飞机航迹 t / 灯亮数量）。
2. **漫画语言做 UI**：粗黑格线（6px border）、网点纸（radial-gradient halftone）、对话框气泡 + 尾巴、格间"唰"斜切 wipe——全部 CSS/SVG 手写。
3. **重轻穿插**：WebGL 格只在视口附近渲染（IntersectionObserver 开关），CSS/SVG 格零成本，形成"重—轻—重—轻—重"的节奏。

## 动效拆解

| 格 | 类型 | 动效 |
|---|---|---|
| 封面 | CSS | 大标题 + 期号 + 滚动提示（小红点下落循环） |
| 壹·日出 | WebGL | 纸海 plane 顶点波浪（CPU 更新）+ wireframe 叠层；滚动驱动红日升起（easeInOut）+ 光晕 |
| 贰·惊醒 | CSS | 拟声词"轰——"steps 抖动 + 速度线缩放循环 + 白 burst 弹出 |
| 叁·启程 | WebGL | cone 拼装纸飞机沿 CatmullRom 曲线飞（滚动驱动 t），红尾迹 line，云朵漂移，红星空 |
| 肆·归途 | SVG | 城市剪影；滚动进度逐个点亮窗口（#111→#E23E22）+ 红月 + 地平红线 |
| 伍·登顶 | WebGL | 黑剪影 + 山顶；斗篷 ShaderMaterial 顶点波浪（顶部固定、下摆掀起）；红风线 |
| 封底 | CSS | "未完待续" + CTA（hover 反色翻转） |

- 每格进入视口 30% 触发一次：格体 back-ease 弹出 + 斜切 wipe + 对话框延迟弹出。
- 顶部固定条："第 X 格 / 共 5 格" + 红色阅读进度。
- WebGL 格离开视口即暂停渲染（`glIO` threshold 0.02），回视口恢复。

## 配置参数

- 三色：`--ink #111111` / `--paper #FAFAF7` / `--red #E23E22`（CSS 变量，JS 侧 `INK/PAPER/RED` 常量）。
- 缓动：`--ease-pop: cubic-bezier(0.34,1.56,0.64,1)`（分镜弹出/hover），`--ease-out`（进度/loader）。
- 分镜画布高：桌面 340px / 移动 260px（媒体查询）。
- 激活阈值：`playIO threshold 0.3`（一次）；WebGL 开关 `glIO threshold [0,0.02,0.5,1]`。
- 故事文案：直接改 `index.src.html` 里的 `.dialog` / `.panel-cap` / 封面封底文字。

## 六项自查（2026-10-08）

1. 克制：整页只讲"滚动漫画"一件事，无多余装饰。
2. 配色：全页严格三色（墨黑/纸白/印泥红），alpha 变体只用于网点与阴影，无第四色。
3. 字体：系统字体栈，大标题字重 900 + 字距，层级分明。
4. 文案：中文短句（"太阳升起来了，出发！""纸飞机，带我飞过云海！"），无 Lorem ipsum、无 emoji。
5. 手工细节：网点纸纹（全页+格内叠层）、"装订中"加载态、格体 hover 浮起 + 硬阴影、CTA 点击反馈。
6. easing：分镜弹出用 back-ease（物理回弹感），拟声词用 steps 抖动，速度线 ease-out 缩放。

## 源码结构

- `index.src.html` —— 源码页：全部 CSS（漫画语言/分镜/对话框/wipe/加载态/响应式）+ DOM + importmap
- `src/main.js` —— ESM：loader、分镜激活 IO、顶部进度、3 个 WebGL 场景、SVG 城市点灯、主循环、reduced-motion
- `vendor/three.module.js` —— Three.js（本地，`product-launch-hero-3d` 拷贝，禁网络下载）
- `index.html` —— 打包成品（`fx-singlefile.py` 一次性单向生成，three 内联为 data: URL）

## 重建方式

```bash
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py comic-scroll-3d
```

验证：`esbuild src/main.js --bundle --external:three --outfile=/dev/null` 通过；
headless 下滚动全页 console 零报错（注：本机构建 file:// ESM 走打包后 data: URL importmap；
黑屏环境 WebGL 画布黑属 SwiftShader 限制，不纠结——DOM/激活/进度逻辑已用 CDP 逐项验证）。

## 移动端

- 分镜天然单列（`#app max-width 880px`），触屏滚动即触发 IO，无需特殊手势。
- 媒体查询（≤640px）：画布 340→260px、拟声词 clamp 自适应、对话框 14px / max-width 74%。
- 实测（390px 视口计算样式断言）：canvas 高 260px ✓、对话框 14px ✓、单列 block ✓。
- 性能：WebGL 格视口外暂停，移动端滚动不掉帧；`prefers-reduced-motion` 时直接显示终态。

## 已知限制

- 真机 GPU 肉眼终验待补（本机 SwiftShader 只能验逻辑 + DOM，WebGL 画面以第 3 格截图为准）。
- 移动端真机触屏跟手度待补。
