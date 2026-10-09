# carousel-3d · 旋转木马

午夜嘉年华的旋转木马：六匹木马绕轴旋转兼上下起伏，顶棚灯珠追逐跑马灯——转速、灯光、马匹故事都可玩。
huafire3d fx-lab — original implementation

## ② 参考与借鉴点

- **对标对象**：游乐园午夜场的旋转木马实拍（灯珠在顶棚边缘一圈圈追、木马此起彼伏那种"转起来就回到小时候"的感觉）。
- **只学了三个手法**：① 跑马灯追逐 —— 灯珠亮度按相位差依次点亮，亮灭之间用 pow 曲线过渡，不跳变；
  ② 木马起伏 —— 每匹马相位错开，沿杆子做正弦起伏 + 轻微俯仰，频率随转速走；
  ③ 午夜氛围 —— 深蓝夜空 + 暖金点光 + 悬浮金尘，冷暖对冲。
- **代码原创声明**：以上手法均为自行实现的 Three.js 代码，没有抄任何旋转木马相关源码；
  three.js 本体为官方 `three.module.js`（从 vinyl-3d 的 vendor 复制，真品 667KB）。

## ③ 动效拆解

| 模块 | 实现 |
|---|---|
| 木马 | 纯程序化低多边形马：capsule 躯干 + 斜颈方头 + 耳锥 + 5 片鬃 + 前迈后蹬四腿 + 锥尾 + 红毯金边马鞍；6 匹体色深红三阶交替，面朝行进切线方向 |
| 旋转 + 起伏 | 整座 `ride` 组绕 Y 旋转；转速 eased（`speed += (target-speed)·dt·1.6`，加减速有惯性）；每匹马 `y=1.5+sin(bobPhase·1.5+phase)·0.42`，`bobPhase` 增速随转速 |
| 顶棚灯珠 | 30 颗 emissive 小球 + additive 光晕 sprite；三档：追逐（三束相位差追逐，`pow(p,3)` eased）、全亮（0.95+微闪）、呼吸（全体正弦，带相位波） |
| 底座灯 | 平台边缘 24 颗暖金灯珠，随模式联动明暗 |
| 顶棚 / 平台 / 中柱 | cone 顶棚（canvas 竖条纹=真放射纹）+ 金色宝顶 + 底面同心环；平台顶面 canvas 金环纹 + 双金圈包边；中柱红底金竖条 |
| 氛围 | FogExp2 夜蓝雾 + 340 点星空 + 130 粒上浮金尘 + vignette 暗角 + SVG 噪点 |
| 交互 | 自研 orbit（拖拽旋转 / 滚轮缩放 / 双指 pinch，阻尼跟随）；转速滑杆 0–100%；灯光三档分段按钮；点击马匹（raycast 隐形代理圆柱，滑动不误触）→ 追光灯跟随 + 金环脉冲 + 右侧信息卡（马名/英文名/一句话故事），点空白处收起 |

## ④ 配置参数表

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `targetSpeed` | src/main.js `applySpeed()` | 42% → 0.378 | 滑杆 0–100 映射到 0–0.9 rad/s |
| 转速 easing 系数 | 主循环 | `dt·1.6` | 加减速惯性，值越大越跟手 |
| `lightMode` | `bulbBrightness()` | `chase` | chase / all / breathe 三档 |
| 追逐束数 | `bulbBrightness()` | 3 | `cos(chaseT·2 - i·2π/30·3)`，改末尾乘数即改束数 |
| `bobPhase` 增速 | 主循环 | `1.1 + speed·2.4` | 起伏频率随转速联动 |
| 起伏振幅 | 主循环 | 0.42 | 马身上下幅度（世界单位） |
| `orbit` | src/main.js | radius 14.5（移动端 19），phi 1.24 | 初始视角；缩放限 7–22 |
| 点选判定 | `endDrag` | 位移 ≤6px 且 <450ms | 拖拽不误触 |
| loader 兜底 | index.src.html 内联脚本 | load+350ms / 3.2s | 首帧渲染即进入，双保险 |

