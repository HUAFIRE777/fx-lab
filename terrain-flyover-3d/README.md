# terrain-flyover-3d · 地形低空漫游

暮色下的程序化地形低空巡航页：simplex 噪声生成的山脉与湖泊，相机沿样条低空自动巡航，滚动页面即可加速。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：Google Earth Studio 的巡航运镜、开放世界游戏开场低空飞行镜头。
- **学的手法**（只学手法，未使用任何原站代码）：
  1. 闭合样条巡航（CatmullRom 曲线定飞行路径，相机沿弧长匀速推进）；
  2. 滚动控速（页面滚动速度映射为巡航加速倍数，滚得快飞得快，松手后指数衰减回巡航速度）；
  3. 低空压坡（按路径曲率给相机滚转 roll，营造贴地飞行体感）。
- **代码原创声明**：simplex 噪声、地形着色、天空 shader、运镜逻辑均为本模板原创实现；three.js 为本地 vendor 库（r160）。未复制、未反编译任何对标站点代码。

## 动效拆解

| 层次 | 内容 |
|---|---|
| 主视觉（唯一） | 全屏 WebGL 程序化地形低空巡航：200×200 网格 fbm 山脉 + 脊线噪声雪峰 + 湖泊水面，相机沿闭合样条以 ~130m 相对高度自动飞行 |
| 微交互 1 | 页面滚动 → 巡航加速（1×–4×，指数衰减回落，有物理感） |
| 微交互 2 | 鼠标移动 → 相机轻微视差偏移（平滑跟随） |
| 微交互 3 | 底部控制条：开始巡航 / 暂停巡航切换，按钮 hover 浮起 |
| 微交互 4 | HUD 地名随飞行扇区淡入淡出切换（6 个虚构山脉名） |
| 氛围 | 距离雾（FogExp2）、34 朵程序化云 sprite 漂移、落日辉光、高空稀疏星点、vignette + 动态噪点 |

## 配置参数

`src/main.js` 顶部 `CFG`：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `seed` | 20261009 | 地形随机种子，换种子即换一整片山脉 |
| `terrainSize` | 2400 | 地形边长（世界单位） |
| `terrainSeg` | 200 | 网格分段，越大越细但生成越慢 |
| `waterLevel` | 0 | 水位线，低于此高度成湖 |
| `baseSpeed` | 34 | 基础巡航速度 u/s |
| `maxBoost` | 4 | 滚动加速上限倍数 |
| `cruiseAlt` | 130 | 巡航相对地形高度 |
| `fogDensity` | 0.00072 | 距离雾浓度 |

配色（全页严格三色）：深蓝 `#0A0F24` / 雾紫 `#9D8FD0` / 暖阳 `#FFB066`，文字用雾紫浅色 `#EFEBFA`。

## "看起来不像 AI 写的"六项自查

1. **克制**：一页只有一个主视觉动效（地形巡航），HUD、控制条、云、雾均为克制点缀，无堆砌。
2. **配色**：全页 2–3 色（深蓝底 + 雾紫 + 暖阳点缀），地形顶点色全部收敛在暮色系内，禁用彩虹渐变。
3. **字体**：标题"暮巡" 200 字重 + 0.42em 字距，大标题有呼吸感；HUD 用等宽 mono 数字 tabular-nums，层级分明。
4. **文案**：零 Lorem ipsum、零 emoji 列表；中文短句（"地形生成中""滚动页面 · 加速巡航"），地名全部虚构中文山脉名。
5. **手工细节**：vignette、动态噪点（grain steps 动画）、"地形生成中"进度加载态、按钮 hover 物理浮起、云朵 canvas 手绘笔触、水面微光呼吸。
6. **easing**：全站 `cubic-bezier(0.16,1,0.3,1)`；速度用指数衰减 `1-exp(-dt*k)` 跟随，无 linear。

## 源码结构

```
terrain-flyover-3d/
├── index.src.html   # 开发版：全部 CSS + importmap(three→vendor) + 结构
├── index.html       # 打包成品（单文件，fx-singlefile.py 生成，勿手改）
├── src/
│   └── main.js      # 全部逻辑：噪声→地形分块生成→天空/云/水→样条巡航→输入/HUD
├── vendor/
│   └── three.module.js  # three r160（本地，与 typo-neon-3d 同源）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/terrain-flyover-3d
# 1. 改 index.src.html / src/main.js（开发版）
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 单文件打包（一次性单向；改源码后从第 2 步重来，禁止对 index.html 重复打包）
python3 ~/workspace/bin/fx-singlefile.py terrain-flyover-3d
```

打包前确认 `/tmp/esb`（esbuild）与 `/tmp/three.module.min.js` 存在。

验证（以打包成品为准）：

```bash
# console 零错误 + 零外部请求
NODE_PATH=/tmp/hcshot/node_modules node /tmp/verify-terrain.js "file:///home/hatch/workspace/fx-lab/terrain-flyover-3d/index.html"
# 截图（viewport 裁剪，等待地形生成）
NODE_PATH=/tmp/hcshot/node_modules node /tmp/shot-terrain.js "file:///home/hatch/workspace/fx-lab/terrain-flyover-3d/index.html" ~/workspace/fx-lab/shots/terrain-flyover-3d.png 1280 800 0
```

## 移动端说明

- 自动巡航（无需滚动也能看完整飞行）；触摸拖拽 → 视角视差（松手回正）。
- 控制条按钮加大点击区，`white-space:nowrap` 防换行；HUD 字号下调一档；hint 文案在小屏隐藏。
- 地形生成为分块 rAF 增量构建，低端机首屏约多 2–3 秒加载态，不会卡死；`prefers-reduced-motion` 下噪点动画关闭。
- 已知限制：无头 Chromium 下截图需等待地形生成完成（约 8–13 秒），属正常。

## 构建手记

- 踩坑：自写 simplex 噪声梯度表只写了 8 组，`permMod12` 索引越界读到 `undefined` → 全地形 NaN → `curve.getLength()` 返回 NaN → three 内部 `distanceToSquared` 抛错。补齐 12 组梯度后解决。
- 教训：程序化生成管线先做 Node 侧数值冒烟（NaN/极值检查），再进浏览器，省掉 CDP 往返。
