/* huafire3d fx-lab — original implementation
 * 程序化头像：canvas 绘制渐变 + 姓名首字母，不依赖任何外部图片。
 */
export function avatarURL(name, hue) {
  const s = 112;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d");

  // 底色：对角双色渐变
  const g = x.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, "hsl(" + hue[0] + ", 40%, 60%)");
  g.addColorStop(1, "hsl(" + hue[1] + ", 46%, 42%)");
  x.fillStyle = g;
  x.beginPath();
  x.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  x.fill();

  // 顶部高光，让圆头像有"球体"体积感
  const hi = x.createRadialGradient(s * 0.36, s * 0.3, s * 0.05, s * 0.36, s * 0.3, s * 0.55);
  hi.addColorStop(0, "rgba(255,255,255,.28)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = hi;
  x.beginPath();
  x.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  x.fill();

  // 底部内阴影，压住边缘
  const sh = x.createRadialGradient(s / 2, s / 2, s * 0.25, s / 2, s / 2, s / 2);
  sh.addColorStop(0, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(0,0,0,.20)");
  x.fillStyle = sh;
  x.beginPath();
  x.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  x.fill();

  // 首字母
  const initials = name
    .split(/\s+/)
    .map(function (w) { return w[0]; })
    .slice(0, 2)
    .join("")
    .toUpperCase();
  x.fillStyle = "rgba(255,255,255,.95)";
  x.font = "600 " + Math.round(s * 0.34) + "px Georgia, 'Times New Roman', serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(initials, s / 2, s / 2 + 2);

  return c.toDataURL("image/png");
}
