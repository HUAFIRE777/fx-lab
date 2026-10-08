# lusion-scroll-3d · 滚动叙事 3D 模板

<!-- huafire3d fx-lab — original implementation -->

## 一句话

虚构香水品牌「雾屿 ATELIER」的滚动叙事长页：滚动即运镜——相机环绕一只程序化香水瓶缓慢 dolly 推进，四章节（诞生 / 香调 / 工艺 / 拥有）以雾浓度呼吸过渡，全程「重灯光构图、轻几何复杂度」。

## 参考与借鉴点

- **参考对象**：Lusion 式商业 3D 官网的「贵价感」手法（公开作品观摩）。
- **借鉴点（只学手法，代码全部原创重写）**：
  1. 滚动驱动相机 dolly：滚动进度纯函数映射相机轨道关键帧，倒滚即回；
  2. 景深雾层次：章节间 FogExp2 浓度变化做呼吸式过渡；
  3. 克制辉光：只用 additive 精灵做瓶口一缕光尘，不用后期 bloom 库；
  4. 签名 easing：全页统一 cubic-bezier(0.16,1,0.3,1)。
- **未借鉴**：不复制任何 Lusion 的文案、模型、配色方案与代码实现。

## 动效拆解

| 手法 | 做法 | 为什么 |
|---|---|---|
| 滚动即运镜 | scrollY → 0..4 连续进度，5 组相机关键帧（角度/半径/高度/视点/雾浓）插值 | 可逆、无重型滚动库 |
| 惯性跟随 | 目标进度经 lerp 平滑（`1 - 0.0018^dt`），章节插值再套 easeOutExpo | 手感顺滑，签名 easing 的 JS 等价 |
| 雾呼吸过渡 | 每章独立雾浓度，逐帧 lerp，香调章节雾最浓 | 章节情绪切换不靠切镜 |
| 逐字淡入 | 章节标题拆字，stagger 70ms，opacity/位移/blur 三属性过渡 | 排印即动效 |
| 光尘 | 42 个 additive 精灵绕瓶口漂浮，瓶身极慢自转 | 克制的高光点 |
| 暖色影棚 | 主光 warm 聚光 + cool 轮廓光 + 柔顶光 + 古铜补光 | 贵价感来自灯光而非面数 |

## 配置参数（`src/main.js`）

- `SHOTS`：5 组相机关键帧（angle/radius/height/lookY/fog），改完即生效；
- 雾浓度：各章节 `fog` 字段（0.048–0.066）；
- 光尘数量：`for (let i = 0; i < 42; i++)`；
- 移动端像素比上限 1.25（桌面 2），`prefers-reduced-motion` 时只渲染静态首帧。

## 六项自查

- [x] 克制：整页只讲一只香水瓶，无多余元素；
- [x] 配色：暖象牙 `#F5EFE6` + 古铜 `#B08D57` + 深咖 `#1C1410`，全页三色；
- [x] 字体：中文衬线栈（宋体系）大标题 + 细字距英文小字点缀；
- [x] 无占位文案 / emoji，中文真实感短句；
- [x] 手工细节：vignette、SVG 噪点、加载进度条、按钮 hover 填充、滚动提示线；
- [x] easing 统一：CSS 全页 `--ease`，JS 关键帧插值用 easeOutExpo。

## 源码结构

```
lusion-scroll-3d/
├── index.src.html   # 源码入口（文案/样式/importmap）
├── index.html       # 打包成品（fx-singlefile.py 一次性生成，不手改）
├── src/main.js      # 全部 3D 与交互逻辑（ESM）
├── vendor/
│   └── three.module.js  # 本地 three（禁网络下载）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab
cp index.src.html index.html  # 实际在目录内执行
python3 ~/workspace/bin/fx-singlefile.py lusion-scroll-3d
```

`fx-singlefile.py` 为一次性单向打包：改源码后重新 `cp` + 重跑，不要对 `index.html` 反复打包。

## 移动端

- 像素比上限 1.25（降采样），触屏原生滚动驱动运镜；
- ≤640px 章节文案左对齐、隐藏侧边导航圆点；
- `100svh` 适配移动浏览器地址栏伸缩。
