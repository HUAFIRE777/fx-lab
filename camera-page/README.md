# camera-page — 镜界 VIEWFINDER · 摄影器材整站

摄影师开的器材店「镜界 VIEWFINDER」整站：品类导航、产品网格、摄影师评测、以旧换新估价、购物袋全流程。

## 参考站点及布局点

- **B&H Photo / Adorama**（美国摄影器材电商）：顶部品类导航（机身/镜头/灯光/配件）、产品网格（图 + 评分 + 销量 + 价格 + 促销标签）、摄影师评测区（带器材型号的真实回访）、二手置换入口（以旧换新 30 秒估价器）。
- 布局点：hero（光圈主视觉 + 快门按钮）→ 品类磁贴 → 热卖产品网格（可按品类筛选）→ 摄影师评测墙 → 以旧换新（三步 + 估价器）→ 页脚。右上常驻购物袋按钮 + 滑出式购物袋抽屉。

## 动效拆解

- **光圈 Hero（本页核心动效）**：SVG 光圈叶片，GSAP 2 秒开合入场（`power2.out`）；点"按下快门"触发快门序列——叶片急速收拢 + 全屏白闪 + 快门音效感（无音频，纯视觉），防连击锁。
- **滚动 reveal**：`.rv` 元素 IntersectionObserver（threshold 0.12）加 `.on`；**4 秒安全网**兜底（防 IO 漏报）。
- **数字滚动**：注册摄影师/评分/当日发等计数器，GSAP 1.6s `power2.out` 从 0 滚到终值；4 秒安全网直接落终值（防 IO 漏报）。
- **产品筛选**：品类 tab 切换，卡片 FLIP 式淡入重排（无布局跳动）。
- **购物袋**：加购按钮 `back.out(3)` 弹性抖动 + toast 提示；购物袋抽屉右滑入，数量/合计实时计算。
- **以旧换新估价器**：设备类型/品牌/成色三组 pill 选择 + 快门次数滑杆，估价区间数字 GSAP 0.5s 滚动更新。
- **导航栏**：滚动毛玻璃；移动端汉堡抽屉。

## 配置参数（`src/main.js` 顶部）

| 变量 | 说明 |
|---|---|
| `CONFIG.SITE.brand / en / organizer / phone / address / email / icp` | 品牌中英文名、公司名、电话、地址、邮箱、ICP（`data-site` 绑定） |
| `CONFIG.accent` | 主题橙 `#FF5C00`（换色只改这一处，CSS 变量同步） |
| `CONFIG.heroIntroMs` | 光圈入场时长（默认 2000ms） |
| `CONFIG.toastMs` | 加购 toast 停留时长（默认 2200ms） |
| `PRODUCTS` | 产品数组：名称/品类/价格/原价/评分/销量/标签，增删产品只动这里 |
| `LEGAL.privacy / terms / cookies` | 法务三文档条款数组 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效——光圈开合 + 快门；其余动效（计数器、抽屉、筛选）都是功能性微交互。
2. **配色**：黑 `#0B0B0C` + 橙 `#FF5C00` + 灰白三色定死；促销标签（热卖/新品/直降）统一用橙色系深浅区分。
3. **字体**：hero 大标题 56px 紧凑行高，"把决定性瞬间装进口袋"断句有呼吸感；kicker tracking 0.28em。
4. **文案**：零 Lorem ipsum、零 emoji；"凌晨三点的弄堂，ISO 12800 手持 1/60，画面干净得不像话。"——摄影师黑话，真实感拉满。
5. **手工细节**：光圈叶片刻度文字环绕排布；快门白闪；产品图全部手绘 SVG 线稿（相机/镜头/灯/三脚架/包/卡）；hover 卡片上浮。
6. **easing**：GSAP `power2.out` / `back.out(3)`，无 linear。

## 源码结构

```
camera-page/
├── index.src.html    # 源码 HTML
├── styles.css        # 全部样式
├── src/main.js       # 交互逻辑（CONFIG / PRODUCTS / LEGAL 配置区在顶部）
├── vendor/
│   └── gsap.min.js   # GSAP 3.12.5（本地 vendored，无 CDN）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/camera-page
cp index.src.html index.html                 # 还原未打包态
python3 ~/workspace/bin/fx-singlefile.py camera-page   # 一次性单向打包
```

**禁止对已打包的 `index.html` 重复跑打包器**；改完源码走"还原→打包"两步。另有 `build.sh` 一键执行上述两步。

## 移动端说明

- 900px 以下：品类导航收进汉堡抽屉；hero 单列（光圈置顶 340px）；产品网格 2 列；以旧换新改单列。
- 560px 以下：弹窗全屏化；页脚单列；估价器 pill 按钮自动换行。
- 已验证 390×844：logo/购物袋按钮不换行（`white-space:nowrap`），抽屉、筛选、加购、估价器均正常。
