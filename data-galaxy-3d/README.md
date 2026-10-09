# data-galaxy-3d · 数据星系

`huafire3d fx-lab — original implementation` · 深黑底上悬浮四个业务星团的 3D 数据可视化 hero 页：节点呼吸脉冲、链路成网，hover/tap 弹出数据卡，chips 筛选聚焦星团，可拖拽旋转、滚轮缩放。

## 参考与借鉴点

- **对标对象**：WebGL 数据可视化作品常见的"星系式网络图"（节点聚成星团 + hover 数据卡这一表现手法）。
- **借鉴了哪几个手法**：① 业务节点按分组聚成星团、团内连线成网；② hover 单节点弹出浮动数据卡；③ 顶部筛选 chips 点选高亮对应分组、其余压暗；④ 辉光节点 + 缓慢自转营造深空感。
- **代码原创声明**：未查看、未复制任何原站源码；全部几何体、材质、动画、数据卡交互均为本模板独立编写（Three.js 仅作为渲染库调用）。页面文案、业务分组、指标数字均为虚构演示数据。

## 动效拆解

1. **星团逐个点亮（加载态）**：开场 4 个星团按 0.55s 间隔依次淡入 + 上升，easeOutExpo 缓动；全部点亮后 loader 退场、文案入场。
2. **节点呼吸脉冲**：每颗卫星节点 scale 按正弦呼吸（相位随机错开），辉光 sprite 同步明暗；枢纽为白色八面体 + 内核白光脉冲 + 缓慢自转。
3. **星系自转 + 惯性**：整团每秒约 3° 缓慢自转；桌面拖拽给角速度，松手后惯性衰减（0.94/帧）；滚轮/双指缩放相机 58–175 距离。
4. **hover/tap 数据卡**：raycast 命中节点后放大 1.65 倍、辉光增强，数据卡弹出并跟随节点（节点在旋转，卡片实时追踪投影位置）；触屏改为点按触发。
5. **chips 筛选**：点选某星团时其余节点/链路透明度插值压暗到 0.1，跨团环路链路同步收暗；"全部星团"一键恢复。
6. **数字滚动**：右下统计（节点/链路数）用 easeOutExpo 从 0 滚动到真实构建数量。
7. **微交互**：chips hover 上浮 + pop 缓动；kicker 装饰线；grain 噪点 4 步抖动；vignette 暗角。

## 配置参数

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| 星团数量/分组 | `src/main.js` `GROUPS` | 4（销售/运营/客服/供应链） | 改数组即增减星团 |
| 每团卫星数 | `GROUPS[].subs` | 12 | 改名数组长度即可 |
| 星团轨道半径 | `ringR` | 44 | 星团中心到星系中心的距离 |
| 自转速度 | `animate()` 内 `dt * 0.055` | 0.055 rad/s | `prefers-reduced-motion` 时为 0 |
| 点亮间隔/时长 | `revealAt: 0.25 + gi*0.42` / 1.1s | — | 加载态节奏 |
| 相机距离范围 | `camZ` clamp | 58–175，初始 105 | 滚轮/捏合缩放 |
| 呼吸幅度 | `0.22 * sin(...)` | 0.22 | 节点脉冲强度 |
| 辉光尺寸 | 卫星 5.2 / 枢纽 12 | — | sprite 缩放 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只有一个主视觉动效（数据星系）；文案、图例、统计均为静态排版，无第二处大动效抢戏。
2. **配色**：全页 3 色——深黑 `#04090D`、青 `#22D3EE`、白 `#F2FAFD`；无彩虹渐变，链路/文字只用青的透明度变化。
3. **字体讲究**：标题 42–84px 九重字重、0.06em 字距，大标题上下留白 20px 行距 1.12；kicker 11px 配 0.5em 疏字距 + 装饰线；层级：kicker → H1 → 描述 → chips。
4. **无 Lorem/emoji**：文案为真实感中文短句（"四个业务星团悬于深空，每颗星都是一条数据流"）；节点名如"华东仓配""智能应答"均为业务感虚构名；页尾声明数据虚构。
5. **手工细节**：vignette 暗角、SVG 噪点 4 步抖动、星团逐个点亮加载态、hover 数据卡跟随、图例三项说明、枢纽白光内核。
6. **easing 物理感**：点亮/数字滚动用 easeOutExpo，chips 用 back 弹性（cubic-bezier(0.34,1.56,0.64,1)），拖拽惯性 0.94 指数衰减；无 linear。

## 源码结构

```
data-galaxy-3d/
├── index.src.html      # 开发版：全部 CSS + DOM + importmap（three → vendor/three.module.js）
├── index.html          # 打包成品：单文件，零外部请求（fx-singlefile.py 生成）
├── src/main.js         # 全部逻辑：场景/星团构建/呼吸/旋转/raycast/筛选/加载态
├── vendor/
│   └── three.module.js # Three.js 本地库（1.27MB 真品，非 CDN）
├── README.md           # 本文件
└── shots → ../shots/data-galaxy-3d(-mobile).png
```

## 重建方式

```bash
# 1. 开发（改 index.src.html / src/main.js，落盘为准）
# 2. 复制为打包输入
cp index.src.html index.html
# 3. 一次性单向打包（改源码后必须从第 2 步重来，禁止对已打包的 index.html 重复跑）
python3 ~/workspace/bin/fx-singlefile.py data-galaxy-3d
# 4. 截图验证（以打包成品为准）
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/data-galaxy-3d/index.html" ~/workspace/fx-lab/shots/data-galaxy-3d.png 1280 800 0
node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/data-galaxy-3d/index.html" ~/workspace/fx-lab/shots/data-galaxy-3d-mobile.png 390 844 1
```

打包前置：`/tmp/esb/node_modules/.bin/esbuild` 与 `/tmp/three.module.min.js` 须存在（fx-lab 构建共用）。

## 移动端说明

- 390×844 布局：隐藏图例与描述段落，保留标题 + chips + 统计 + 提示；chips 可换行。
- hover 改为**点按**：tap 节点弹出数据卡，tap 空白处关闭（`pointer:coarse` 分支）。
- 单指拖拽旋转星系，双指捏合缩放（58–175）；滚轮提示在触屏隐藏、改为点按提示。
- 性能：节点 52 个、链路约 100 条、raycast 仅对节点 mesh，低端机可流畅运行；`prefers-reduced-motion` 下关闭自转与呼吸。
