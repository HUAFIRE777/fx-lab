# ferris-wheel-3d · 摩天轮夜景

夜空下缓慢旋转的摩天轮：轮圈灯珠 + 座舱暖光 + 嘉年华灯串，乐园 / 节日营销品牌 hero 可用。huafire3d fx-lab — original implementation。

## 1. 参考与借鉴点

- 对标对象：嘉年华夜景摄影（长曝光下的摩天轮灯光）。
- 只学了三个手法：① 灯光海洋——轮圈布满灯珠、光晕叠加出 bloom 感；② 座舱水平——座舱公转时永远保持水平；③ 慢速浪漫——转速压到"看得见在动、但不着急"的程度。
- 代码全部原创：轮体 / 座舱补偿 / 灯光模式 / 灯串悬链线均为手写 Three.js，无复制任何现有摩天轮实现。

## 2. 动效拆解

| 模块 | 手法 |
|---|---|
| 轮体旋转 | `wheel.rotation.z` 每帧推进，转速滑杆 0–2x 平滑插值 |
| 座舱水平 | anchor（随轮公转）→ pivot（每帧 `rotation.z = -wheel.rotation.z` 反向补偿）嵌套，不手算角度；另加 x 轴轻微摇摆给物理感 |
| 轮圈灯珠 | InstancedMesh 小球（硬核灯珠）+ 同位置 Points 光晕层（additive sprite 模拟 bloom） |
| 灯光模式 | 暖金 / 霓虹（粉为主、金点缀）/ 彩虹（粉↔金追逐波，严格不出三色盘）；座舱窗光、灯串、轮毂同步变色 |
| 灯串 | 抛物线悬链线 + 金色灯珠 Points，帐篷檐口一圈灯 |
| 夜空 | 双层星星错相闪烁 + 月亮光晕 + 远景城市剪影亮窗 |
| 点击座舱 | raycast 命中座舱体 → 相机 lerp 跟随座舱公转，信息卡显示编号 / 高度；点空白处或 × 返回全景 |
| 相机 | 未聚焦时指针视差（桌面端）；窄屏自动拉远机位 |

## 3. 配置参数表

| 参数 | 值 | 说明 |
|---|---|---|
| `wheelR` | 4.2 | 轮半径（世界单位） |
| `wheelY` | 4.7 | 轮心高度 |
| `gondolas` | 8 | 座舱数 |
| `rimBulbs` | 48 | 轮圈灯珠数（前后圈交错） |
| `baseSpeed` | 0.14 rad/s | 基础角速度 |
| `meterPerUnit` | 7.2 | 世界单位→米（轮直径约 60 米，舱顶高度约 71 米） |
| `starCount` | 650 | 星星数（双层共约 920） |
| 配色 | `#0A1030` 夜蓝 / `#FF5C8A` 霓虹粉 / `#FFD166` 暖黄 | 全页严格三色 |

## 4. "看起来不像 AI 写的"六项自查

1. 克制：整页只有一个主视觉——摩天轮；帐篷 / 灯串 / 天际线全是剪影配角，不抢戏。
2. 配色：死守夜蓝 + 霓虹粉 + 暖黄三色；"彩虹"模式也只是粉金追逐波，UI 文字只用暖白 / 金 / 粉。
3. 字体：中文标题衬线（Songti SC / STSong / Noto Serif SC），英文小字大字距（.5em），数字 tabular-nums。
4. 文案：真实感短句（"转一圈，刚好够讲完一个故事"），无 Lorem ipsum、无 emoji 符号列表（关闭用 × 字符）。
5. 手工细节：vignette 暗角 + SVG 噪点覆盖层（pointer-events:none）；滑杆 thumb 悬停放大；按钮 hover 上浮；座舱摇摆、灯晕呼吸、星星错相闪烁。
6. easing：全页统一 `cubic-bezier(.22,1,.36,1)`，相机跟随用指数阻尼 lerp，有物理感。

## 5. 源码结构

```
ferris-wheel-3d/
├── index.src.html      # 源码页（内联样式 + importmap + loader）
├── index.html          # 打包后单文件（fx-singlefile.py 生成，一次性单向）
├── src/main.js         # 全部逻辑（ESM，import three）
├── vendor/
│   └── three.module.js # Three.js 本地 vendor（667KB 真品，禁外链）
└── README.md
```

main.js 分节：配置 → 渲染器/场景/相机 → 灯光 → 工具（glowTexture）→ 星空月亮 → 城市剪影 → 摩天轮（轮圈/辐条/轮毂/灯珠/座舱pivot）→ 支架 → 地面/帐篷/灯串 → 灯光模式 → 转速/暂停 → 座舱聚焦 → 主循环 → 入场。

## 6. 重建方式

```bash
cd ~/workspace/fx-lab/ferris-wheel-3d
cp index.src.html index.html   # 如已打包过，禁止重复跑打包器
python3 ~/workspace/bin/fx-singlefile.py ferris-wheel-3d
```

注意：fx-singlefile.py 是一次性单向打包——改 src 或 index.src.html 后，先 `cp index.src.html index.html` 恢复再重跑，禁止对已打包的 index.html 重复跑。

## 7. 移动端说明

- 触屏：转速滑杆 / 灯光切换 / 暂停 / 点座舱聚焦全部可点，按钮最小 44px 热区。
- 窄屏（aspect < 0.85）相机自动拉远到 z=17.5，保证轮体横向完整入画。
- 640px 以下：标题缩小、右侧标签与 hint 隐藏、信息卡变为底部浮层、控制栏收紧。
- `prefers-reduced-motion`：转速降为 35%、关闭星星闪烁与座舱摇摆。

## 8. 踩坑记录

1. **座舱水平补偿**：最初想每帧用三角函数手算座舱角度，容易累积误差；改用 anchor → pivot 嵌套，pivot 每帧 `rotation.z = -wheel.rotation.z`，结构即正确，零手算。
2. **灯珠 bloom**：无后期 bloom 通道，用"小球 InstancedMesh（硬核）+ 同位置 Points 光晕（additive radial sprite）"双层叠加模拟，远看即 bloom 感，draw call 只有 2 个。
3. **彩虹模式与三色约束**：brief 要彩虹但全页禁彩虹渐变——实现为粉↔金追逐波（`sin(t*2.2 + i*0.55)` 在粉金之间 lerp），严格不出 `#0A1030/#FF5C8A/#FFD166` 三色盘，UI 配色完全不动。
4. **聚焦座舱跟随**：座舱一直在公转，相机每帧 `getWorldPosition` 取座舱实时位置做 lerp 跟随 + lookAt，而不是只跳一次；高度读数节流 4Hz 更新，避免 DOM 高频抖动。
5. **file:// 下 ES module 限制**：本机 headless Chromium 禁 file:// 相对路径 ESM，截图验收一律测打包后的 index.html（three 已内联为 data: URL），不测 index.src.html。
6. **点击 vs 拖动**：pointerdown/up 距离 > 8px 视为拖动不触发 raycast，避免误触；点空白处关闭聚焦。
