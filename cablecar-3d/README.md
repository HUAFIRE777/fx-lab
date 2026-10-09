# cablecar-3d · 缆车山景

一辆红色缆车沿钢索缓行，穿过翻涌的云海与三层群山剪影，到站减速停靠播报——为旅游 / 山景地产 hero 而生的云端旅程。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：高山缆车 POV 延时影像（cable car POV）。
- **学的三个手法**：① 车厢沿索道走 Catmull-Rom 曲线、进站前减速的节奏感；② 云海用多层 FBM 错速平移造"翻涌"而非贴图平移；③ 远山剪影多层透明度递减 + 雾，拉出纵深。
- **代码原创声明**：以上只学手法。GLSL FBM 云海、山脊剪影 canvas 生成、车厢程序化建模、进站减速状态机、双视角相机阻尼全部手写原创，未复制任何现成缆车/云海特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 钢索 | Catmull-Rom 曲线（10 控制点，塔顶/垂度交替），TubeGeometry 半径 0.07，`getPointAt` 等弧长取点保证匀速 |
| 缆车 | 程序化建模：红舱体 + 深色窗带 + 云白顶 + 悬挂臂 + 滑轮组；`lookAt(切线)` 定向，舱体正弦摇摆（速度耦合） |
| 云海 | 大平面 5 阶 FBM fragment shader，双层噪声错速平移；26 个径向渐变云团精灵近景漂移造视差 |
| 群山 | canvas 程序化山脊剪影（正弦齿峰 + 随机抖动），远/中/近三层透明度 .42/.68/1，近层点缀松树三角 |
| 支架塔 | 双腿 + 斜撑 + 横臂 + 索轮，车厢经过时自然视差 |
| 进站停靠 | 前方 0.022t 内线性减速 → 对准站台 t → 站牌 UI 显示 3 秒 → 加速离站；两端到站自动折返 |
| 相机 | 车外跟随（切线后侧 + 侧向偏移，damp 3.2）/ 车内视角（舱内前视，damp 5.5）一键切换 |
| 天空 | 穹顶渐变 shader（山青雾 → 云白）+ Fog 纵深 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `sliderV` | 速度滑杆 0–100 | 50 | 基速 `lerp(0.004→0.030)` t/s；`prefers-reduced-motion` 下默认 25 |
| `boost` | 滚轮 | 0 | 每次滚轮叠加 ≤0.004，上限 0.030，指数衰减（1.1/s） |
| `dwell` | main.js | 3s | 到站停靠时长 |
| 进站减速区 | main.js | 0.022t | 前方站进入该距离开始线性减速 |
| `PUFFS` | main.js | 26 | 云团精灵数量 |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态 |
| 配色 | CSS 变量 | — | `--pine:#2E4A3E` 山青 / `--cloud:#F2F5F3` 云白 / `--red:#D84A3A` 缆车红点缀 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——缆车穿越云海。无多余装饰模块。
2. **配色**：严格 3 色（#2E4A3E / #F2F5F3 / #D84A3A），禁用彩虹渐变；红色只出现在车厢、站牌、滑杆、kicker 点缀位。
3. **字体**：中文标题宋体栈衬线，英文小字大字距（.42em），层级分明；零外部字体。
4. **文案**：真实感短句（"坐上这趟缆车，整座山都是你的窗外""滚轮可临时加速"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（pointer-events:none）；按钮 hover 上浮；滑杆 thumb hover 放大；到站红色站牌播报；站点按钮当前站高亮。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，相机/速度/摇摆全部阻尼过渡，intro stagger 150ms。

## 源码结构

```
cablecar-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：场景/钢索/缆车/云海/群山/交互/loader
├── vendor/
│   └── three.module.js # three 真品 667KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/cablecar-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py cablecar-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题上移避开右上读数，控制面板贴底全宽，footer 隐藏；站牌与提示错开上下位置。
- 触屏：站点直达/视角切换均为按钮点击；滚轮加速在触屏无滚轮事件，靠速度滑杆代替。
- 像素比上限 2；云团精灵与桌面共用数量，低端机可降 `PUFFS`。

## 踩坑记录

1. **站台顶棚穿模**：初版站台加了红色顶棚，车厢进站时舱体正好卡进顶棚里。修法：开放式登车甲板（无顶），甲板顶 y=5.9 低于舱底，站牌立柱偏置避开摆动区。
2. **CDP evaluate 读数乌龙**：自写验收脚本的 `Runtime.evaluate` 模板字符串返回 0/5，截图却显示完成态。debug 脚本直验得 5/5、loader 已移除——是验收脚本表达式拼接问题，非页面 bug。教训：截图才是全量真相，布尔读数要交叉验证。
3. **无头 file:// 下 ES module**：打包后 importmap 的 three 走 data:URL、main.js 已内联，无外部 module 请求，file:// 可正常跑，console 零错。WebGL 细节仍以真机为准，无头只验"无报错 + 构图"。
