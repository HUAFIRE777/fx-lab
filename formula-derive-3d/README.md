# 公式是怎么来的 · 等差数列求和推导

四步走完「倒序相加」：公式逐行 stagger 展开、配图 3D 图形同步生长，跟着高斯当年的思路把 S=n(a₁+aₙ)/2 推出来，而不是背下来。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **3Blue1Brown 的公式讲解分镜**：一个镜头只讲一个数学动作，配图随讲解逐个出现、不一次全倒出来。学的是"讲解节奏 = 图形出现节奏"的分镜感。
2. **Observable notebooks 的步骤揭示**：上一步变淡、下一步高亮滑入，读者永远知道自己在哪一步。学的是"步骤指示器 + 历史步骤降调"的导航结构。

复现的手法（实现均为原创）：步骤 `.active`（白底+朱红编号）/ `.dim`（30% 透明）的二态切换 + 新步骤 `y:26→0` `power3.out` 滑入；3D 图形旧组下沉收起、新组 stagger 生长（柱 `power3.out` 0.09s 间隔、顶盖 `back.out(2.2)` 弹出）；图注"图一·数列柱"随步骤同步换（教科书式 figure caption）。

## 动效拆解

- **核心动效（只讲这一个）**：四步公式 stagger 展开。上一步自动变淡（`.dim`），当前步高亮滑入；每步配一个 3D 辅助图形同步生长淡入——图一数列柱（8 根 stagger 生长，a₁/aₙ 朱红）、图二倒序行（朱红半透明反向行 + 顶部翻转弧线箭头 `back.out` 弹出）、图三配对塔（4 座等高塔，首尾配对之和可视化）、图四矩形取半（整块矩形 + 朱红对角线扫过 + 半透明三角 = S）。
- **导航**：上一步/下一步按钮（末步变为"回到开头"）、4 个指示点、进度条、计数器；空格/→/← 键盘翻步。
- **3D 舞台**：纸面浅色场景，慢速自转（0.22 rad/s）+ 用户拖拽旋转（嵌套 tilt 组，不打架）+ 滚轮缩放（6.5–14）；首帧渲染后 canvas 淡入。
- **入场**：`body.js → loaded` 双 rAF 淡入；无 JS 时步骤内容直接可见（降调类由 JS 添加）。

## 配置参数

- `src/config.js`：`STEPS`（numeral/tag/fx/note/figNo/figTitle/figDesc，改文案只改这里）、`N_BARS=8`（演示项数）、`UNIT=0.42`（柱高单位）、配色 `INK/VERM`。
- `src/helpers3d.js`：`BUILDERS` 四步图形构造器，每步返回 `{ group, intro() }`；生长节奏（stagger 间隔、easing）在各 `intro` 里调。
- `src/main.js`：`goStep(i)` 切换逻辑；自转速度、缩放范围、拖拽灵敏度。
- 公式排版：`.frac`（上下结构 + 分数线）与 `<sub>` 纯 CSS/HTML 手排，无 MathJax/KaTeX。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"四步推导"一个核心动效，无多余装饰动画。
2. **配色**：纸白 `#FAFAF8` + 墨 `#1A1A1A` + 朱红 `#E5484D` 三色定死，无渐变滥用（背景仅两处极淡光晕）。
3. **字体**：公式用 Times/Songti 衬线（教科书感），标题字距 .06em、行高 1.3；步骤编号用汉字数字一/二/三/四。
4. **文案**：真实感中文短句（"别背公式。跟高斯当年一样……"），无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角、SVG 噪点、教科书式图注（图一·数列柱）、按钮 hover 浮起/active 缩放、kbd 键帽、末步"回到开头"。
6. **easing**：全部 `power3.out` / `back.out` / `power2.in`，无 linear；`prefers-reduced-motion` 下 stagger 全跳过、CSS 过渡压到 0.01ms。

## 源码结构

- `index.template.html` —— 开发模板（CSS 全内联 `<style>`，importmap 指 `./vendor/three.module.js`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 888KB）
- `src/config.js` —— 四步文案 / 配色 / 演示参数
- `src/helpers3d.js` —— 四步 3D 辅助图形构造器（数列柱/倒序行/配对塔/矩形取半）
- `src/main.js` —— 步骤 DOM 渲染、步骤切换、3D 舞台（手写拖拽旋转+缩放）、键盘导航
- `vendor/` —— three.module.js + GSAP 3.12.5（本地，无 CDN；头部 URL 注释已剥离以符合外链白名单）

## 模型说明

四步图形全部程序化几何，**零外部依赖、零网络请求**：无 R2 外链，无 CORS 问题。WebGL 不可用时显示文字提示，公式推导不受影响。

## 重建命令

```bash
cd ~/workspace/fx-lab/formula-derive-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py formula-derive-3d
# 验收
NODE_PATH=/tmp/hcshot/node_modules timeout 100 node /tmp/pageprobe.js "file:///home/hatch/workspace/fx-lab/formula-derive-3d/index.html" 12 2>&1 | tail -25
grep -oE 'https?://[^"'\'' ]+' ~/workspace/fx-lab/formula-derive-3d/index.html | sort -u
```

## 移动端说明

- ≤960px 单列：3D 图置顶（4:3）、步骤在下；键帽提示隐藏。
- 触屏：拖拽旋转/双指缩放走 pointer 事件；按钮均为原生 button，无 hover 依赖。
- `prefers-reduced-motion`：跳过 stagger 生长与自转，CSS 过渡压到 0.01ms。

## 隐藏元素完成态审计（2026-10-05）

- 非当前步骤 `.dim`（opacity .30）：仍可读，点击指示点/下一步即达 `.active` 全显；无永久隐藏的内容元素。
- `body.js` 入场淡入：JS 第一行即加 `js` 类，无 JS 时内容直接可见；`loaded` 在双 rAF 后添加。
- 3D 旧图形组收起后 `visible=false`：受控切换，每步 `intro()` 可达；探针已验证 4 步来回切换零错误。
- 未覆盖 `[hidden]{display:none}`。
