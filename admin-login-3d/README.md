# admin-login-3d — 3D 背景登录页模板

<!-- huafire3d fx-lab — original implementation -->

管理系统登录页：全屏 GPU 粒子背景 + 中央玻璃拟态登录卡。商用级，可直接改 CONFIG 换皮复用。

## 参考与复现手法

只看了效果、代码全部重写，未下载/复制任何参考站源码：

1. **Linear**（深色 SaaS 登录）— 复现手法：深底 + 细腻光晕 + 居中极简卡片，大量留白、克制配色（整页只用 indigo/cyan 两色）。
2. **Vercel**（几何光束登录背景）— 复现手法：背景动效是页面的唯一主角，前景表单保持静态克制；鼠标视差让背景有"物理感"。
3. **Clerk**（SSO 按钮行 + 分隔线 + 邮箱密码表单）— 复现手法：SSO 双按钮在上、"OR WITH EMAIL" 分隔线、表单三段式布局。

## 自己加的手工细节（防"AI 味"）

- 粒子大小非均匀分布（72% 微尘 / 22% 中亮 / 6% 大亮点），透明度按黄金比例 hash 在 indigo/cyan 间过渡
- 粒子呼吸式闪烁（twinkle），每颗相位不同，永不全灭
- 鼠标视差用 0.045 阻尼 lerp，有惯性不跟手
- CSS vignette + 顶部微光压住四角，卡片有内高光 hairline
- 按钮三态：idle → loading（spinner）→ success（对勾描画动画）
- 错误态抖动（shake keyframes）、输入时自动清除错误

## 参数（src/main.js 顶部 CONFIG）

- `bg.particles` / `bg.mobileParticles`：粒子数
- `bg.colorA` / `bg.colorB`：两主色
- `bg.speed`：漂移速度；`bg.parallax`：视差强度
- `auth.fakeDelayMs`：模拟登录延迟；`auth.demoEmail/demoPassword`：演示账号

## 构建

```bash
python3 build.py                                        # template -> index.html（开发版）
python3 ~/workspace/bin/fx-singlefile.py admin-login-3d # 打成附件可发的单文件
```

## 降级

- 无 WebGL → CSS 双光斑漂移背景（`body.no-webgl`）
- `prefers-reduced-motion` → 只渲染一帧静态粒子
- 移动端：粒子数降到 900、DPR 上限 1.5、卡片全宽、SSO 纵排
- 切后台标签页自动暂停渲染

## 生产接入

把 `initForm` 里 `setTimeout` 模拟段换成真实 `fetch('/api/login')`；SSO 按钮接 OAuth；`localStorage` 记住邮箱可保留。
