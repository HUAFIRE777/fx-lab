# 野原工作室 · 可驾驶 3D 小岛

> 一座低多边形小岛，开车闲逛，撞进发光圆环弹出内容卡片——全部代码原创实现。

## 参考对象与借鉴点

- 参考对象：**bruno.simpson.com（Bruno Simon）**——十年常青的"开车逛简历"式 3D 个人站，2026 年重制版延续了同一玩法。
- 只借鉴**手法与创意**，未复制其任何源码：
  1. "驾驶即浏览"：用开车代替滚动，探索感代替信息流；
  2. 碰撞触发内容：世界里放显眼的触发物（他的是彩色方块，这里是发光圆环），开进去弹出 DOM 卡片；
  3. 低多边形 + flatShading 的手工质感美术方向；
  4. 第三人称跟随相机的顺滑拖尾。
- 以下全部为本模板原创：街机物理（速度向量 + 侧向抓地回正，带漂移感）、昼夜色调偏移、WebAudio 合成引擎声、虚拟摇杆、集齐庆祝。

## 动效拆解

1. **小车街机物理**（`src/car.js`）：状态只有位置/朝向/速度向量。油门沿车头加速、刹车/倒车二段式、无输入指数阻力；每帧把速度分解为"车头方向分量 + 侧向分量"，侧向分量按抓地系数衰减——抓地越小甩尾越明显，这就是漂移感的来源。转向角速度正比于车速（静止打方向不动、倒车自动反打）。
2. **碰撞**：XZ 平面 2D 碰撞。小车是圆，房子是 AABB（圆心卡进盒内时沿最小穿透轴推出），树/池塘是圆；岛屿边缘是隐形圆形围墙。撞墙速度打折，不弹飞。
3. **跟随相机**（`src/main.js`）：目标点 = 车尾后上方，每帧用指数阻尼 `1 - e^(-λ·dt)` 做 lerp，帧率无关；看向车头前方 4.5 米提前量；FOV 随车速从 55 张到 67。
4. **圆环触发**（`src/world.js` + `src/ui.js`）：4 枚 Torus 圆环悬浮旋转 + 呼吸缩放 + 底部光圈明暗脉动；车进入半径 2.8 米 → DOM 卡片以回弹 easing（cubic-bezier(.2,1.4,.35,1)）弹出；每枚 3 秒冷却防刷屏；集齐 4 枚顶部出现"探索完成"庆祝条。
5. **昼夜色调**：驾驶时长驱动，天空/雾/太阳色在 5 分钟内从午后（#BAE6FD）easeInOut 过渡到黄昏（#F5C98B）。
6. **引擎声**（`src/audio.js`）：WebAudio 锯齿波 + 低通滤波，频率/滤波/音量三参数跟车速走；默认静音，点"开启声音"后启用（开场按钮点击即解锁 AudioContext）。
7. **果汁**：车身转向侧倾、前后俯仰、前轮转向偏转、车轮按速度滚动；阴影相机跟随小车（26 米正交阴影盒，世界再大也不糊）。

## 配置参数

| 位置 | 参数 | 说明 |
|---|---|---|
| `car.js` P | `accel 15 / brake 26 / maxFwd 17 / maxRev 7` | 加速/刹车/极速 |
| `car.js` P | `grip 7.5` | 侧向抓地，越小越漂移 |
| `car.js` P | `turnRate 2.4` | 满速转向角速度 |
| `world.js` | `bounds 32` | 岛屿可行駛半径 |
| `world.js` | `mulberry32(20261008)` | 场景随机种子，同种子同布局 |
| `main.js` | `driveTime / 300` | 午后→黄昏过渡时长（秒） |
| `main.js` | 相机 `9.5 / 6.2`、阻尼 `4.2` | 跟随距离/高度/顺滑度 |
| `ui.js` | 冷却 `3000ms` | 同一圆环重复触发冷却 |

## 六项自查

- [x] **不像 AI 写的**：整页只讲"开车逛岛"一个核心交互；配色定死草地绿 #4ADE80 / 天空 #BAE6FD / 沙土 #FDE68A 三色（+墨色字），禁彩虹渐变；中文短句文案，无 Lorem ipsum、无 emoji 列表；vignette + SVG 噪点 + 加载态（"正在搭建小岛…"→"点击进入驾驶"）+ 按钮 hover/active 三态。
- [x] **外部依赖本地化**：three@0.183.0 内联为 data: URL（890KB 单文件），零网络请求（实测 `performance.getEntriesByType('resource')` 无站外条目）；无 GSAP（本模板不需要）。
- [x] **无头验证**：esbuild 一次通过；headless console 零错误、零异常；首帧渲染后按钮自动放行（file:// ES module 在 headless 受限，截图黑屏属环境限制，已用 swiftshader 渲染验证通过）。
- [x] **easing 物理感**：卡片弹出回弹曲线、相机指数阻尼、昼夜 easeInOut、圆环呼吸正弦。
- [x] **隐藏等 JS 完成态可达**：`html.js` 前缀控制 HUD/卡片/庆祝条/摇杆的显示；JS 未加载时开场层照常可见、按钮保持 disabled（加载态文案）。
- [x] **原创**：物理/碰撞/音频/场景生成均为原创实现；README 顶部已声明参考对象与借鉴边界。

## 源码结构

```
drive-world-3d/
├── index.src.html      # 源码入口（importmap three→vendor，module→src/main.js）
├── index.html          # 打包成品（fx-singlefile.py 一次性单向生成，勿二次打包）
├── vendor/
│   └── three.module.js # three@0.183.0（从 product-launch-hero-3d 拷贝，禁从网络下）
├── src/
│   ├── main.js         # 渲染器/灯光/相机跟随/昼夜/主循环
│   ├── world.js        # 程序化小岛：沙盘/草地/路/池塘桥/房子/树/圆环
│   ├── car.js          # 小车拼装 + 街机物理 + 碰撞
│   ├── input.js        # 键盘 WASD/方向键 + 触屏虚拟摇杆
│   ├── audio.js        # WebAudio 合成引擎声 + 触发音
│   └── ui.js           # 开场/HUD/卡片/庆祝/声音开关 + 原创文案
└── README.md
```

## 重建方式

```bash
cd ~/workspace/fx-lab/drive-world-3d
cp index.src.html index.html                      # 从源码恢复打包页
python3 ~/workspace/bin/fx-singlefile.py drive-world-3d   # esbuild 打包 src → 内联 → three 走 data: URL
```

- 改 `src/` 后重新跑上面两步即可；**禁止对已打包的 index.html 二次打包**（importmap 已是 data: URL，重复跑会坏）。
- 单独校验：`/tmp/esb/node_modules/.bin/esbuild src/main.js --bundle --format=esm --external:three --minify` 一次通过为准。
- 双击 `index.html` 即可玩（file:// 直接打开）。

## 移动端说明

- 触屏自动显示左下虚拟摇杆（`html.touch`）：上下推 = 油门/刹车，左右推 = 转向；摇杆用 Pointer Events + `touch-action:none`，半径 44px，带回弹复位。
- 降级：`pixelRatio ≤ 1.5`、阴影贴图 1024（桌面 2048）；布局无横向溢出，卡片宽度 `min(420px, 92vw)`。
- 音频：移动端不自动播放，必须点"开启声音"（浏览器自动播放策略要求用户手势）。
- 操作提示文案在触屏下自动切换（隐藏键盘提示）。
