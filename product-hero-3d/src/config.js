// huafire3d fx-lab — original implementation
// product-hero-3d · src/config.js
// 中央参数文件：改这里的任何值都会实时生效（页面右上 ⚙ 面板 / 控制台 window.__HERO.apply()）。
export const CONFIG = {
  // ---- 模型 ----
  model: {
    // 默认耳机模型（R2 公网桶外链，打包时保持不动）
    url: 'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb',
  },

  // ---- 文案（电商首屏信息）----
  copy: {
    brand: 'AURALAB',
    eyebrow: '旗舰无线降噪耳机',
    title: 'AURA X1',
    tagline: '40 小时续航 · -48dB 主动降噪<br>把录音棚戴在头上。',
    price: '¥1,299',
    priceNote: '首发立减 ¥200',
    ctaPrimary: '立即购买',
    ctaSecondary: '查看规格',
  },

  // ---- 背景（canvas 透明，CSS 渐变透出来）----
  background: {
    top: '#141a26',
    bottom: '#05070c',
    glowColor: '#3b6cff',   // 中央光晕颜色
    glowOpacity: 0.22,      // 中央光晕不透明度
  },

  // ---- 灯光（三点布光，全部可实时调）----
  lights: {
    exposure: 1.1,                       // ACES 曝光
    key:   { color: '#ffffff', intensity: 2.6, position: [4, 6, 5] },   // 主光（投射阴影）
    fill:  { color: '#bcd2ff', intensity: 0.9, position: [-5, 2, 3] },  // 补光
    rim:   { color: '#7aa2ff', intensity: 3.2, position: [-2, 4, -6] }, // 轮廓光（背面勾边）
    hemi:  { sky: '#dfe8ff', ground: '#1a1d24', intensity: 0.5 },       // 半球环境底光
  },

  // ---- 环境反射（RoomEnvironment 程序化影棚，零外部 HDR）----
  environment: {
    enabled: true,
    intensity: 0.85,   // 材质 envMapIntensity，金属/塑料质感就靠它
  },

  // ---- 地面阴影 ----
  floor: {
    enabled: true,
    shadowOpacity: 0.35,
  },

  // ---- 相机 ----
  camera: {
    fov: 38,
    distanceFactor: 1.35,  // 最终距离 = 包围球贴合距离 × 系数（面板可调）
    minFactor: 0.7,        // 缩放下限（相对贴合距离）
    maxFactor: 3.2,        // 缩放上限
    minPolarDeg: 15,       // 俯仰下限（防止钻到地下）
    maxPolarDeg: 92,       // 俯仰上限
    // 移动端构图：文案在底部，模型让到屏幕上半区
    mobile: { targetYOffsetFactor: -0.6, distanceBoost: 1.5 },
  },

  // ---- 交互 ----
  controls: {
    autoRotate: true,      // 闲置自动旋转
    autoRotateSpeed: 1.4,   // 自动转速（度/秒换算系数，OrbitControls 口径）
    idleSeconds: 3,        // 用户松手后多少秒恢复自动旋转
    dampingFactor: 0.06,   // 阻尼（越小越滑）
    enablePan: false,       // 产品 hero 不许平移出画
  },

  // ---- 开场 ----
  intro: {
    enabled: true,
    durationSec: 1.6,      // 相机从远处推进来的时长
    startFactor: 1.8,      // 开场起始距离 = 最终距离 × 系数
  },

  // ---- 性能 ----
  perf: {
    pixelRatioMax: 2.0,        // 桌面像素比上限
    pixelRatioMaxMobile: 1.5,  // 移动端像素比上限
    shadowMapSize: 2048,       // 桌面阴影贴图
    shadowMapSizeMobile: 1024, // 移动端阴影贴图
    antialias: true,
  },

  // ---- 界面 ----
  ui: {
    panel: true,           // 右上 ⚙ 参数面板
    loadingText: '正在加载 3D 模型',
  },
};
