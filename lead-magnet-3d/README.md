# 3D 白皮书落地页（lead-magnet-3d）

白皮书获客落地页模板 —— 左侧文案 + 表单，右侧 3D 白皮书随鼠标倾斜，点击"翻开看看"书页翻动，提交表单后成功态。商用级，原创代码。

`huafire3d fx-lab — original implementation`

## 参考来源（手法学习，代码全部重写）

1. **HubSpot 白皮书落地页**：左文案（标题 + 3 条价值 bullet + 短表单）右 3D 书封面的经典获客版式，表单字段只收必要信息（姓名/邮箱/公司），提交后成功态明确下一步。
2. **Apple 式产品页的书本质感**：纯白舞台、柔和投影、书脊/书页的程序化建模，用光影而非贴图堆料表现质感。

复现的手法（实现均为原创）：鼠标视差驱动的书本倾斜（lerp 跟随）、铰链式翻页（书脊处 pivot + GSAP 时间轴双页先后翻动）、Canvas 程序化绘制的封面/内页纹理（藏青 + 金配色）、表单三段校验 + 成功态浮现。

## 动效拆解

1. **入场**：左栏（眉题 → 标题 → 导语 → bullets → 表单）逐项 `stagger 0.1s` 上浮浮现，3D 书随后淡入，全套 `power3.out`。
2. **鼠标倾斜**：`pointermove` 归一化 → 目标旋转 ±0.4/±0.25 rad，`dt*4` lerp 跟随；书本另有 ±0.05 的呼吸浮动。
3. **翻页**：点"翻开看看"或点书 → 两页以 0.45s 间隔先后翻到 -2.85 rad（`power2.inOut`），书本同步微转展示；按钮变"合上"，再点按逆序合上。`flipping` 锁防连点。
4. **表单**：姓名/邮箱必填（邮箱正则），错误红框 + 自动聚焦；提交成功表单隐藏，左侧金线成功态浮现（"发送成功，请查收邮箱"）。
5. **手工细节**：封面金色双线框、书页侧边条纹纹理、地面柔和投影、vignette + SVG 胶片噪点、按钮 hover 上浮 + 阴影、加载态品牌滑杆。

## 配置参数（`src/main.js` 顶部常量区）

- `EASE` —— 全局 easing（`power3.out`，物理感）。
- 翻页角度 `FLIP_Y = -2.85`，翻页时长 1.1s/页，间隔 0.45s。
- 倾斜幅度：`cx * 0.4`（yaw）、`cy * 0.25`（pitch）；书本基础位 `baseRy = -0.55`。
- 封面/内页文案在 `coverTexture()` / `pageTexture()` 里改（纯 Canvas 绘制，零外部资源）。
- 表单成功文案在 `#formOk` 内联 HTML 里改。

## 六项"不像 AI 写的"自查

1. **克制**：整页只讲"翻书"一个核心动效，倾斜只是跟随，不堆砌。
2. **配色定死**：白 `#ffffff` / 藏青 `#14264d` / 金 `#c9a227` 三色全页统一，无彩虹渐变。
3. **字号字距层级**：标题 `clamp(40px,4.6vw,62px)` 字重 800；眉题 12px 字距 .3em 金色；表单 label 12px 字距 .2em 淡藏青。
4. **文案真实感**："写给每月 10 万–500 万 GMV 的独立站团队""烧掉 40 万美金之后，我们总结出的避坑清单""已有 3,280 位店主下载 · 我们只发白皮书，不发垃圾邮件"。无 Lorem、无 emoji 列表（bullets 用金色短横标记）。
5. **手工细节**：vignette、噪点、地面投影、书页条纹、封面双线框、按钮 hover 物理感。
6. **easing**：统一 `cubic-bezier(.2,.8,.2,1)` / `power3.out`，翻页 `power2.inOut` 模拟纸张惯性。

## 源码结构

- `index.template.html` —— 开发模板（CSS 内联 `<style>`，importmap `"three": "./vendor/three.module.js"`）
- `index.html` —— 最终单文件交付版（`fx-singlefile.py` 打包；**禁止对它二次打包**，改源码后重新 `cp` 再跑）
- `src/main.js` —— 纹理绘制 + 3D 书（封面/书脊/书页块/双翻页）+ 灯光投影 + 鼠标倾斜 + 翻页 + 表单 + 入场
- `vendor/` —— `three.module.js` + `addons/` + `gsap.min.js`（全部本地；本模板无外部模型，零外部请求）

## 重建命令

```bash
cd ~/workspace/fx-lab/lead-magnet-3d
cp index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py lead-magnet-3d
```

## 移动端说明

- `≤900px` 单列：文案在上、书在下（`max-height: 52vh`）；表单/按钮全宽。
- 触屏无 hover，倾斜改由触摸滑动触发（`pointermove` 覆盖触摸）；翻页按钮保留。
- `prefers-reduced-motion`：入场/倾斜/翻页动画全部跳过，直接显示终态。
- 经验：`renderer.setSize(w,h,false)` 不写 canvas 行内尺寸，高 dpr 下 canvas 会按属性像素撑破 grid —— `#gl canvas` 必须 `width/height: 100%`（teaser-reveal-3d 同修）。

## 验收记录（2026-10-05）

1. console 检测：零错误零告警（无外部模型，无 R2 依赖）。
2. URL 扫描：仅 gsap.min.js 注释内的 `gsap.com` 许可链接（未被请求，与 cart-fly-3d 一致）；无 Google Fonts/picsum/CDN。
3. 截图：`shots/lead-magnet-3d.png`（hcshot 官方命令）；`shots/lead-magnet-3d-final.png`（30s 等待版，入场完成态）。注：本机 headless SwiftShader 渲染慢（阴影贴图），3.5s 截图时入场动画未走完，真机约 2.5s 完成。
4. 交互验证（CDP 实测）：点"翻开看看"→两页翻开→按钮变"合上"；填表提交→"发送成功，请查收邮箱"；全程零报错。
5. 移动端 390px 截图：单列版式正常，文案无裁切。
6. 文案：无 Lorem/emoji 列表。
