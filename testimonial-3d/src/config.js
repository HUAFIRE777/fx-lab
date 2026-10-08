/* huafire3d fx-lab — original implementation
 * 全部可调参数集中在这里。换文案 / 换人 / 换节奏，只改这个文件。
 */
export const CONFIG = {
  autoplayMs: 5500,        // 自动轮播间隔（毫秒）；0 = 关闭自动轮播
  sidePeek: true,          // 是否显示两侧纵深卡片

  testimonials: [
    {
      quote: "We replaced our homepage hero with their 3D template on a Friday afternoon. By Monday, demo bookings were up 31%. I keep waiting for the catch — there isn't one.",
      name: "Maya Chen",
      role: "Founder",
      company: "Northwind",
      rating: 5,
      hue: [16, 38],
    },
    {
      quote: "The configurator paid for itself in a week. Customers spin the product, change the finish, and the price updates live. Returns on configured orders dropped by half.",
      name: "Jonas Weber",
      role: "Product Lead",
      company: "Vantage",
      rating: 5,
      hue: [212, 258],
    },
    {
      quote: "I'm picky about motion. Most template animation feels like a screensaver — this feels considered. The easing, the restraint. Our brand team approved it in one review.",
      name: "Priya Nair",
      role: "Design Director",
      company: "Fieldnote",
      rating: 5,
      hue: [328, 292],
    },
    {
      quote: "Cleanest template code I've bought. One CONFIG object, no dependency soup, and the single-file build actually works offline. I had it in our pipeline within the hour.",
      name: "Tom Okafor",
      role: "Frontend Engineer",
      company: "Kiln",
      rating: 4,
      hue: [152, 192],
    },
    {
      quote: "We A/B tested the testimonial wall against our old logo slider. Time on page went up 42 seconds. Forty-two seconds — on a testimonials section.",
      name: "Sofia Marchetti",
      role: "CMO",
      company: "Loomly",
      rating: 5,
      hue: [266, 214],
    },
    {
      quote: "We ship client sites with these as the starting point now. It used to take three weeks to reach this level of polish. Now it's the first draft, not the finish line.",
      name: "Daniel Reyes",
      role: "Principal",
      company: "Osmo Studio",
      rating: 5,
      hue: [22, 342],
    },
  ],

  // 文字 logo 墙：纯文本 wordmark，样式由 CSS 类区分，避免图片依赖
  logos: [
    { text: "NORTHWIND", cls: "wm-spaced" },
    { text: "Vantage", cls: "wm-serif" },
    { text: "FIELDNOTE", cls: "wm-bold" },
    { text: "loomly", cls: "wm-round" },
    { text: "Kiln&Co", cls: "wm-serif-it" },
    { text: "OSMO", cls: "wm-mono" },
    { text: "Papertrail", cls: "wm-serif" },
    { text: "HELIX", cls: "wm-spaced" },
  ],

  stats: [
    { value: "4.9", label: "average rating" },
    { value: "2,400+", label: "teams shipping" },
    { value: "38", label: "countries" },
  ],
};
