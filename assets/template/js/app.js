/*
 * {{BRAND}} — page behaviour: smooth scroll, anchors, WhatsApp links from
 * config, hero hint, reveal-on-scroll, counters and toast. Add the business's
 * own features (menu + cart, quote builder, booking…) below the helpers.
 */
(function () {
  'use strict';

  const BIZ = window.SITE_CONFIG.business;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => `${BIZ.currency} ${Math.round(n).toLocaleString('en-PK')}`;
  const waBase = `https://wa.me/${BIZ.whatsapp}`;

  // ---------- Smooth scroll (Lenis) ----------
  let lenis = null;
  if (window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', () => window.dispatchEvent(new Event('site:scroll')));
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const navH = () => $('#nav').offsetHeight;
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -navH() + 1, duration: 1.3 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navH(), behavior: 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-wa')) return;
    const id = a.getAttribute('href');
    if (id === '#') return;
    e.preventDefault();
    if (id === '#top') { lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    scrollToEl($(id));
  });
  // Modals/drawers: lock() while open, unlock() on close. Scrollable panels need data-lenis-prevent.
  let locks = 0;
  const lock = () => { if (locks++ === 0) { if (lenis) lenis.stop(); document.documentElement.style.overflow = 'hidden'; } };
  const unlock = () => { if (locks && --locks === 0) { if (lenis) lenis.start(); document.documentElement.style.overflow = ''; } };
  window.SITE = { lock, unlock, scrollToEl, money, esc, toast };

  // ---------- Contact details from config ----------
  $$('[data-wa]').forEach((a) => { a.href = waBase; if (a.hasAttribute('data-wa-text')) a.textContent = BIZ.phoneDisplay; });
  $$('[data-address]').forEach((el) => { el.textContent = BIZ.address; });

  // ---------- Hero hint ----------
  const hint = $('#heroHint');
  window.addEventListener('hero:progress', (e) => { if (hint) hint.style.opacity = Math.max(0, 1 - e.detail / 0.04); });

  // ---------- Gallery ----------
  const masonry = $('#masonry');
  if (masonry && window.GALLERY) {
    masonry.innerHTML = window.GALLERY.map((g, i) => `
      <figure class="shot reveal" style="--d:${(i % 3) * 70}ms">
        <img src="${g.img}" alt="${esc(g.cap)}" loading="lazy" />
        <figcaption>${esc(g.cap)}</figcaption>
      </figure>`).join('');
  }

  // ---------- Toast ----------
  const toastEl = $('#toast'); let tt = 0;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('is-on'), 2200); }

  // ---------- Reveal + counters (<b data-count="45" data-div="10">) ----------
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in-view');
    en.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  function countUp(el) {
    const end = +el.dataset.count, div = +(el.dataset.div || 1), t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1500), v = (end * (1 - Math.pow(1 - k, 4))) / div;
      el.textContent = div > 1 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  $$('.reveal').forEach((el) => io.observe(el));
})();
