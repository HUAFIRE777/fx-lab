# coral-reef-3d · 珊瑚礁生态

程序化珊瑚礁：递归分支的鹿角珊瑚逐节生长，32 尾鱼群以 boids 算法在丁达尔光束里穿行，焦散光纹在沙地上流淌。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- 对标对象：海洋纪录片水下摄影（如《蓝色星球》式珊瑚礁长镜头）。
- 只学三个手法：① 丁达尔光束——水面透下的体积光柱画法；② 鱼群队形——大群同向游动、遇扰动散开又聚拢的节奏；③ 珊瑚层次——前景鹿角珊瑚、中景扇形珊瑚、远景管状珊瑚的景深排布。
- 代码全部原创：珊瑚递归生成器、boids、焦散函数、光束 shader 均为本模板手写，未复制任何现有水下场景代码。

## 动效拆解

1. **珊瑚生长**：鹿角珊瑚由递归分支生成（圆柱逐级分叉 3 层），每段带 `aGrow` 属性；材质经 `onBeforeCompile` 注入 `if (vGrow > uGrow) discard`，开场 0.4s 起每株间隔 0.28s、2.4s 内从基部向梢部"长"出来。扇形珊瑚（三角扇几何 + 正弦涟漪摆动）、管状珊瑚（5–9 根开管 + 管口暗色内盘）同理。
2. **鱼群 boids**：分离/对齐/聚合三力 + 鼠标引力 + 投食强引力 + 惊散脉冲 + 椭球边界回游；鱼身为拉伸球体 + 分叉尾鳍 + 背鳍，顶点 shader 里按 `position.x` 做正弦扭曲（头不动、尾摆幅最大），`InstancedMesh` 一次绘制 32 尾。
3. **焦散光纹**：沙地 ShaderMaterial，经典迭代式 caustic 函数（4 轮 sin/cos 叠代），随时间流淌，边缘压暗沉入黑暗。
4. **丁达尔光束**：6 个 additive 锥体，alpha 随高度衰减 + 缓慢摇摆；顶部另有一层水面微光平面。
5. **交互**：鼠标慢移→鱼群聚拢；快速挥动（>1500px/s）→惊散脉冲；点击水面/点"投食"→青色食饵下沉，鱼群强聚集 9 秒。浅滩/深海两档切换：雾色、光强、焦散、荧光强度 2 秒内插值过渡。

## 配置参数表

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `FISH_N` | main.js 顶部 | 32（移动端 20） | 鱼群数量，O(n²) 注意上限 |
| `coralDefs` / `spotR` | 种植珊瑚段 | 11 株 | 珊瑚种类、尺寸、环形排布半径 |
| `MODES.shallow/deep` | 浅滩/深海段 | — | 雾色/雾距/灯光/焦散/光束/荧光/鱼速两档 |
| `uGlow` | 共享 uniform | 0.35→深海 1.5 | 珊瑚梢部荧光青强度 |
| 生长节奏 | animate 内 | delay 0.4+i*0.28s，时长 2.4s | 开场生长动画 |
| loader 兜底 | completeIntro | 3800ms | 无论是否首帧渲染完成都强制进入完成态 |
| 相机 | animate 内 | (0,9,26) 看向 (0,4.5,0) | 缓慢漂移 + 鼠标视差 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个主视觉——珊瑚礁生态；UI 只有标题、三个数据、两个控制，没有多余面板。
2. **配色**：深海蓝 `#04263B` + 珊瑚橙 `#FF7A59` + 荧光青 `#5DF2FF` 三色定死，无彩虹渐变；鱼腹/管口等明暗变化均为同色系深浅。
3. **字体**：中文标题衬线（Songti SC/STSong/Noto Serif SC），英文小字 11px、0.5em 大字距。
4. **文案**：无 Lorem ipsum、无 emoji 列表；标题"一片会呼吸的海"、提示"移动鼠标引鱼聚拢 · 快速挥动惊散鱼群 · 点击水面投食"均为真实感短句。
5. **手工细节**：vignette 暗角 + SVG 噪点覆盖层（pointer-events:none）；按钮 hover 上浮 + 阴影；珊瑚梢部荧光青点缀；食饵计数。
6. **easing**：全部过渡用 `cubic-bezier(.22,1,.36,1)`；生长用 easeOutCubic；环境切换用指数插值。

