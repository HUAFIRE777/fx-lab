// huafire3d fx-lab — original implementation
// 全局配置：换数据只改这里，整页跟着变。
export const CONFIG = {
  theme: {
    bg: '#07070d',
    accent: '#6e6bff',   // 主强调色
    accent2: '#a855f7',  // 副强调色
    up: '#34d399',
    down: '#f87171',
  },

  nav: [
    { id: 'overview', label: '数据总览', icon: 'grid', active: true },
    { id: 'analytics', label: '深度分析', icon: 'chart' },
    { id: 'users', label: '用户管理', icon: 'users' },
    { id: 'orders', label: '订单中心', icon: 'box' },
    { id: 'settings', label: '系统设置', icon: 'gear' },
  ],

  // KPI 卡片：value 为原始数值，format 决定展示格式
  kpis: [
    { id: 'revenue', label: '总营收', value: 2846930, format: 'money0', delta: +12.4, spark: [42, 55, 48, 70, 66, 82, 95] },
    { id: 'users', label: '活跃用户', value: 186204, format: 'int', delta: +8.1, spark: [30, 44, 52, 48, 63, 71, 88] },
    { id: 'conversion', label: '转化率', value: 0.0342, format: 'pct2', delta: -0.6, spark: [64, 58, 61, 55, 49, 52, 46] },
    { id: 'churn', label: '流失率', value: 0.0121, format: 'pct2', delta: -2.3, spark: [70, 62, 55, 58, 44, 38, 33], invert: true },
  ],

  // 3D 柱状图数据：空数组 -> 显示空数据态
  revenue: {
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    current: [182, 205, 198, 226, 248, 262, 255, 284, 301, 318, 342, 371],
    previous: [150, 168, 175, 190, 202, 214, 208, 228, 240, 252, 268, 285],
  },

  ranges: ['6M', '12M', 'YTD'],

  regions: [
    { name: '华东', pct: 86 }, { name: '华南', pct: 72 },
    { name: '华北', pct: 64 }, { name: '西南', pct: 41 }, { name: '海外', pct: 28 },
  ],

  funnel: [
    { label: '访问', value: 100 }, { label: '注册', value: 46 },
    { label: '加购', value: 21 }, { label: '支付', value: 9 },
  ],

  feedTemplates: [
    { icon: 'pay', text: '新订单 <b>¥12,800</b> · 企业版年付' },
    { icon: 'user', text: '<b>深圳某科技公司</b> 完成注册' },
    { icon: 'warn', text: 'API 错误率突增 <b>0.8%</b> · 已恢复' },
    { icon: 'pay', text: '新订单 <b>¥3,600</b> · 专业版月付' },
    { icon: 'user', text: '<b>132</b> 位新用户来自推荐链接' },
    { icon: 'up', text: '转化率回升 <b>+1.2%</b>' },
  ],

  motion: {
    bootMs: 650,          // 开屏骨架时长
    staggerMs: 90,        // 卡片入场间隔
    countupMs: 1400,      // 数字滚动时长
    barGrowMs: 900,       // 3D 柱生长时长
    feedEveryMs: 4200,    // feed 推送间隔
    maxFeed: 7,
  },

  gl: {
    barPixelRatio: 2,     // 3D 图表像素比上限（移动端自动降到 1.25）
    globePixelRatio: 1.5,
    autoRotate: true,
  },
};
