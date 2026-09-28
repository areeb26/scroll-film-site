# Turning the film into the hero

## 1. Frames

```bash
cp "<downloaded>.mp4" video/hero.mp4
scripts/make-frames.sh video/hero.mp4          # 24 fps → ~192 frames for 8 s
scripts/make-frames.sh video/hero.mp4 15       # for a 16 s extended film (~240 frames)
```

The script:
- writes `frames/lg/f001.webp…` (1920×1080, q72) and `frames/sm/…` (1280×720, q70);
- copies the last frame to `assets/img/poster.webp`;
- sets `frames: { count: N,` in `js/config.js`, which switches the hero from poster mode to frames mode.

It stops if there would be more than 999 frames. Keep the total around 150–250 frames. Scrolling can't show more detail than that, and every frame costs bandwidth.

Keep `video/hero.mp4` in git as the source of truth. `frames/lg`, `frames/sm` and `frames/_headers` are gitignored and never go to Vercel (see `.vercelignore`).

## 2. Read the footage

```bash
bash <skill>/scripts/frame-sheet.sh video/hero.mp4 <scratch>/grid.jpg      # 2 fps, 4 columns
```

The sheet shows the film at 0.5 s steps, left to right and top to bottom, with a vertical grid. Thin yellow lines mark every 10% of the width, and the red line marks the centre. The script prints what scroll progress each tile corresponds to. Read the image, then write down for each tile:
- **Where the subject is** horizontally (0–1). This becomes `mobileFocus`.
- **Which side is empty or dark.** Chapter panels go there.
- **When key moments happen** (the truck jumps, the light bar sweeps, the burger arrives). Chapters should land on them.

## 3. Retime the overlays

Chapter windows are `data-in` / `data-out` in scroll progress (0–1). Each fades over ±0.05 around its window:
- **Intro:** `0 → ~0.14`, while nothing much has happened yet.
- **Side cards:** 0.15–0.20 wide, centred on the matching moment, on the side opposite the subject.
- **Final:** `~0.88 → 1.01`, over the held last second.
- Leave gaps of at least 0.05 between windows, so the footage gets moments to itself.

## 4. mobileFocus

`hero.mobileFocus` in `js/config.js` is a list of `[progress, subjectX]` keys, sorted by progress. The engine eases between them with smoothstep, and only when the canvas is portrait-ish (aspect < 1.2). Landscape screens see the whole frame untouched.

```js
// car's nose on the right, the squeegee hand across the bonnet, then the centred reveal
mobileFocus: [[0, 0.72], [0.2, 0.68], [0.28, 0.62], [0.4, 0.54], [0.47, 0.55], [0.53, 0.6], [0.58, 0.62], [0.65, 0.5], [0.72, 0.46], [1, 0.48]],
```

Add a key wherever the subject changes direction. 6–10 keys is typical. Add a one-line comment saying what the keys follow; the next person to re-time it will need it. Then check at 390×844 with the audit's hero screenshots that the subject stays in shot.

## 5. Host the frames

```bash
npx --yes wrangler@4 login                  # once per machine
scripts/deploy-frames-pages.sh <slug>-frames
```

This writes `frames/_headers` (immutable cache plus CORS) and creates the Pages project (with `--force`, because Wrangler 4 otherwise redirects to Workers and fails). It deploys `frames/` and points `FRAMES_CDN` in `js/config.js` at `https://<slug>-frames.pages.dev`. Cloudflare Pages is free, needs no card and has unlimited bandwidth, which is why it's used instead of R2.

If a backgrounded wrangler run gets blocked by a permission check, run the same command in the foreground.

## 6. Ship and verify

Commit (`Add hero film: frames on Cloudflare Pages, retime overlays to the footage`), push, run `vercel deploy --prod --yes`, then run the audit against the live URL with `nosections`. For each viewport the report should show `frames.n` equal to the frame count and the host `<slug>-frames.pages.dev sm` (phones) or `… lg` (desktop).
