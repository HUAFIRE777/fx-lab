// huafire3d fx-lab — original implementation
//
// product-configurator 配置文件。
// 换一款商品：只改这个文件即可 —— 商品名、价格、模型 URL、默认视角、
// 选项组（颜色 / 材质 / 增值服务）、每个选项的价格差，全在这里。

export const CONFIG = {
  product: {
    name: 'AURAL X1 头戴式耳机',
    tagline: '旗舰降噪 · 40mm 动圈单元',
    basePrice: 1299,
    currency: '¥',
    // 价格显示格式：(n) => string
    formatPrice: (n) => '¥' + n.toLocaleString('zh-CN'),
  },

  model: {
    // R2 外链：单文件打包时保持不动，按字节原样保留
    url: 'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb',
    credit: '模型来源 Tripo Studio AI 生成（3d-assets 共享库）',
  },

  // 相机：distanceFactor 相对模型包围盒尺寸，自动适配任意大小的模型
  camera: {
    fov: 38,
    distanceFactor: 2.4,
    minDistanceFactor: 1.1,
    maxDistanceFactor: 6,
    polarMin: 0.15 * Math.PI,
    polarMax: 0.62 * Math.PI,
  },

  stage: {
    autoRotateSpeed: 1.4,      // 展台自动旋转速度（度/秒换算由 OrbitControls 处理）
    idleResumeMs: 4000,        // 用户交互后多久恢复自动旋转
    bgTop: '#1b1e26',          // 展台背景渐变（上）
    bgBottom: '#0c0d12',       // 展台背景渐变（下）
    keyLightColor: '#ffffff',
    rimLightColor: '#7aa2ff',
  },

  // 选项组：type = 'swatch'（色板单选）| 'pill'（胶囊单选）| 'check'（复选框多选）
  // 颜色选项：color 为十六进制，换色通过材质 override 实现，不碰模型文件
  // 材质选项：material 字段直接映射到覆盖材质的物理属性
  options: [
    {
      id: 'color',
      label: '颜色',
      type: 'swatch',
      choices: [
        { id: 'midnight', label: '午夜黑', color: '#232327', priceDelta: 0 },
        { id: 'arctic',   label: '冰川白', color: '#e9e7e2', priceDelta: 0 },
        { id: 'crimson',  label: '烈焰红', color: '#a71e28', priceDelta: 120 },
        { id: 'ocean',    label: '深海蓝', color: '#1e4d7b', priceDelta: 120 },
        { id: 'forest',   label: '松林绿', color: '#2e5d43', priceDelta: 120 },
      ],
    },
    {
      id: 'finish',
      label: '表面工艺',
      type: 'pill',
      choices: [
        { id: 'matte', label: '哑光', priceDelta: 0,
          material: { roughness: 0.82, metalness: 0.05, clearcoat: 0.0 } },
        { id: 'gloss', label: '亮面', priceDelta: 80,
          material: { roughness: 0.22, metalness: 0.10, clearcoat: 0.8 } },
        { id: 'metal', label: '金属', priceDelta: 200,
          material: { roughness: 0.34, metalness: 0.92, clearcoat: 0.2 } },
      ],
    },
    {
      id: 'addon',
      label: '增值服务',
      type: 'check',
      choices: [
        { id: 'engrave', label: '镌刻姓名（耳机内侧）', priceDelta: 99 },
        { id: 'warranty', label: '延保 1 年', priceDelta: 149 },
      ],
    },
  ],

  defaults: {
    color: 'midnight',
    finish: 'matte',
    addon: [],   // 复选组默认空选
  },

  ui: {
    wordmark: 'AURAL',
    ctaLabel: '加入购物车',
    ctaDoneLabel: '已加入',
    features: ['40mm 大动圈单元', '主动降噪 -45dB', '续航 60 小时', '蓝牙 5.4 + 有线双模'],
  },
};
