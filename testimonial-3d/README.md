# FX·LAB — testimonial-3d 客户评价 3D 墙（原创实现）

> `huafire3d fx-lab — original implementation`
> 暖纸面编辑风的评价墙模板：3D 堆叠轮播卡片 + 文字 logo 走马灯。全部代码从零编写，零外部依赖。

## 在线预览

双击 `index.html` 即可（单文件，CSS/JS 已全内联，无需服务器，断网可开）。

## 参考与复现手法

没有复制任何网站的源码。研究过的公开手法（均为通用模式，代码全部自己重写）：

1. **3D 堆叠轮播**（参考了公开的 "3D stacked carousel" 教程类实现思路）：居中主卡，两侧卡片按偏移量下沉 `translateZ`、倾斜 `rotateY`、虚化 `blur`、降低透明度；拖拽时把横向位移换算成分数偏移实时叠加，松手按阈值吸附。实现见 `src/carousel.js`。
2. **无缝 logo 走马灯**：同一组 wordmark 复制两份，`track` 做 `translateX(-50%)` 循环；悬停暂停；`prefers-reduced-motion` 下静止平铺。实现见 `src/logos.js`。
3. **自动轮播进度条**：CSS `width` transition 与 `setTimeout` 同步计时，hover/focus/拖拽/切后台时暂停并重置——无障碍（WCAG 2.2.2：自动轮播必须可暂停）。

## 效果清单

| 效果 | 说明 |
|---|---|
| 3D 纵深卡片 | `perspective:1600px`；偏移 ±1 的卡片下沉 190px、倾斜 15°、blur 1.6px；±2 以外隐藏 |
| 拖拽切换 | Pointer Events，横向拖动实时跟手（拖拽中关闭 transition），阈值 0.32 张卡宽吸附；`touch-action:pan-y` 保证移动端纵向滚动不受影响 |
| 自动轮播 | 默认 5.5s，顶部细进度条同步；hover / focus / 拖拽 / 页面隐藏时暂停 |
| 圆点 + 箭头 + 计数器 | 胶囊形圆点（激活拉长）、两侧圆形箭头、`01 — 06` 等宽计数器、键盘左右键 |
| 程序化头像 | `src/avatars.js`：canvas 画双色渐变 + 高光 + 首字母，无外部图片 |
| 星级 | 内联 SVG 星形，`rating` 字段控制点亮数 |
| 入场编排 | 标题/副标题/各区块按 `--d` 依次升起；无 JS 时内容照常可见（`.js` 守卫） |
| 降级 | `prefers-reduced-motion`：关自动轮播、关走马灯、关过渡 |

## 踩过的两个坑（已修，记下来防复发）

1. **`preserve-3d` + `filter:blur()` 层叠 bug**：卡片带 blur 时 Chromium 会把 3D 场景压平按 DOM 顺序绘制，导致最后一张卡盖住第一张。修法：`.deck` 不用 `preserve-3d`（默认 flat），靠 `z-index` 排序；`translateZ/rotateY` 照样吃父级的 `perspective`。见 `styles.css` 注释。
2. **`fx-singlefile.py` 是一次性单向打包**：跑过一次后 `index.html` 里的 `<link>`/`<script src>` 已被内联，再跑等于白跑（改动进不了包）。本窗口改走 `build.py`：`index.template.html`（源码）→ `index.html`（源码）→ 打包。以后改 `src/` 后一律 `python3 build.py` 重建。

## 参数（`src/config.js`）

- `autoplayMs`：自动轮播间隔毫秒，`0` 关闭
- `testimonials[]`：`quote / name / role / company / rating(1-5) / hue([h1,h2])` ——评价、头像配色全从这里换
- `logos[]`：`text / cls` ——文字 logo，样式类见 CSS `.wm-*`
- `stats`：本模板 stats 写在 HTML 里，如需改直接改 `index.template.html`

## 文件结构

```
testimonial-3d/
├── index.html            # 单文件成品（附件发出这个）
├── index.template.html   # 打包前源码（改结构改这里）
├── styles.css            # 设计系统源码
├── build.py              # 重建脚本：template → index.html → 单文件打包
├── src/
│   ├── config.js         # 全部可调参数
│   ├── carousel.js       # 3D 堆叠轮播
│   ├── logos.js          # logo 走马灯
│   ├── avatars.js        # canvas 头像生成
│   └── main.js           # 入口
└── README.md
```

## 验收记录

- 桌面 1280px / 移动 390px 截图验证通过
- 首卡 01/06 居中，两侧纵深卡片正常；圆点/进度条/计数器联动
- console 零报错；断网 file:// 双击可开
