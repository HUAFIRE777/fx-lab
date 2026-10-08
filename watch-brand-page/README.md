# watch-brand-page — 玖时 JIU TIME · 高级钟表整站

高级制表品牌「玖时 JIU TIME」整站：全屏 hero、系列展示、工艺故事、机芯细节，黑金美学。

## 参考站点及布局点

- **Rolex / Omega**：全屏深色 hero（大标题 + 腕表主视觉）、系列展示（tab 切换不同表款）、工艺故事（大图 + 长文案叙事）、机芯细节（SVG 手绘齿轮/日内瓦纹特写）、预约品鉴表单 + 门店列表。
- 布局点：全屏 hero → 系列 tab → 工艺故事 → 机芯细节（SVG 动画）→ 预约品鉴表单 → 门店 → 售后服务 → 页脚。

## 动效拆解

- **Hero 标题行遮罩升起（本页核心动效）**：`.rl-mask > span` 初始 `translateY(112%)` 被遮罩裁剪，入场时逐行升起（第二行延迟 0.18s），1.15s 自定义 ease；完成态有 `[data-hero].is-in` 覆盖规则兜底（防"播完又被压回去"坑）。
- **滚动 reveal**：`.reveal` 元素 IntersectionObserver（threshold 0.12）加 `.in`，`data-i` 控制 0.12s 阶梯延迟；**4 秒安全网**兜底（防 IO 漏报）；`prefers-reduced-motion` 下全部直接显示。
- **机芯 SVG**：手绘齿轮组/日内瓦纹/螺丝缓慢旋转（CSS animation），深色底 + 金色线条。
- **系列 tab**：点击切换表款，内容淡入，选中态金色下划线。
- **数字滚动**：年份/机芯零件数等计数器，IntersectionObserver 触发后 GSAP 式缓动（手写 rAF）。
- **预约表单**：姓名/11 位手机号校验，错误文案口语化（"请留下你的称呼，顾问好知道怎么叫你。"）；成功后显示门店 + 24 小时联系承诺，表单禁用防重复提交。
- **导航栏**：滚动毛玻璃 `blur(14px)`；移动端汉堡抽屉。

## 配置参数（`src/main.js` 顶部）

| 变量 | 说明 |
|---|---|
| `SITE.name / phone / phoneHref / address / email / icp / year` | 公司名/电话/地址/邮箱/ICP/版权年（`data-site` 绑定） |
| `LEGAL.privacy / terms` | 法务文档标题 + 条款数组 |
| `MODELS` | 系列表款数据：名称/机芯/价格/描述，增删表款只动这里 |
| `CFG.countDur` | 数字滚动时长；`CFG.loaderMax` loader 最长等待 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效——hero 标题行遮罩升起；机芯齿轮是氛围慢转，不抢戏。
2. **配色**：黑 + 金 `#C9A96A` 系 + 象牙白三色定死；金色只用于标题点缀/下划线/按钮描边，绝不铺满。
3. **字体**：大标题用宋体系 serif（"Songti SC"），字号 52px、字距宽松，高级感来自留白而非字重。
4. **文案**：零 Lorem ipsum、零 emoji；"我们只做一件事：让时间值得被认真对待。"——品牌口吻统一。
5. **手工细节**：hero 暗角 vignette；机芯 SVG 纯手绘（齿轮齿数/日内瓦纹波浪都是算出来的）；按钮 hover 金色光泽扫过；表单错误态抖动。
6. **easing**：标题升起用 1.15s 长缓动（`--ease` 自定义 cubic-bezier，有物理感的"抬起来"），无 linear。

## 源码结构

```
watch-brand-page/
├── index.src.html    # 源码 HTML（零外部依赖，vendor 为空目录）
├── styles.css        # 全部样式
├── src/main.js       # 交互逻辑（SITE / LEGAL / MODELS / CFG 配置区在顶部）
├── vendor/           # 空（本页零依赖，属正常）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/watch-brand-page
cp index.src.html index.html                 # 还原未打包态
python3 ~/workspace/bin/fx-singlefile.py watch-brand-page   # 一次性单向打包
```

**禁止对已打包的 `index.html` 重复跑打包器**；改完源码走"还原→打包"两步。

## 移动端说明

- 900px 以下：hero 改单列（主视觉置顶）；系列 tab 横向滚动；机芯 SVG 缩放适配。
- 标题字号降至 36px，行遮罩动效保留。
- 已验证 390×844：抽屉、tab 切换、预约表单、法务弹窗均正常。
