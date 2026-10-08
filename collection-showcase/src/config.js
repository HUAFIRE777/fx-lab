/* huafire3d fx-lab — original implementation */
/* collection-showcase: 商品配置 —— 换商品只改这个数组 */
/* 模型全部在本地 models/ 目录，开箱即用，不依赖任何外部图床或对象存储 */

export const MODEL_BASE = './models';

/* 字段：id / name / en / category / price(¥) / tag / model / tint(视口底色) / desc */
export const CONFIG = [
  {
    id: 'aurora-x9',
    name: 'Aurora X9 头戴式耳机',
    en: 'Aurora X9 Headphones',
    category: '数码',
    price: 1299,
    tag: '新品',
    model: `${MODEL_BASE}/electronics/tripo_headphone.glb`,
    tint: '#e8edf4',
    desc: '40mm 镀铍动圈单元，自适应主动降噪，单次充电 36 小时续航。折叠收纳，出差通勤都从容。',
  },
  {
    id: 'voyager-20',
    name: 'Voyager 20L 旅行背包',
    en: 'Voyager 20L Backpack',
    category: '出行',
    price: 649,
    tag: '热卖',
    model: `${MODEL_BASE}/tripo_backpack.glb`,
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
    model: `${MODEL_BASE}/tripo_dress.glb`,
    tint: '#f2e8e2',
    desc: '桑蚕丝混纺面料，立体剪裁，手工包边。行走之间，自有风的形状。',
  },
  {
    id: 'halo-aviator',
    name: 'Halo 飞行员墨镜',
    en: 'Halo Aviator',
    category: '配饰',
    price: 349,
    tag: '',
    model: `${MODEL_BASE}/tripo_sunglasses.glb`,
    tint: '#edf0e8',
    desc: '偏光镜片，超轻钛金属镜架，UV400 防护。烈日之下，依然松弛。',
  },
];

export const CATEGORIES = ['全部', '数码', '服饰', '出行', '配饰'];
