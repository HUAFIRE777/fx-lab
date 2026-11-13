#!/usr/bin/env node
/**
 * huafire3d fx-lab — 画廊聚合器
 *
 * 扫描 fx-lab/ 下所有含 index.html 的子目录（每套独立模板），
 * 从 README 提取元信息，给缺截图的模板截首屏，最后生成画廊页 index.html。
 *
 * 用法：
 *   node tools/build-gallery.mjs              # 增量：只截缺失的截图，重新生成画廊
 *   node tools/build-gallery.mjs --force      # 全量重截所有截图
 *   node tools/build-gallery.mjs --only lusion,igloo   # 只处理指定模板（逗号分隔）
 *
 * 依赖：node + /tmp/hcshot/node_modules/ws（随 hcshot 工具链安装）
 *   NODE_PATH=/tmp/hcshot/node_modules node tools/build-gallery.mjs
 *
 * 注意：截图走 headless Chromium（/opt/meta-chromium/chrome），WebGL 用 SwiftShader
 * 软件渲染；R2 模型 URL 走 egress 代理（$https_proxy）加载，截图里 3D 模型正常显示。
 */
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// Chrome 155 强制要求 WebGL 域名策略，否则启动即退出（"Hatch WebGL domain policy is required"）。
// hcshot.js 已补同一对开关；生成器截图走同一 Chrome，必须跟上，否则 CDP 永远起不来。
function webglPolicyArgs() {
  try {
    const f = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
    const sum = createHash('sha256').update(readFileSync(f)).digest('hex');
    return [`--hatch-webgl-allowed-domains-file=${f}`, `--hatch-webgl-allowed-domains-sha256=${sum}`];
  } catch { return []; }
}

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SHOTS = join(ROOT, 'shots');
const CHROME = '/opt/meta-chromium/chrome';
const RAW_ARGS = process.argv.slice(2);
const ARGS = new Set(RAW_ARGS);
const FORCE = ARGS.has('--force');
const ONLY = (() => {
  const eq = RAW_ARGS.find(a => a.startsWith('--only='));
  if (eq) return eq.slice(7).split(',').filter(Boolean);
  const i = RAW_ARGS.indexOf('--only');
  if (i >= 0 && RAW_ARGS[i + 1]) return RAW_ARGS[i + 1].split(',').filter(Boolean);
  return [];
})();

// ws 随 hcshot 工具链安装在 /tmp（ESM 不认 NODE_PATH，这里用绝对路径兜底）
const _require = createRequire(import.meta.url);
function loadWs() {
  for (const p of ['/tmp/hcshot/node_modules/ws', `${process.env.HOME}/workspace/bin/node_modules/ws`]) {
    try { return _require(p); } catch {}
  }
  return _require('ws'); // 最后尝试常规解析
}
const WebSocket = loadWs();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- 分类
const CATS = [
  { id: 'page',      name: '整站落地页',   match: /^(saas-landing|store-home|launch-page|company-home|campaign-page|portfolio-page|restaurant-page|docs-home|realestate-page|car-ev-page|beauty-clinic-page|edu-academy-page|gym-page|hotel-page|wedding-photo-page|lawfirm-page|coffee-brand-page|travel-page|pet-page|jewelry-page|smarthome-page|jobs-page|bank-page|interior-page|baby-brand-page|eyewear-page|tea-brand-page|outdoor-page|instrument-page|logistics-page|insurance-page|cowork-page|cleaning-page|camera-page|resale-page|cloud-page|watch-brand-page|bike-page|ski-page|florist-page|dating-page|farmfresh-page|counseling-page|security-page|evcharge-page|salon-page|esports-page|kidspark-page|sportswear-page|campgear-page|scriptmurder-page|eldercare-page|wedding-plan-page|carwash-page|swim-page|craftbeer-page)$/ },
  { id: 'marketing', name: '营销落地',   match: /^(launch|pricing|landing|promo|countdown|cta|feature|testimonial|product-launch|teaser|lead)-/ },
  { id: 'ecommerce', name: '电商独立站', match: /^(product|collection|unboxing|cart|lookbook)-/ },
  { id: 'admin',     name: '管理系统',   match: /^(admin|ops)-/ },
  { id: 'company',   name: '公司介绍',   match: /^(company|team|culture|careers)-/ },
  { id: 'course',    name: '教程课件',   match: /^(lesson-steps|timeline-lesson|code-typing|whiteboard-derive|formula-derive|lab-experiment|quiz-check|flashcards)-/ },
  { id: 'lab',       name: '动效实验',   match: /.*/ },
];
const catOf = (name) => CATS.find(c => c.match.test(name));

