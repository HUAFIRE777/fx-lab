# tiny-planet-3d · 一颗小星球

球面重力行走模板 —— 开场着陆俯冲 → 小宇航员在低多边形小星球上自由行走 → 走近地标弹出信息卡。商用级，原创代码。

`huafire3d fx-lab — original implementation`

## 一句话

把"导航"做成一次小小的太空着陆：你是一名宇航员，降落在一颗住着树、蘑菇屋和灯塔的小星球上，用 WASD 在球面上散步，走近灯塔 / 大树 / 小屋，就会看到它们想告诉你的事。

## 参考与借鉴点

- **参考对象**：Messenger（Awwwards 2026 开发者年度奖，Igloo 出品）。
- **借鉴点（仅手法，不碰代码）**："一颗可以走上去的小星球、导航做成空间探索"——即用一颗可步行的微缩星球承载全部导航，信息入口藏在星球上的地标里，走到哪看到哪。
- **原创实现**：本模板全部代码重写。星球地形是程序化噪声位移的低多边形球体；景观（树 / 蘑菇屋 / 路灯 / 围栏 / 小湖）全部由 Three.js 几何体拼装；宇航员是胶囊体 + 球形头盔的拼装角色；大气辉光是手写的菲涅尔 backside shader。

## 动效拆解

1. **开场**：标题"一颗小星球" + "点击着陆"按钮，星球在标题下方缓慢漂移（相机环绕），星空 + 暗角 + 噪点营造深空感。
2. **着陆俯冲**：点击后 3.2 秒一镜到底 —— 相机从太空沿弧线俯冲到宇航员身后，`easeInOutCubic` 驱动位置、`easeOutCubic` 驱动 up 向量过渡，落地即进入跟随视角。
3. **球面行走**：WASD / 方向键 / 移动端摇杆。位置每帧约束回球面（`pos.normalize() * R`），角色 up = 位置法线，朝向用 quaternion slerp 平滑转向；走路带正弦弹跳 + 前倾 + 脚步粒子。
4. **跟随相机**：始终位于宇航员身后上方，`lookAt` 星球中心方向，`camera.up` 持续对齐角色 up —— "头顶永远是天"。位置与 up 均用 damp/lerp 平滑。
5. **地标交互**：走近灯塔 / 大树 / 小屋一定距离，头顶冒出 DOM 标签（投影跟随）；点击标签弹出信息卡（`easeOutBack` 入场），分别是关于我们 / 作品 / 联系方式。
6. **环境生命力**：灯塔光束旋转、大树顶星闪烁、小屋炊烟升腾、路灯珊瑚色光晕。

## 配置参数

`src/main.js` 顶部 `C` 对象集中可调：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `R` | 30 | 星球半径 |
| `walkSpeed` | 7 | 行走速度（单位/秒） |
| `camDist` / `camH` | 8.2 / 3.4 | 跟随相机：身后距离 / 高度 |
| `touchDist` | 9 | 地标标签触发距离（×2.2 为显示半径） |
| `space` / `sand` / `coral` | #0A1628 / #E8D5B5 / #FF6B6B | 全页三色：深空 / 沙色 / 珊瑚 |

地标位置：`LM`（灯塔 / 大树 / 小屋三处单位向量）；地标文案在 `addLandmark` 的第三个参数里直接改。
调试参数（验收用）：`?land` 自动点击着陆，`&walk` 着陆后自动前走，`&nodive` 跳过俯冲直接进入游玩态（headless 慢环境截图用）。

## 六项自查

- [x] **克制**：整页只讲"小星球行走"一个核心动效，无多余装饰。
- [x] **配色**：全页严格三色 —— 深空 #0A1628、沙色 #E8D5B5、珊瑚 #FF6B6B（点缀：按钮 / 标签 / 灯塔 / 天线灯），水面为深空系加深。
- [x] **字体**：系统字体栈，大标题 200 字重 + 宽字距，有呼吸感。
- [x] **无 Lorem ipsum / emoji**：全部中文短句，温柔语气（"穿上宇航服，上来走走吧"）。
- [x] **手工细节**：vignette 暗角、SVG 噪点颗粒、加载态（"正在点亮星球"）、按钮 / 标签 hover 微交互。
- [x] **easing 物理感**：俯冲 easeInOutCubic、相机 damp 跟随、信息卡 easeOutBack 入场、走路正弦弹跳。

另：**完成态可达** —— loader 在首帧渲染后必定消失（`requestAnimationFrame` 回调）；着陆按钮常驻可点；信息卡可开可关。**零外部请求**（three.js 走本地 vendor 打包内联，无字体 / CDN / 图片外链）。

## 源码结构

- `index.src.html` —— 源码页骨架（DOM 结构 + 全部样式：暗角 / 噪点 / 加载态 / 开场 / 标签 / 信息卡 / 摇杆）
- `src/main.js` —— 唯一逻辑入口（ESM）：场景 / 星球 / 景观 / 地标 / 宇航员 / 输入 / 相机 / 主循环
- `vendor/three.module.js` —— Three.js r160（本地，无网络下载）
- `index.html` —— 打包成品（`fx-singlefile.py` 一次性单向生成，可直接双击打开）

## 重建方式

```bash
cd ~/workspace/fx-lab/tiny-planet-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py tiny-planet-3d
```

注意：`fx-singlefile.py` 为一次性单向打包 —— 改 `src/` 后必须重新 `cp` + 打包，不要对已打包的 `index.html` 二次打包。

## 移动端说明

- 操作：左下角虚拟摇杆（pointer 事件，多点触控友好），桌面端自动隐藏。
- 性能降档（`isTouch` 时自动生效）：像素比上限 1.25、星空 700 颗、路灯点光源只保留 3 盏（其余保留发光体外观）。
- 视口：`user-scalable=no` + `touch-action: none`，防止手势缩放 / 橡皮筋滚动干扰行走。
- `prefers-reduced-motion`：星星闪烁与标签呼吸动画自动关闭。

## 验证记录（2026-10-08）

- `node --check` + esbuild bundle 通过（25KB ESM，three external）。
- Headless Chromium（SwiftShader）：console 零 ERROR（仅 SwiftShader 软件渲染的 INFO 性能提示，环境相关非代码问题）；开场 / 游玩双截图正常。
- 说明：SwiftShader 下单帧渲染以秒计，3.2s 的着陆俯冲在 headless 里被拉长（`dt` 钳制 0.05 所致）；真机 60fps 下为设计时长。此为测试环境限制，非代码 bug。
