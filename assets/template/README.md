# {{BRAND}}

A static site (HTML/CSS/JS, no build step) with a scroll-scrubbed hero film and WhatsApp <!-- ordering / booking -->.

- **Hero:** a scroll-scrubbed video with text chapters. It stays in poster mode until the Veo film exists (see `VEO_PROMPT.md`).
- <!-- feature -->
- <!-- feature -->

Run locally: `python3 -m http.server <port>`

Edit content in `js/data.js`, and the business name, WhatsApp number and hours in `js/config.js`.

**Placeholders to confirm with the client:** name and logo, address and hours, prices, stats and reviews, photos (Unsplash stand-ins), WhatsApp number.

## Hero film
1. Generate the film from `VEO_PROMPT.md` and save it as `video/hero.mp4`.
2. Run `scripts/make-frames.sh video/hero.mp4`. This writes the frames, sets the frame count in config and makes the last frame the poster.
3. Run `scripts/deploy-frames-pages.sh {{SLUG}}-frames`. This hosts the frames on Cloudflare Pages and points `FRAMES_CDN` at them.
4. Commit, push, then run `vercel deploy --prod --yes`.
