#!/usr/bin/env node
/*
  Tanıtım videosu kaydedici (60 fps, 1920x1080)
  ---------------------------------------------
  Sitenin tüm bölümlerini ve 6 dili gezen bir video çeker.
  Sayfanın saati "sanal" olarak kare kare ilerletilir; bu yüzden bilgisayar
  ne kadar yavaş olursa olsun video tam 60 fps ve takılmasız çıkar.

  Gerekenler: Google Chrome, ffmpeg, site http://localhost:5173 adresinde açık.
  Kullanım:   node tools/tanitim-videosu.mjs [çıktı.mp4] [--kisa]
*/
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const SHORT = args.includes('--kisa');
const OUT = path.resolve(args.find(a => !a.startsWith('--')) || 'belgeler/KAR-DEF-Site-Tanitim-60fps.mp4');
const URL_ = process.env.SITE_URL || 'http://localhost:5173/';
const W = 1920, H = 1080, FPS = 60, DT = 1000 / FPS, PORT = 9333;
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find(p => existsSync(p));
if (!CHROME) { console.error('Chrome bulunamadı'); process.exit(1); }

/* ---------- Sayfaya enjekte edilen sanal saat ---------- */
const INIT = `(() => {
  let now = 0;
  const base = performance.now();
  const dateBase = Date.now();
  performance.now = () => base + now;
  Date.now = () => dateBase + now;
  let tid = 1; const timers = new Map();
  window.setTimeout = (fn, ms, ...a) => { const id = tid++; timers.set(id, { fn, at: now + Math.max(0, +ms || 0), a, every: 0 }); return id; };
  window.setInterval = (fn, ms, ...a) => { const id = tid++; const e = Math.max(1, +ms || 1); timers.set(id, { fn, at: now + e, a, every: e }); return id; };
  window.clearTimeout = window.clearInterval = id => timers.delete(id);
  let rid = 1; let rafs = new Map();
  window.requestAnimationFrame = fn => { const id = rid++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = id => rafs.delete(id);
  const started = new WeakMap(); const done = new WeakSet();
  function sync() {
    for (const a of document.getAnimations()) {
      if (done.has(a)) continue;
      let st = started.get(a);
      if (st === undefined) { st = now; started.set(a, st); try { a.pause(); } catch (e) {} }
      const t = (now - st) * (a.playbackRate || 1);
      const end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
      if (isFinite(end) && t >= end) { done.add(a); try { a.finish(); } catch (e) {} }
      else { try { a.currentTime = t; } catch (e) {} }
    }
  }
  window.__vt = {
    step(ms) {
      const target = now + ms;
      for (;;) {
        let id = null, best = null;
        for (const [k, v] of timers) if (v.at <= target && (!best || v.at < best.at)) { id = k; best = v; }
        if (!best) break;
        now = Math.max(now, best.at);
        if (best.every) best.at += best.every; else timers.delete(id);
        try { typeof best.fn === 'function' ? best.fn(...best.a) : (0, eval)(best.fn); } catch (e) { console.error(e); }
      }
      now = target;
      const cbs = rafs; rafs = new Map();
      for (const fn of cbs.values()) { try { fn(base + now); } catch (e) { console.error(e); } }
      sync();
    }
  };
  // Video için imleç ve alt yazı
  const css = 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}'
    + '#__cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform-origin:3px 2px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}'
    + '#__cur.down{transform:var(--p) scale(.82)}'
    + '#__cap{position:fixed;left:50%;bottom:36px;z-index:2147483646;pointer-events:none;transform:translate(-50%,16px);opacity:0;'
    + 'background:rgba(18,18,18,.86);color:#fff;font:600 22px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:-.01em;'
    + 'padding:13px 22px 14px;border-radius:999px;transition:opacity .35s ease,transform .5s cubic-bezier(.16,1,.3,1);white-space:nowrap}'
    + '#__cap.on{opacity:1;transform:translate(-50%,0)}#__cap b{color:#FF7A7F;font-weight:700}';
  addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l17 9.5-7.6 1.6L9 20.5z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const p = document.createElement('div'); p.id = '__cap'; document.body.appendChild(p);
  });
  window.__cursor = (x, y, down) => { const c = document.getElementById('__cur'); if (!c) return; const t = 'translate(' + x + 'px,' + y + 'px)'; c.style.setProperty('--p', t); c.style.transform = down ? t + ' scale(.82)' : t; };
  window.__caption = html => { const p = document.getElementById('__cap'); if (!p) return; if (html) { p.innerHTML = html; p.classList.add('on'); } else p.classList.remove('on'); };
})();`;