## 源码结构

```
coral-reef-3d/
├── index.src.html      # 源码版（含 importmap -> ./vendor/three.module.js）
├── index.html          # 打包版（单文件，fx-singlefile.py 生成，一次性单向）
├── src/main.js         # 全部逻辑：珊瑚生成 / boids / shader / 交互 / 开场
├── vendor/three.module.js  # 真品 three（667KB，从 vinyl-3d 复制）
└── README.md
```

main.js 内部分段：基础→灯光→几何工具→珊瑚材质→三种珊瑚生成器→种植→沙地焦散→光束→水面→微粒→鱼群几何→boids→投食→浅滩/深海→指针交互→开场→主循环。

## 重建方式

```bash
cd ~/workspace/fx-lab/coral-reef-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py coral-reef-3d
```

改 src 后重建：改完 `src/main.js` 再跑一次上式。**禁止对已打包的 index.html 重复跑**（importmap 已是 data:URL，重复跑会坏）。

## 移动端说明

- 鱼群 32→20 尾，微粒 130→70，像素比上限 1.5。
- 触屏：手指滑动=引鱼聚拢，快速滑动=惊散，点按水面=投食。
- 布局：标题缩小、右侧 FIELD NOTES 隐藏、控制栏换行居中，`env(safe-area-inset-*)` 适配刘海屏。

## 踩坑记录

1. **mergeGeos 读不到 color**：鹿角/扇形/管状三处都是先 merge 后 `colorize` 上色，merge 时 `g.attributes.color` 为 undefined 直接 `.array` 会炸。修法：merge 里判空留零，colorize 统一后补。
2. **smoothstep 边缘写反未定义**：鱼摆动权重一开始写成 `smoothstep(0.9, -1.1, p.x)`，GLSL 要求 edge0<edge1，否则结果未定义。改成 `1.0 - smoothstep(-1.1, 0.9, p.x)`。
3. **ShaderMaterial 色彩偏暗**：自写 shader 输出的是线性值，直接进 sRGB 画布会发暗。五个 ShaderMaterial 的 fragment 末尾统一加 `#include <tonemapping_fragment>` + `#include <colorspace_fragment>`。
4. **管口压暗误伤管壁**：最初按"顶部 + y 高"判内盘，把管壁顶圈也染黑了。改判"法线朝上（normal.y>0.6）+ aGrow 顶部"才精确命中内盘。
5. **InstancedMesh 朝向**：`Matrix4.lookAt(eye,target,up)` 的 -z 朝目标，鱼头建模在 +x，需右乘 `rotY(+90°)` 把 +x 转到 -z 方向，否则鱼群倒着游。
6. **鹿角珊瑚生长梯度被压缩**：`total` 估 46 而实际段数约 22，导致分支只长到一半。按实际段数改 `total=23`，梯度铺满。
7. **雾 uniform 不同步**：沙地/鱼群 shader 自带雾计算，用的却是写死的 near/far。主循环里每帧把 `scene.fog.near/far` 回写进两个材质的 uniform，深海切换才不会雾断层。
8. **分支全部向上导致"棍子珊瑚"**：递归分支里 `nd.y = |nd.y|*0.7+0.35` 把所有子分支都掰成近垂直，远看就是一根棍子。改成 `nd.y = nd.y*0.5+0.25`（轻微上偏、保持开散）+ 分叉角加大到 34°–68°，灌木感立刻出来。
9. **梢部颜色洗白**：顶点色梯度梢部用了苍白蜜桃色 `0xffd9b0`，强光一照整株发白。改成饱和亮橙 `0xff9a5e`，荧光青点缀（g>0.86）保留。
10. **无头 SwiftShader 下 uTime 膨胀**：`uTime += min(dt, 0.05)` 在软件渲染低帧率下比墙钟慢 2–4 倍，验收截图 3.5s 时珊瑚还在生长中。真机 60fps 不受影响；验收截图改等 14s（或加速生长常数看稳态）。
