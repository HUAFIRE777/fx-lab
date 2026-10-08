# huafire3d fx-lab — collection-showcase（产品 3D 陈列墙）

独立站系列页模板：6 件商品的 3D 陈列网格。每张卡片一个实时 3D 视口，悬停加速旋转 + 卡片上浮，点击进详情弹窗（大视口 360° 拖拽查看）。

> `huafire3d fx-lab — original implementation`
> 全部代码从零手写，只用了"多视口陈列"这一通用手法，**没有复制任何现有网站的代码**。
> Three.js r183 / GLTFLoader / DRACOLoader 为 MIT 合规引用，已下载到 `vendor/` 本地化。

独立站系列页模板：6 件商品的 3D 陈列网格。每张卡片一个实时 3D 视口，
悬停加速旋转 + 卡片上浮，点击进详情弹窗（大视口 360° 拖拽查看）。

## 打开方式

- **直接看**：双击 `index.html`（单文件，CSS/JS/Three.js/Draco 解码器已全内联，附件发出即完整可看）。
- **二次开发**：改 `src/` 后跑 `python3 build.py` 生成 `index.html`，
  再跑 `python3 ~/workspace/bin/fx-singlefile.py collection-showcase` 打单文件。
  （`build.py` 是幂等的，可反复跑；`fx-singlefile.py` 是一次性单向打包，不要对已打包文件重复跑。）

**零国外依赖**：Three.js/Draco 走 `vendor/` 相对路径（打包后转 data: URL 内联），
无 Google Fonts（系统字体栈），无 CDN。模型全部在本地 `models/` 目录，开箱即用。

## 换商品：只改 `src/config.js`

```js
export const MODEL_BASE = './models'; // 本地模型目录，换 CDN 改这里即可
export const CONFIG = [
  { id: 'aurora-x9',
    name: 'Aurora X9 头戴式耳机', en: 'Aurora X9 Headphones',
    category: '数码', price: 1299, tag: '新品',          // tag 为空则不显示角标
    model: `${MODEL_BASE}/electronics/tripo_headphone.glb`, // 模型路径（本地）
    tint: '#e8edf4',                                     // 视口底色
    desc: '...' },
  // ... 继续加
];
export const CATEGORIES = ['全部', '数码', '服饰', '出行', '配饰'];
```

增删商品、改名、改价、换模型、换分类，全部只动这一个文件。

## 关键设计

- **一个 renderer，多剪刀区视口**（`src/viewer.js`）：整页共用一个 WebGL 上下文，
  每张卡片是独立 Scene/Camera/Light rig，按卡片矩形 `setViewport/setScissor` 分区渲染。
  比每卡一个 canvas 省 5 个 GL 上下文，移动端无压力。
- **懒加载**：`IntersectionObserver`（rootMargin 120px 预载）——进入视口才下载 GLB；
  离开视口的卡片跳过渲染；`document.hidden` 时整页暂停。移动端自动降画质
  （`pixelRatio ≤ 1.5`、关闭抗锯齿）。
- **悬停**：JS 端转速向目标 easing（`spinTarget` 0.45 → 2.4 rad/s，有物理感的加速/回落），
  CSS 端卡片 `translateY(-8px)` + 阴影加深（`cubic-bezier(0.22,0.9,0.28,1)`）。
- **详情弹窗**：克隆卡片已加载的模型（几何/材质共享引用，零二次下载），
  大视口支持拖拽旋转，松手 2.5s 后恢复自动旋转；弹窗打开时卡片暂停渲染。
- **失败隔离**：单模型加载失败 → 该卡片显示手绘风格占位 + "重新加载"按钮，
  不影响其他卡片；同一 URL 多卡共用时各拿独立克隆，互不抢夺。
- **Draco**：hero 模型是 Draco 压缩，解码器（wasm+wrapper）由 `build.py`
  内联进包，单文件同样可解，无外部路径依赖。
- **模型归一化**：任意尺寸/位置的 GLB 自动算包围盒，缩放到统一大小、居中，
  换模型不用调相机。

## 质量自查（"看起来不像 AI 写的"六项）

① 克制：整页只有一个核心动效（3D 转盘陈列），无堆砌；
② 配色：纸色 `#f4f3ef` + 墨 `#17171b` 两色定死，无彩虹渐变；
③ 字体：系统字体栈，字号 clamp 层级、字距拉开，大标题有呼吸感；
④ 文案：真实中文短句，无 Lorem、无 emoji 列表；
⑤ 手工细节：SVG 噪点颗粒（0.05 透明度）、视口中性暗角、每卡随机初始角度/浮动相位、
   骨架屏 + 加载转圈、hover 微交互；
⑥ easing：全站统一物理感贝塞尔曲线，无 linear 动效（转圈为功能性旋转除外）。

## 已知事项

- **移动端**：单列网格；弹窗内大视口可拖拽旋转；`prefers-reduced-motion` 时转盘静止。

## 文件结构

```
collection-showcase/
  index.html            # 交付物（单文件，build + singlefile 生成）
  index.template.html   # 页面骨架（源码）
  styles.css            # 样式（源码，打包时内联）
  build.py              # 构建：template→index.html + 生成 draco 内联模块
  src/
    config.js           # ★ 商品配置（唯一需要改的文件）
    main.js             # 入口：引擎/网格/筛选/弹窗组装
    viewer.js           # 共享 renderer + 剪刀区多视口引擎
    grid.js             # 卡片 DOM + 懒加载 + 悬停/点击
    modal.js            # 详情弹窗（克隆模型 + 拖拽旋转）
    loader.js           # GLB 加载（缓存/内联 Draco/归一化/阴影贴图）
    draco-inline.gen.js # 自动生成（build.py 产物，勿手改）
  vendor/
    three.module.js     # Three.js r183（源码 importmap 引用）
    addons/GLTFLoader.js / DRACOLoader.js
    addons/draco/       # 解码器原件（build.py 内联用）
    utils/              # GLTFLoader 依赖的两个工具模块
  README.md
```

## 验收记录（2026-10-05，无头 Chromium + SwiftShader）

- 6 卡片全部构建，模型加载成功 6/6（含 Draco 解码），`loadfail` 0
- 悬停：`spinTarget` 0.45 → 2.4，卡片上浮样式生效
- 点击：弹窗打开（标题/价格/描述正确），弹窗 3D 视口像素验证 30% 为模型像素
- ESC/背景点击/关闭按钮均可关闭；加入购物袋 toast 正常
- 反向测试：坏 URL 卡片显示占位 + 重试按钮，其余 5 张正常渲染
- `console.error` / 未捕获异常：**0**
