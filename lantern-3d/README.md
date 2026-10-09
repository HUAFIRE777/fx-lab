# lantern-3d · 孔明灯放飞

夜空下 44 盏孔明灯缓缓升空、随风漂移，写下愿望（≤12 字）放飞属于自己的一盏——为节日 / 婚庆品牌 hero 而生的许愿夜空。huafire3d fx-lab — original implementation。

## 参考与借鉴点

- **对标对象**：元宵 / 七夕孔明灯放飞的延时摄影与节日航拍。
- **学的三个手法**：① 灯群的"速度差"——远近灯升空速度、大小、明暗各不相同，营造纵深；② 灯罩透光——底部火光把纸罩从下往上照透，边缘暖、中心更暖；③ 地面剪影——远山 + 宝塔的纯黑剪影压住画面底部，夜空才有"天"的感觉。
- **代码原创声明**：以上只学手法。纸罩 canvas 纹理绘制、光晕/火焰 sprite、升空+正弦漂移+顶部渐隐回收、愿望竖排字纹理、点击聚焦跟随、相机平滑回位全部手写原创，未复制任何现成孔明灯/粒子特效代码。

## 动效拆解

| 模块 | 手法 |
|---|---|
| 孔明灯群 | 44 盏，程序化纸罩（球体压扁 1:1.24 + canvas 纹理：暖橙渐变/纵向竹骨/底部透光）+ additive 光晕 sprite + 底部火焰 sprite（11Hz+23Hz 双频闪烁，尺寸/亮度抖动） |
| 升空与漂移 | 每盏独立速度 1.1–2.5/s；x 轴正弦漂移（频率 0.25–0.6、风速滑杆放大）；机身随风轻微摇摆 |
| 渐隐回收 | y>36 进入 10 米渐隐带，opacity→0 后沉到地平线下换新位置重生，灯群永不枯竭 |
| 愿望灯 | canvas 纹理竖排写字（≤12 字），从近处（z=22，1.5 倍大）升起；最多并存 4 盏，老灯自动退场 |
| 夜空 | 球体穹顶 shader 垂直渐变（#0B0E1A→近黑）+ 580 颗两层星点（呼吸微闪）+ 一轮明月（canvas 环形山纹理）+ 月白光晕 |
| 地面剪影 | 两层远山脊线（随机种子山脊 canvas）+ 五层宝塔剪影，纯黑压底 |
| 相机 | 点击灯后 lerp 跟随 3 秒（位置+朝向双平滑），超时后 cubic-out 回家 |

## 配置参数表

| 参数 | 位置 | 默认 | 说明 |
|---|---|---|---|
| `windFactor` | 风速滑杆 0–100 | 38（和风） | 映射 0–2，放大 x 漂移幅度与摇摆；<25 微风 / <60 和风 / ≥60 强风 |
| `LANTERN_COUNT` | main.js | 44 | 夜空常驻灯数（30–50 规格内） |
| `RISE_TOP` | main.js | 46 | 顶部回收线；渐隐带 10 米 |
| 愿望字数 | 输入框 maxlength | 12 | 超限截断；空字不放飞 |
| 愿望灯上限 | `releaseWish()` | 4 | 超出时最老的灯退场并 dispose |
| 聚焦时长 | click handler | 3000ms | 跟随时长，hover 变 pointer 提示可点 |
| loader 兜底 | main.js | 3800ms | 超时强制进入完成态；正常走首帧+900ms |
| 配色 | CSS 变量 | — | `--bg:#0B0E1A` 夜空墨蓝 / `--amber:#FFB45E` 灯火橙 / `--moon:#E8EDF5` 月白 |

## 「看起来不像 AI 写的」六项自查

1. **克制**：整页只讲一个主视觉——升空的灯群。无多余装饰模块。
2. **配色**：严格 3 色（#0B0E1A / #FFB45E / #E8EDF5），禁用彩虹渐变；滑杆渐变只用橙色系。
3. **字体**：中文标题 Songti SC 衬线，英文小字大字距（.42em），层级分明；零外部字体。
4. **文案**：真实感短句（"把愿望写进灯里，看它穿过星空，把心事交给月亮保管""灯火不灭 · 愿望不坠"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角 + SVG feTurbulence 噪点覆盖层；放飞按钮 hover 上浮 + 橙光晕；滑杆 thumb hover 放大；悬停灯身指针变手形；loader 有一簇抖动小火苗。
6. **easing**：全站 `cubic-bezier(.22,1,.36,1)`，intro stagger 150ms；相机跟随/回位用指数 lerp（物理感）。

## 源码结构

```
lantern-3d/
├── index.src.html      # 源码 HTML（含内联 CSS、importmap、data-intro 完成态）
├── index.html          # 打包产物（fx-singlefile.py 单向生成，勿手改）
├── src/main.js         # ESM 主程序：天空/灯群/愿望/交互/loader
├── vendor/
│   └── three.module.js # three 真品 667KB（从 lightning-3d 复制）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/lantern-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py lantern-3d
```

改 `src/main.js` 或 `index.src.html` 后重新跑上面三行即可。**禁止对已打包的 index.html 重复跑 singlefile**（importmap 已是 data:URL、main.js 已是 bundle，单向）。

## 移动端说明

- 390×844 布局：标题下移避开右上读数，面板贴底全宽 + safe-area，footer 隐藏。
- 输入框 `font-size:16px` 防 iOS 聚焦自动缩放；`touch-action:manipulation` 防双击缩放；回车键即放飞。
- 像素比上限 2；`prefers-reduced-motion` 下漂移降为 0.25 倍。

## 踩坑记录

1. **透明度双写 bug**：初版用一个 for 循环同时处理 body 渐隐和 glow/flame 闪烁，结果 fade 把闪烁包络盖掉。修法：拆成 `baseGlowOp/baseFlameOp` 先算闪烁，再统一乘 fade。
2. **愿望灯内存泄漏**：连续放飞会无限加 group。修法：上限 4 盏，老灯 scene.remove + texture/material dispose。
3. **相机 lookAt 跳变**：跟随结束直接切回家朝向会"抽"一下。修法：朝向也做指数 lerp（getWorldDirection 插值），不是只插位置。
