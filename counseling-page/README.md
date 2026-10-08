# counseling-page · 听澜心理咨询平台

一句话介绍：为心理咨询平台「听澜」打造的完整落地页模板——咨询师匹配问卷 hero、个体/伴侣/青少年服务 Tab、保密承诺、咨询师墙、免费匹配表单，氛围克制舒缓，零外部依赖。

## 参考站点及借鉴点

参考 **BetterHelp** 的落地页编排，只学布局结构，不抄任何文案与视觉：

- Hero 首屏即放"匹配问卷"入口：BetterHelp 把问卷作为核心转化路径，我们照搬这个信息架构（三题问卷 → 推荐方向 → CTA 表单）。
- 服务 Tab：个体 / 伴侣 / 青少年三类并列切换，对应 BetterHelp 的服务分流逻辑。
- 保密承诺独立成区：心理咨询品类的信任基石，BetterHelp 也有专门的隐私 reassurance 区块。
- 咨询师墙：真人背书区，我们用程序化头像（姓氏首字 + 鼠尾草渐变圆）替代真人照片，避免肖像与外部图床依赖。
- 所有文案、配色（柔白+鼠尾草绿+深 slate）、动效均为原创重写。

## 动效拆解

- **主视觉（全页唯一大动效）**：Hero 呼吸光晕——三层径向渐变色块（鼠尾草绿系）以 7/9/11 秒不同周期做 `scale 1→1.14 + opacity` 呼吸，`ease-in-out` 无限循环；底部一条舒缓波形线 SVG 以 14 秒周期左右漂移。克制、慢、有呼吸感。
- **微交互**：导航滚动后透明→毛玻璃；按钮 hover 上浮 2px + 阴影加深；卡片（保密承诺/咨询师）hover 上浮 8px；服务 Tab 底部有滑动指示条（`tab-ink`，`cubic-bezier(.22,1,.36,1)` 500ms）；问卷选项 hover 右移 6px；问卷步骤切换 pane 滑入；表单成功态对勾 `popIn` 回弹。
- **滚动 reveal**：`IntersectionObserver` 驱动，`.reveal` 初始 `opacity:0 + translateY(28px)`，进入视口后 `.is-in` 以 expo easing 淡入上浮；8 秒兜底全放行，保证完成态可达。
- **加载态**：呼吸圆点 + 品牌名 + 进度条，`load` 后 500ms 淡出，3.5 秒兜底。
- **手工细节**：SVG 噪点（feTurbulence data URI，内联）+ 全页暗角 vignette；滚动提示小胶囊；`prefers-reduced-motion` 下全部动效降级为静态可见。
- 全页 easing 均为物理感曲线（expo / ease-in-out），无一处默认 linear。

## 配置参数（SITE 变量）

页面顶部 `src/main.js` 开头：

```js
const SITE = {
  name: "听澜心理咨询",
  phone: "400-820-8820",
  address: "上海市静安区南京西路 1266 号 18 层",
  email: "hello@tinglan.example.com",
  copyright: "© 2026 听澜心理咨询（上海）有限公司 · 版权所有",
  icp: "沪ICP备2026000000号-1（占位）"
};
```

修改后重新打包即可生效，渲染位置：页脚联系方式三行、底部版权行、备案占位行。

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个主视觉动效（呼吸光晕），其余全部是小幅 hover/reveal，不堆砌。
2. **配色**：柔白 `#FAF8F1`、鼠尾草绿系、深 slate 三色走完全页，无彩虹渐变；CTA 深色区块用深 slate 而非跳色。
3. **字体**：大标题用宋体系 serif、字间距 `.1em–.28em`、行高 1.5–1.6，有呼吸感；正文苹方系 sans，层级分明。
4. **文案**：无 Lorem ipsum、无 emoji 列表；咨询师引言（"先被好好听见，改变才会发生。"）、表单占位（"比如：小林（可用昵称）"）均为真实感短句。
5. **手工细节**：噪点+vignette、加载态、滚动提示、Tab 滑动条、成功态回弹对勾，均已落实。
6. **Easing**：reveal/卡片/弹窗统一 `cubic-bezier(.22,1,.36,1)`，呼吸类用 ease-in-out，无默认 linear。

## 源码结构

```
counseling-page/
├── index.src.html   # 源码 HTML（引用 styles.css 与 src/main.js）
├── index.html       # 打包成品（单文件，fx-singlefile.py 生成，勿手工改）
├── styles.css       # 全部样式
├── src/main.js      # 全部交互（顶部 const SITE 配置）
├── vendor/          # 空——本模板零外部依赖，无需任何库
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/counseling-page
cp index.src.html index.html && python3 ~/workspace/bin/fx-singlefile.py counseling-page
```

改源码后重新跑上面两行即可（禁止对已打包的 `index.html` 重复跑打包器——单向打包）。

## 移动端说明

- 断点 900px / 640px：导航收起为汉堡抽屉（可开合，遮罩点击关闭）；服务 Tab 全宽三等分；咨询师墙与保密承诺 2 列→1 列；CTA 双列→单列；页脚 4 列→1 列。
- Hero 主标题 `clamp(40px,6.4vw,72px)` 自适应；抽屉打开时锁定 body 滚动；ESC 可关闭抽屉与弹窗。
- 截图验证：桌面 1280×800、移动 390×844，均 console 零错。
