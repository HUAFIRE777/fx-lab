// papercraft-3d 分块截图驱动（无头 SwiftShader 大窗口 OOM，故分块 + 独立进程）
import { spawn, execSync } from 'child_process';
import WebSocket from 'ws';
import fs from 'fs';
import os from 'os';
import http from 'http';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[tile]', ...a);
const WSPACE = '/home/hatch/workspace/fx-lab/papercraft-3d/hidden_files/test';

async function shoot(url, out, winW, winH, waitMs = 9000) {
  const PORT = 9460 + Math.floor(Math.random() * 2000);
  const prof = `${WSPACE}/prof-${process.pid}-${Date.now()}`;
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-sandbox', '--disable-dev-shm-usage',
    `--user-data-dir=${prof}`, '--enable-unsafe-swiftshader',
    'about:blank',
  ], { stdio: 'ignore' });
  try {
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        targets = await new Promise((res, rej) => {
          const req = http.get(`http://127.0.0.1:${PORT}/json/list`, r => {
            let d = ''; r.on('data', c => d += c);
            r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
          });
          req.on('error', rej); req.setTimeout(3000, () => { req.destroy(); rej(new Error('t')); });
        });
        if (targets && targets.length) break;
      } catch { /* retry */ }
      await sleep(500);
    }
    if (!targets || !targets.length) throw new Error('no targets');
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 512 * 1024 * 1024 });
    await new Promise((res, rej) => {
      ws.on('open', res); ws.on('error', rej);
      setTimeout(() => rej(new Error('ws timeout')), 10000);
    });
    let id = 0; const pending = new Map();
    const send = (method, params = {}) => new Promise((res, rej) => {
      const i = ++id; pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
      setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('cdp timeout ' + method)); } }, 25000);
    });
    const errors = [];
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return;
      }
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
        errors.push(m.params.args.map(a => a.value ?? '').join(' ').slice(0, 200));
      if (m.method === 'Runtime.exceptionThrown')
        errors.push('exc:' + JSON.stringify(m.params.exceptionDetails).slice(0, 200));
    });
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: winW, height: winH, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url });
    await sleep(waitMs);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    log('saved', out, 'errors:', errors.length, errors.slice(0, 3).join(' | '));
    ws.close();
  } finally {
    chrome.kill();
    await sleep(1200);
    try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
  }
}

const jobs = JSON.parse(process.argv[2]);
function cleanChrome() {
  try { execSync("pkill -9 -f 'meta-chromium/chrome --headles[s]' 2>/dev/null"); } catch {}
}
(async () => {
  for (const j of jobs) {
    cleanChrome(); await sleep(1500);
    try { await shoot(j.url, j.out, j.w, j.h, j.wait || 9000); }
    catch (e) { log('retry', j.out, e.message); cleanChrome(); await sleep(1500);
      await shoot(j.url, j.out, j.w, j.h, (j.wait || 9000) + 5000); }
  }
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
