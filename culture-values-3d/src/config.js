// culture-values-3d · 配置（改这里换文案/配色，不碰逻辑）
export const CONFIG = {
  brand: 'PANSHI',
  brandSub: '磐石工作室 · 关于我们',
  palette: {
    paper: '#faf6ef',   // 暖白
    clay:  '#c1502e',   // 陶土
    ink:   '#201a15',   // 墨
  },
  points: 3800,          // 3D 粒子数
  pointSize: 0.12,       // 粒子基础大小（世界单位；sizeAttenuation 下屏幕约 8px。
                         // 注意：attenuation 开启时 size 会被 scale/depth 放大，
                         // 此处若写成 15 之类的"像素值"，单粒子会被放大到上千像素，
                         // 真机 GPU 靠 overdraw 硬扛、无头软件渲染直接卡死——已踩坑）
  // 4 屏价值观：滚动进度 0→3 逐个对应，几何体 球→立方→圆环→锥体
  values: [
    { title: '专注', en: 'FOCUS',    shape: '球体', desc: '一次只做一件事，把它做到配得上时间。' },
    { title: '诚实', en: 'HONESTY',  shape: '立方', desc: '坏消息先说，数字不说谎，从不骗自己。' },
    { title: '极致', en: 'MASTERY',  shape: '圆环', desc: '差一点就是差很多，多打磨一版再交出去。' },
    { title: '长期主义', en: 'LONG GAME', shape: '锥体', desc: '慢即是快，复利只奖励不离开牌桌的人。' },
  ],
  hint: '向下滚动',
  closing: '这就是我们做事的方式。',
};
