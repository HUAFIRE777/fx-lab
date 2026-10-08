// huafire3d fx-lab — original implementation
// 滚动开箱模板：集中参数配置。改这里即可换产品、换文案、调运镜。

export const CONFIG = {
  // 3D 模型（R2 外链；单文件打包时保持外链，不内联）
  modelUrl:
    'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_keyboard.glb',

  // 模型归一化：最长边缩放到该宽度（世界单位）
  modelWidth: 2.0,

  // 相机轨道关键帧：p=滚动进度(0~1)，angle=环绕角(度)，radius=轨道半径，height=高度
  camera: {
    fov: 40,
    keys: [
      { p: 0.0, angle: -38, radius: 3.6, height: 1.75, targetY: 0.05 },
      { p: 0.3, angle: 18, radius: 2.7, height: 1.25, targetY: 0.05 },
      { p: 0.5, angle: 52, radius: 2.7, height: 1.0, targetY: 0.0 },
      { p: 0.75, angle: 118, radius: 2.9, height: 1.35, targetY: 0.0 },
      { p: 1.0, angle: 162, radius: 1.75, height: 0.72, targetY: -0.05 },
    ],
  },

  // 分解视图：包围盒切片。grid=[x,y,z] 切块数；distance=散开距离；range=进度区间
  explode: {
    grid: [2, 2, 2], // 桌面端 8 块
    gridMobile: [2, 1, 2], // 移动端 4 块（省面数）
    distance: 1.15,
    range: [0.38, 0.62], // 滚动 ~50% 处完成触发
  },

  // 卖点标注：anchor=包围盒内相对坐标(0~1)；show=显示进度区间；side=卡片偏移方向
  labels: [
    {
      id: 'keycaps',
      title: 'PBT 双色键帽',
      text: '细腻磨砂触感，字符历久弥新',
      anchor: [0.68, 0.98, 0.5],
      show: [0.06, 0.44],
      side: 'right',
    },
    {
      id: 'structure',
      title: '精密卡扣结构',
      text: '键帽 · 定位板 · 底壳逐层分离，一睹内部乾坤',
      anchor: [0.32, 0.62, 0.5],
      show: [0.42, 0.86],
      side: 'left',
    },
    {
      id: 'case',
      title: '一体成型底壳',
      text: '人体工学弧度，长时间敲击不累手',
      anchor: [0.5, 0.3, 0.06],
      show: [0.58, 0.97],
      side: 'right',
    },
  ],

  // 阶段文案
  phases: [
    { until: 0.35, text: '环绕鉴赏 · 360°' },
    { until: 0.68, text: '分解视图 · 内部结构' },
    { until: 1.01, text: '细节特写' },
  ],

  // 画质
  quality: {
    dprDesktop: 2,
    dprMobile: 1.5,
    antialiasMobile: true,
  },

  // 静态降级（reduced-motion）三段文案
  staticSections: [
    { title: 'PBT 双色键帽', text: '细腻磨砂触感，字符历久弥新。人体工学键帽曲线，贴合指尖。' },
    { title: '精密卡扣结构', text: '键帽、定位板、底壳逐层嵌合，免工具即可拆装清理。' },
    { title: '一体成型底壳', text: 'CNC 级一体底壳，配重扎实，敲击稳如磐石。' },
  ],
};
