# 栖智 · 智能家居品牌落地页

虚构智能家居品牌「栖智」的完整整站首页模板：场景模式一键联动（核心交互）、产品生态矩阵、App 联动、技术规格、CTA、肥页脚（含法务三件套弹窗）。开箱即用，换文案+SITE 变量即可交付客户上线。

`huafire3d fx-lab — original implementation`

## 参考来源（Google Nest，只学布局结构，代码/文案/商标全部原创）

学的 4 个布局点，逐一对应实现：

1. **产品生态矩阵** —— Nest 式的"Works with"设备陈列：音箱 X1 / 门锁 S3 / 灯带 L2 / 温控 T2 四张卡片，统一卡片结构（品类 pill + 线性图标 + 真实感价格），各有英文副标。
2. **场景模式切换** —— 对应 Nest App 的 Routine：一键切换"回家 / 离家 / 睡眠"，全页设备卡片联动点亮/变暗/熄灭并更新状态文案，附一行场景描述。
3. **App 联动区块** —— 左文案三条卖点 + 右 CSS 手机模型（非图片），手机内的设备行与场景按钮跟随全局模式实时变化。
4. **技术规格表** —— 三列式参数行（名称 / 参数 / 标签徽标），hover 高亮，标签标明适用型号。

## 动效拆解

- **核心动效：场景联动** —— 点模式按钮，全页所有 `[data-device]` 节点（hero 户型 SVG 光点、场景区设备 chips、手机设备行、产品卡）同步切换 `on/dim/off` 三态：`on` 为电光蓝辉光 + 2.6s 呼吸（`breathe` keyframes，opacity .45↔1）；`dim` 为弱光；`off` 熄灭。切换瞬间场景面板打一次蓝色脉冲（GSAP boxShadow yoyo），强化"一处指令、处处响应"。
- **区块滚动 stagger 入场** —— IntersectionObserver（阈值 .12）加 `.in`，translateY(30px)→0，0.75s `cubic-bezier(.22,1,.36,1)`，按 `i%4` 加 70ms  stagger。
- **Hero 氛围** —— 两团蓝色光斑 GSAP 怠速漂移（11–14s sine.inOut，像素位移）；户型卡片 4.5s 上下浮动；CTA 圆环 5s 缩放呼吸。
- **按钮** —— primary 扫光（::after skew 扫过）+ hover 上浮 2px；ghost 描边变蓝。
- **噪点/vignette** —— 全页 fixed SVG feTurbulence 暗纹（opacity .05）+ 径向 vignette，只提质感。
- **加载态** —— 品牌 logo 脉冲 + 三点弹跳，`load` 后双 rAF 关闭，2.5s 强制兜底。
- **完成态可达审计** —— `#loader.hide`（load 双 rAF + 2.5s 兜底，无提前 return）、`.reveal.in`（无头 instant-scroll 实测 28/28 全部触发）、`.modal.active`（点击/ESC/遮罩三路开关实证）、`#drawer.open`（移动端实证）、模式切换状态（sleep 实测 6 设备状态全部符合预期）。

## 配置参数

- **`src/main.js` 顶部 `SITE` 变量**（公司信息唯一真实来源，改一处全站生效）：
  ```js
  var SITE = { name, address, email, phone, icp }
  ```
  页脚品牌/联系行/邮箱电话（自动拼 `mailto:`/`tel:`）、弹窗内邮箱、底部版权行备案号，全部走 `data-site` / `data-site-href` 属性自动渲染。
- **颜色**：`styles.css :root` → `--ink:#16181D`、`--paper:#F2F4F7`、`--blue:#3E7BFA`，全页只用这三色（含其透明度变体），换主题只改这三个变量。禁彩虹渐变。
- **场景模式**：`src/main.js` → `MODES`，每模式定义 6 个设备的三态 + 状态文案 + 场景描述，加新模式照格式加一项即可。
- **产品卡**：`index.src.html` `#matrix .pcard`，改名/改价/改描述直接改 HTML；`data-device` 决定它跟随哪个设备联动。

