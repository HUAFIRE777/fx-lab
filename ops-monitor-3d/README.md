# ops-monitor-3d · 暗黑 3D 节点拓扑监控

深色 NOC 风格的网络监控模板：中央 Three.js 程序化 3D 拓扑球（零外部模型）+ 左侧节点列表 + 右侧详情 + 顶部 KPI 微动。所有代码原创手写，可直接卖。

`huafire3d fx-lab — original implementation`

## 参考来源与复现手法

参考了 **Cloudflare Radar / Vercel Status 的深色监控美学**（近黑底色、荧光绿状态灯、KPI 大数字、实时事件流）。**没有下载或复制任何一方源码**，以下手法均为独立实现的原创代码：

1. **Fibonacci + 黄金角节点分布** — 14 个节点按黄金角螺旋布在球面上，均匀不重叠（`main.js: nodes`）
2. **节点呼吸脉冲** — 核心小球按正弦缩放 + 外层 additive 光晕呼吸，速度随机错开，整页有生命感（`main.js: animate()`）
3. **琥珀涟漪扩散** — 随机告警时从节点放出两圈扩散光环（easeOutCubic），同时节点/列表灯变琥珀色，6 秒后自动恢复（`main.js: spawnRipple() / fireAlert()`）
4. **KPI 数字微动** — 每 2.2 秒在基线附近随机抖动，更新时短闪一下（CSS `kpiFlash` + `main.js: tickKpi()`）
5. **Canvas 延迟走势迷你图** — 详情面板里用 2D canvas 画近 1 小时延迟曲线 + 渐变填充（`main.js: sparkDraw()`）
6. **详情滑入** — 右侧面板点击节点后沿 cubic-bezier(.16,1,.3,1) 滑入，关闭/返回复位（CSS `.detail`）

## 参数（`src/config.js`）

换数据只改 CONFIG，整页跟着变：

| 段 | 说明 |
|---|---|
| `theme` | 主色：荧光绿 #3dffa0 / 琥珀 #ffb020 / 墨黑 #05070a |
| `nodes` | 节点：展示名 / tier（核心·边缘·备用）/ baseLatency / uptime / load |
| `alertKinds` | 随机告警文案模板（延迟抖动/丢包/CPU/连接重试） |
| `kpis` | 三项 KPI：label / unit / base / jitter / decimals / comma |
| `motion` | 旋转速度 / 呼吸幅度 / 涟漪时长 / 告警间隔(7–16s) / 告警保持(6s) / KPI 节拍 |

## 质量自查（六项铁律）

- ① 克制：整页只讲一个核心动效（3D 拓扑 + 告警涟漪），KPI/列表/详情都是配角
- ② 配色：锁死墨黑 #05070a + 荧光绿 #3dffa0，琥珀 #ffb020 仅作告警语义色，无彩虹渐变
- ③ 字体：系统字体栈，数字 `font-variant-numeric: tabular-nums`，标签字距 .2em，大标题留白
- ④ 文案：真实运维短句（"P99 延迟突增，已触发自动限流"），无 Lorem ipsum、无 emoji 列表
- ⑤ 手工细节：vignette 暗角 + SVG 噪点、星尘背景每颗点随机、骨架加载态（进度条+百分比）、节点 hover 放大光晕
- ⑥ easing：全站 cubic-bezier(.16,1,.3,1) / easeOutCubic，无 linear

## 构建与验证

```bash
# 开发：直接用 file 打开 index.template.html（importmap 指向 vendor/three.module.js）
# 打包单文件（一次性，不可重复跑；改源码后先 cp 再打包）：
cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py ops-monitor-3d
```

- 单文件约 895KB，零外部依赖（Three.js 已打进 data: URL importmap），断网双击可开
- 已验证：桌面端渲染正常、console 零报错、涟漪/告警/详情链路完整；移动端（≤820px）左侧列表隐藏、详情改底部抽屉；`prefers-reduced-motion` 下退化为静态
- 文件：`index.html`（单文件成品）+ `index.template.html`（开发模板）+ `src/`（config/main）+ `vendor/three.module.js`
