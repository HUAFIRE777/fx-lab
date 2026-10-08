/* huafire3d fx-lab — original implementation · teaser-reveal-3d */
export const CONFIG = {
  // R2 耳机模型（含 Draco 压缩；CORS 未配时自动降级为程序化剪影）。
  modelUrl: 'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb',

  brand: '听澜 HEARLAN',
  brandSub: '新品预告',
  product: '听澜 One',
  productSub: '首款旗舰降噪耳机',
  releaseDate: '2026.11.11',
  releaseLabel: '全球发布',
  specs: '-48dB 自适应降噪 · 40mm 镀铍单元 · 58 小时续航',
  // 倒计时目标（+08:00）。
  countdownTarget: '2026-11-11T00:00:00+08:00',
  // 揭开多少比例后自动撕掉剩余幕布。
  revealThreshold: 0.45,
  loadTimeoutMs: 9000,

  // 全页只用三色：纯黑 / 白 / 红。
  colors: {
    bg: '#000000',
    ink: '#ffffff',
    accent: '#e8341c',
  },
};
