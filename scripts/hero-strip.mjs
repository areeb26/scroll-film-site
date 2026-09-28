// Contact sheet of the live hero (film + overlays) at chosen scroll progress
// points — the fastest way to check chapter timing and mobileFocus against the
// real footage.
//
// usage: node hero-strip.mjs <out.jpg> <url> [WxH] [p1,p2,...] [cols]
//   e.g. node hero-strip.mjs /tmp/strip-desk.jpg http://localhost:5183/ 1440x900
//        node hero-strip.mjs /tmp/strip-phone.jpg http://localhost:5183/ 390x844 0,0.1,0.2,0.3 4
// Defaults: 1440x900, p = 0 → 1 in 0.05 steps, 4 columns (6 for phones).
// Each tile is labelled with its progress. Needs playwright-core (see audit.mjs)
// and ffmpeg.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
const require = createRequire(import.meta.url);

let pw;
for (const id of [process.env.PWCORE, 'playwright-core', 'playwright'].filter(Boolean)) {
  try { pw = require(id); break; } catch (e) { /* try next */ }
}
if (!pw) { console.error('playwright-core not found — set PWCORE=/path/to/playwright-core'); process.exit(1); }

const [OUT, url, vp = '1440x900', ptsArg, colsArg] = process.argv.slice(2);
if (!OUT || !url) { console.error('usage: node hero-strip.mjs <out.jpg> <url> [WxH] [p1,p2,...] [cols]'); process.exit(1); }
const [w, h] = vp.split('x').map(Number);
const mobile = w < 800;
const PTS = ptsArg ? ptsArg.split(',').map(Number) : Array.from({ length: 21 }, (_, i) => +(i * 0.05).toFixed(2));
const COLS = +colsArg || (mobile ? 6 : 4);
const chrome = process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);

const browser = await pw.chromium.launch({ executablePath: chrome });
const ctx = await browser.newContext({
  viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  ...(mobile ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : {}),
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => {
  const p = document.getElementById('preloader');
  return !p || p.classList.contains('is-done') || getComputedStyle(p).visibility === 'hidden';
}, null, { timeout: 30000 }).catch(() => console.warn('preloader never hid'));
await page.waitForTimeout(1500);

const hero = await page.evaluate(() => {
  const el = document.getElementById('hero');
  return { top: el.offsetTop, len: el.offsetHeight - innerHeight };
});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-'));
for (const [i, p] of PTS.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(hero.top + p * hero.len));
  await page.waitForTimeout(900);
  // Label in-page so the sheet needs no font setup in ffmpeg.
  await page.evaluate((txt) => {
    let t = document.getElementById('__strip');
    if (!t) {
      t = document.createElement('div'); t.id = '__strip';
      t.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99999;padding:4px 10px;font:700 22px/1.2 monospace;color:#000;background:#ffe600;border-radius:4px';
      document.body.appendChild(t);
    }
    t.textContent = txt;
  }, `p ${p.toFixed(2)}`);
  await page.screenshot({ path: `${tmp}/s${String(i).padStart(3, '0')}.png` });
}
await browser.close();

const rows = Math.ceil(PTS.length / COLS);
const tileW = mobile ? 260 : 480;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', `${tmp}/s%03d.png`,
  '-vf', `scale=${tileW}:-2,tile=${COLS}x${rows}:padding=4:color=white`, '-frames:v', '1', OUT]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${OUT} — ${PTS.length} tiles at ${w}x${h}, ${COLS} per row: ${PTS.join(' ')}`);
