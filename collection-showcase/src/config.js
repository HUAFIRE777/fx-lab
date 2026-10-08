/* huafire3d fx-lab — original implementation */
/* collection-showcase: 商品配置 —— 换商品只改这个数组 */

export const R2_BASE =
  'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero';

/* 字段：id / name / en / category / price(¥) / tag / model / tint(视口底色) / desc */
export const CONFIG = [
  {
    id: 'aurora-x9',
    name: 'Aurora X9 头戴式耳机',
    en: 'Aurora X9 Headphones',
    category: '数码',
    price: 1299,
    tag: '新品',
    model: `${R2_BASE}/electronics/tripo_headphone.glb`,
    tint: '#e8edf4',
    desc: '40mm 镀铍动圈单元，自适应主动降噪，单次充电 36 小时续航。折叠收纳，出差通勤都从容。',
  },
  {
    id: 'meridian-s',
    name: 'Meridian S 智能腕表',
    en: 'Meridian S Watch',
    category: '数码',
    price: 899,
    tag: '',
    model: `${R2_BASE}/electronics/tripo_watch.glb`,
    tint: '#ebe9e3',
    desc: '蓝宝石表镜，双频 GPS，14 天长续航。抬腕即见，运动健康数据一目了然。',
  },
  {
    id: 'voyager-20',
    name: 'Voyager 20L 旅行背包',
    en: 'Voyager 20L Backpack',
    category: '出行',
    price: 649,
    tag: '热卖',
    model: `${R2_BASE}/tripo_backpack.glb`,
    tint: '#e8efe8',
    desc: '防泼水面料，独立 16 寸电脑仓，人体工学背负系统。城市与旷野，一包搞定。',
  },
  {
    id: 'flow-dress',
    name: 'Flow 真丝连衣裙',
    en: 'Flow Silk Dress',
    category: '服饰',
    price: 799,
    tag: '限定',
    model: `${R2_BASE}/tripo_dress.glb`,
    tint: '#f2e8e2',
    desc: '桑蚕丝混纺面料，立体剪裁，手工包边。行走之间，自有风的形状。',
  },
  {
    id: 'stride-runner',
    name: 'Stride 复古跑鞋',
    en: 'Stride Retro Runner',
    category: '服饰',
    price: 549,
    tag: '',
    model: `${R2_BASE}/apparel/tripo_sneaker.glb`,
    tint: '#e9edf0',
    desc: 'EVA 缓震中底，复古拼接鞋面，轻量透气。压马路，也压得住场面。',
  },
  {
    id: 'halo-aviator',
    name: 'Halo 飞行员墨镜',
    en: 'Halo Aviator',
    category: '配饰',
    price: 349,
    tag: '',
    model: `${R2_BASE}/tripo_sunglasses.glb`,
    tint: '#edf0e8',
    desc: '偏光镜片，超轻钛金属镜架，UV400 防护。烈日之下，依然松弛。',
  },
];

export const CATEGORIES = ['全部', '数码', '服饰', '出行', '配饰'];
