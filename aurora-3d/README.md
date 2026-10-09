# aurora-3d · 极光夜空

一句话介绍：全屏极光天空 shader——fbm 噪声三层幕布缓慢舞动、程序化星空微闪烁、底部雪山剪影；极光强度与颜色随时间呼吸，可调强度/流速、冰岛·挪威·阿拉斯加三地预设。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：极地旅游 / 户外品牌的极光 hero（大面积天空幕布 + 星空 + 山脊剪影的构图）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 天空占满全屏的极光幕布构图：幕布居中上、山脊压底、标题浮于左上；
  2. 极光"下缘锐、上缘散"的辉光边：真实极光底部边缘更亮更锐；
  3. 纵向光柱条纹 + 垂幕列：幕布不是整片色块，而是被纵向纹理打散的垂帘。
- **代码原创声明**：fbm/星空/山脊/呼吸全部为手写 GLSL 与原创 JS，未引用任何原站源码；Three.js（MIT）仅作全屏 quad 渲染载体。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 极光幕布（三层） | Fragment Shader：每层 `exp(-d²/2σ²)` 高斯带（下缘 σ 小更锐），`fbm(x·1.4, t·0.05)` 驱动中心线 sway 缓慢舞动；三层高度 0.30/0.47/0.64、漂移方向交错 |
| 2 | 纵向光柱 + 垂幕列 | `rays = pow(smoothstep(fbm(x·7, t·0.12)), 1.4)` 纵向条纹；`cols` 列调制打散横向整片，形成垂帘明暗 |
| 3 | 下缘辉光 | `exp(-((d+0.05)/0.030)²)` 在幕布底部叠一条亮线，模拟极光下缘辉光 |
| 4 | 呼吸 | 双正弦 `0.80+0.20·sin(0.42t)·sin(0.117t+2)`，不规则慢呼吸，乘进极光与雪面反射 |
| 5 | 程序化星空 | hash 网格星点（`h>0.978` 才有星），`sin` 微闪烁；极光亮处星星自动压暗 |
| 6 | 雪山剪影 | 两层 fbm 山脊线（远 0.155 / 近 0.105）：远山微紫剪影、近山更深；山脊雪线微光 + 雪面反射极光 |
| 7 | 控制条 | 极光强度滑杆、时间流速滑杆（0–3×）、冰岛/挪威/阿拉斯加三预设（只调绿紫配比 `uMix` 0.78/0.50/0.22）；全部 `1-exp(-dt·k)` 指数平滑过渡 |
| 8 | 加载态 | 「极光正在升起」+ 循环进度条；首帧+450ms / load+450ms / 3.2s / 5s 四重兜底必进完成态 |

## 配置参数

在 `src/main.js` 顶部 / shader uniform 处调整：

- `tgt.i` 初值 `0.70`：极光强度（滑杆 0–100）
- `tgt.s` 初值 `1.0`：时间流速（滑杆 0–300 → 0–3×）
- 三地预设 `data-mix`：冰岛 `0.78`（偏绿）/ 挪威 `0.50`（均衡）/ 阿拉斯加 `0.22`（偏紫）
- 幕布层数：fragment 中 `for (int L = 0; L < 3; L++)`；层高 `base = 0.30 + 0.17·L`
- 呼吸速率：`sin(uTime·0.42)·sin(uTime·0.117+2.0)`
- 山脊高度：`r1`（远山）/ `r2`（近山）的 fbm 系数
- 配色：`:root` 中 `--night:#020617` `--green:#34d399` `--violet:#a78bfa`

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉动效（极光天空）；标题/控制条均为静态 UI，无第二主角。
2. **配色**：全页严格 3 色（极夜 #020617 / 极光绿 #34d399 / 极光紫 #a78bfa），无彩虹渐变；预设只调绿紫配比、不引入新色。
3. **字体**：系统字体栈；巨型标题 `clamp(3.2rem,11vw,8.5rem)` 字距 -0.02em，kicker 字距 0.55em 大小 12px，层级分明。
4. **文案**：真实感中文短句（"在冰岛的夜空下，等一场绿色的呼吸"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：极光下缘辉光线、山脊雪线微光、雪面反射极光、星星在极光后压暗、vignette + SVG 噪点、「极光正在升起」加载态、滑杆 thumb 悬停发光。
6. **easing**：全部手写物理感缓动（`cubic-bezier(0.16,1,0.3,1)`、指数追踪 `1-exp(-dt·k)`），无默认 linear。

## 源码结构

```
aurora-3d/
├── index.src.html      # 开发版（引用 src/main.js + vendor，落盘为准）
├── index.html          # 打包成品（单文件，验收以此为准）
├── src/
│   └── main.js         # 全部逻辑：加载态门控 / Three.js 全屏极光 shader / 控制条平滑
├── vendor/
│   └── three.module.js # Three.js 本地（MIT，打包时走 importmap data: URL 内联）
├── README.md
└── ../shots/aurora-3d.png / aurora-3d-mobile.png  # 验收截图
```

## 重建方式

```bash
cd ~/workspace/fx-lab/aurora-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py aurora-3d
# 4. 验证（以打包成品为准）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/aurora-3d/index.html" ~/workspace/fx-lab/shots/aurora-3d.png 1280 800 0
```

打包前确认 `/tmp/esb` 与 `/tmp/three.module.min.js` 存在（缺失先恢复；2026-10-09 本模板构建中遇到两次 VM 重置清空 /tmp，已从 vendor 副本恢复）。

## 移动端说明

- 布局：标题 `20vw`、控制条 `flex-wrap` 换行居中，390×844 下全部可见、无横向溢出。
- 省电：移动端停掉噪点位移（`grain{animation:none}`）；`prefers-reduced-motion` 下时间流速强制 5%。
- 触摸：滑杆/按钮均为原生控件，无需额外手势处理。

## 验收结论

- console：CDP 采集 0 错误 / 0 异常 / 0 真实外部请求（仅 headless swiftshader 性能 warning，属环境噪声）。
- 外链：打包成品中唯一 URL 为 SVG `http://www.w3.org/2000/svg` 命名空间（非请求），零真实外部请求；零 Google Fonts / picsum / CDN。
- 截图：桌面 1280×800 + 移动 390×844 双截图齐，极光幕布/星空/山脊/控制条均正常渲染。
- 修过两个真 bug：① 完成态 `transform:none` 吃掉控制条 `-50%` 居中（控制条偏右/移动端被裁）；② 预设按钮文字换行（加 `white-space:nowrap`）。
- 六项自查：全部通过。真机 GPU 肉眼终验待做（无头环境仅验证 console + 静态帧）。
