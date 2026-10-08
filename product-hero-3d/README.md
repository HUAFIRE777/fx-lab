# product-hero-3d · 电商产品 Hero 3D 模板

<!-- huafire3d fx-lab — original implementation -->
独立站首页首屏：全屏 3D 产品展示。默认模型为 本地 models/ 目录的耳机模型
（`models-web/hero/electronics/tripo_headphone.glb`，Draco 压缩——模板自带解码器，零额外请求）。

双击 `index.html` 即可看（单文件，断网可开；模型已在本地 models/ 目录，断网可开）。

## 手法拆解

| 手法 | 做法 | 为什么 |
|---|---|---|
| 三点布光 | 主光（投射阴影）+ 补光 + 背面轮廓光 + 半球底光 | 电商产品图的经典布光，轮廓光把产品从深色背景里"勾"出来 |
| 程序化影棚 | `RoomEnvironment` + PMREM，不加载任何外部 HDR | 金属/塑料质感全靠环境反射；单文件无外部依赖 |
| 包围球自动构图 | `Box3.getBoundingSphere` → 贴合距离 = r/sin(fov/2) | 换任意模型（`?model=`）都不用调相机，永远摆得正 |
| 闲置自动旋转 | OrbitControls `autoRotate`，`start` 事件暂停、`end` 后 N 秒恢复 | 用户一上手就停，松手即回——"活的"首屏 |
| 开场推进 | 相机从 1.8× 距离 `easeOutCubic` 推近 1.6s | 物理感，不用 linear |
| 地面阴影 | `ShadowMaterial` 圆盘 + PCFSoft | 产品"落"在页面里，有重量感 |
| 加载失败占位 | SVG 占位卡 + 重试按钮，文案照常显示 | 永不白屏 |
| 降级 | `prefers-reduced-motion` → 静态渲染（交互时补一帧） | 可访问性 |

## 参数说明（`src/config.js`，改完即生效）

- `model.url` — 模型地址（也支持 `?model=<url>` 临时换）
- `copy.*` — 品牌/标题/文案/价格/按钮文字，换产品只改这里
- `background.*` — 背景渐变上下色、中央光晕颜色/不透明度
- `lights.{key,fill,rim,hemi}` — 颜色/强度/位置；`lights.exposure` 曝光
- `environment.intensity` — 环境反射强度（0–2）
- `floor.*` — 地面阴影开关/浓度
- `camera.*` — fov、距离系数（相对贴合距离）、缩放上下限、俯仰角限制
- `controls.*` — 自动旋转开关/转速、闲置恢复秒数、阻尼、平移开关
- `intro.*` — 开场推进开关/时长/起始距离
- `perf.*` — 像素比上限（桌面/移动）、阴影贴图尺寸
- `ui.panel` — 右上 ⚙ 实时调参面板开关

三种改参方式：① 页面右上 ⚙ 面板拖滑杆；② 控制台 `__HERO.CONFIG.lights.key.intensity = 4; __HERO.apply()`；
③ 直接改 `src/config.js`（`?panel=0` 藏面板、`?autorotate=0` 关自转、`?static=1` 强制静态）。

## 质量自查（fx-lab 第四条铁律）

① 整页只讲"3D 产品旋转展示"一个核心动效；② 配色 2 色：深蓝黑背景 + 雾蓝 accent；
③ 字号/字距/层级：品牌字距 .34em、大标题 800 粗 + .04em 字距；④ 无 lorem、无 emoji（齿轮为内联 SVG）；
⑤ 手工细节：vignette 暗角、feTurbulence 噪点、chips 透明度错落、hover 上浮、加载态；
⑥ easing：开场 `easeOutCubic`、面板/UI 过渡统一 `cubic-bezier(.2,.8,.2,1)`。

## 源码结构

```
product-hero-3d/
├── index.html            # 单文件成品（附件交付用，由 template + singlefile 生成）
├── index.template.html   # 开发模板（改这里，再打包）
├── src/
│   ├── config.js         # 中央参数
│   ├── viewer.js         # Three.js 查看器（场景/灯光/相机/交互/加载）
│   ├── ui.js             # 文案注入/loading/占位/参数面板
│   ├── main.js           # 启动入口
│   └── draco-assets.js   # Draco 解码库内联（由官方 r160 文件生成）
├── vendor/               # Three.js r160 本地库（three.module.js + addons）
└── README.md
```

改完模板后重新打包：`cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py product-hero-3d`
（注意 singlefile 是单向的，不要对已打包的 index.html 重复跑。）

## 移动端

触屏旋转/双指缩放（OrbitControls 原生手势，`touch-action: none` 防滚动打架）、像素比上限 1.5、
窄屏/矮屏自动收起装饰元素。`prefers-reduced-motion` 降级静态渲染。
