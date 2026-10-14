# scroll-film-site: a Claude Code skill

By [Areeb Ahmed Khan (The Ai Khan)](https://www.theaikhan.com) · step-by-step guide: [theaikhan.com/guides/scroll-film-site](https://www.theaikhan.com/guides/scroll-film-site) · MIT licensed

This skill builds and ships **client demo websites with a cinematic, scroll-scrubbed AI video hero**, the kind of site that makes a small business look like a big brand.

- **Hero.** A Veo 3 film is cut into WebP frames and painted onto a canvas as the visitor scrolls. Headline "chapters" fade in over the footage, and on portrait phones the crop pans to follow the subject.
- **Site.** One static page with no build step: HTML, CSS and vanilla JS with Lenis smooth scroll. It's mobile-first from the first line of CSS.
- **Selling.** Orders, bookings and quotes are written up as a pre-filled WhatsApp message to the business, with cart, options, delivery zones and opening hours built in.
- **Hosting.** Frames go on **Cloudflare Pages** (free, unlimited bandwidth). The site deploys to **Vercel** from the CLI, and the code lives in a private **GitHub** repo per client.

Sites built with this pipeline so far: a watch wholesaler, a toy shop with a cart and toy finder, a car-detailing studio with a live quote builder, and a BBQ and burger restaurant with menu, deals, delivery zones and live open/closed status.

## Install

With the [skills](https://www.npmjs.com/package/skills) CLI (works for Claude Code, Cursor, Codex, OpenCode and other agents):

```bash
npx skills add areeb26/scroll-film-site
```

Add `-g -a claude-code -y` to install it globally for Claude Code without prompts.

Or clone it straight into Claude Code's skills folder:

```bash
git clone https://github.com/areeb26/scroll-film-site.git ~/.claude/skills/scroll-film-site
```

Or keep the repo somewhere else and symlink it:

```bash
ln -s /path/to/scroll-film-site ~/.claude/skills/scroll-film-site
```

Restart Claude Code, or start a new session. The skill loads by itself when you ask for a client website, and you can also call it by name ("use scroll-film-site").

Update with `git -C ~/.claude/skills/scroll-film-site pull`.

## Requirements

| Tool | Used for | Install |
|---|---|---|
| Claude Code | runs the skill | https://claude.com/claude-code |
| `ffmpeg` / `ffprobe` | film → frames, frame sheets, screenshot sheets | your package manager |
| Python 3 + Pillow | photo sheets, WebP conversion, scaffolding | `pip install pillow` |
| Node 18+ and `playwright-core` + Chrome | mobile/desktop layout audit | `npm i -g playwright-core` (or reuse the one inside `@playwright/mcp`) |
| `gh` (GitHub CLI) | private repo per site | `gh auth login` |
| `vercel` CLI | deploys | `npm i -g vercel` then `vercel login` |
| `wrangler` (via `npx`) | frames on Cloudflare Pages | `npx --yes wrangler@4 login` once |
| Firecrawl MCP *(optional)* | searching Unsplash for stand-in photos | add the Firecrawl connector |
| Google Veo 3 (Flow / Gemini / Vertex) | **you** generate the hero film from the prompt the skill writes | https://labs.google/flow |

## How to use it

Ask in plain words, for example:

> make a website for a restaurant: desi BBQ and smash burgers, online delivery orders, deals, gallery and reviews

> new client: a car detailing studio, needs a quote builder and booking on WhatsApp

> here's the Veo video for the toy shop, put it on the site: ~/Downloads/toys_hero.mp4

> the text on the hero is breaking on small phones, fix the mobile layout

### The flow

1. **Intake.** Claude asks a few questions: business type, features, real client or placeholder, WhatsApp number.
2. **Scaffold.** It runs `scripts/new-site.sh <folder> "<Brand>"`, which copies the template and adds a local preview entry.
3. **Photos.** It uses Unsplash stand-ins, picked from contact sheets and converted to WebP.
4. **Veo prompt.** Claude writes `VEO_PROMPT.md` and pastes the prompt in chat. **You** generate the 8-second film in Veo 3. You can do this later; the site works without it.
5. **Build.** It builds the site in *poster mode*, where a still image pushes in on scroll.
6. **Audit.** A headless check runs at 320, 390 and 1440px wide. It catches page zoom-out, clipped text and overlays hitting the nav, and produces screenshot sheets.
7. **Ship.** Claude creates a private GitHub repo and runs `vercel deploy --prod --yes`.
8. **Film arrives.** Claude cuts it into frames, reads a gridded frame sheet, retimes the text chapters and the phone crop to the footage, hosts the frames on Cloudflare Pages, redeploys and verifies the live site.

## What's inside

```
SKILL.md                 workflow Claude follows
references/
  veo-prompting.md       writing scrub-friendly Veo prompts planned around the text
  photos.md              Unsplash sourcing, contact sheets, WebP crops
  mobile.md              mobile-first rules and the audit procedure
  commerce.md            cart, options sheet, checkout drawer, WhatsApp message, hours
  film-timing.md         frames, frame sheets, retiming chapters, mobileFocus, Pages
  deploy.md              GitHub, Vercel, live verification, README checklist
scripts/
  new-site.sh            scaffold a site from the template
  audit.mjs              Playwright layout audit (mobile + desktop), report + screenshots
  frame-sheet.sh         gridded contact sheet of the film with a time → progress table
  hero-strip.mjs         screenshots of the live hero at chosen scroll points, tiled and labelled
  fetch-unsplash.sh      download free Unsplash photos by ID
  photo-sheet.py         labelled contact sheet of a photo folder
  to-webp.py             resize / crop to WebP around a focal point
assets/template/         starter site: hero engine, config, base CSS, frame scripts
```

### The hero engine (`assets/template/js/hero.js`)

- **Frames mode** (`frames.count > 0`): loads `lg` (1920×1080) or `sm` (1280×720) WebP frames coarse-to-fine (every 32nd frame, then every 16th, down to every frame), so scrubbing works after about 14 requests.
- **Poster mode** (`count: 0`): a single still pushes in toward a focal point.
- **Chapters:** elements with `data-in` / `data-out` fade and slide in and out by scroll progress.
- **`hero.mobileFocus`:** `[progress, x]` keys that pan the crop on portrait screens, eased with smoothstep.
- **Resize guard:** it ignores address-bar resizes on phones.
- **Events:** it emits `hero:progress` (0–1) for custom widgets such as gauges, dials and trackers.

## Notes

- Client sites default to **private** repos.
- Stats and reviews on placeholder brands are sample content and are listed in each site's README. For real clients, the skill asks for real reviews instead of inventing them.
- Currency and payment defaults are tuned for Pakistan (PKR, cash on delivery, JazzCash / Easypaisa), and the skill changes them for other markets.

## License

MIT, see [LICENSE](LICENSE). Free to use for your own and your clients' sites. More skills: [theaikhan.com/skills](https://www.theaikhan.com/skills).
