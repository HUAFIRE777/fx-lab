# cleaning-page — 净屋 JINGWU · 家政服务整站

同城直营家政团队「净屋 JINGWU」的整站落地页：服务品类、在线预约、价格透明、服务者评价一页讲完。

## 参考站点及布局点

- **Thumbtack / Homeaglow**（美国家政平台）：服务品类网格（四类服务卡片：日常保洁/深度保洁/开荒保洁/月嫂育儿/维修安装/搬家搬运）、在线预约表单（三步式：选服务→填地址→留电话）、服务者评价墙（带星级与服务者姓名的真实回访卡片）、价格透明区（明码标价卡片 + "服务中途不加价"承诺）。
- 布局点：hero 左文案右主视觉 → 品类网格 → 三步预约（表单）→ 价格卡片 → 评价墙 → 关于我们 → CTA（免费上门评估）→ 页脚。

## 动效拆解

- **Hero 擦拭扫光主视觉**：GSAP timeline 无限循环的扫光动画（`power2.inOut`），房间卡片随鼠标 3D 倾斜（`gsap.quickTo` rotationX/Y，0.6s `power2.out` 跟手）。
- **滚动 reveal**：IntersectionObserver（threshold 0.12，rootMargin 底部 -8%）逐节加 `.in`，同级元素按 0.08s 阶梯 delay；**4 秒安全网**兜底（防 IO 漏报，未点亮的一律点亮）。
- **导航栏**：滚动超 24px 加 `.scrolled`，毛玻璃 `blur(13px)` + 底部分隔线。
- **移动端抽屉**：汉堡按钮 → 全屏菜单滑入，body 锁定滚动，点链接自动关闭。
- **预约表单**：逐字段校验（手机号 `/^1\d{10}$/`），错误态红框 + 聚焦首个错误项；提交后按钮转菊花 → 成功面板（订单号 `JW-xxxx`）→ "再约一单"可重置。
- **法务弹窗**：隐私/条款/Cookie 三文档同一弹窗壳切换，Esc/遮罩/X 均可关闭，焦点管理（打开聚焦关闭钮，关闭返回原焦点）。

## 配置参数（`src/main.js` 顶部）

| 变量 | 说明 |
|---|---|
| `SITE.name / phone / phoneHref / email / emailHref / address / hours / icp / year` | 买家改这里，一改全站：页脚联系方式、预约成功文案、ICP 备案号、版权年份（`data-site` 属性绑定） |
| `CFG.navOffset` | 锚点滚动偏移（默认 40） |
| `CFG.revealThreshold` | reveal 触发阈值（默认 0.12） |
| `CFG.loaderMin` | loader 最短展示毫秒（默认 650） |
| `LEGAL.privacy / terms / cookie` | 法务三文档的标题 + 条款数组，改文案只动这里 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效——hero 房间卡片的擦拭扫光 + 鼠标视差；其余全是克制的信息呈现，无堆砌。
2. **配色**：深绿 `#1E4D3B` + 米白 `#F7F4EC` + 墨黑三色定死，无渐变滥用；价格卡"约得最多"用深绿反白标签点缀。
3. **字体**：大标题 44px/1.25 行高 breathing room，kicker 小字 tracking 0.28em，层级分明。
4. **文案**：零 Lorem ipsum、零 emoji 列表；"下单不收钱。服务者上门后先确认总价，您点头才开工。"——真实口语短句。
5. **手工细节**：loader 擦拭进度条 + tip 轮播；svc-card hover 上浮 8px + 阴影；按钮 loading 菊花态；评价卡星级用 ★ 字符手排。
6. **easing**：GSAP `power2.inOut` / `power2.out`，CSS 用自定义 `--ease`（cubic-bezier），无默认 linear。

## 源码结构

```
cleaning-page/
├── index.src.html    # 源码 HTML（语义化 section）
├── styles.css        # 全部样式（CSS 变量定主题色）
├── src/main.js       # 交互逻辑（CFG / SITE / LEGAL 配置区在顶部）
├── vendor/
│   └── gsap.min.js   # GSAP 3.12.5（本地 vendored，无 CDN）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/cleaning-page
cp index.src.html index.html                 # 还原未打包态
python3 ~/workspace/bin/fx-singlefile.py cleaning-page   # 一次性单向打包
```

打包器把 `styles.css`、`vendor/gsap.min.js`、`src/main.js` 全部内联进 `index.html`。**禁止对已打包的 `index.html` 重复跑打包器**（会破坏已内联内容）；改完源码务必走"还原→打包"两步。

## 移动端说明

- 900px 以下：导航收进汉堡抽屉；hero 改单列（主视觉置顶）；品类/价格/评价网格改 2 列或单列。
- 表单字段全宽堆叠，日期选择器调用原生控件；预约成功面板居中显示。
- 已验证 390×844：抽屉开合、表单校验、弹窗关闭均正常。
