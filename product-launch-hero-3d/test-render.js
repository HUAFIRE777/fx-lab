// fx-lab render test: loads test-local.html via file:// with --allow-file-access-from-files,
// collects console errors + page errors, screenshots after N seconds.
const CHROME = '/opt/meta-chromium/chrome';
const { spawn } = require('child_process');
const WebSocket = require('ws');

const [, , url, out, waitSec] = process.argv;
const PORT = 19311 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, [
  '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  await sleep(7000);
  let targets = null;
  for (let i = 0; i < 10; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      break;
    } catch (e) { await sleep(1500); }
  }
  if (!targets) throw new Error('chrome devtools not reachable');
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let sid = 1; const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sid; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const errors = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errors.push('[console.error] ' + m.params.args.map(a => a.value || a.description || '').join(' '));
    } else if (m.method === 'Runtime.exceptionThrown') {
      errors.push('[exception] ' + (m.params.exceptionDetails.text || '') + ' ' +
        (m.params.exceptionDetails.exception?.description || ''));
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      errors.push('[log.error] ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    }
  };
  await send('Runtime.enable');
  await send('Log.enable');
  const isMob = process.env.MOBILE === '1';
  await send('Emulation.setDeviceMetricsOverride', { width: isMob ? 390 : 1280, height: isMob ? 844 : 800, deviceScaleFactor: 1, mobile: isMob });
  if (isMob) {
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  }
  await send('Page.enable');
  await send('Page.navigate', { url });
  try { await send('Page.loadEventFired'); } catch (e) {}
  await sleep((+waitSec || 8) * 1000);
  if (process.env.FX_EVAL) {
    try {
      await send('Runtime.evaluate', { expression: Buffer.from(process.env.FX_EVAL, 'base64').toString('utf8') });
    } catch (e) { errors.push('[eval] ' + String(e)); }
    await sleep((+process.env.FX_WAIT2 || 4) * 1000);
  }
  // probe WebGL state + fps text from the page
  let probe = {};
  try {
    const r = await send('Runtime.evaluate', { expression: `({
      fps: document.getElementById('fps')?.textContent,
      label: document.getElementById('scene-label')?.textContent,
      canvas: !!document.querySelector('#gl canvas'),
      gl: (() => { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch(e){ return false; } })()
    })`, returnByValue: true });
    probe = r.result.value;
  } catch (e) { probe.probeError = String(e); }
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  require('fs').writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('PROBE ' + JSON.stringify(probe));
  console.log('ERRORS ' + JSON.stringify(errors.slice(0, 20)));
  console.log('saved ' + out);
  ws.close(); chrome.kill();
  process.exit(0);
}
main().catch(e => { console.error('FATAL', e); chrome.kill(); process.exit(1); });
