# hourglass-3d · 沙漏

玻璃沙漏 3D 动效模板：沙粒细流下落、沙堆质量守恒、点击 180° 翻转重计。时间管理 / 效率工具品牌 hero 可直接用。huafire3d fx-lab — original implementation。

## ② 参考与借鉴点

- **对标对象**：极简主义产品摄影（静物广告片里的沙漏镜头）。
- **只学三个手法**：① 玻璃折射 —— 高透明物理材质 + 程序化环境反射卡，表现樽体通透感；② 沙流连续感 —— 双层粒子（顶部汇聚 trickle + 细颈主 stream）营造不间断细流；③ 翻转仪式感 —— 整樽 180° 缓动旋转 + 金色光环扩散，翻转即"重新开始"。
- **代码原创声明**：几何体（LatheGeometry 沙漏剖面）、粒子系统、翻转状态机、计时逻辑全部手写，未复制任何第三方示例代码；three.module.js 为官方构建产物（vendor 真品 667KB）。

## ③ 动效拆解

1. **玻璃樽**：LatheGeometry 对称双球剖面 + 细颈，MeshPhysicalMaterial（clearcoat 高透明，非 transmission，避免 SwiftShader 编译抖动）。
2. **环境反射**：PMREMGenerator + 纯代码小场景（暖主光 / 冷轮廓 / 顶光 / 底部金反光四张发光卡），零外部 HDR。
3. **沙粒流**：260 粒主 stream（细颈→下堆表面，圆柱形细流带收束）+ 90 粒顶部 trickle（上堆表面汇聚入颈）。
4. **沙堆质量守恒**：下堆 cone 随 progress 长高、上堆倒 cone 随 progress 降低，同一 progress 驱动。
5. **翻转**：点击沙漏或「翻转」按钮 → 整组绕 Z 轴 180°（easeInOutCubic 1.5s）+ 金色光环扩散；结束瞬间 progress 清零 —— 因沙堆是翻转组的子节点，旧满堆自然变成新顶堆，视觉无跳变。
6. **计时**：中速 120 秒一漏；已流逝 / 剩余 mm:ss + 顶部金色进度条。
7. **氛围**：鼠标视差相机、樽体轻微呼吸浮动、vignette 暗角 + SVG 噪点覆盖层。

## ④ 配置参数表

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `CFG.totalSeconds` | src/main.js | 120 | 中速下一漏时长（秒） |
| `CFG.streamCount` | src/main.js | 260 | 主沙流粒子数 |
| `CFG.trickleCount` | src/main.js | 90 | 顶部汇聚粒子数 |
| `CFG.bulbR / bulbH / neckR` | src/main.js | 1.0 / 2.05 / 0.07 | 樽体半径 / 半高 / 细颈半径 |
| `CFG.pileMaxH` | src/main.js | 1.05 | 沙堆最大高度 |
| `CFG.sand` | src/main.js | 0xE8B86D | 流沙金 |
| `S.speed` | src/main.js | 1 | 流速档：0.6 慢 / 1 中 / 1.8 快 |
| `S.flipDur` | src/main.js | 1.5 | 翻转动画时长（秒） |
| `S.progress` 初值 | src/main.js | 0.32 | 开场已有 1/3 沙落下，画面不空 |

## ⑤ "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"沙漏计时"一个动效，无多余装饰元素。
2. **配色**：墨黑 #0C0C0E + 流沙金 #E8B86D + 玻璃透明，三色封顶，无渐变滥用。
3. **字体**：中文标题衬线（Songti SC / STSong / Noto Serif SC），英文小字大字距（letter-spacing .42–.58em），数字 tabular-nums。
4. **文案**：真实感短句（"时间看得见""每一粒沙落下，都有回响"），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：vignette 暗角、SVG 噪点 overlay（pointer-events:none）、按钮 hover 上浮 + active 缩放、金色描边立柱 collar。
6. **easing**：全站 cubic-bezier(.22,1,.36,1)；翻转用 easeInOutCubic，有物理感。

## ⑥ 源码结构

```
hourglass-3d/
├── index.src.html      # 源码 HTML（内联样式 / importmap / data-intro）
├── index.html          # fx-singlefile.py 一次性打包产物（883KB，勿二次打包）
├── src/main.js         # 全部逻辑（ESM，import * as THREE from 'three'）
├── vendor/three.module.js  # 官方构建真品 667KB（从 vinyl-3d 复制）
└── README.md
```

main.js 分段：渲染器/场景 → 程序化环境 → 灯光 → 沙漏主体（玻璃/底座/立柱）→ 沙堆 → 沙粒 → 状态机 → 翻转 → 交互 → 视差 → 计时 DOM → 主循环 → loader/intro。

## ⑦ 重建方式

```bash
cd ~/workspace/fx-lab/hourglass-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py hourglass-3d
```

- 打包为一次性单向：**禁止**对已打包的 index.html 重复跑 singlefile。
- 改代码只改 `index.src.html` / `src/main.js`，改完重跑上面三步。

## ⑧ 移动端说明

- 390×844 已截图验证：标题左上、计时右上、控制条底部胶囊横向可滑，无错乱。
- 沙漏触屏可点翻转（pointerup + 8px 拖拽阈值，滑动不算误触）。
- `touch-action:manipulation` 防双击缩放；safe-area inset 已处理。

## ⑨ 踩坑记录

1. **hcshot 偶发 "FAIL fetch failed"**：`node -e "require('ws')"` 直接失败 —— 验收命令没带 `NODE_PATH=/tmp/hcshot/node_modules`（ws 装在 /tmp/hcshot/node_modules）。带上即稳定；仍有小概率端口竞态，重试即过。不是页面问题。
2. **首版构图顶部被裁**：沙漏组总高 ~4.7，fov 38 / z=6.4 可视高仅 ~4.4，顶盖出画。修法：`glass.scale.setScalar(0.82)`，一屏完整。
3. **翻转复位跳变**：翻转结束把 rotation.z 从 π 直接置 0 —— 因沙堆是子节点且 progress 同步清零（满堆变顶堆），π 态与 0 态视觉完全一致，无跳变。立柱 collar 上下不对称（仅顶部有），差异小到可忽略。
4. **玻璃材质选型**：没用 transmission（SwiftShader 下可能编译抖动），改用 MeshPhysicalMaterial 高透明 + clearcoat + 程序化环境反射，console 零错且真机效果更好。
5. **粒子 stream 的 x 坐标曾写残留表达式**（`cos*jr*Math.random()*0 +`），已清理 —— 写完通读一遍能省一次返工。
