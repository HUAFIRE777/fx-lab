# huafire3d fx-lab — 3D 产品配置器

> `huafire3d fx-lab — original implementation`
> 全部代码从零手写，只学了"电商 3D 配置器"这个通用品类手法，**没有复制任何现有网站的代码**。
> Three.js r160（MIT）与 meshoptimizer 解码器（MIT）为合规开源引用，已下载到本地 `vendor/` / `src/addons/`。

独立站商品页模板：**左侧 3D 实时预览，右侧配置面板**。点颜色/工艺/增值服务，
产品外观实时变化，总价实时重算。换一款商品只改 `src/config.js`。

## 打开方式

- **成品**：双击 `index.html`（已打包的单文件，CSS/JS/Three.js 全内联；
  3D 模型在本地 `models/` 目录，无外部依赖，断网可开）。
- **二次开发**：改 `index.template.html` / `src/` 后，
  `cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py product-configurator`
  重新打包。**不要对已打包的 index.html 重复跑打包器**（单向）。
- 源码态 `index.html` 用 ES module，file:// 在部分 Chromium 构建上被禁，
  本地开发请起 HTTP 服务：`python3 -m http.server`。

URL 参数：`?model=<url>` 覆盖模型（测试用）、`?spin=0` 关闭自动旋转。

## 部署注意（上线前必读）

- **模型面数**：演示模型约 188 万三角面，手机端偏重。生产建议用减面管线
  （ultra 档 60 万面）处理后再挂 CONFIG。

## 模型说明

演示模型为本地 `models/electronics/` 目录的 GLB（Tripo 生成）。
CONFIG 里换任意模型 URL 即可，相机/灯光按包围盒自动适配。

## 手法拆解

1. **材质 override，不碰模型文件**：全模型网格共享一支 `MeshPhysicalMaterial`，
   选色只改 `color`，选工艺只改 `roughness/metalness/clearcoat`。模型是单网格
   合并件也照样整件换色；多部件模型可按 mesh 名分组配多支覆盖材质（见下）。
2. **包围盒自动取景**：`Box3.setFromObject` 算尺寸，相机距离 = 最大边 ×
   `CONFIG.camera.distanceFactor`，任意大小的模型进来都不穿帮、不出框。
3. **零 HDR 的 PBR**：`RoomEnvironment` + PMREM 生成环境反射，金属/亮面工艺
   有真实高光；再加主光投影（PCFSoft）+ 冷色轮廓光 + `ShadowMaterial` 接阴影盘。
4. **meshopt 解码**：模型用了 `EXT_meshopt_compression`，`MeshoptDecoder`
  （wasm base64 自包含，无外部文件）喂给 GLTFLoader。
5. **展台自动旋转**：无交互时缓慢转台，用户一碰即停，4 秒无操作后恢复；
   `prefers-reduced-motion` 下全关。
6. **价格引擎**：`basePrice + Σ priceDelta`，单选/复选统一走 `calcPrice()`，
   切换时数字有个带回弹的 `bump`（spring easing），明细行列出加价项。
7. **移动端底部抽屉**：≤860px 面板变圆角底抽屉，可收起；OrbitControls 原生
   支持单指旋转、双指缩放。
8. **失败态**：加载失败显示手绘 SVG 占位 + 重试按钮，面板照常用，不白屏；
   loading 有真实百分比进度条。

## CONFIG 参数（`src/config.js`）

| 字段 | 说明 |
|---|---|
| `product.{name,tagline,basePrice,currency,formatPrice}` | 商品名/卖点/基价/货币/格式化 |
| `model.url` | GLB 路径（本地 `models/` 目录，换 CDN 改这里） |
| `camera.{fov,distanceFactor,min/maxDistanceFactor,polarMin/polarMax}` | 视角，距离按模型尺寸自动换算 |
| `stage.{autoRotateSpeed,idleResumeMs,bgTop/bgBottom,keyLightColor,rimLightColor}` | 展台氛围 |
| `options[]` | 选项组：`swatch`（色板单选）/`pill`（胶囊单选）/`check`（复选多选）；`color` 换色，`material{}` 换工艺，`priceDelta` 加价 |
| `defaults` | 各组默认选项 |
| `ui.{wordmark,ctaLabel,features}` | 品牌字标/按钮文案/特性短句 |

多部件分别换色（如表带/表盘）：把 `applyMaterial()` 里按 `mesh.name`
正则分组，每组一支覆盖材质，`options` 里加 `target` 字段指向组即可。

## "不像 AI 写的"自查（fx-lab 第四铁律）

- ① 克制：整页只讲"配置商品"一件事，无多余动效。
- ② 配色：深灰单色系 + 一个蓝（`#4f7cff`）点缀，共 2 色；无彩虹渐变。
- ③ 排版：28px 标题 1.4 行高、0.32em 字距的 kicker、分组 12px 大字距小标题，
  价格 tabular-nums，留白分层。
- ④ 文案：真实商品短句（"午夜黑/冰川白/烈焰红"、"镌刻姓名（耳机内侧）"）；
  无 Lorem ipsum；无 emoji 符号列表（特性列表用 4px 方块，失败态用手绘 SVG）。
- ⑤ 手工细节：展台暗角 vignette + 5% 胶片噪点、品牌字标、纤细真实进度条、
  swatch 悬停上浮、价格回弹。
- ⑥ easing：全页统一 `--ease-out: cubic-bezier(0.22,1,0.36,1)` 与
  `--ease-spring: cubic-bezier(0.34,1.35,0.64,1)`，无默认 ease/linear；
  reduced-motion 下全部停用。
- "随机大小透明度"在本模板不适用（电商 UI 要求对齐可信），以噪点/暗角/
  悬停物理感表达手工感。

## 文件

```
product-configurator/
├── index.html            # 打包成品（单文件，双击即开）
├── index.template.html   # 源码模板（打包前从它复制）
├── src/
│   ├── config.js         # 全部可调参数（换商品只改它）
│   ├── main.js           # 应用逻辑
│   ├── style.css         # 样式
│   └── addons/           # GLTFLoader / OrbitControls / RoomEnvironment /
│       └── utils/        #   meshopt 解码器 / BufferGeometryUtils（three r160）
├── vendor/three.module.js# Three.js r160 本地
└── README.md
```
