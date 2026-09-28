// Layout audit for scroll-film sites (mobile + desktop), headless Chrome via playwright-core.
//
// usage: node audit.mjs <outDir> <url>[,<url>...] [WxH,...] [nosections]
//   e.g. node audit.mjs /tmp/audit http://localhost:5183/ 320x568,390x844,1440x900
//
// For every url × viewport it saves hero screenshots at 7 scroll points
// (hero_0..6.png), paged screenshots of the rest of the page (page_NN.png,
// skipped with `nosections`) and writes <outDir>/report.json with:
//   errors  — console / page errors
//   frames  — hero frames loaded and from which host
//   hero    — chapters under the nav, off-screen, or with over-wide children
//   scan    — docW vs vw (zoom-out bug), elements wider than the viewport,
//             clipped text, text under 11px
//
// Needs playwright-core: set PWCORE to its path, e.g.
//   export PWCORE=$(npm root -g)/@playwright/mcp/node_modules/playwright-core
// Chrome: set CHROME (default /usr/bin/google-chrome if present, else Playwright's own).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);

let pw;
for (const id of [process.env.PWCORE, 'playwright-core', 'playwright'].filter(Boolean)) {
  try { pw = require(id); break; } catch (e) { /* try next */ }
}
if (!pw) { console.error('playwright-core not found — set PWCORE=/path/to/playwright-core'); process.exit(1); }
const { chromium } = pw;

const [OUT, urlArg, vpArg, flag] = process.argv.slice(2);
if (!OUT || !urlArg) { console.error('usage: node audit.mjs <outDir> <url>[,<url>...] [WxH,...] [nosections]'); process.exit(1); }
const URLS = urlArg.split(',');
const VPS = (vpArg || '320x568,390x844,1440x900').split(',').map((s) => s.split('x').map(Number));
const sections = flag !== 'nosections';
const chrome = process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);

const browser = await chromium.launch({ executablePath: chrome, args: ['--autoplay-policy=no-user-gesture-required'] });
const report = {};

for (const url of URLS) {
  const u = new URL(url), key = (u.host || u.pathname.split('/').slice(-2, -1)[0] || 'site').replace(/[:.]/g, '_');
  for (const [w, h] of VPS) {
    const tag = `${key}-${w}x${h}`;
    const dir = `${OUT}/${tag}`;
    fs.mkdirSync(dir, { recursive: true });
    const mobile = w < 800;
    const ctx = await browser.newContext({
      viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
      ...(mobile ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : {}),
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const p = document.getElementById('preloader');
      return !p || p.classList.contains('is-done') || getComputedStyle(p).visibility === 'hidden';
    }, null, { timeout: 20000 }).catch(() => errors.push('preloader never hid'));
    await page.waitForTimeout(1500);

    const probe = () => page.evaluate(() => {
      const vw = innerWidth, vh = innerHeight;
      const nav = document.querySelector('#nav, header, .nav');
      const navB = nav ? nav.getBoundingClientRect().bottom : 0;
      const live = [...document.querySelectorAll('[data-in]')].filter((c) => +getComputedStyle(c).opacity > 0.5);
      const issues = [];
      for (const c of live) {
        const r = c.getBoundingClientRect();
        if (r.top < navB - 2) issues.push(`chapter ${c.className} top ${Math.round(r.top)} under nav ${Math.round(navB)}`);
        if (r.bottom > vh + 1) issues.push(`chapter ${c.className} bottom ${Math.round(r.bottom)} > vh ${vh}`);
        if (r.left < -1 || r.right > vw + 1) issues.push(`chapter ${c.className} x ${Math.round(r.left)}..${Math.round(r.right)} vw ${vw}`);
        for (const el of c.querySelectorAll('*')) {
          const e = el.getBoundingClientRect();
          if (e.width && (e.right > vw + 1 || e.left < -1)) { issues.push(`  child <${el.tagName.toLowerCase()} class="${el.className}"> x ${Math.round(e.left)}..${Math.round(e.right)}`); break; }
        }
      }
      return { live: live.map((c) => c.className), issues };
    });

    // Hero at key progress points
    const hero = await page.evaluate(() => {
      const el = document.getElementById('hero');
      return el ? { top: el.offsetTop, len: el.offsetHeight - innerHeight } : { top: 0, len: 0 };
    });
    const heroRes = [];
    if (hero.len > 0) {
      for (const [i, p] of [0.02, 0.2, 0.4, 0.5, 0.65, 0.8, 0.95].entries()) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(hero.top + p * hero.len));
        await page.waitForTimeout(1100);
        heroRes.push({ p, ...(await probe()) });
        await page.screenshot({ path: `${dir}/hero_${i}.png` });
      }
    }

    // Whole-page overflow scan
    const scan = await page.evaluate(() => {
      const vw = innerWidth;
      const out = { docW: document.documentElement.scrollWidth, vw, wide: [], clipped: [], tiny: [] };
      const inScroller = (el) => {
        for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
          if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true;
        }
        return false;
      };
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cls = String(el.className).slice(0, 60);
        if ((r.right > vw + 1 || r.left < -1) && !inScroller(el)) out.wide.push(`<${el.tagName.toLowerCase()} .${cls}> ${Math.round(r.left)}..${Math.round(r.right)}`);
        const text = el.children.length === 0 && el.textContent.trim();
        if (text && el.scrollWidth > el.clientWidth + 1 && /(hidden|clip)/.test(s.overflowX) && s.textOverflow !== 'ellipsis') out.clipped.push(`<${el.tagName.toLowerCase()} .${cls}> "${text.slice(0, 30)}" ${el.scrollWidth}>${el.clientWidth}`);
        if (text && parseFloat(s.fontSize) < 11) out.tiny.push(`<${el.tagName.toLowerCase()} .${cls}> ${s.fontSize} "${text.slice(0, 20)}"`);
      }
      out.wide = [...new Set(out.wide)].slice(0, 40); out.clipped = out.clipped.slice(0, 30); out.tiny = [...new Set(out.tiny)].slice(0, 30);
      return out;
    });

    if (sections) {
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      let i = 0;
      for (let y = hero.top + hero.len; y < total && i < 40; y += h, i++) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(450);
        await page.screenshot({ path: `${dir}/page_${String(i).padStart(2, '0')}.png` });
      }
    }

    const frames = await page.evaluate(() => {
      const f = performance.getEntriesByType('resource').filter((e) => /\/(lg|sm)\/f\d+\.webp/.test(e.name));
      return { n: f.length, hosts: [...new Set(f.map((e) => `${new URL(e.name).host} ${new URL(e.name).pathname.split('/').slice(-2, -1)[0]}`))] };
    });

    report[tag] = { errors, frames, hero: heroRes.filter((r) => r.issues.length), scan };
    await ctx.close();
    const bad = scan.docW > scan.vw ? `  ✗ docW ${scan.docW} > vw ${scan.vw}` : '';
    console.log(`${tag}: ${errors.length} errors, ${report[tag].hero.length} hero issues, ${scan.wide.length} wide, ${scan.clipped.length} clipped, frames ${frames.n}${bad}`);
  }
}
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
await browser.close();
console.log(`report → ${OUT}/report.json`);
