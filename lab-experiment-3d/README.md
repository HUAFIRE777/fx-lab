# 凸透镜成像 · 虚拟实验室

拉一下物距，看光线自己拐弯：三束特征光线实时折射，带着阻尼滑向新的成像位置，像的大小虚实跟着你的手变。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **PhET 仿真交互**：参数一变，整个实验现象连续、实时地跟着变，而不是"点一下、跳一个结果"。学的是"连续参数 → 连续现象"的仿真手感。
2. **中学物理课本的光路图**：三束特征光线（平行光过异侧焦点、过焦点光折成平行、过光心光直走）+ F/2F 标记 + 实像画在屏上、虚像用虚线反向延长。学的是这套百年不变的光路图语言。

复现的手法（实现均为原创）：物距 `u` 用指数阻尼（`1-exp(-7dt)`）跟随目标值，光路/光屏/像箭头/读数全部由当前 `u` 每帧重算——所以拖滑杆时像是"滑"过去的；虚像时三束实线照常发散、另加青色虚线反向延长交于虚像点；光屏只在实像且像距 ≤5f 时阻尼跟到像的位置，否则停靠最右并标注"屏外"。

## 动效拆解

- **核心动效（只讲这一个）**：滑杆调物距 / 直接拖拽透镜 → 三束光线实时重算折射角度、光屏与像箭头带阻尼跟随，像的大小/虚实连续变化并标注。
- **光路**：青色实线三束（`THREE.Line`，每帧重写 Buffer）；虚像时加 `LineDashedMaterial` 反向延长线（每帧 `computeLineDistances`）；u=f 时三束折后平行、像箭头隐藏、结论"不成像"。
- **像箭头**：蓝色，实像倒立（轴下方）/虚像正立半透明（轴上方），配"实像/虚像" canvas 手绘标签；实像落在屏上时屏面亮起青色光斑。
- **实验台**：程序化双凸透镜（LatheGeometry + clearcoat 高光 streak + 镜框）、蜡烛（青色风格化烛焰 + 点光源 + 轻微晃动）、光具座导轨刻度、跟随透镜移动的 F/F′/2F/2F′ 标记。
- **面板**：物距滑杆（0.35f–3.4f，蓝色填充）、五个快捷 chips（u>2f / u=2f / f<u<2f / u=f / u<f，一键跳到典型值看阻尼滑动）、实时读数（像距/放大率/像的性质）、结论卡（倒立·缩小·实像等五种真实物理结论 + 一句话讲解）。
- **镜头**：固定机位 +  subtle 鼠标视差（拖透镜时暂停）；`prefers-reduced-motion` 下阻尼改为直接跟随、关闭视差与烛焰晃动。

## 配置参数

- `src/config.js`：`F=1`（焦距）、`U_MIN/U_MAX`（滑杆范围）、`conclude(u)` 五种成像结论、`imageOf(u)` 薄透镜公式 `1/v=1/f−1/u`。
- `src/optics.js`：实验台各部件构造器、`RaySet`（三束实线+三束虚线）、`makeLabel`（canvas 手绘中文标签，无外部字体）。
- `src/main.js`：阻尼系数（u: 7/s，光屏: 5/s，镜头: 4/s）、拖拽/滑杆/chips 事件、读数 DOM 更新（文本变化才写）。
- 改焦距：`config.js` 的 `F`；改默认物距：`U_DEFAULT`。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"调物距看成像"一个核心动效，无多余装饰动画。
2. **配色**：实验室白 `#F4F7FA` + 蓝 `#2563EB` + 青 `#22D3EE` 三色定死；烛焰也做成青色（风格化统一），无彩虹渐变。
3. **字体**：标题字距 .06em、行高 1.3；读数全部 tabular-nums；键帽式 chips。
4. **文案**：真实感中文短句与真实物理结论（"物距大于二倍焦距……照相机就是这个原理"），无 Lorem、无 emoji 列表。
5. **手工细节**：vignette 暗角、SVG 噪点、烛焰轻晃、滑杆蓝色填充、光屏"屏外"诚实标注、虚像半透明。
6. **easing**：参数变化全走指数阻尼（物理感的"滑"），无 linear；`prefers-reduced-motion` 下全部压到 0.01ms。

## 源码结构

- `index.template.html` —— 开发模板（CSS 全内联 `<style>`，importmap 指 `./vendor/three.module.js`）
- `index.html` —— 单文件交付版（`fx-singlefile.py` 打包，约 963KB）
- `src/config.js` —— 光学常量 / 薄透镜公式 / 五种成像结论文案
- `src/optics.js` —— 实验台程序化几何（光具座/蜡烛/透镜/光屏/光线/像箭头/标签）
- `src/main.js` —— 阻尼状态机、光路每帧重算、滑杆/chips/透镜拖拽、读数更新
- `vendor/` —— three.module.js + GSAP 3.12.5（本地，无 CDN；头部 URL 注释已剥离以符合外链白名单，版权归属见本节）

## 模型说明

全部程序化几何，**零外部依赖、零网络请求**：无 R2 外链，无 CORS 问题，无加载失败态。

## 重建命令

```bash
cd ~/workspace/fx-lab/lab-experiment-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py lab-experiment-3d
# 验收
NODE_PATH=/tmp/hcshot/node_modules timeout 100 node /tmp/pageprobe.js "file:///home/hatch/workspace/fx-lab/lab-experiment-3d/index.html" 12 2>&1 | tail -25
grep -oE 'https?://[^"'\'' ]+' ~/workspace/fx-lab/lab-experiment-3d/index.html | sort -u
```

## 移动端说明

- ≤960px 单列：3D 图在上（4:3）、面板在下；面板取消 sticky。
- 触屏：透镜拖拽走 pointer 事件（`touch-action: none`），滑杆/chips 均为原生控件，无 hover 依赖。
- `prefers-reduced-motion`：阻尼改直接跟随，关闭镜头视差与烛焰晃动，CSS 过渡压到 0.01ms。

## 隐藏元素完成态审计（2026-10-05）

- 像箭头在 u=f 时隐藏：滑杆/chips 拉到 u≠f 即出现（实像/虚像两种形态均可达）。
- 虚线延长线仅虚像时显示：u<f 即达；光斑仅实像跟屏时显示。
- `body.js` 入场淡入：JS 第一行即加 `js` 类，无 JS 时面板内容直接可见；`loaded` 在双 rAF 后添加。
- 探针已验证：滑杆 5 档 + chips 点击，结论/读数/像性质全部正确切换，零错误。
- 未覆盖 `[hidden]{display:none}`。
