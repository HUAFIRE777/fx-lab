# 招聘 3D 职位墙（careers-3d）

<!-- huafire3d fx-lab — original implementation -->

深蓝星空背景上的招聘页：职位卡片以 3D 扇形翻转姿态入场，部门筛选切换时旧卡翻转离场、新卡扇形重排；点击卡片展开详情弹窗投递。双击 `index.html` 即可看（单文件，断网可开，零外链）。

参考来源：Linear / Vercel careers 页的"筛选 pills + 职位卡片列表"结构只学了信息架构；3D 扇形入场（`rotateY/rotateX/z` 组合 + 中央 stagger）与筛选翻转重排为本模板原创实现，代码全部重写，未复制任何第三方源码。

## 动效拆解

| 手法 | 做法 | 为什么 |
|---|---|---|
| 3D 扇形入场 | GSAP：`rotateY:-38, rotateX:12, z:-420, y:60` → 归零，`stagger:{each:.07, from:'center'}` | 卡片像从深处扇形铺开，中央先行，有舞台感 |
| 筛选翻转重排 | 旧卡 `rotateY:55, z:-260` 翻转离场 → 切 display → 新卡扇形入场 | "翻页"式切换，比淡入淡出有物理感 |
| 详情弹窗 | `rotateX:-14 + transformPerspective:900` 翻入，`power3.out` | 弹窗像从桌面上立起来，不是凭空出现 |
| 深蓝星空 | 700 粒子程序化星空（电光蓝/白双色），缓慢自转 | 背景有呼吸感但不抢卡片；零贴图零外链 |
| hover 微交互 | 卡片上浮 7px + 蓝色辉光 + 左侧蓝条浮现 + "查看详情 →" 字距拉开 | 每个可点元素都有反馈 |
| 加载态 | 进度条 + 百分比，window load 后淡出 | 程序化内容无外部资源，加载态只为仪式感 |

## 参数说明（`src/config.js`，改完即生效）

- `brand` / `brandSub` — 顶栏品牌名 / 副标题
- `palette.{navy,blue,white}` — 海军蓝底 / 电光蓝 / 白
- `title` / `subtitle` — 首屏大标题 / 副标题
- `depts[]` — 筛选 pills（首项为"全部"）
- `jobs[]` — 职位数组，每项 `{dept, title, loc, salary, tags[], desc, reqs[]}`：增删职位只改这里
- `applyNote` — 页脚/弹窗底部说明；`toastOk` — 点击"投递简历"后的提示文案

## 质量自查（"不像 AI 写的"六项）

① 整页只讲"职位卡片 3D 扇形展开 + 筛选翻转重排"一个核心动效；② 配色 3 色：海军 #0a1230 + 电光蓝 #4d7cff + 白，无彩虹渐变；
③ 字号/字距/层级：大标题 clamp(40px,5.6vw,72px) 800 粗，部门标签 .28em 字距，卡片标题 22px；
④ 无 Lorem、无 emoji 列表（职位名/地点/薪资段均为真实感中文："慢查询在你这里活不过一周。"）；
⑤ 手工细节：radial 暗角、feTurbulence 胶片噪点、卡片左侧蓝条、箭头 hover 位移、按钮弹簧 easing、加载进度条；
⑥ easing：UI 过渡统一 `cubic-bezier(.2,.8,.2,1)`，按钮 hover 用 `cubic-bezier(.34,1.45,.44,1)` 弹簧感，入场用 GSAP `power3.out`（非 linear）。

## 源码结构

```
careers-3d/
├── index.html            # 单文件成品（附件交付用，由 template + singlefile 生成）
├── index.template.html   # 开发模板（改这里，再打包）
├── src/
│   ├── config.js         # 中央参数（文案/配色/部门/职位）
│   └── main.js           # three 星空 + DOM 搭建 + 扇形入场 + 筛选 + 弹窗
├── vendor/               # three.module.js + gsap.min.js（本地；gsap 注释内 URL 已剥离，保证零外链）
└── README.md
```

改完模板后重新打包：`cp index.template.html index.html && python3 ~/workspace/bin/fx-singlefile.py careers-3d`
（注意 singlefile 是单向的，不要对已打包的 index.html 重复跑。）

## 移动端

卡片单列、标题字号降到 clamp(40px,5.6vw,72px)、pills 可换行、弹窗全宽；
`prefers-reduced-motion` 下关闭全部过渡/动画时长。
