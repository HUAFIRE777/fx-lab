// huafire3d fx-lab — original implementation · formula-derive-3d
// 推导文案：等差数列求和 S = n(a₁+aₙ)/2，四步。公式用 HTML 手排（frac/sub），无外链。
export const STEPS = [
  {
    numeral: '一',
    tag: '第一步 · 摊开',
    fx: 'S = a<sub>1</sub> + a<sub>2</sub> + a<sub>3</sub> + ⋯ + a<sub>n</sub>',
    note: '先把要求和的 n 个数，一个一个摆出来。S 就是它们全部加起来的总和——先别急着算，看清楚长什么样。',
    figNo: '图一',
    figTitle: '数列柱',
    figDesc: '8 个数，一根比一根高',
  },
  {
    numeral: '二',
    tag: '第二步 · 倒序',
    fx: 'S = a<sub>n</sub> + a<sub>n−1</sub> + ⋯ + a<sub>3</sub> + a<sub>2</sub> + a<sub>1</sub>',
    note: '高斯小时候的灵机一动：把同一串数倒过来再抄一遍。加法不怕换顺序，两行的 S 是同一个 S。',
    figNo: '图二',
    figTitle: '倒过来',
    figDesc: '同一串数，反向再摆一遍',
  },
  {
    numeral: '三',
    tag: '第三步 · 配对',
    fx: '2S = (a<sub>1</sub>+a<sub>n</sub>) + (a<sub>2</sub>+a<sub>n−1</sub>) + ⋯',
    note: '上下两行逐项相加：a₁ 配 aₙ，a₂ 配 aₙ₋₁……每一对的和都相等，一共 n 对——这就叫「倒序相加」。',
    figNo: '图三',
    figTitle: '配成对',
    figDesc: '首尾相配，每对一样高',
  },
  {
    numeral: '四',
    tag: '第四步 · 取半',
    fx: 'S = <span class="frac"><span class="fn">n(a<sub>1</sub>+a<sub>n</sub>)</span><span class="fd">2</span></span>',
    note: '2S 等于 n 个 (a₁+aₙ)，两边除以 2，公式就出来了。记住一句话：首项加末项，乘以项数，除以 2。',
    figNo: '图四',
    figTitle: '取一半',
    figDesc: '矩形的一半，就是 S',
  },
];

export const INK = 0x1a1a1a;
export const VERM = 0xe5484d;
export const PAPER_LINE = 0xd8d4c8;
export const N_BARS = 8;      // 演示用项数
export const UNIT = 0.42;     // 每单位差对应的柱高
