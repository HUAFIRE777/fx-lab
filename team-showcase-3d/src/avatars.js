/* huafire3d fx-lab — original implementation
 * 程序化几何头像：canvas 绘制渐变 + 几何装饰 + 姓名首字，无外部图片。 */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function makeAvatar(name, color, size = 256) {
  const rnd = mulberry32(hashStr(name));
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");

  // 背景渐变
  const g = x.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, shade(color, -70));
  g.addColorStop(1, shade(color, 10));
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);

  // 几何装饰：圆环 / 圆点 / 斜线（用名字做随机种子，保证同一人永远同一张）
  x.strokeStyle = "rgba(255,255,255,0.28)";
  x.fillStyle = "rgba(255,255,255,0.16)";
  for (let i = 0; i < 3; i++) {
    const r = size * (0.12 + rnd() * 0.3);
    const cx = rnd() * size, cy = rnd() * size;
    x.lineWidth = 2 + rnd() * 5;
    x.beginPath(); x.arc(cx, cy, r, rnd() * 6.28, rnd() * 6.28 + 2 + rnd() * 3); x.stroke();
  }
  for (let i = 0; i < 5; i++) {
    x.beginPath(); x.arc(rnd() * size, rnd() * size, 3 + rnd() * 9, 0, 6.29); x.fill();
  }
  x.save();
  x.translate(size / 2, size / 2); x.rotate(-0.5);
  x.fillStyle = "rgba(255,255,255,0.10)";
  for (let i = -3; i <= 3; i++) x.fillRect(i * 34, -size, 12, size * 2);
  x.restore();

  // 首字
  x.fillStyle = "rgba(255,255,255,0.96)";
  x.font = `700 ${size * 0.42}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(name[0], size / 2, size * 0.54);

  return c.toDataURL("image/png");
}
