// huafire3d fx-lab — original implementation · lab-experiment-3d
// 光学常量 + 成像结论文案（真实物理）
export const F = 1.0;            // 焦距（单位）
export const CANDLE_X = -3.4;    // 蜡烛固定位置
export const AXIS_Y = 2.1;       // 主光轴高度
export const H_OBJ = 0.85;       // 物高（烛焰顶到光轴）
export const U_MIN = 0.35;       // 物距滑杆下限（×f）
export const U_MAX = 3.4;        // 物距滑杆上限（×f）
export const U_DEFAULT = 2.6;
export const RAIL_END = 4.35;    // 光屏最右停靠
export const V_FOLLOW_MAX = 5.0; // 像距超过此值光屏跟不上

export const BLUE = 0x2563eb;
export const CYAN = 0x22d3ee;
export const INK = 0x16222e;

// 成像结论：[标题, 描述, 徽标文字, 徽标样式类]
export function conclude(u) {
  const f = F;
  if (Math.abs(u - f) <= 0.015) {
    return ['不 成 像', '物距恰好等于焦距：折射光线互相平行，永远不会相交——光屏上什么也接不到。', '不成像', 'none'];
  }
  if (u < f) {
    return ['正立 · 放大 · 虚像', '物距小于焦距，折射光线向外发散；反向延长线在透镜同侧相交——眼睛能看到正立放大的像，但光屏接不到。', '虚像', 'virtual'];
  }
  if (Math.abs(u - 2 * f) <= 0.02) {
    return ['倒立 · 等大 · 实像', '物距等于二倍焦距，像距也等于二倍焦距，像和烛焰一样大，倒立。', '实像', ''];
  }
  if (u > 2 * f) {
    return ['倒立 · 缩小 · 实像', '物距大于二倍焦距，像距在一二倍焦距之间，像落在光屏上，倒立缩小——照相机就是这个原理。', '实像', ''];
  }
  return ['倒立 · 放大 · 实像', '物距在一二倍焦距之间，像距大于二倍焦距，倒立放大——投影仪、幻灯机就是这个原理。', '实像', ''];
}

// 薄透镜成像：返回 { type: 'real'|'virtual'|'none', v, m }
export function imageOf(u) {
  const f = F;
  if (Math.abs(u - f) <= 0.015) return { type: 'none', v: Infinity, m: 0 };
  const v = 1 / (1 / f - 1 / u);
  return { type: v > 0 ? 'real' : 'virtual', v, m: Math.abs(v) / u };
}
