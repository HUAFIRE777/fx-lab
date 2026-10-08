# cloud-page — 云枢 CLOUDPivot · 云服务整站

云服务商「云枢」整站：代码窗口 hero、价格计算器、产品矩阵、文档入口，工程师气质拉满。

## 参考站点及布局点

- **DigitalOcean / AWS**：hero 放真实代码窗口（`deploy` 命令打字机）、价格计算器（滑杆调配置实时出账单）、产品矩阵（计算/存储/网络/数据库卡片）、文档入口（快速开始/API/CLI 三栏）。
- 布局点：导航（产品/定价/文档/登录）→ hero（左文案 + 右终端窗口）→ 产品矩阵 → 价格计算器 → 客户评价 → 文档入口 → CTA（领 200 元体验金）→ 页脚。

## 动效拆解

- **终端打字机（本页唯一核心动效）**：hero 代码窗口逐字符打出 `deploy` 全流程（拉镜像 → 起容器 → 健康检查 → 上线），光标块闪烁，行内 `$` / 输出 / 成功三种颜色区分；播完定格。
- **滚动 reveal**：`.reveal` 元素 IntersectionObserver（threshold 0.16）加 `.is-in`，`data-d` 属性控制 90ms 阶梯延迟；hero 区走入场编排不走 IO；**4 秒安全网**兜底（防 IO 漏报）。
- **价格计算器**：4 组滑杆（CPU/内存/存储/带宽），`input` 事件实时重算月账单 + 折合小时价 + 分项明细，数字无动画直接更新（工程师审美：准比炫重要）。
- **导航栏**：滚动超 24px 毛玻璃 `blur(14px)`。
- **CTA 表单**：邮箱格式校验（坏格式给口语提示），成功态"200 元体验金已记入该邮箱对应账户"。
- **法务弹窗**：隐私/条款/Cookie 三文档，`#modalX` 关闭 + 遮罩点击关闭 + Esc 关闭。

## 配置参数（`src/main.js` 顶部）

| 变量 | 说明 |
|---|---|
| `SITE.name / en / phone / email / address / icp` | 公司名/英文名/电话/邮箱/地址/ICP（`data-site` 属性绑定） |
| `LEGAL` | 法务三文档标题 + 条款数组 |
| `data-d`（HTML 属性） | reveal 阶梯延迟系数，`data-d="3"` = 延迟 270ms |
| 价格计算器单价 | `src/main.js` 第 6 节 `calc()` 内的单价表，改价格只动这里 |

## "看起来不像 AI 写的"六项自查

1. **克制**：整页只讲一个核心动效——终端打字机；计算器、reveal 全部收敛，无多余装饰动画。
2. **配色**：深海军蓝 + 青 `#22D3EE` 系 + 白三色定死；终端窗口黑底青字，成功行绿色，配色即语义。
3. **字体**：终端用等宽字体，大标题 48px 紧凑有力，kicker tracking 拉开，层级清晰。
4. **文案**：零 Lorem ipsum、零 emoji；"把应用推上云，像推代码一样简单。"——工程师一听就懂。
5. **手工细节**：终端窗口红绿黄三点 + 光标闪烁；计算器滑杆自定义 thumb；卡片 hover 细微上浮；加载态菊花。
6. **easing**：打字机逐字符无 easing（机械感是刻意设计），其余用 CSS `cubic-bezier` 缓动，无 linear 滥用。

## 源码结构

```
cloud-page/
├── index.src.html    # 源码 HTML（零外部依赖，无 vendor 目录）
├── styles.css        # 全部样式
├── src/main.js       # 交互逻辑（SITE / LEGAL / 单价表在顶部）
├── index.html        # 单文件成品（打包生成，勿手改）
└── README.md
```

本页**零 JS 依赖**（打字机/reveal/计算器全手写），无 vendor 目录属正常。

## 重建方式

```bash
cd ~/workspace/fx-lab/cloud-page
cp index.src.html index.html                 # 还原未打包态
python3 ~/workspace/bin/fx-singlefile.py cloud-page   # 一次性单向打包
```

**禁止对已打包的 `index.html` 重复跑打包器**；改完源码走"还原→打包"两步。

## 移动端说明

- 900px 以下：hero 改单列（终端窗口置顶）；产品矩阵 2 列；计算器滑杆全宽。
- 终端窗口在小屏保持等宽字体 + 横向滚动，不挤压换行。
- 已验证 390×844：抽屉、计算器、CTA 表单、法务弹窗均正常。