/* ---------- Chrome + CDP ---------- */
const profile = mkdtempSync(path.join(tmpdir(), 'kardef-video-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1',
  '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', 'about:blank'
], { stdio: 'ignore' });

async function pageWs() {
  for (let i = 0; i < 100; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
      const p = list.find(t => t.type === 'page');
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Chrome bağlantısı kurulamadı');
}
const ws = new WebSocket(await pageWs());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let mid = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown') console.error('Sayfa hatası:', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') console.error('Sayfa:', m.params.args.map(a => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++mid; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: INIT });
await send('Page.navigate', { url: URL_ });
// Yazı tipleri ve görseller gerçek zamanda yüklensin; sanal saat bu sırada durur.
for (let i = 0; i < 100; i++) {
  const ok = await ev(`document.readyState === 'complete' && !!window.__vt && !!window.__lenis`).catch(() => false);
  if (ok) break;
  await new Promise(r => setTimeout(r, 150));
}
// "loading=lazy" görseller kaydırılmadan yüklenmez; önceden yüklensin, en fazla 15 sn beklensin.
// (Sayfadaki setTimeout sanal saate bağlı olduğundan süre sınırı Node tarafında.)
await Promise.race([
  ev(`document.fonts.ready.then(() => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => 0); })))`),
  new Promise(r => setTimeout(r, 15000))
]);
console.log('Sayfa hazır, kayıt başlıyor...');

/* ---------- ffmpeg ---------- */
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', OUT],
  { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise(r => ff.on('close', r));

let frames = 0;
const t0 = Date.now();
async function frame() {
  await ev(`__vt.step(${DT})`);
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
  const buf = Buffer.from(data, 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  frames++;
  if (frames % 300 === 0) console.log(`${(frames / FPS).toFixed(0)} sn kaydedildi (${((Date.now() - t0) / 1000).toFixed(0)} sn sürdü)`);
}
const wait = async (sec) => { for (let i = 0, n = Math.round(sec * FPS); i < n; i++) await frame(); };

/* ---------- Senaryo yardımcıları ---------- */
let mouse = { x: W * 0.62, y: H * 0.5 };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
async function moveTo(x, y, sec = 0.6) {
  const n = Math.max(1, Math.round(sec * FPS)), sx = mouse.x, sy = mouse.y;
  for (let i = 1; i <= n; i++) {
    const p = ease(i / n), cx = sx + (x - sx) * p, cy = sy + (y - sy) * p;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
    await ev(`__cursor(${cx},${cy})`);
    await frame();
  }
  mouse = { x, y };
}
async function center(sel) {
  const r = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  if (!r) throw new Error('Öğe bulunamadı: ' + sel);
  return r;
}
async function hover(sel, sec = 0.6) { const c = await center(sel); await moveTo(c.x, c.y, sec); }
async function click(sel, sec = 0.6) {
  if (sel) await hover(sel, sec);
  await ev(`__cursor(${mouse.x},${mouse.y},true)`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: mouse.x, y: mouse.y, button: 'left', clickCount: 1 });
  await wait(0.08);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: mouse.x, y: mouse.y, button: 'left', clickCount: 1 });
  await ev(`__cursor(${mouse.x},${mouse.y},false)`);
}
async function scrollTo(target, sec = 1.6, offset = -76) {
  const t = typeof target === 'number' ? target : `document.querySelector(${JSON.stringify(target)})`;
  await ev(`__lenis.scrollTo(${t}, { offset: ${offset}, duration: ${sec}, easing: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2 })`);
  await wait(sec + 0.15);
}
const cap = (html) => ev(`__caption(${JSON.stringify(html || '')})`);
async function langMenu(code, label) {
  await click('.lang-btn', 0.55);
  await wait(0.45);
  await click(`.lang-list [data-lang="${code}"]`, 0.45);
  await cap(`6 dil · <b>${label}</b>`);
  await wait(1.3);
}
async function langSilent(code, label, prefix) {
  await ev(`document.querySelector('[data-lang="${code}"]').click()`);
  await cap(`${prefix} · <b>${label}</b>`);
}

