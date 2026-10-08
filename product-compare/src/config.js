/* huafire3d fx-lab — original implementation */
/* product-compare 配置：双品信息 + 参数对照表。
   接入真实独立站时，只改这里即可：MODEL_URL 换 SKU 的 GLB 链接，
   SPECS 换真实参数。差异行由页面自动判定（a !== b），无需手写。 */

const R2 = 'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero';

export const PRODUCTS = {
  a: {
    id: 'a',
    name: '穹顶声场头戴耳机',
    tagline: '旗舰降噪 · 60 小时续航',
    price: '¥899',
    modelUrl: `${R2}/electronics/tripo_headphone.glb`,
    // R2 models-web/hero/electronics/tripo_headphone.glb（Tripo H3.1 生成，减面版 3.8MB）
  },
  b: {
    id: 'b',
    name: '矩阵三模机械键盘',
    tagline: 'PBT 键帽 · 三模连接',
    price: '¥649',
    modelUrl: `${R2}/electronics/tripo_keyboard.glb`,
    // R2 models-web/hero/electronics/tripo_keyboard.glb（Tripo H3.1 生成，减面版 2.9MB）
    // 注：该文件待 hero/ 同步到 R2 后可用；同步完成前 B 视口显示占位提示，
    // A 视口不受影响（加载失败隔离，见 README）。
  },
};

/* 参数对照表：label=参数名，a/b=两侧取值。取值相同即视为"相同行"。 */
export const SPECS = [
  { label: '售价', a: '¥899', b: '¥649' },
  { label: '重量', a: '254 g', b: '1.02 kg' },
  { label: '主体材质', a: '蛋白皮革 · 铝合金', b: 'PBT 键帽 · 铝合金' },
  { label: '连接方式', a: '蓝牙 5.4 · 3.5mm 有线', b: '蓝牙 5.1 · 2.4GHz · 有线' },
  { label: '续航', a: '60 小时（降噪开启）', b: '300 小时（节能模式）' },
  { label: '特色功能', a: '-42dB 主动降噪', b: '全键热插拔 · 线性红轴' },
  { label: '防护等级', a: 'IPX4', b: '—' },
  { label: '质保政策', a: '2 年', b: '2 年' },
  { label: '出品', a: 'huafire3d', b: 'huafire3d' },
];

export const COPY = {
  eyebrow: 'HUAFIRE 选品 · 双品对比',
  title: '并排看，才看得出差别。',
  subtitle: '两款产品同一角度同步旋转，所见即所得。打开「只看差异」，只看关键不同。',
  syncLabel: '同步旋转',
  diffOnlyLabel: '只看差异',
  loading: '正在载入 3D 模型…',
  loadError: '模型加载失败',
  retry: '重新加载',
  diffSummary: (d, s) => `${d} 处不同 · ${s} 处相同`,
  footnote: '* 参数为模板演示数据，接入时替换为真实 SKU 数据。模型由 huafire3d 资产库提供。',
};
