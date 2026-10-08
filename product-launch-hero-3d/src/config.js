/* huafire3d fx-lab — original implementation */
export const CONFIG = {
  // 3D product model. NOTE (2026-10-05): the brief's watch URL 404s on R2
  // (only the headphone has been uploaded so far); using the verified one.
  // Swap to any GLB by changing this single line.
  modelUrl: 'https://pub-5e390bef91b24ffe9036eedac2f9c382.r2.dev/models-web/hero/electronics/tripo_headphone.glb',

  brand: 'AURELIA',
  eyebrow: 'Introducing',
  product: 'Aria One',
  tagline: 'Silence, engineered.',
  sub: 'Our first flagship. 40\u2009mm beryllium drivers, adaptive silence, 58 hours of listening.',
  price: 'From $349',
  ctaPrimary: 'Pre-order',
  ctaSecondary: 'Watch the film',

  // Spec chips that pop in around the product during phase 3.
  // Anchors are resolved from the model's bounding box at load time,
  // so they work for any swapped-in model.
  callouts: [
    { title: '\u221248\u2009dB adaptive ANC', sub: 'Two chips. Zero noise.', side: 'left' },
    { title: '40\u2009mm beryllium drivers', sub: 'Studio sound, on the move.', side: 'right' },
    { title: '58-hour battery', sub: 'A month of commutes.', side: 'top' },
  ],

  // Keynote timeline, seconds per phase. Total = sum.
  timeline: {
    black: 1.0,      // pure black hold
    spotlight: 1.4,  // beam fades in, dust drifts
    reveal: 2.2,     // product rises + rotates in, headline reveals
    callouts: 2.0,   // spec chips pop, CTA fades up
  },

  // Palette: exactly 3 colors. bg / warm white / amber accent.
  colors: {
    bg: 0x050507,
    text: '#f5f1e8',
    accent: '#ffb35c',
  },

  idleSpin: 0.16,          // rad/s after the show
  floatAmp: 0.045,         // gentle hover, scene units
  modelTargetSize: 2.4,    // normalize any model to this max dimension

  quality: {
    desktopPixelRatio: 2.0,
    mobilePixelRatio: 1.5,
    dustDesktop: 240,
    dustMobile: 120,
  },
};
