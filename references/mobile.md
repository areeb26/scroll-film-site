# Mobile first

Most visitors arrive from a WhatsApp, TikTok or Instagram link on a phone. Every earlier site needed a retrofit pass because the text over the film broke at 320–390px wide, so build these rules in from the first line of CSS.

## Page-level rules

- **Nothing may be wider than the screen.** Mobile browsers widen the *layout viewport* to fit the widest element, and the whole page then renders zoomed out. The usual culprits are a tilted marquee, a long nav label or a fixed-width card. The template sets:
  ```css
  html { overflow-x: clip; }
  body { overflow-x: hidden; overflow-x: clip; }
  ```
  `clip` doesn't create a scroll container, so `position: sticky` (hero stage, category chips) keeps working. Never use `overflow: hidden` on an ancestor of a sticky element. Still fix the element that overflowed; the root clip is the safety net.
- **The nav must fit at 320px.** Hide the text links below ~960px, and shorten button labels with the utility spans:
  `<span class="hide-sm">…</span>` (hidden ≤760px), `<span class="hide-xs">…</span>` (hidden ≤400px), `<span class="nowrap">…</span>`.
  Example: `<span class="hide-xs">Order on </span>WhatsApp`.
- **Inputs are 16px on phones.** Under 16px, iOS zooms the page when the field gets focus.
- **Touch targets are at least 40px**, and primary buttons 46–52px.

## The hero on phones

- The stage is `position: sticky; height: 100svh`. Use `svh`, not `vh`, so the sliding address bar doesn't change the stage height. The engine also ignores `resize` events where the canvas size hasn't changed.
- Screens under 900px wide (or under 700px on the short side) load the 1280×720 `sm` frame set.
- A portrait phone sees about a third of the 16:9 film. `hero.mobileFocus` pans the crop to follow the subject; see film-timing.md for how to read the keys off the footage. Poster mode uses `poster.focusX/focusY` instead.
- **Overlays** at ≤760px:
  - Pin the chapter cards to the bottom (`top: auto; bottom: ~72px; left/right: gutter`) and make them compact (padding 18px, h2 `clamp(34px, 10.4vw, 46px)`, facts `dd` about 20px).
  - Size the intro title with `clamp(54px, 17.5vw, 92px)`, and let the CTAs `nowrap` at 46–48px tall.
  - Put a stronger bottom gradient in `.hero__shade` so text stays legible over bright footage.
  - Hide decorative HUD elements (trackers, gauges) on phones, and hide ledes and facts on short landscape screens (`max-height: 540px`).
- Check that no chapter slides under the nav. The audit flags `chapter … top under nav`.

## Content on phones

- Turn card grids into horizontal scroll-snap rows (`flex: 0 0 84%; scroll-snap-align: start`) for deals and featured products. Make menus and product lists into delivery-app rows: text on the left, a square photo on the right, and the add button over the photo.
- Dialogs become bottom sheets (`margin: auto 0 0; width: 100%; border-radius: 20px 20px 0 0; max-height: 92svh`).
- When a sticky bottom bar appears (e.g. "View your order"), move the floating WhatsApp button up, or hide it while the bottom bar is showing. Also add bottom padding to the footer so nothing sits underneath the bar.
- **Lenis**: put `data-lenis-prevent` on every scrollable panel (drawer, sheet, horizontal chip bar), and stop Lenis while a modal is open.

## Audit procedure

The browser preview pane is too narrow to emulate phones reliably (screenshots get clipped and scaled). Use the headless audit instead:

```bash
export PWCORE=$(npm root -g)/@playwright/mcp/node_modules/playwright-core
node <skill>/scripts/audit.mjs <scratch>/audit http://localhost:5183/ 320x568,375x667,390x844,1440x900
```

It runs mobile contexts (isMobile, touch, DPR 2) below 800px wide and a desktop context above. For each viewport it:
- screenshots the hero at 7 progress points (`hero_0…6.png`) and checks the live chapters for sitting under the nav, running off-screen or having a child wider than the screen;
- scans the whole page for elements wider than the viewport, clipped text (overflow without an ellipsis) and text under 11px;
- takes paged screenshots of everything below the hero (`page_NN.png`), unless you pass `nosections` as the last argument;
- records console and page errors, plus how many hero frames loaded and from which host.

Read `report.json`, then look at the pictures:

```bash
cd <scratch>/audit/<site>-390x844
ffmpeg -v error -y -pattern_type glob -i 'hero_*.png' -vf "scale=260:-1,tile=7x1:padding=6:color=white" -frames:v 1 ../hero_390.jpg
n=$(ls page_*.png | wc -l); ffmpeg -v error -y -pattern_type glob -i 'page_*.png' -vf "scale=220:-1,tile=10x$(( (n+9)/10 )):padding=6:color=white" -frames:v 1 ../page_390.jpg
```

"Wide" hits inside a horizontal scroller (the scan skips those) or on deliberately bled decoration are fine. Anything else gets fixed. Re-run until `docW == vw` at 320px.