/* ---------- Senaryo ---------- */
try {
  await ev(`__cursor(${mouse.x},${mouse.y})`);
  await cap('KAR-DEF · Haber ve Arşiv');
  await wait(SHORT ? 2 : 3.2);

  if (!SHORT) {
    // Menü
    await cap('Menü: alt çizgi fareyi takip eder');
    await hover('.nav-in a:nth-child(2)', 0.7); await wait(0.25);
    await hover('.nav-in a:nth-child(3)', 0.35); await wait(0.25);
    await hover('.nav-in a:nth-child(5)', 0.4); await wait(0.25);
    await hover('.nav-in a:nth-child(7)', 0.4); await wait(0.4);

    // Manşet
    await cap('Manşet: fotoğraflar yakınlaşarak geçer');
    await click('.tab:nth-child(2)', 0.8); await wait(1.6);
    await click('.tab:nth-child(4)', 0.5); await wait(1.8);

    // Diller
    await cap('6 dil');
    await langMenu('ku', 'Kurdî');
    await langMenu('en', 'English');
    await langMenu('de', 'Deutsch');
    await langMenu('nl', 'Nederlands');
    await langMenu('fr', 'Français');
    await langMenu('tr', 'Türkçe');

    // Yazı boyutu
    await cap('Yazı boyutu: büyüklerimiz için');
    await click('.fs button:nth-of-type(3)', 0.8); await wait(1.2);
    await click('.fs button:nth-of-type(1)', 0.45); await wait(0.8);

    // Gündem
    await cap('Akıcı kaydırma · Gündem');
    await moveTo(W * 0.7, H * 0.55, 0.5);
    await scrollTo('#gundem', 1.8);
    await hover('.card:nth-child(2) .card-img', 0.7); await wait(1.0);
    await hover('.card:nth-child(1) h3', 0.5); await wait(0.6);

    // Etkinlikler
    await cap('Etkinlik takvimi · <b>English</b>');
    await langSilent('en', 'English', 'Etkinlik takvimi');
    await scrollTo('#etkinlikler', 1.5);
    await click('[data-ev-filter="eu"]', 0.7); await wait(1.2);
    await click('[data-ev-filter="tr"]', 0.4); await wait(1.1);
    await click('[data-ev-filter="all"]', 0.4); await wait(1.0);

    // Arşiv
    await langSilent('tr', 'Türkçe', 'Arşiv');
    await cap('Arşiv: döneme göre süzme');
    await scrollTo('#arsiv', 1.8, 0);
    await wait(1.4);
    await scrollTo('.decades', 1.0, -110);
    await click('[data-dec="1960"]', 0.7); await wait(1.0);
    await click('[data-dec="1990"]', 0.5); await wait(0.9);
    await hover('.arc-item[data-dec="1990"] .arc-vis', 0.6); await wait(1.4);
    await click('[data-dec="all"]', 0.7); await wait(1.0);
    await langSilent('de', 'Deutsch', 'Arşiv');
    await wait(1.6);
    await langSilent('ku', 'Kurdî', 'Arşiv');
    await wait(1.6);

    // Duyurular + köyler
    await langSilent('nl', 'Nederlands', 'Duyurular ve köy rehberi');
    await scrollTo('#duyurular', 1.6);
    await hover('.notices li:nth-child(2) a', 0.6); await wait(0.6);
    await hover('.alpha a:nth-child(4)', 0.7); await wait(0.25);
    await hover('.alpha a:nth-child(13)', 0.45); await wait(0.25);
    await hover('.alpha a:nth-child(22)', 0.45); await wait(0.7);

    // Kurumlar
    await langSilent('fr', 'Français', 'Kurumlarımız');
    await scrollTo('#kurumlar', 1.6);
    await hover('.org:nth-child(1) .org-seal', 0.6); await wait(1.0);
    await hover('.org:nth-child(2) .org-seal', 0.6); await wait(1.2);

    // Katkı + bülten + alt bilgi
    await langSilent('tr', 'Türkçe', 'Arşive katkı ve haber bülteni');
    await scrollTo('#katki', 1.6, -140);
    await hover('.join-a .btn', 0.6); await wait(1.0);
    await scrollTo(1e6, 1.6, 0);
    await wait(0.8);

    // Başa dön
    await cap('Başa dön: ilerleme halkası');
    await click('.totop', 0.7);
    await wait(2.4);

    // Koyu tema
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await cap('Koyu tema: telefon ayarına göre otomatik');
    await wait(1.6);
    await moveTo(W * 0.66, H * 0.6, 0.5);
    await scrollTo('#gundem', 1.6);
    await wait(0.6);
    await scrollTo('#arsiv', 1.6, 0);
    await wait(1.2);
    await cap('');
    await scrollTo(0, 1.8, 0);
    await cap('KAR-DEF · Haber ve Arşiv');
    await wait(2.2);
  }
  await cap('');
  await wait(0.5);
} catch (e) {
  console.error('Senaryo hatası:', e.message);
} finally {
  ff.stdin.end();
  await ffDone;
  ws.close();
  chrome.kill();
  setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch (e) {} }, 1500);
  console.log(`Bitti: ${frames} kare (${(frames / FPS).toFixed(1)} sn) -> ${OUT}`);
}
