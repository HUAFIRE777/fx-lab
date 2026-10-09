# huafire3d · fx-lab 模板库

> 150 套全部免费 · MIT 协议，可商用、可修改、可转售。

每个子目录是一套独立模板（`index.html` 单文件即开；含 3D 模型的 10 套另带本地 `models/` 目录，无外部依赖）。
根目录的 `index.html` 是画廊聚合页：搜索 + 分类筛选，点击卡片新窗口打开模板。

## 重新生成画廊

```bash
cd ~/workspace/fx-lab
NODE_PATH=/tmp/hcshot/node_modules node tools/build-gallery.mjs
```

- **增量更新**：`shots/<name>.png` 已存在的不会重截；新模板目录会自动收录。
- `node tools/build-gallery.mjs --force`：全量重截所有截图。
- `node tools/build-gallery.mjs --only lusion,igloo`：只处理指定模板（调试用）。
- 生成中的模板（目录里还没有 `index.html`）会被跳过并列在报告里，下次运行自动收录。

## 截图失败排查

截图走本机 headless Chromium（`/opt/meta-chromium/chrome`），WebGL 用 SwiftShader
软件渲染；R2 模型由脚本内 Node 直取（R2 公网直连通畅）经 CDP `Fetch.fulfillRequest`
回填并注入 CORS 头。常见失败：

| 现象 | 原因 / 处理 |
|---|---|
| `chrome CDP 起不来` | chrome 二进制缺失或端口被占；确认 `/opt/meta-chromium/chrome` 可执行，换个时间再跑 |
| 截图全黑 / WebGL 没渲染 | SwiftShader 初始化慢；脚本已等 12s，仍黑则 `--only <name>` 单独重跑一次看是否偶发 |
| 3D 模型没出来、只有占位 | 见下 **R2 CORS** 专项 |
| 截图超时 `CDP 超时：Page.captureScreenshot` | 重型 WebGL 页软渲染慢，首张可达 27s+；脚本已给 120s 超时+自动重试，下次运行也会补截 |
| 某模板截图一直失败 | 不阻塞：该卡片显示"截图生成中"占位，下次运行自动重试；也可用 `--force` 强制重截 |
| `ws` 模块找不到 | 必须带 `NODE_PATH=/tmp/hcshot/node_modules` 运行 |

### R2 CORS 专项（2026-10-05 实测结论）

截图里模型显示"加载失败 / Failed to fetch"，但 curl 直测模型 URL 返回
200——这是 **R2 桶没配 CORS 头**（`Access-Control-Allow-Origin` 缺失），
`file://` 页面 `fetch()` 跨域被浏览器拦截。验证：

```bash
curl -s -I --noproxy '*' -H "Origin: null" "<模型URL>" | grep -i access-control
# 无输出 = 桶没配 CORS
```

截图脚本侧已用 CDP `Fetch.fulfillRequest` 中转绕过（脚本内 Node 直取 R2
模型、回填时注入 `Access-Control-Allow-Origin: *`，仅截图有效）。
**但这是生产问题**：模板上线到 https 域名后同样会被 CORS 拦截，必须给
R2 桶配置 `Access-Control-Allow-Origin: *`，截图脚本修不了。

## 目录规范（新模板照此放，画廊自动收录）

- `fx-lab/<name>/index.html` —— 单文件成品（CSS/JS/库全内联；含 3D 模型的模板另带本地 models/ 目录，零外部依赖）
- `fx-lab/<name>/README.md` —— 首行 `#` 为标题；正文第一段为一句话描述；
  含 `inspired by xxx` 或 `## 参考` 小节会被画廊展示为"手法参考"
- 分类按目录名前缀自动归入：`product-/collection-/unboxing-` → 电商独立站；
  `admin-` → 管理系统；`company-/team-` → 公司介绍；
  `launch-/pricing-/landing-` → 营销落地；其余 → 动效实验
