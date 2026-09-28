/*
 * Site configuration — {{BRAND}}.
 *
 * hero.frames.count — frames in the hero film. 0 = poster mode until the Veo
 *   video is processed (scripts/make-frames.sh sets it).
 * FRAMES_CDN — Cloudflare Pages URL of the frames (scripts/deploy-frames-pages.sh
 *   sets it). Empty = ./frames.
 * hero.poster — still used until the film exists: pushes in from 1 to `zoom`
 *   toward the focal point (focusX/focusY, 0–1) as the visitor scrolls.
 * hero.mobileFocus — [scroll progress, subject x 0–1] keys the crop follows on
 *   portrait phones (they only see a third of the 16:9 film). Fill these in
 *   from the frame sheet once the film exists.
 * business.whatsapp — number orders/bookings go to (international format, no +).
 */
const FRAMES_CDN = '';

window.SITE_CONFIG = {
  hero: {
    frames: { count: 0, baseUrl: FRAMES_CDN || './frames', prefix: 'f', pad: 3, ext: 'webp' },
    poster: { src: 'assets/img/poster.webp', focusX: 0.5, focusY: 0.55, zoom: 1.35 },
    mobileFocus: [],
  },
  business: {
    name: '{{BRAND}}',
    whatsapp: '920000000000',
    phoneDisplay: '0300-0000000',
    address: 'Plot 00, Main Boulevard, Your City',
    currency: 'Rs',
    timezone: 'Asia/Karachi',
  },
};
