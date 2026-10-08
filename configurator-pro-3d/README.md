# configurator-pro-3d · 玖时 MERIDIAN 实时 3D 腕表配置器

一句话：对标 2026 电商获奖 3D 配置器的实时产品配置器模板——左侧 3D 视口（自研 orbit + 影棚三点布光），右侧配置面板（表盘/表带/场景/夜光），价格实时联动，"加入购物袋"带按压反馈与 toast。

## 参考与借鉴点

- 参考对象：Zapf Garagen 式在线车辆配置器、Awwwards "Generative 3D-Configurator" 类获奖电商配置器。
- 借鉴的手法（实现全部原创重写，未复制任何第三方代码）：
  1. GLB 模型 + 材质槽位切换：表盘色 / 表带材质 / 场景灯光三组独立槽位；
  2. 环境光叙事：影棚 / 黄昏 / 夜晚三套灯光色温 + 背景色，强化"一物多面"的销售话术；
  3. orbit 交互：拖拽旋转 + 滚轮缩放 + 无操作自动旋转，引导用户自己"把玩"商品；
  4. 价格实时联动：每个选项明码标价，合计数字滚动，离"下单"只差一个按钮。
- 未借鉴：任何品牌的视觉资产、文案、模型文件。品牌"玖时 MERIDIAN"、中文短句、程序化手表几何均为虚构原创。

## 动效拆解

| 动效 | 实现 | 参数 |
|---|---|---|
| 入场运镜 | 相机半径 8.6 → 5.6，easeOutCubic，1.6s | `introCam` / `updateIntro` |
| 材质过渡 | 表盘色 / roughness / metalness / emissiveIntensity 逐帧指数趋近（帧率无关 damp），不硬切 | k=7/s（材质），k=5/s（灯光） |
| 自研 orbit | yaw/pitch 目标-当前双值 + 松手惯性速度衰减；滚轮/双指缩放钳制 | 惯性衰减 `pow(0.02, dt)` |
| 自动旋转 | 无操作 5s 后 yaw 缓转，任意交互即停并重置计时 | 0.28 rad/s |
| 价格滚动 | 显示值向目标值 damp 追踪，`¥` 千分位中文格式 | k=8/s |
| 按钮反馈 | 加入购物袋：scale .96 按压 + `bagpop` 回弹（easeOutBack 味）；swatch hover 放大 1.12 | CSS transition |
| Toast | 底部滑入，2.6s 自动收起 | cubic-bezier(.22,1,.36,1) |
| 加载态 | 品牌 mark 脉冲 + 进度条（GLB 真实进度）+ 四句 tip 轮播；完成淡出 600ms 后移除 DOM | — |
| 夜光开关 | switch 拨杆滑动 + emissiveIntensity 0 → 1.6 lerp | k=7/s |

物理感来源：所有连续量都用指数趋近 `1-exp(-k·dt)`（帧率无关），离散动作用 easeOutCubic / easeOutBack，不用 linear。

## 配置参数

```js
MODEL_URL  // 模型地址（本地 models/ 目录；换自己 CDN 的 URL 也行）
DIALS[6]   // 表盘：曜石黑/象牙白/深海蓝/墨绿/赭石/酒红，溢价 +¥0 / +¥500
STRAPS[3]  // 表带：意大利皮革(+¥800, rough .72) / 精钢链带(+¥2000, metal .92) / 尼龙织带(+¥0, rough .92)
ENVS[3]    // 场景：影棚 #F4F4F2 / 黄昏 #2E2118 / 夜晚 #0F0F13（背景+三灯色温+曝光+阴影不透明度）
BASE_PRICE = 12800, LUME_PRICE = 300
```

GLB 模型部件分类（`classifyGLB`）：按名称关键词（dial/strap…）→ 按包围盒启发式（薄圆盘≈表盘、细长薄片≈表带）→ 兜底（最大体块当表盘、其余非最大件当表带区）。加载即克隆全部材质，防止多 mesh 共享材质串色。

## 六项自查

1. 克制：整页只讲"配置这块表"一件事，无多余动效堆砌。
2. 配色：全页 3 色——影棚灰 `#F4F4F2`、石墨 `#1A1A1A`、强调赭 `#C2410C`，无彩虹渐变。
3. 字体：系统字体栈，字号/字距/层级分明，大标题 breathing room。
4. 文案：中文短句（"时间，自有分量。"），无 Lorem ipsum、无 emoji。
5. 手工细节：radial 纹理 ContactShadow、vignette、表带 canvas 纹理（皮革颗粒/尼龙斜纹/拉丝）、hover 微交互、加载 tip 轮播。
6. easing：指数趋近 + easeOutCubic/easeOutBack，有物理感。

## 源码结构

```
configurator-pro-3d/
├── index.src.html      # 页面骨架（构建入口）
├── index.html          # 单文件成品（fx-singlefile.py 生成，一次性单向）
├── styles.css          # 原创样式（构建时内联）
├── vendor/
│   ├── three.module.js # three r160（构建时转 data: URL）
│   └── addons/loaders/ # GLTFLoader / DRACOLoader（esbuild 打包进 bundle）
├── src/
│   ├── main.js         # 全部业务逻辑（orbit/灯光/配置/价格/动效）
│   ├── inline-draco.js # 内联 Draco 加载器（原创重写：子类化 DRACOLoader，重写 _loadLibrary）
│   └── draco-assets.js # Draco 解码器二进制（MIT，随 three 分发；纯数据非创意代码）
└── README.md
```

外部请求：零（模型在本地 models/；three/Draco/字体/纹理全内联或程序化生成）。

## 重建方式

```bash
cd ~/workspace/fx-lab/configurator-pro-3d
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py configurator-pro-3d
# esbuild 预检：
/tmp/esb/node_modules/.bin/esbuild src/main.js --bundle --format=esm --external:three --minify --outfile=/dev/null
# 强制程序化手表（跳过模型加载）：index.html?procedural
```

模型已下载到本地 `models/tripo_watch.glb`（4.8MB），开箱即用无外部依赖。
加载失败时 try/catch 自动降级为程序化手表，console 仅 warn、无 error。

## 移动端

- 宽度 <900px 时配置面板变为底部抽屉：默认收起露出把手，点按展开，可上下滑动浏览选项。
- 视口手势：单指拖拽旋转、双指开合缩放；360° 提示 pill 精简为图标+数字。
- 顶栏压缩：品牌字缩小，价格与"加入购物袋"保留一屏可达。
