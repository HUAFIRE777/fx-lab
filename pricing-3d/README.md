# pricing-3d — 3D 定价页模板

<!-- huafire3d fx-lab — original implementation -->

三档 SaaS 定价卡：3D 倾斜跟随鼠标（glare 高光）、月付/年付切换（价格数字里程表滚动 + 粒子微爆）、
推荐档放大 + 光环、CTA 磁吸。零依赖，单文件 16KB。

## 参考与复现手法

看效果、代码全重写，未复制任何参考站源码：

- **Linear 定价页**（linear.app/pricing）：克制的三档编排、月付/年付切换的交互位置、诚实的特性对照写法。
  复现：① billing toggle 的滑块 + 价格联动；② 推荐档只用一处强调（徽章+光环），不堆装饰。
- **Stripe 定价页**（stripe.com/pricing）：价格数字的视觉层级（大数字 + 小单位 + 计费说明三行）。
  复现：价格 / 周期 / 备注三层排版；Enterprise 档用 "Custom" 打破数字节奏。

原创部分：odometer 按位滚动、toggle 粒子微爆、卡片 3D tilt + glare、CTA 磁吸、墨色 + 琥珀配色。

## 参数（全在 `src/main.js` 顶部 CONFIG）

- `currency`：货币符号
- `billing.annualSave`：年付折扣（徽章与备注文案联动）
- `plans[]`：每档 `name / tagline / monthly / annual`（数字字符串；`null` 显示 Custom）
  `per / note / noteM / noteA / cta / featured / features[] / hi[]`（高亮特性下标）

换产品：只改 CONFIG，重新打包。

## 文件

- `index.html` — 最终单文件（已打包，双击即看）
- `index.dev.html` — 开发模板（改完源码后从它重新生成）
- `styles.css` / `src/main.js` — 源码
- 打包：`python3 ~/workspace/bin/fx-singlefile.py pricing-3d`

## 降级

- 移动端（≤900px）：单列堆叠，tilt/磁吸自动关闭（`pointer: fine` 检测）
- `prefers-reduced-motion`：关倾斜、磁吸、粒子、滚动动画，价格直接切换
- 无 JS 时卡片区为空（纯模板演示页，接受此取舍）

## 验收记录（2026-10-05）

- headless Chromium：3 卡片渲染、月/年切换价格 $29→$23 滚动、备注与 aria-pressed 联动、console 零报错
- tilt + glare：CDP 真实 mousemove 验证（`perspective rotateX/Y` 生效，离场回弹）
- 移动端 390px：单列堆叠正常
