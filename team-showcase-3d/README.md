# team-showcase-3d · 团队介绍 3D 卡片

公司「团队」介绍页：成员卡片 3D 翻转 + 鼠标视差，暖色纸面质感，点卡片看成员介绍。

huafire3d fx-lab —— 原创实现，可商用。

## 参考与复现手法（只学手法，代码全部重写，未复制任何参考站源码）

1. **Linear about 页** —— 复现：卡片悬停时的 3D 倾斜跟随鼠标 + 高光（glare）扫过；网格入场 stagger。
2. **Arc（The Browser Company）团队页** —— 复现：卡片悬停翻面（正面头像 → 背面简介/社交链接）的编排节奏。

实现上两者被融合成一套：外层 tilt（JS 阻尼跟随）+ 内层 flip（CSS rotateY），互不打架。

## 玩法

- 桌面：鼠标移到卡片上，卡片 3D 倾斜跟随 + 高光扫过；继续悬停翻面看简介
- 移动端 / 触屏：点按卡片翻面（无倾斜）
- 顶部可按部门筛选（全部 / 技术 / 设计 / 市场），带淡出 + stagger 淡入编排
- `prefers-reduced-motion`：关倾斜、翻面无动画，内容全部可达
- 头像：canvas 程序化生成（渐变 + 几何装饰 + 姓名首字），零外部图片

## 换团队只改一处

`src/config.js` 的 `TEAM` 数组：姓名 / 职位 / 部门（tech/design/marketing）/ 简介 / 颜色 / 链接。

## 质量自查（"不像 AI 写的"六项）

① 克制：整页只讲"3D 团队卡片"一个核心，筛选/入场都是配套编排；② 配色：墨黑 + 骨白 + 鸢尾蓝三色定死，成员色只出现在头像内且已压暗；③ 字体：系统栈，大标题 clamp 字号 + 负字距 + 宽松行高；④ 文案：真实中文短句，无 lorem、无 emoji 列表；⑤ 手工细节：vignette 暗角、胶片颗粒噪点、筛选胶囊 hover 上浮、链接 hover 微交互；⑥ easing：全部物理曲线（`cubic-bezier(0.2,0.7,0.25,1)` / 带回弹的 spring），无 linear。

## 构建

```bash
python3 ~/workspace/bin/fx-singlefile.py team-showcase-3d
```

`index.html` 即单文件成品（双击可看），`src/` 保留源码。
