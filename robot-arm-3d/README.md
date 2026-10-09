# robot-arm-3d · 交互机械臂

程序化建模的三节机械臂：底座 yaw + 两连杆解析 IK，末端跟随鼠标在目标平面上的投影；按住鼠标夹爪合拢抓取悬浮橙立方体并举起，松开后落下带弹性回弹；右上角面板实时显示各关节角度读数。三种运行模式：跟随 / 自动演示 / 抓取演示。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：科技/工业品牌官网常用的交互机械臂展台（KUKA、Universal Robots 风格的产品页：机械臂随访客鼠标转动、关节读数实时跳动的 HUD 面板）。
- **学的手法**（只学思路，不抄代码）：
  1. 两连杆解析 IK（余弦定理求肘上解），而非数值迭代——解算稳定、无抖动；
  2. 底座 yaw 独立对准目标方位角，俯仰只在径向-垂直平面内解；
  3. 右下角/右上角等宽字体关节读数面板，营造工业控制台质感。
- **代码原创声明**：机械臂全部程序化建模（圆柱/圆台/圆环/方块组合）、IK 求解器、抓取状态机（合爪 attach → 举升 → 松开 detach → 重力下落 → 弹性回弹 → 复位悬浮）、七相位抓取演示脚本均为本模板独立编写；未使用任何物理库（cannon 等），未接触任何原站源码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| IK 解算 | 目标点先经径向夹紧（RMIN 0.55 / RMAX L1+L2−0.12）；yaw=atan2(−tz,tx) 对准；径向-垂直平面内余弦定理求肘上解（肩 θ1=α+β，肘弯折 π−γ）；腕关节反向补偿保持夹爪水平 |
| 关节运动 | 目标点指数阻尼跟随（k=7），关节角阻尼跟随（k=8，yaw 带角度回绕处理）——临界阻尼感，无生硬跳变 |
| 抓取 | 按住：目标自动移向方块、夹爪 0.42s easeOutBack 合拢（带过冲回弹），合拢后 `attach` 到腕部、举升 +0.95；松开：`detach` 回场景，重力下落、触地 restitution 0.38 弹性回弹、静止后 easeInOutCubic 复位悬浮 |
| 自动演示 | 目标走 Lissajous 曲线（径向 1.85+0.45sin、方位角 0.45t、高度正弦），机械臂自行巡游 |
| 抓取演示 | 七相位脚本循环：接近 → 下降 → 合爪 → 举升 → 搬运 → 松开 → 复位，相位间 easeInOutCubic 过渡 |
| 目标标记 | 目标点处橙色脉冲环（1+0.13sin 呼吸）+ 一条垂向地面的细线，鼠标意图可视化 |
| 入场 | 整机从上方 easeOutExpo 落位装配（1.15s），随后标题层 `.is-in` 淡入；加载态"装配中"进度条 |
| 微交互 | 模式按钮 hover 上浮、读数面板呼吸灯、相机随鼠标微视差（±0.35） |

## 配置参数

