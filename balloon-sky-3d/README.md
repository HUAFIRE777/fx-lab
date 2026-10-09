# balloon-sky-3d · 热气球天空

一句话介绍：多层视差热气球（程序化球囊 + 吊篮 + 缆绳）在云海之上漂浮——晨/午/暮三档光照联动、气球数量可调、拖拽换视角的天空题材 hero。`huafire3d fx-lab — original implementation`

## 参考与借鉴点

- **对标对象**：旅游品牌天空题材 hero（大地色天空 + 热气球群 + 云海纵深的经典构图）。
- **学了哪几个手法**（只学手法，不抄代码）：
  1. 云海分层：远/中/近/低涌四层云精灵以不同速度漂移，天然多层视差；
  2. 气球群落构图：近大远小、按深度分三层排布，数量滑杆增减时按"主角优先"顺序出现；
  3. 时间氛围切换：晨/午/暮三档整体调光（天空渐变 + 太阳位置 + 灯光色温 + 雾色联动），一键换情绪。
- **代码原创声明**：球囊 Lathe 剖面、条纹纹理、云朵笔刷、天空 shader、飞鸟扑翼全部手写；Three.js（MIT）为本地 vendor，其余代码均为本模板原创实现。

## 动效拆解

| # | 动效 | 实现 |
|---|------|------|
| 1 | 天空穹顶 | BackSide 球体 + 手写 GLSL：天顶/地平/云下三色渐变 + 太阳圆盘 + 辉光 + 光晕，一次 draw call |
| 2 | 太阳辉光 | shader 内 `smoothstep` 圆盘 + `pow(dot,220)` 辉光 + `pow(dot,7)` 光晕，随时间档位变色变位 |
| 3 | 云海五层 | 98 个 Sprite（canvas 笔刷云纹理），远/中/近/低涌/高空游丝五层不同漂移速度，越界回绕 |
| 4 | 热气球 | LatheGeometry 球囊剖面 + canvas 竖条纹（红/云白）+ 圆柱吊篮 + 4 根缆绳 Line + 暮时喷灯辉光闪烁 |
| 5 | 气球浮动 | 每只独立相位：正弦升降 ±0.7、摇摆 ±0.06rad、慢速 x 向漫游；指数跟随，无 linear |
| 6 | 晨/午/暮 | 1.8s easeInOutCubic 补间 13 个参数（天空三色/太阳方向颜色/灯光/雾/曝光/云色/喷灯） |
| 7 | 数量滑杆 | 1–12 只，按出现优先级排序；增减时 easeOutBack 弹性缩放弹出/收起 |
| 8 | 拖拽视差 | pointer 拖拽 → 相机 lookAt 目标偏移（yaw ±0.16 / pitch ±0.09），`1-exp(-dt*7)` 指数跟随；静置 3s 后极轻微自主摇摆 |
| 9 | 飞鸟 | 6 只双翼平面，扑翼 `sin(t*7)`，横穿天空循环，暮时剪影感最强 |
| 10 | 入场 | 相机 24→15 easeOutExpo 2.4s 推近；标题两行 clip-path 上升；面板延迟浮现 |
| 11 | 加载态 | 「云海正在聚集」+ 红色循环进度条；首帧渲染 / 2.6s / 6s 三重兜底必进完成态 |

## 配置参数

在 `src/main.js` 顶部 / 对应函数处调整：

- `TIMES`：晨/午/暮三档全部颜色与光照参数（`top/bottom/haze/sunDir/sun/light/li/lpos/hemiSky/hemi/fog/exp/cloud/burner`）
- 云层：`cloudLayer(数量,yMin,yMax,zMin,zMax,尺寸Min,尺寸Max,不透明度,漂移速度)`，共 5 层
- 气球：`LAYERS` 三层 `{z范围, 缩放}`；`order` 数组定 12 只的层归属与出现优先级
- 浮动幅度：`sin` 系数（升降 0.7 / 摇摆 0.06 / 漫游 3），`REDUCED` 下自动 ×0.25
- 拖拽：yaw 限 ±0.16、pitch 限 ±0.09，跟随系数 `1-exp(-dt*7)`
- 入场推近：`lerp(24,15,easeOutExpo(introT))`，2.4s
- 配色：`:root` 中 `--sky:#7FB6D9` `--cloud:#F5F1E6` `--red:#E4572E`（全页只用这三色及其明暗）

## "看起来不像 AI 写的"六项自查

1. **克制**：全页只有一个主视觉（热气球云海）；飞鸟/辉光/云漂移均为氛围微交互，无第二主角。
2. **配色**：全页严格 3 色（晨空蓝 #7FB6D9 / 云白 #F5F1E6 / 气球红 #E4572E），暮色暖调是红色的浅色调，无彩虹渐变。
3. **字体**：系统字体栈；标题 `clamp(2.6rem,7.2vw,5.4rem)` 字距 .06em，kicker 字距 .52em 12px，层级分明；标题逐行 clip-path 上场。
4. **文案**：真实感中文短句（"乘风的人从不问归期""风把我们带到的地方，地图上都没有名字"），无 Lorem ipsum、无 emoji 符号列表。
5. **手工细节**：球囊底部压暗体积感、暮时喷灯闪烁、飞鸟剪影、vignette + SVG 噪点、「云海正在聚集」加载态、滑杆红色填充、按钮 hover 上浮。
6. **easing**：全部物理感缓动（`cubic-bezier(0.16,1,0.3,1)`、指数跟随 `1-exp(-dt*k)`、easeInOutCubic、easeOutBack、easeOutExpo），无默认 linear。

## 源码结构

```
balloon-sky-3d/
├── index.src.html      # 开发版：HTML + CSS + importmap(three→vendor)
├── index.html          # 打包成品（单文件，勿直接改；改 src 后重建）
├── src/main.js         # 场景全部代码（天空 shader / 云海 / 气球 / 交互）
├── vendor/
│   └── three.module.js # three@0.183.0 本地（MIT）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/balloon-sky-3d
# 1. 改开发版
vim index.src.html src/main.js
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py balloon-sky-3d
# 4. 验证（以打包成品为准；headless 下 file:// ESM 需走打包后的 data:URL importmap）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/balloon-sky-3d/index.html" ~/workspace/fx-lab/shots/balloon-sky-3d.png 1280 800 0
```

## 移动端说明

- 布局：标题/面板全部 `clamp()` 自适应；390×844 下标题 12.5vw，面板自动换行居中，`hint` 隐藏（触屏即拖拽，无需提示）。
- 触屏拖拽：`touch-action:none` + pointer 事件统一处理，单指拖拽即换视角；`pointer:coarse` 下停掉噪点位移省电。
- 安全区：`env(safe-area-inset-*)` 适配刘海屏。
- `prefers-reduced-motion`：浮动幅度 ×0.25、关闭自主摇摆与入场推近、加载条放慢。