## 法务三件套（弹窗实现）

页脚底部"隐私政策 / 服务条款 / Cookie 政策"为按钮，点击弹模态弹窗（非跳页）：

- **可关闭**：右上 ✕（hover 旋转 90°）、点击遮罩、ESC 三种；打开时 `body overflow:hidden` 锁定背景滚动，关闭恢复焦点。
- **文案**：真实感中文通用条款，无 Lorem ipsum —— 隐私政策 5 条（收集范围/用途/存储位置/用户权利/联系邮箱）、服务条款 6 条（账号/可用性/合理使用/退货保修/固件更新/责任限制）、Cookie 政策 4 条（定义/必要型/分析型/第三方），每篇带版本号与更新日期。
- **移动端**：≤600px 弹窗变全屏式（`100dvh` 无圆角），CDP 实测 390×844 铺满无错位。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲"智能家居品牌首页"一件事；核心动效只有一个（场景联动呼吸光），不堆 3D 场景。
2. **配色**：石墨 #16181D / 月白 #F2F4F7 / 电光蓝 #3E7BFA 定死三色，无彩虹渐变；灰只出现在三色透明度变体中。
3. **字体**：系统字体栈（零外部字体）；H1 60px/1.12、副标题 18px/1.75、eyebrow 12.5px 大字距，三级分明。
4. **文案**：全部真实感中文短句（"推门回家灯就亮了""洗澡也能喊它换歌""断网不断联"），产品名/参数/价格像真的（X1 ¥399 / S3 ¥1899 含安装 / L2 ¥499/5米 / T2 ¥699），无 Lorem ipsum、无 emoji 列表。
5. **手工细节**：SVG 噪点暗纹、加载三点弹跳、按钮扫光、户型 SVG 手绘房间线、手机 notch、CTA 同心圆环、状态 pill 随模式变色。
6. **Easing**：`cubic-bezier(.22,1,.36,1)` 入场、弹簧 `.34,1.56,.64,1` 弹窗、GSAP `sine.inOut` 呼吸，无一处 linear（呼吸循环属装饰性往复）。

## 源码结构

- `index.src.html`：开发版源码（改这里）。
- `styles.css`：全部样式（构建时内联）。无 `preserve-3d`（blur 层叠坑已避），无 `[hidden]` 覆盖。
- `src/main.js`：交互逻辑（classic script，非模块，无头 file:// 可跑）。顶部 `SITE` 配置变量。
- `vendor/gsap.min.js`：GSAP 3.12.5 真品（72,214 字节，已验非空壳；构建时内联；仅像素位移，未用百分比位移）。
- `index.html`：单文件发行版（构建产物，勿手改，111KB，零真实外部 URL）。
- `README.md`：本文件。

## 重建方式

```bash
cd ~/workspace/fx-lab/smarthome-page
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py smarthome-page
# 验收
NODE_PATH=/tmp/hcshot/node_modules no_proxy=127.0.0.1,localhost node ~/workspace/bin/hcshot.js "file:///home/hatch/workspace/fx-lab/smarthome-page/index.html" ~/workspace/fx-lab/shots/smarthome-page.png 1280 800 0
```

注意：`fx-singlefile.py` 是一次性单向打包器，禁止对已打包的 `index.html` 重复跑；改源码后从 `index.src.html` 重新 `cp` 再跑。node 走代理时连不上本机 Chrome 调试端口，记得加 `no_proxy=127.0.0.1,localhost`。

## 移动端说明

- ≤1020px：导航收起为汉堡抽屉（右滑入，含 4 链接 + CTA，scrim 可点关）；hero 单列；App 区单列；产品 2 列；场景三区堆叠；规格行单列。
- ≤600px：H1 37px、CTA 全宽、产品 1 列、页脚单列；法务弹窗全屏式（`100dvh`）。
- `prefers-reduced-motion`：全部动画降为 0.01ms，GSAP 点缀跳过，reveal 直接显示。