| 参数 | 位置 | 说明 |
|---|---|---|
| `L1 / L2` | `src/main.js` | 两节臂杆长度，默认 1.6 / 1.4 |
| `SH_H / PLANE_Y` | `src/main.js` | 肩高 1.0 / 目标平面高 1.15 |
| 模式按钮 | 页面底部 | 跟随（默认）/ 自动演示 / 抓取演示，`aria-pressed` 互斥 |
| 读数面板 | 页面右上 | BASE/SHOULDER/ELBOW/GRIP/TARGET/STATE，约 12Hz 刷新 |
| 配色 | `index.src.html :root` | 墨黑 `#101014` / 橙 `#f97316` / 米白 `#e7e5e4`（严格三色，网格/垂线用米白与橙的透明变体） |
| 相机 | `src/main.js` | fov 38 / (4.8, 3.1, 5.8)；窄屏（aspect<0.8）自动拉远 1.38 倍 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只有一个主视觉（机械臂 + 悬浮方块），其余只有按钮 hover、读数刷新、标题淡入等微交互。
2. **配色**：全页严格三色（墨黑/橙/米白），无彩虹渐变；地面网格、垂线均为三色透明变体。
3. **字体**：标题无衬线粗体、字号 clamp(52px, 8.5vw, 116px)、字距 .16em；读数用等宽字体 tabular-nums，kicker → h1 → slogan 三档层级分明。
4. **文案**：真实感中文短句（"指尖所向 · 关节自随" / "按住鼠标，抓起那颗悬浮的橙方块。"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：vignette + SVG 噪点颗粒（1.1s steps 跳动）、"装配中"加载态、极坐标地面网格、橙色定位环、夹爪橙色指尖、目标脉冲环与垂线、读数面板呼吸灯。
6. **easing**：easeOutExpo（入场装配）、easeOutBack（夹爪合拢过冲）、easeInOutCubic（相位过渡/复位）、指数阻尼（关节跟随）、restitution 0.38（落地回弹）；全站无 linear。

## 源码结构

```
robot-arm-3d/
├── index.src.html   # 开发版：结构 + 全部 CSS + importmap（three → vendor）
├── src/main.js      # 全部逻辑（ESM）：场景/程序化建模/解析IK/抓取状态机/演示脚本/HUD
├── vendor/
│   └── three.module.js  # 本地 three（从 cloth-flag-3d 复制，约 1.2MB，非空壳）
├── index.html       # 打包成品（单文件，fx-singlefile.py 生成，勿手改）
└── README.md
```

`src/main.js` 内部分节：缓动工具 → 渲染器/场景/相机 → 灯光 → 材质 → 地面 → 机械臂建模 → 悬浮立方体 → 目标标记 → IK 求解器 → 状态 → 鼠标交互 → 抓取/释放 → 模式切换 → HUD → 主循环。

## 重建方式

```bash
cd ~/workspace/fx-lab/robot-arm-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py robot-arm-3d
# 输出 index.html：single-file OK（esbuild 打包 main.js 内联 + three 走 data: URL importmap）
```

- 打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在。
- 单向打包：改源码后从 `index.src.html` 重新 cp 再跑，禁止对已打包的 `index.html` 重复跑。
- 验证：`NODE_PATH=/tmp/hcshot/node_modules node /tmp/ra-shot.js <out.png> <w> <h> <mobile>`（等 loader hidden 完成态后截图 + 交互测试 + 断言 console 零错误、零 http(s) 外链）。

## 移动端说明

- 断点 640px：标题上移、读数面板移至控制条上方、控制条纵向堆叠（模式三按钮均分一行）。
- 相机：窄屏（aspect < 0.8）自动拉远 1.38 倍，整机入画不被裁切。
- 触摸：canvas `touch-action: none`，pointerdown/move 统一处理，手指拖动即驱动机械臂、按住抓取。
- 性能：pixelRatio 上限 2；阴影 1024；`prefers-reduced-motion` 下入场瞬间完成、噪点动画关闭。

## 验收记录

- 桌面 1280×800：loader 完成态到达、`is-in` 生效、标题 opacity 1、canvas 存在；鼠标移动驱动 base −1.1°→+36.7°；切自动演示 aria-pressed=true；console 0 错；http(s) 外链 0 条。截图 `shots/robot-arm-3d.png`。
- 移动 390×844（touch 模拟）：同上全过；窄屏相机拉远后整机入画。截图 `shots/robot-arm-3d-mobile.png`。
- 抓取交互专项（CDP 真实 pointer 事件）：按住方块 → 状态 `抓取·举升`、GRIP 100%；松开 → `抓取·举升` → `落下` → `就绪`；console 0 错。（headless 软渲染帧率低，动画按帧推进故保持时间加长，真机 60fps 下合爪 0.42s）
- vendor/three.module.js 1272972 字节，非空壳；完成态选择器均带 `html.js` 前缀。