## ⑤ "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"旋转木马"一个主视觉，灯光/金尘/星空全是配角，没有第二套动效抢戏。
2. **配色定死 3 色**：夜蓝 `#0B1530`、深红 `#8E1118`、金 `#F0BE4A`；马身三阶深红是同色系明暗，文字米白属中性色，无彩虹渐变。
3. **字体讲究**：中文标题衬线（Songti SC / STSong / Noto Serif SC），大字号 + 宽松行高；英文小字全大写 + 0.5em 以上字距；信息卡马名 38px 衬线。
4. **无 Lorem、无 emoji**：文案全是真实感短句（"转起来，就回到小时候""脖子上的铃铛是老园长亲手系的，响了四十年"）。
5. **手工细节**：vignette 暗角 + SVG 噪点覆盖层（pointer-events:none）；灯珠追逐用 pow 曲线 eased 不跳变；滑杆 thumb hover 放大；徽章呼吸点；加载态金色转环。
6. **easing**：全站 `--ease: cubic-bezier(.22,1,.36,1)`；转速加减速惯性 easing；intro 元素 90ms staggered 上浮；信息卡滑入 0.6s。

## ⑥ 源码结构

```
carousel-3d/
├── index.src.html      # 源码：内联样式 + importmap + 经典脚本(intro 进入/load+350ms 与 3.2s 双兜底)
├── index.html          # 打包产物（fx-singlefile.py 单向打包，勿重复跑）
├── src/main.js         # 全部 3D 逻辑（ESM，import * as THREE from 'three'）
├── vendor/
│   └── three.module.js # 官方 three（667KB，从 vinyl-3d 复制）
└── README.md
```

main.js 内部分段：配色/马匹档案 → canvas 纹理 → 渲染器/场景 → 灯光 → 地面/星空/金尘 →
木马本体（平台/中柱/顶棚）→ 灯珠/底座灯 → 程序化木马 → 自研 orbit → 点选聚焦 →
控制（转速/灯光模式）→ 灯光模式函数 → 主循环 → resize → 调试钩子。

## ⑦ 重建方式

```bash
cd ~/workspace/fx-lab/carousel-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py carousel-3d
```

- 改源码只改 `index.src.html` / `src/main.js`，改完重新跑上面三行。
- **禁止对已打包的 index.html 重复跑 singlefile**（importmap 已内联，会坏）。
- vendor 的 three.module.js 从 `~/workspace/fx-lab/vinyl-3d/vendor/` 复制，不要自己下载。

### 踩坑记录

1. **顶棚斜向暗带**：第一版顶棚纹理用 canvas 放射楔形 24 瓣，但锥面 UV 是 `(u=环向, v=高度)`，
   楔形边界在 (u,v) 空间里变成穿过锥面的斜线，mipmap 平均后形成一条斜暗带。改画竖条纹
   （canvas-x 对应环向）才是锥面上真正的放射纹，暗带消失。教训：canvas 纹理下笔前先想清楚 UV 映射。
2. **棚下主光放进柱子里**：第一版点光源放在 (0,6.4,0)，先是在锥体内部、移到 (0,4.1,0) 后又在中柱内部，
   中柱外表面永远照不到、全黑。改两盏对称点光放在 (±3.6,3.4,0) 柱外，中柱/木马/棚底全亮。
3. **intro 在 headless 下偶发不进入**：只靠 3.2s 兜底 timer，headless 里 timer 被限流时 intro 元素到截图时还没 `is-in`。
   修法：加 `load+350ms` 早触发（双兜底），CDP 实测 `introIn:3/3`。
4. **CDP 合成点击测不出点选**：`Input.dispatchMouseEvent` 两次调用在 headless 输入队列里被拉开 1.4s+，
   触发 tap 判定 `quick<450ms` 失败——是测试工具假象，真机 tap 正常。用页面内合成 PointerEvent
   走完整 handler 链验证通过（卡片弹出，马名/故事正确）。
5. **合成事件调 setPointerCapture 抛错**：真机无此问题，但为保 console 零错，加了 try/catch。

## ⑧ 移动端说明

- 触屏：单指拖拽旋转视角，双指 pinch 缩放；点按马匹弹出信息卡（底部 sheet 样式，滑动不误触）。
- 布局：≤640px 时标题下移避开徽章、desc 隐藏、hint 隐藏、控制条换行铺满底部、信息卡变底部弹出。
- 视角：竖屏初始半径 19（桌面 14.5），保证木马群入画。
- 性能：`setPixelRatio(min(devicePixelRatio, 2))`；约 350 draw call，中端机可跑。
