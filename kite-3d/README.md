# kite-3d · 风筝翱翔

一只风筝在云海之上乘风翱翔——布料随风抖动、阵风把它托高推远、手里这根线由你掌控：上下拖拽放飞收线，拨动风力滑杆，看它在云端翻飞的样子。huafire3d fx-lab — original implementation。

## 参考站点及借鉴点

- **对标对象**：潍坊国际风筝节航拍、风筝第一人称放飞 POV 视频。
- **学的三个手法**：① 风筝的"阵风呼吸"——真实航拍里风筝不是匀速飘，而是一阵一阵被托高、间歇下坠；② 云海的"速度差"——近处游云快、远处云海慢，纵深全靠相对速度；③ 牵引线的"垂度语言"——风小时线垂成弧线，风大时线绷直，这是放风筝的人一眼能读懂的信号。
- **代码原创声明**：以上只学手法。天空穹顶 shader 渐变、云团程序化拼合、三种筝式帆形参数化生成（半宽函数逐行收分）、CPU 顶点布料抖动、阵风物理（位置/俯仰/压坡联动）、贝塞尔垂线牵引线、七节飘带尾巴全部手写原创，未复制任何现成风筝/布料特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 风筝帆面 | PlaneGeometry(12×18 网格)按半宽函数逐行收分生成钻石/三角/六角三种帆形；每帧 CPU 顶点位移（双正弦叠加，边缘权重 0.25+0.75w），振幅 0.05+0.15×阵风，兜风弧度打底 |
| 风力物理 | 滑杆 0–100 → 阵风函数 g(t)=wind×(0.62+0.26sin0.8t+0.16sin2.17t)；筝高 = 线长×(0.50+0.38g)，风越大飞得越高越远；俯仰 -(0.16+0.24g)，侧滑速度 → 压坡滚转（钳制 ±0.55rad）|
| 牵引线 | 48 点二次贝塞尔：起点线轴、终点系留点世界坐标；垂度 = 1.9×(1-g)+0.22，侧摆 sin1.25t×0.55g，叠加高频涟漪 0.09g |
| 尾巴 | 7 节菱形飘带（点缀色/白相间），每节 rotation.x = sin(3.2t−i×0.75)×(0.28+0.5g)，滞后相位形成波浪 |
| 云海 | 46 团底层云（y≈−8.5，压扁球体拼合）+ 12 团空中游云；漂移速度 0.35+2.4g，随风加速，x>100 回绕；雾效 55–220 压远 |
| 相机 | 指针视差：x/y 目标偏移，指数 lerp（dt×2.2）跟随，有物理惯性感 |
| 款式切换 | 0.22s easeIn 缩没 → 重建筝组 → 0.55s easeOutBack 弹性弹出；CSS 变量 --accent 同步换色 |

## 配置参数

| 参数 | 位置 | 说明 |
|---|---|---|
| `STYLES` | src/main.js 顶部 | 三款筝式：钻石筝(#E4573D)/三角翼(#E89B2E)/六角筝(#2E6FD8)，含帆高 H 与半宽函数 hw(y) |
| 风力滑杆 | #rg-wind 0–100 | 映射 wind 0–1，读数换算风速 = wind×11 m/s |
| 牵引线滑杆 | #rg-line 8–40 | 线长（米），画布上下拖拽同步联动（上拖放飞 0.035 m/px）|
| 帆面网格 | buildSailGeometry | PlaneGeometry(1.7, H, 12, 18)，18 行收分 |
| 牵引线点数 | LP=48 | updateLine 每帧重算 |
| 相机 | fov 55, (0,3.2,16) | lookAt(0,5.5,0)，视差 ±1.4/±0.9 |
| 雾效 | Fog(0xDCEFFB,55,220) | 穹顶 shader 设 fog:false 保底色 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——云海上的风筝。面板只有三个控件，无多余装饰模块。
2. **配色**：严格 3 色系（天空蓝 #8FD0EF 系 / 云白 #FDFEFE / 点缀色随筝式切换其一），禁用彩虹渐变；滑杆填充只用当前点缀色。
3. **字体**：中文标题 Songti SC 衬线 44px 字距 .18em，英文 kicker 11px 字距 .5em，层级分明；零外部字体。
4. **文案**：真实感短句（"一线在手，云海任你翱翔""正在系紧风筝线""上下拖拽画面 · 亦可放飞收线"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层（mix-blend overlay）；按钮 hover 上浮 + 点缀色光晕；滑杆 thumb hover 放大 1.25；筝式按钮选中态实心填充；loader 是 CSS 剪裁的菱形小风筝左右摇摆（非转圈圈）；画布 cursor grab/grabbing。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`；intro stagger 140ms；款式切换 easeIn 收 + easeOutBack 弹；相机/视差指数 lerp（物理感）。

## 源码结构

```
kite-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/
│   └── main.js         # 场景/风筝/阵风物理/牵引线/UI（ESM，three 走 importmap）
├── vendor/
│   └── three.module.js # three 本地（667KB，禁一切 CDN/外部字体/外链图）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/kite-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py kite-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题 32px、读数缩小贴右上；面板贴底全宽 + safe-area，滑杆缩至 104px，hint/footer 隐藏。
- 触摸：画布 `touch-action:none`，上下拖拽直接放飞/收线；按钮 ≥44px 高可点区。
- 性能：帆面 12×18 网格 CPU 顶点（~247 点）+ 云团共享几何体，中端机 60fps。
