/* huafire3d fx-lab — original implementation */
/* company-hero-3d · 全站可配参数：换一家公司，只改这里 */
export const CONFIG = {
  brand: {
    name: 'STELLARCRAFT',
    cn: '星核工坊',
    tagline: 'SPATIAL COMPUTING STUDIO',
  },
  nav: [
    { label: '作品', href: '#work' },
    { label: '能力', href: '#capabilities' },
    { label: '联系', href: '#contact' },
  ],
  navCta: { label: '预约演示', href: '#contact' },

  eyebrow: 'SPATIAL COMPUTING STUDIO · EST. 2021',
  /* 每行一个字符串，可用 <em> 包裹需要 accent 色的词 */
  titleLines: ['We turn ideas', 'into <em>places.</em>'],
  sub: '星核是一家空间计算工作室——为产品、展览与品牌，把故事装进可以走进去的 3D 世界。',
  ctas: [
    { label: '预约演示', href: '#contact', primary: true },
    { label: '观看作品', href: '#work', primary: false },
  ],
  scrollHint: '向下滚动',

  /* 定死三色：墨底 / 雾白 / 信号紫，全页只用它们 */
  palette: {
    bg: '#060913',
    bgSoft: '#0a0f1c',
    ink: '#e9edf5',
    inkDim: 'rgba(233,237,245,0.62)',
    accent: '#7c6cff',
  },

  /* hero 右侧真实 3D 产品点缀（R2 外链，打包时保持不动） */
  model: {
    url: 'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb',
    label: '耳机 · Tripo 生成样机',
    position: [2.05, 0.12, -0.4],
    targetHeight: 1.75,
    mobile: { position: [1.15, 1.55, -1.2], targetHeight: 0.85 },
  },

  /* 粒子星云参数 */
  particles: {
    stars: 2400,
    nebula: 380,
    starsMobile: 1100,
    nebulaMobile: 170,
    starSize: 4.6,
    nebulaSize: 15.0,
    starOpacity: 0.45,
    nebulaOpacity: 0.12,
    /* 粒子三色：冷白星 / 信号紫雾 / 极淡暖尘（低饱和，不抢戏） */
    colA: '#cdd8f2',
    colB: '#7c6cff',
    colC: '#d8b48f',
  },

  capabilities: [
    { no: '01', title: '产品 3D 化', desc: '把商品变成可旋转、可配置、可走进的实时 3D。' },
    { no: '02', title: '空间叙事', desc: '用滚动与镜头语言，把品牌故事讲成一段旅程。' },
    { no: '03', title: '实时渲染管线', desc: '从模型减面到 R2 分发，一套管线全包。' },
  ],

  footer: {
    note: '© 2026 Stellarcraft Studio · 本页为 huafire3d 模板演示',
    backTop: '回到顶部',
  },
};
