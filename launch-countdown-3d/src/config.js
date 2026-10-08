/* huafire3d fx-lab — original implementation */
/* launch-countdown-3d：新品发布倒计时。换产品只改这里。 */
export const CONFIG = {
  brand: "AURA",
  product: "X1",
  productFull: "AURA X1",
  tagline: "Wireless Flagship",
  price: "¥2,999",

  /* 倒计时目标（ISO，含时区）。页面也支持 ?demo=秒 快速预览揭幕。 */
  launchAt: "2026-10-10T20:00:00+08:00",

  model: {
    url: "https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb",
    /* 模型在世界单位里的目标高度，越大越有压迫感 */
    targetHeight: 2.1,
    /* 初始展示角度 */
    initialYaw: -0.5,
  },

  scene: {
    bg: 0x060607,
    exposure: 1.12,
    turnSpeed: 0.28,      /* 弧度/秒 */
    bobAmp: 0.07,
    productY: 0.62,       /* 产品中心高度（给下方倒计时留位置） */
    cameraZ: 6.6,
    cameraY: 1.05,
    rimColor: 0xffb454,   /* 呼吸边缘光 */
    keyColor: 0xfff1de,
  },

  burst: {
    count: 2400,
    power: 5.2,
  },

  copy: {
    eyebrow: "GLOBAL LAUNCH IN",
    notifyPlaceholder: "Email for early access",
    notifyOk: "You're on the list — see you at launch.",
    revealEyebrow: "THE WAIT IS OVER",
    revealTitle: "IT'S HERE.",
    cta: "立即预订",
    fine: "X1 ships worldwide · 30-day returns",
  },
};
