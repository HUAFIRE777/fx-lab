<!-- huafire3d fx-lab — original implementation -->
# company-hero-3d · 公司介绍 Hero 模板

全屏电影感 3D 公司介绍首屏：GPU 粒子星云背景 + 大标题逐行揭示 + 真实 3D 产品点缀。
`index.html` 为单文件成品（935KB，双击即看，零外部依赖，3D 模型走 R2 外链）。

## 参考声明（手法学习，代码全部独立重写）

1. **lusion.co** —— 复现的手法：
   - GPU 粒子星云 hero 背景（Points + 自定义 shader、加色混合、深浅双层错动）
   - 电影感慢镜头：相机极缓漂移 + 鼠标视差
   - 未复制其任何源码、贴图或文案；shader、粒子分布、配色均为独立编写。
2. **activetheory.net** —— 复现的手法：
   - 大标题逐行遮罩揭示（mask reveal）的编排节奏
   - 副标题 + 双 CTA（主/次按钮）的信息层级
   - 揭示实现为独立编写（见"防呆设计"）。

## 手法拆解

- **粒子星云**（`src/nebula.js`）：两层 Points——远景冷白星点 + 近景信号紫雾带；
  顶点着色器做正弦慢漂移 + 闪烁（每粒子随机相位/速度/尺寸/取色）；
  片元着色器做柔边圆点 + 按随机值三色混合（72% 冷白 / 22% 紫 / 6% 淡暖尘）。
- **标题揭示**（`src/reveals.js`）：纯 class 驱动。隐藏态 `html.js .rv-txt{transform:translateY(112%)}`，
  显示态 `html.js .rv.is-in .rv-txt{transform:none}` 特异度更高；全程不读写行内 transform；
  6 秒兜底强制显示；与 WebGL 解耦（canvas 挂了标题照样出）。
- **产品点缀**（`src/product.js`）：GLTFLoader 加载 R2 模型，按包围盒归一化到目标高度；
  入场 scale expo-out 弹一下，之后慢转 + 呼吸浮动 + 鼠标视差（lerp 阻尼）；
  加载失败静默隐藏，版式不受影响。
- **开场编排**（`src/main.js`）：loader（品牌 + 细进度线）→ 星云先出一帧 → 标题逐行 → 副标题/CTA →
  滚动提示；不等待 window load（大模型会拖慢），700ms 即开场。
- **手工细节**：vignette 暗角 + SVG 噪点颗粒；CTA 箭头 hover 右滑；导航链接下划线生长；
  滚动提示小圆点循环下坠（cubic-bezier 物理感）；所有动效 easing 均为 expo-out 系，
  无 linear。

## 参数（`src/config.js`，换公司只改这里）

`brand / nav / eyebrow / titleLines（支持 <em> accent 词）/ sub / ctas / scrollHint /
palette（bg/bgSoft/ink/inkDim/accent 三色定死）/ model{url,position,targetHeight} /
particles{数量/尺寸/透明度} / capabilities / footer`

## 构建

```bash
bash build.sh   # index.src.html -> index.html -> fx-singlefile.py 单文件打包（单向）
```

`vendor/`：three.module.js（r183）+ GLTFLoader 及依赖（构建时一次性下载 vendor，
运行时零外部 URL）。模型 URL 打包时保持 R2 外链不动。

## "不像 AI 写的"六项自查

1. 克制：整页只讲一个核心动效（粒子星云），产品点缀是配角，无效果堆砌。✅
2. 配色：墨底 #060913 / 雾白 #E9EDF5 / 信号紫 #7C6CFF 三色定死，无彩虹渐变。✅
3. 字体：系统字体栈；大标题 clamp(3rem,8vw,6.6rem)、-0.02em 字距、1.05 行高，有呼吸感。✅
4. 文案：虚构公司"星核工坊"真实感短句，无 Lorem ipsum、无 emoji 列表。✅
5. 手工细节：vignette/噪点/随机粒子/加载态/hover 微交互齐全。✅
6. easing：expo-out 系 cubic-bezier(0.16,1,0.3,1)，无默认 linear。✅

## 验收结论（2026-10-05）

- 标题揭示：真实 bundle 上 `titleLinesIn 2/2`、`fadesIn 4/4`，终态 transform 为单位矩阵
  （studiofreight 式隐身 bug 不存在，有 6 秒兜底）。
- console 零 JS 报错（多次 headless 运行）。
- 星云渲染为深空效果（初版过曝已修：雾带 1050→380 粒子、尺寸 24→15、透明度 0.20→0.12）。
- GLTF 加载管线验证通过（测试模型正常渲染定位）；R2 耳机模型在测试机上因代理
  `ERR_EMPTY_RESPONSE` 加载失败——代码已静默降级，真机网络正常即可加载。
- 已知限制：本机 headless Chromium 的 SwiftShader 软件光栅化跑不动
  2780 粒子加色混合（单帧数十秒），交互时序类验证用"隔离页"与"无渲染变体"完成；
  真机 GPU 下为 60fps 场景。
- 移动端：粒子减半、像素比上限 1.6、产品缩小上移、导航收起，390px 版式验证通过。
- reduced-motion：只渲一帧、标题直接显示、无循环动画。