// ---------------------------------------------------------------- premium（Pro/Max 分级，唯一事实来源 premium.json）
// 没有条目的模板一律按 premium=free、releaseAt=null 处理。不许把 premium 写死在代码里。
function loadPremium() {
  const p = join(ROOT, 'premium.json');
  if (!existsSync(p)) return {};
  try {
    const m = JSON.parse(readFileSync(p, 'utf8'));
    return m && typeof m === 'object' ? m : {};
  } catch { return {}; }
}

// ---------------------------------------------------------------- 发布日期（git 首次添加日期，供“最新”排序）
// release-dates.json 由 git log 生成；缺失或解析失败时返回 {}，不影响构建。
function loadReleaseDates() {
  const p = join(ROOT, 'release-dates.json');
  if (!existsSync(p)) return {};
  try {
    const m = JSON.parse(readFileSync(p, 'utf8'));
    return m && typeof m === 'object' ? m : {};
  } catch { return {}; }
}

// ---------------------------------------------------------------- README 解析（容错：各模板 README 格式不统一）
function parseReadme(dir, name) {
  const info = { title: pretty(name), desc: '模板生成中，README 待补充。', ref: '' };
  const p = join(dir, 'README.md');
  if (!existsSync(p)) return info;
  const md = readFileSync(p, 'utf8');

  const t = md.match(/^#\s+(.+?)\s*$/m);
  if (t) info.title = t[1].replace(/^huafire3d fx-lab\s*[—–\-–]\s*/i, '').replace(/\s*[（(]huafire3d fx-lab[）)]\s*$/i, '').trim();

  // 参考来源：优先 "inspired by X" / "复刻 X"，其次"参考"小节里第一个 **加粗站名**
  let r = md.match(/inspired by\s+([A-Za-z0-9][A-Za-z0-9.\-]*\.[a-z]{2,}|[A-Z][A-Za-z0-9]+)/i);
  if (!r) r = md.match(/复刻\s*([A-Za-z0-9][A-Za-z0-9.\-]*\.[a-z]{2,})/);
  if (r) {
    info.ref = r[1];
  } else {
    const sec = md.match(/##\s*参考[^]*?(?=\n## |\n?$)/);
    if (sec) {
      const b = sec[0].match(/\*\*([^*]{2,40}?)\*\*/);
      if (b) info.ref = b[1].trim();
    }
  }

  // 描述：标题之后第一个"像人话"的段落（跳过引用块里的版权行、代码围栏、HTML 注释）
  const lines = md.split('\n');
  let pastTitle = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!pastTitle) { if (/^#\s/.test(line)) pastTitle = true; continue; }
    if (!line) continue;
    if (/^#{1,6}\s/.test(line)) continue;
    if (/^>\s*`?huafire3d fx-lab/i.test(line)) continue;
    if (/^>/.test(line) && /(没有|未)(下载|复制)|原创|inspired/i.test(line)) continue;
    if (/^```/.test(line)) continue;
    if (/^<!--/.test(line)) continue;
    if (/^!\[|^</.test(line)) continue;
    if (/^[-*]\s/.test(line) && line.length < 24) continue;
    if (/^(打开方式|用法|构建|安装)/.test(line)) continue;
    info.desc = line.replace(/^[>]\s*/, '').replace(/`/g, '').slice(0, 120);
    break;
  }
  return info;
}

function pretty(name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ---------------------------------------------------------------- 扫描
function scan() {
  const found = [], pending = [];
  for (const e of readdirSync(ROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('.') || e.name === 'tools' || e.name === 'shots' || e.name === 'node_modules') continue;
    // 6 个"复刻"参考目录：只当视觉参考，不进销售画廊
    if (['lusion','locomotive','studiofreight','bruno-simon','igloo','active-theory'].includes(e.name)) continue;
    if (ONLY.length && !ONLY.includes(e.name)) continue;
    const dir = join(ROOT, e.name);
    if (existsSync(join(dir, 'index.html'))) found.push(e.name);
    else pending.push(e.name);
  }
  return { found: found.sort(), pending: pending.sort() };
}

// ---------------------------------------------------------------- 截图（CDP 直连，代理鉴权后 R2 模型可加载）
function proxyConf() {
  try {
    const u = new URL(process.env.https_proxy || process.env.HTTPS_PROXY || '');
    if (!u.hostname) return null;
    return { server: `http://${u.hostname}:${u.port || 3128}`, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) };
  } catch { return null; }
}

async function screenshot(name) {
  const url = pathToFileURL(join(ROOT, name, 'index.html')).href;
  const out = join(SHOTS, `${name}.png`);
  const proxy = proxyConf();
  const PORT = 19400 + Math.floor(Math.random() * 400);
  const UD = `/tmp/fxshot-${PORT}-${Date.now()}`;

  const chromeArgs = [
    '--headless', '--no-sandbox', '--hide-scrollbars',
    `--user-data-dir=${UD}`,
    '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests',
    `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
    ...webglPolicyArgs(),
    // R2 公网直连通畅（实测直连 200），走直连免代理鉴权；其余仍走代理
    '--proxy-bypass-list=*.r2.dev',
  ];
  if (proxy) chromeArgs.push(`--proxy-server=${proxy.server}`);
  chromeArgs.push('about:blank');

  const chrome = spawn(CHROME, chromeArgs, { stdio: 'ignore' });
  const wsUrlOf = async () => {
    for (let i = 0; i < 40; i++) {
      await sleep(400);
      try {
        const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
        const page = targets.find(t => t.type === 'page');
        if (page) return page.webSocketDebuggerUrl;
      } catch {}
    }
    throw new Error('chrome CDP 起不来（16s 无响应）');
  };

  try {
    const ws = new WebSocket(await wsUrlOf(), { maxPayload: 256 * 1024 * 1024 });
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let sid = 1; const pending = new Map();
    let r2Inflight = 0; // 进行中的 R2 中转请求数
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sid; pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
      // 首张截图时 SwiftShader 预热可能很慢（实测 27s），截图调用给足 120s
      const tmo = method === 'Page.captureScreenshot' ? 120000 : 30000;
      setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('CDP 超时：' + method)); } }, tmo);
    });
    ws.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data.toString()); } catch { return; }
      if (m.id && pending.has(m.id)) {
        const { resolve, reject } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      } else if (m.method === 'Fetch.requestPaused') {
        const url = m.params.request.url || '';
        if (/^https:\/\/pub-[a-z0-9-]+\.r2\.dev\//.test(url)) {
          // R2 公桶未配 CORS：Node 直取（R2 直连通畅），经 fulfillRequest 回填并注入 CORS 头
          r2Inflight++;
          (async () => {
            try {
              const resp = await fetch(url);
              if (!resp.ok) throw new Error('R2 返回 ' + resp.status);
              const buf = Buffer.from(await resp.arrayBuffer());
              await send('Fetch.fulfillRequest', {
                requestId: m.params.requestId,
                responseCode: 200,
                responseHeaders: [
                  { name: 'Access-Control-Allow-Origin', value: '*' },
                  { name: 'Content-Type', value: 'model/gltf-binary' },
                  { name: 'Content-Length', value: String(buf.length) },
                ],
                body: buf.toString('base64'),
              });
            } catch (e) {
              await send('Fetch.fulfillRequest', {
                requestId: m.params.requestId, responseCode: 502,
                responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }],
                body: Buffer.from('gallery screenshot proxy: ' + e.message).toString('base64'),
              }).catch(() => {});
            } finally {
              r2Inflight--;
            }
          })();
        } else {
          send('Fetch.continueRequest', { requestId: m.params.requestId }).catch(() => {});
        }
      }
    };

    // 只拦截 R2（注入 CORS），其余请求不碰；R2 直连故无需代理鉴权
    await send('Fetch.enable', { patterns: [{ urlPattern: '*pub-*.r2.dev*' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send('Page.enable');
    await send('Page.navigate', { url });
    try { await send('Page.loadEventFired'); } catch {}
    await sleep(10000); // WebGL 初始化
    // R2 模型中转慢（实测单个 3.8MB 需 ~15s）：等所有 R2 请求落定，最多再等 40s
    for (let i = 0; i < 20 && r2Inflight > 0; i++) await sleep(2000);
    await sleep(3000); // GLB 解析 + 首帧渲染
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(out, Buffer.from(data, 'base64'));
    ws.close();
    return { ok: true, bytes: statSync(out).size };
  } finally {
    chrome.kill('SIGKILL');
    try { rmSync(UD, { recursive: true, force: true }); } catch {}
  }
}

// ---------------------------------------------------------------- 画廊介绍（F11 静态化输入）
// tools/fxlab-gallery-intro.md 是构建输入（由 staging 的 fxlab-gallery-intro.md
// 拷入，内容一致）：首行 `# ` 为小标题，其余空行分段的段落逐段成 <p>。
// 构建时读不到该文件就直接失败，不许静默生成无介绍的画廊。
function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function loadGalleryIntro() {
  const p = join(ROOT, 'tools', 'fxlab-gallery-intro.md');
  const md = readFileSync(p, 'utf8');
  const lines = md.split('\n');
  let heading = '';
  const paras = [];
  let buf = [];
  const flush = () => {
    const t = buf.join(' ').trim();
    if (t) paras.push(t);
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('# ')) { flush(); heading = line.slice(2).trim(); continue; }
    if (!line) { flush(); continue; }
    buf.push(line);
  }
  flush();
  if (!heading || !paras.length) throw new Error('画廊介绍文件为空或格式不对：' + p);
  return { heading, paras };
}

// ---------------------------------------------------------------- 静态卡片（F11）
// 与页面内 JS card() 同构的服务端渲染：无 JS 时画廊也有全部卡片。
// JS 加载后 render() 会用同一数据重绘 #grid，静态卡片只是首屏/爬虫兜底。
function staticCard(i) {
  const catName = (CATS.find(c => c.id === i.cat.id) || {}).name || '';
  const tier = (i.releaseAt && Date.now() < new Date(i.releaseAt).getTime())
    ? 'MAX' : (i.premium || 'free').toUpperCase();
  const prem = tier === 'PRO' ? ' <span class="prem">Pro 专享</span>'
    : tier === 'MAX' ? ' <span class="prem">Max 专享</span>' : '';
  const inner = i.hasShot
    ? `<img loading="lazy" src="shots/${i.name}.png" alt="${escHtml(i.title)}">`
    : `<div class="t">截图生成中</div><div class="s">${i.name}</div>`;
  const cls = i.hasShot ? 'thumb' : 'thumb missing';
  const ref = i.ref ? `<span class="src">手法参考 · ${escHtml(i.ref)}</span>` : '<span class="src"></span>';
  const dl = tier === 'FREE'
    ? `<a class="dl" href="./zips/${i.name}.zip" download="${i.name}.zip" title="下载源码包">下载 ZIP</a>`
    : `<a class="dl" href="/pricing" title="订阅后下载">订阅 ${tier === 'PRO' ? 'Pro' : 'Max'} 下载</a>`;
  return `<div class="card">
    <a class="card-open" href="./${i.name}/index.html" target="_blank" rel="noopener">
    <div class="${cls}">${inner}<span class="cat-tag">${escHtml(catName)}</span></div>
    <div class="meta"><h3>${escHtml(i.title)}${prem}</h3><p>${escHtml(i.desc)}</p>
    <div class="ref">${ref}<span class="go">打开模板 →</span></div></div>
    </a>
    ${dl}
  </div>`;
}

// ---------------------------------------------------------------- 画廊页生成
function buildHtml(items) {
  const data = JSON.stringify(items.map(it => ({
    name: it.name, title: it.title, desc: it.desc, ref: it.ref,
    cat: it.cat.id, shot: `shots/${it.name}.png`, hasShot: it.hasShot,
    premium: it.premium, releaseAt: it.releaseAt,
  }))).replace(/<\//g, '<\\/');
  const cats = CATS.filter(c => items.some(i => i.cat.id === c.id));
  // F11：免费套数按 premium.json + releaseAt 实时算（4 套 Max 专属永不转免费，
  // "全部免费"是错的）；画廊介绍来自 tools/fxlab-gallery-intro.md。
  const freeCount = items.filter(i => {
    const tier = (i.releaseAt && Date.now() < new Date(i.releaseAt).getTime())
      ? 'MAX' : (i.premium || 'free').toUpperCase();
    return tier === 'FREE';
  }).length;
  const intro = loadGalleryIntro();
  const introHtml = `<section class="gallery-intro" aria-label="画廊介绍">\n`
    + `    <h2>${escHtml(intro.heading)}</h2>\n`
    + intro.paras.map(p => `    <p>${escHtml(p)}</p>`).join('\n') + `\n  </section>`;
  const staticCards = items.map(staticCard).join('\n    ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>huafire3d · fx-lab 模板库</title>
<!-- huafire3d fx-lab gallery — original implementation -->
<style>
  :root{
    --bg:#0a0a0c; --panel:#111114; --line:rgba(255,255,255,.08);
    --text:#ececef; --muted:#8f8f99; --faint:#5c5c66;
    --accent:#c9a25f; --accent-dim:rgba(201,162,95,.14);
    --radius:14px;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{background:var(--bg)}
  body{
    background:
      radial-gradient(1100px 500px at 50% -180px, rgba(201,162,95,.07), transparent 60%),
      var(--bg);
    color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
    -webkit-font-smoothing:antialiased; min-height:100vh;
  }
  .wrap{max-width:1240px;margin:0 auto;padding:0 28px}
  /* ---- 顶栏 ---- */
  header{padding:64px 0 8px}
  .kicker{font-size:12px;letter-spacing:.32em;color:var(--accent);text-transform:uppercase;margin-bottom:18px}
  h1{font-size:clamp(34px,5vw,54px);font-weight:650;letter-spacing:-.02em;line-height:1.08}
  h1 .thin{color:var(--muted);font-weight:400}
  .sub{margin-top:14px;color:var(--muted);font-size:15px;line-height:1.7;max-width:640px}
  .sub b{color:var(--text);font-weight:600}
  .free{display:inline-block;margin:16px 0 0;padding:9px 18px;border:1px solid #22c55e;color:#4ade80;border-radius:999px;font-size:13px}
  .free span{background:#22c55e;color:#04120a;font-weight:700;border-radius:4px;padding:2px 8px;margin-right:10px;font-size:11px;letter-spacing:.1em}
  .free .gh{color:#fff;border-bottom:1px solid rgba(255,255,255,.5);text-decoration:none;margin-left:6px}
  .free .gh:hover{color:#4ade80;border-color:#4ade80}
  /* ---- 画廊介绍（F11 静态段落） ---- */
  .gallery-intro{max-width:760px;padding:26px 0 6px}
  .gallery-intro h2{font-size:19px;font-weight:650;letter-spacing:-.01em;margin-bottom:12px}
  .gallery-intro p{color:var(--muted);font-size:15px;line-height:1.8;margin-bottom:12px}
  .card{position:relative}
  .card-open{display:block;text-decoration:none;color:inherit}
  .dl{position:absolute;top:12px;right:12px;z-index:2;font-size:12px;letter-spacing:.06em;background:rgba(8,8,10,.78);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.28);padding:7px 14px;border-radius:999px;opacity:0;transform:translateY(-4px);transition:opacity .2s,transform .2s,background .2s,color .2s;text-decoration:none}
  .card:hover .dl{opacity:1;transform:none}
  .card:focus-within .dl{opacity:1;transform:none}
  @media (hover:none){.card .dl{opacity:1;transform:none;font-size:13px;padding:10px 18px}}
  .dl:hover{background:#22c55e;border-color:#22c55e;color:#04120a}
  /* ---- 控制条 ---- */
  .controls{position:sticky;top:0;z-index:10;background:rgba(10,10,12,.86);backdrop-filter:blur(14px);
    border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:36px}
  .controls .wrap{display:flex;gap:14px;align-items:center;padding-top:14px;padding-bottom:14px;flex-wrap:wrap}
  .search{flex:1;min-width:200px;display:flex;align-items:center;gap:10px;background:var(--panel);
    border:1px solid var(--line);border-radius:10px;padding:10px 14px;transition:border-color .2s}
  .search:focus-within{border-color:rgba(201,162,95,.5)}
  .search svg{flex:none;opacity:.5}
  .search input{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:14px}
  .search input::placeholder{color:var(--faint)}
  .pills{display:flex;gap:8px;flex-wrap:wrap}
  .pill{border:1px solid var(--line);background:transparent;color:var(--muted);font-size:13px;
    padding:9px 16px;border-radius:999px;cursor:pointer;transition:all .18s;white-space:nowrap}
  .pill:hover{color:var(--text);border-color:rgba(255,255,255,.22)}
  .pill.on{background:var(--accent-dim);border-color:rgba(201,162,95,.55);color:var(--accent)}
  .pill .n{opacity:.55;font-size:12px;margin-left:6px}
  .count{margin-left:auto;font-size:13px;color:var(--faint);white-space:nowrap}
  .count b{color:var(--accent);font-weight:600}
  /* ---- 排序 tab ---- */
  .sort{display:flex;gap:6px}
  .sort button{border:1px solid var(--line);background:transparent;color:var(--muted);font-size:13px;
    padding:8px 14px;border-radius:999px;cursor:pointer;transition:all .18s;white-space:nowrap}
  .sort button:hover{color:var(--text);border-color:rgba(255,255,255,.22)}
  .sort button.on{background:var(--accent-dim);border-color:rgba(201,162,95,.55);color:var(--accent)}
  /* ---- 本周热门 ---- */
  #hot{padding-top:28px}
  #hot h2{font-size:19px;font-weight:650;letter-spacing:-.01em;margin-bottom:14px}
  #hot h2 span{color:var(--accent);font-size:13px;font-weight:500;margin-left:8px;letter-spacing:0}
  .hot-row{display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;scrollbar-width:thin}
  .hot-row .card{flex:0 0 340px;max-width:340px}
  @media(max-width:640px){ .hot-row .card{flex-basis:280px;max-width:280px} }
  /* ---- 卡片网格 ---- */
  main .wrap{padding-top:34px;padding-bottom:80px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:26px}
  .card{display:block;text-decoration:none;color:inherit;background:var(--panel);
    border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;
    transition:transform .25s cubic-bezier(.2,.7,.3,1),border-color .25s,box-shadow .25s}
  .card:hover{transform:translateY(-5px);border-color:rgba(201,162,95,.4);
    box-shadow:0 18px 44px -18px rgba(0,0,0,.7)}
  .thumb{aspect-ratio:16/10;background:#060607;overflow:hidden;position:relative}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block;
    transition:transform .5s cubic-bezier(.2,.7,.3,1);filter:saturate(.96)}
  .card:hover .thumb img{transform:scale(1.035)}
  .thumb.missing{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px}
  .thumb.missing .t{font-size:13px;color:var(--faint);letter-spacing:.08em}
  .thumb.missing .s{font-size:11px;color:#3d3d44}
  .cat-tag{position:absolute;top:12px;left:12px;font-size:11px;letter-spacing:.14em;
    background:rgba(10,10,12,.72);backdrop-filter:blur(8px);color:var(--accent);
    border:1px solid rgba(201,162,95,.3);padding:5px 11px;border-radius:999px}
  .meta{padding:18px 20px 20px}
  .meta h3{font-size:17px;font-weight:600;letter-spacing:-.01em;margin-bottom:8px}
  .meta h3 .prem{font-size:12px;color:var(--accent);font-weight:500;margin-left:8px;letter-spacing:.02em;white-space:nowrap}
  .meta p{font-size:13.5px;color:var(--muted);line-height:1.65;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:44px}
  .ref{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);
    font-size:12px;color:var(--faint);display:flex;justify-content:space-between;align-items:center}
  .ref .src{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%}
  .ref .go{color:var(--accent);opacity:0;transition:opacity .2s;font-size:12px;letter-spacing:.06em}
  .card:hover .ref .go{opacity:1}
  .empty{grid-column:1/-1;text-align:center;padding:70px 0;color:var(--faint);font-size:14px;display:none}
  /* ---- 页脚 ---- */
  footer{border-top:1px solid var(--line);padding:26px 0 40px;color:var(--faint);font-size:12.5px}
  footer .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
  footer code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);font-size:12px}
  @media(max-width:640px){ .grid{grid-template-columns:1fr} header{padding-top:44px} .count{display:none} }
  @media(prefers-reduced-motion:reduce){ *{transition:none!important} }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <div class="kicker">huafire3d · fx-lab</div>
    <h1>Web 3D 动效模板库 <span class="thin">/ ${items.length} 套</span></h1>
    <p class="sub">每套都是可直接商用的独立页面：<b>开箱即用</b>、零外部依赖、参数集中可配。点击任意卡片在新窗口打开 live 模板。</p>
    <p class="free"><span>FREE</span>${freeCount} 套免费 · MIT 协议，可商用、可修改、可转售 <a class="gh" href="https://github.com/HUAFIRE777/fx-lab" target="_blank" rel="noopener">GitHub 开源仓库</a></p>
  </div>
</header>

<div class="controls">
  <div class="wrap">
    <label class="search">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input id="q" type="text" placeholder="搜索模板…（按 / 快速聚焦）" autocomplete="off">
    </label>
    <nav class="pills" id="pills"></nav>
    <nav class="sort" id="sort" aria-label="排序">
      <button type="button" data-sort="hot">热门</button>
      <button type="button" data-sort="recent">最新</button>
      <button type="button" data-sort="default" class="on">默认</button>
    </nav>
    <div class="count" id="count"></div>
  </div>
</div>

<main>
  <div class="wrap">
${introHtml}
    <section id="hot" hidden>
      <h2>本周热门 <span>精选推荐</span></h2>
      <div class="hot-row" id="hotRow"></div>
    </section>
    <div class="grid" id="grid">${staticCards}</div>
    <div class="empty" id="empty">没有匹配的模板，换个关键词试试。</div>
  </div>
</main>

<footer>
  <div class="wrap">
    <span>fx-lab · 模板持续增加中</span>
    <span>增量更新 <code>node tools/build-gallery.mjs</code> · 生成于 ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</span>
  </div>
</footer>

<script>
const ITEMS = ${data};
const CATS = ${JSON.stringify(cats.map(c => ({ id: c.id, name: c.name })))};
const $ = s => document.querySelector(s);
let cat = 'all', q = '', sort = 'default';
// ---- 热门排序：编辑精选（editorial），不是真实下载量——目前没有下载统计，
// 勿在界面上标下载数。顺序：首页主推 8 套 → 4 套 Max 专享 → 其余精选。
const FEATURED = ['aurora-3d','gpu-fluid-3d','particle-morph-3d','observatory-3d','waterfall-3d','admin-dashboard-3d','drive-world-3d','lusion-scroll-3d','crystal-prism-3d','liquid-chrome-3d','nebula-drift-3d','solar-storm-3d','flame-3d','balloon-sky-3d','bonsai-3d','windmill-3d','wormhole-3d','volcano-3d','saas-landing','portfolio-page','company-home'];
const HOT_TOP = 6; // 本周热门行显示前 6 套

// ---- 订阅档位：只影响下载按钮显示，放行只在后端下载口（I4）。接口不通/未登录一律按 FREE。
let tier = 'FREE';
const RANK = { FREE: 0, PRO: 1, MAX: 2 };
function reqTier(i){
  if (i.releaseAt && Date.now() < new Date(i.releaseAt).getTime()) return 'MAX';
  return (i.premium || 'free').toUpperCase();
}
function premLabel(i){
  const r = reqTier(i);
  if (r === 'PRO') return ' <span class="prem">Pro 专享</span>';
  if (r === 'MAX') return ' <span class="prem">Max 专享</span>';
  return '';
}
function dlButton(i){
  const r = reqTier(i);
  if (r === 'FREE') return \`<a class="dl" href="./zips/\${i.name}.zip" download="\${i.name}.zip" title="下载源码包">下载 ZIP</a>\`;
  if (RANK[tier] >= RANK[r]) return \`<a class="dl" href="/api/fxlab/\${i.name}/download" download="\${i.name}.zip" title="下载源码包">下载 ZIP</a>\`;
  if (i.premium === 'pro' && i.releaseAt && Date.now() < new Date(i.releaseAt).getTime() && tier === 'PRO') {
    return \`<a class="dl" href="/pricing" title="订阅后下载">Max 用户提前下载，\${String(i.releaseAt).slice(0, 10)} 后开放</a>\`;
  }
  const need = r === 'PRO' ? 'Pro' : 'Max';
  return \`<a class="dl" href="/pricing" title="订阅后下载">订阅 \${need} 下载</a>\`;
}
fetch('/api/subscriptions')
  .then(r => r.ok ? r.json() : null)
  .then(j => {
    const p = j && j.data && j.data.active !== false ? j.data.plan : null;
    if (p === 'PRO' || p === 'MAX') { tier = p; render(); }
  })
  .catch(() => {});

const pills = $('#pills'), grid = $('#grid'), count = $('#count'), empty = $('#empty'), input = $('#q');

function renderPills(){
  const n = id => id === 'all' ? ITEMS.length : ITEMS.filter(i => i.cat === id).length;
  pills.innerHTML = [{id:'all',name:'全部'}].concat(CATS).map(c =>
    \`<button class="pill\${cat===c.id?' on':''}" data-cat="\${c.id}">\${c.name}<span class="n">\${n(c.id)}</span></button>\`
  ).join('');
  pills.querySelectorAll('.pill').forEach(b => b.onclick = () => { cat = b.dataset.cat; render(); });
}

function card(i){
  const inner = i.hasShot
    ? \`<img loading="lazy" src="\${i.shot}" alt="\${i.title}">\`
    : \`<div class="t">截图生成中</div><div class="s">\${i.name}</div>\`;
  const cls = i.hasShot ? 'thumb' : 'thumb missing';
  const catName = (CATS.find(c => c.id === i.cat) || {}).name || '';
  const ref = i.ref ? \`<span class="src">手法参考 · \${i.ref}</span>\` : '<span class="src"></span>';
  return \`<div class="card">
    <a class="card-open" href="./\${i.name}/index.html" target="_blank" rel="noopener">
    <div class="\${cls}">\${inner}<span class="cat-tag">\${catName}</span></div>
    <div class="meta"><h3>\${i.title}\${premLabel(i)}</h3><p>\${i.desc}</p>
    <div class="ref">\${ref}<span class="go">打开模板 →</span></div></div>
    </a>
    \${dlButton(i)}
  </div>\`;
}

function matchKw(i, kw){
  return !kw || (i.title + ' ' + i.desc + ' ' + i.name + ' ' + i.ref).toLowerCase().includes(kw);
}
function sortList(list){
  if (sort === 'hot') {
    const rank = new Map(FEATURED.map((n, i) => [n, i]));
    return list.slice().sort((a, b) => {
      const ra = rank.has(a.name) ? rank.get(a.name) : 1e6;
      const rb = rank.has(b.name) ? rank.get(b.name) : 1e6;
      return ra - rb;
    });
  }
  if (sort === 'recent') {
    return list.slice().sort((a, b) => {
      const ta = a.releaseAt ? new Date(a.releaseAt).getTime() : 0;
      const tb = b.releaseAt ? new Date(b.releaseAt).getTime() : 0;
      return tb - ta;
    });
  }
  return list; // 默认：ITEMS 原顺序
}

function render(){
  renderPills();
  const kw = q.trim().toLowerCase();
  const list = sortList(ITEMS.filter(i =>
    (cat === 'all' || i.cat === cat) && matchKw(i, kw)));
  grid.innerHTML = list.map(card).join('');
  empty.style.display = list.length ? 'none' : 'block';
  count.innerHTML = \`共 <b>\${list.length}</b> 套\`;
  // 本周热门行：FEATURED 前 6 套，服从分类 + 搜索；无匹配时隐藏
  const hot = FEATURED.map(n => ITEMS.find(i => i.name === n)).filter(Boolean)
    .filter(i => (cat === 'all' || i.cat === cat) && matchKw(i, kw))
    .slice(0, HOT_TOP);
  const hotSec = $('#hot');
  if (hot.length) {
    hotSec.hidden = false;
    $('#hotRow').innerHTML = hot.map(card).join('');
  } else {
    hotSec.hidden = true;
    $('#hotRow').innerHTML = '';
  }
}

document.querySelectorAll('#sort button').forEach(b => b.onclick = () => {
  sort = b.dataset.sort;
  document.querySelectorAll('#sort button').forEach(x => x.classList.toggle('on', x === b));
  render();
});

input.addEventListener('input', e => { q = e.target.value; render(); });
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
});
render();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------- 主流程
async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const { found, pending } = scan();
  const premiumMap = loadPremium();
  const releaseMap = loadReleaseDates();
  console.log(`扫描到 ${found.length} 套已完成模板${pending.length ? `，${pending.length} 套生成中（${pending.join(', ')}）` : ''}`);

  const items = [];
  const shotFails = [];
  for (const name of found) {
    const info = parseReadme(join(ROOT, name), name);
    const shotPath = join(SHOTS, `${name}.png`);
    let hasShot = existsSync(shotPath) && !FORCE;
    if (!hasShot) {
      process.stdout.write(`截图 ${name} … `);
      try {
        const r = await screenshot(name);
        hasShot = true;
        console.log(`OK (${Math.round(r.bytes / 1024)}KB)`);
      } catch (e1) {
        // 偶发 CDP 启动失败：等 3s 重试一次
        await sleep(3000);
        try {
          const r = await screenshot(name);
          hasShot = true;
          console.log(`OK(重试) (${Math.round(r.bytes / 1024)}KB)`);
        } catch (e2) {
          shotFails.push(`${name}: ${e2.message}`);
          console.log(`失败：${e2.message}`);
        }
      }
    }
    const pe = premiumMap[name] || {};
    // releaseAt：premium.json 有字符串时优先（新品提前开放窗口），否则用 git 首次添加日期
    const rel = typeof pe.releaseAt === 'string' ? pe.releaseAt
      : (typeof releaseMap[name] === 'string' ? releaseMap[name] : null);
    items.push({ name, ...info, cat: catOf(name), hasShot,
      premium: pe.premium === 'pro' || pe.premium === 'max' ? pe.premium : 'free',
      releaseAt: rel });
  }

  const html = buildHtml(items);
  writeFileSync(join(ROOT, 'index.html'), html);
  console.log(`\n画廊已生成：fx-lab/index.html（${items.length} 套）`);

  if (pending.length) console.log(`\n[待处理] 生成中的模板（下次运行自动收录）：${pending.join(', ')}`);
  if (shotFails.length) console.log(`[截图失败] 下次运行会自动重试：\n  - ${shotFails.join('\n  - ')}`);
  console.log('\n完成。');
}

main().catch(e => { console.error('构建失败：', e.message); process.exit(1); });
