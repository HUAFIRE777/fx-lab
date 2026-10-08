<!-- huafire3d fx-lab — original implementation -->
# cta-finale-3d — 终章 CTA 动效模板

落地页最后一屏：巨型动态标题 + 磁吸 CTA 按钮 + 点击粒子爆发 + 成功态。整页只讲一件事：让人点下去。

## 参考了谁（只学手法，代码全部重写）

1. **Awwwards 获奖站通用的 magnetic button 手法** — 鼠标靠近时按钮被"吸"向光标、松开后弹簧回弹。本模板的磁吸用自主写的弹簧积分器实现（欠阻尼回弹），内层文案多动 35% 制造纵深。
2. **获奖落地页终章的 giant CTA typography** — viewport 级大字 + 逐字升起（字符包在 overflow 遮罩里，`cubic-bezier(.19,1,.22,1)` 依次揭示）。
3. **点击爆发反馈** — 点击后从点击点喷出 ember 粒子（重力+阻尼+ additive 发光）+ 冲击波圆环扩散，按钮翻转为对勾描边成功态。

未下载、未复制任何参考站源码。

## 手法拆解

| 手法 | 实现 |
|---|---|
| 逐字标题揭示 | JS 按词/字拆 span，每字包遮罩，`transition-delay` 按序号 stagger；3 秒兜底定时器防标题隐身（studiofreight 教训） |
| 磁吸按钮 | 160px 半径内 lerp 跟随（0.22），离开后弹簧回弹（stiffness 0.16 / damping 0.68）；触屏/ reduced-motion 自动降级 |
| 粒子爆发 | 单 canvas，`lighter` 合成，90 粒子：径向初速 + 上偏 + 重力 0.14 + 阻尼；圆环冲击波同步扩散 |
| 对勾成功态 | SVG stroke-dashoffset 描边动画，文案切换，http(s) 链接 2.4s 后自动跳转 |
| 星空视差 | 150 星，twinkle 相位 + 鼠标视差 * depth + 缓慢漂移；DPR 上限 2（移动 1.5），页面隐藏时停 rAF |
| 手工质感 | vignette 暗角 + SVG 噪点 overlay + 三色定死（墨黑/米白/ ember 橙） |

## 参数（src/main.js 顶部 CONFIG）

`kicker / titleLines / accentLine / sub / ctaLabel / ctaHref / successLabel / brand / links / accent / starCount / burstCount` — 换文案、链接、配色只改这里。

## 文件

- `index.html` — 单文件交付版（已打包，CSS/JS 全内联，双击即看）
- `styles.css` / `src/main.js` — 可编辑源码
- 打包：`python3 ~/workspace/bin/fx-singlefile.py cta-finale-3d`（幂等，已验证）

## 验收

- headless Chromium 实测：首屏渲染正常、标题 23 字逐字升起、点击后 `done` 成功态 + 文案切换、console 零报错
- 零外部依赖：无 CDN、无 Google Fonts（系统字体栈）、粒子/星空全手写 canvas
- 移动端：磁吸降级为普通按钮；`prefers-reduced-motion` 下关爆发、关磁吸、标题直接显示
