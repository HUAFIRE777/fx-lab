# 3D 物理感看板 · admin-kanban-3d（huafire3d fx-lab）

> `huafire3d fx-lab — original implementation`
> 参考了 **Trello** 与 **Linear** 看板的拖拽交互（见下文"手法来源"），**全部代码原创重写**，
> 未下载、未复制任何一方的源码、样式与文案。

## 手法来源（诚实声明）

| 参考对象 | 复现的手法 | 实现方式 |
|---|---|---|
| Trello | 拖起时卡片放大 + 深阴影；目标列高亮；虚线槽位指示落点 | 自研 Pointer Events 引擎重写 |
| Linear | 克制的 lift（无夸张旋转）、放下时弹性 settle | FLIP + `cubic-bezier(0.22,1,0.36,1)` 重写 |
| 自创 | 拖拽中卡片 `translateZ(70px)` 纵深浮起，`rotateX/Y` 跟随指针**速度**（EMA 平滑），边缘自动滚动 | 原创 |

## 文件清单

```
~/workspace/fx-lab/admin-kanban-3d/
├── index.html            # 单文件成品：双击即看（build.sh 生成，CSS/JS 已内联）
├── index.template.html   # 页面源码（改 HTML 改这里，改完跑 build.sh）
├── styles.css            # 全部样式（锁死配色见下文）
├── build.sh              # 构建脚本：template → fx-singlefile.py → index.html
├── README.md             # 本文档
└── src/
    ├── config.js         # ★ 参数中枢：看板数据、文案、动效调参全在这里
    ├── board.js          # 看板渲染 + 数据操作（移动/增删列卡/完成态/双击改名）
    ├── drag.js           # ★ 拖拽引擎：Pointer Events 自研，无第三方库
    ├── rings.js          # 列头 SVG 进度环
    └── main.js           # 入口：接线 + 工具栏 + 无头验证钩子
```

构建：`./build.sh`（注意 fx-singlefile.py 是单向打包，永远从 template 重新生成，
不要直接改 `index.html`）。

## 交互说明

- **拖起**：鼠标移动超 6px / 触屏长按 380ms；卡片 `scale(1.06)` + `translateZ(70px)` 浮起，
  深阴影 + 强调色描边；`rotateX/Y` 按指针速度 EMA 映射（最大 ±10°），另带轻微 `rotateZ`。
- **拖拽中**：`elementsFromPoint` 命中目标列 → 列高亮（强调色光晕），虚线槽位指示插入位置；
  拖到看板/列边缘自动滚动；`Esc` 或落到列外 = 取消，卡片飞回原位。
- **放下**：快照全部卡片位置 → 提交数据 → 重渲染 → Web Animations API 做 FLIP，
  240ms `cubic-bezier(0.22,1,0.36,1)` 回弹落位（含被挤开的邻居卡片）。
- **列头进度环**：该列 `done` 卡片占比，SVG 圆环带过渡动画；点卡片右上角圆圈标记完成。
- **演示工具栏**：添加卡片 / 添加列 / 重置演示；双击卡片标题就地改名。
- **降级**：`prefers-reduced-motion` 时关闭倾斜/FLIP/放大，退化为普通拖拽。

## 手法拆解（drag.js 核心）

1. **统一指针模型**：只用 Pointer Events，mouse / touch / pen 同一套状态机
   `idle → pending → dragging`；touch 在长按触发前允许滚屏（移动超 12px 即视为滚动）。
2. **视觉分离**：原卡片 `display:none` 腾位，`body` 下挂全屏 `.drag-layer`
   （`perspective:1200px`，`pointer-events:none`），clone 在 layer 内做真 3D 变换。
3. **速度倾斜**：每帧算指针瞬时速度，做 0.25 系数 EMA 平滑后映射到 rotate，
   抖动的手不会让卡片乱晃；静止时卡片回正。
4. **FLIP settle**：放下前快照 `Map<cardId, rect>`（含被挤开的卡），重渲染后
   `el.animate([translate(dx,dy) → 0])`，物理 easing，一次性播完无残留样式。

## "不像 AI 写的"自查（按老板质量铁律）

- ① 克制：整页只讲一个核心动效（3D 拖拽），无多余装饰动效。
- ② 配色锁死：底 `#0a0d13` / 面 `#121722` / 边 `#232b3d` / 强调 `#5b8cff`，
  语义色只出现在优先级小圆点；无渐变、无彩虹。
- ③ 字体：系统字体栈，标题 21px/700、列名 13.5px/700、卡片 14px，
  字距分层，留白呼吸感。
- ④ 文案：真实研发任务短句（"慢查询从 800ms 降到 120ms"），无 Lorem、无 emoji。
- ⑤ 手工细节：暗角 + 3.5% 胶片噪点、列 stagger 入场（70ms 级差）、卡片 hover 上浮、
  空列"拖到此处"虚线态、按钮 hover 微交互。
- ⑥ easing：全部物理曲线（`cubic-bezier(0.22,1,0.36,1)`），无 linear。

## 验证记录（2026-10-05，无头 Chromium）

- 初渲染：8 卡 / 3 列 / 3 进度环，console + pageerror **零报错**。
- 人工驾驶拖拽（`window.__kanban.engine.debugBeginAt/debugMoveTo`）：
  拖起状态 `dragging`、落点 `doing/index:1`、槽位与列高亮正确、
  clone 矩阵含 `translateZ(70px) + rotateX(-10°) + rotateY(10°) + scale(1.06)`。
- 放下后：卡片准确插入目标列第 2 位，列计数 4/2/2 → 3/3/2，无残留 slot/clone。
- ⚠️ 拖拽**手感**（跟手延迟、触屏长按、边缘滚动速度）无头环境测不出来，
  **需真机（鼠标 + 触屏）再验**，已在结构上预留调参口（`CONFIG.motion`）。

## 改造成你业务的看板

只改 `src/config.js`：换 `columns` 数据（列/卡片字段见文件内示例），
调 `motion` 参数（放大倍数、倾斜上限、长按时长、回弹时长），跑 `./build.sh` 即得单文件。
