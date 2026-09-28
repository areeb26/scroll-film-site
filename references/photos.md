# Stand-in photography

Real client photos always win, so ask for them, or pull from the client's Instagram or TikTok if they give permission. Until then, use free Unsplash photos and say so in the README ("Photos are Unsplash stand-ins").

## 1. Find candidates (Firecrawl)

Unsplash's JSON search endpoint rejects plain curl, but its search pages scrape fine:

```
firecrawl_scrape  url=https://unsplash.com/s/photos/<query-with-dashes>
                  formats=["links"]  onlyMainContent=true
```

From the returned `links`, keep the IDs of links shaped like `https://unsplash.com/photos/<ID>/download?force=true`. Those are the free photos. Links that go through `/plus?referrer=…` are premium Unsplash+ photos, so skip them. The metadata `name` array pairs alt text with photographer names if you need a hint about what a photo shows.

Each result is large (~12k tokens), so run 4–6 targeted queries in one batch. Make them concrete, e.g. `chicken-karahi`, `smash-burger`, `dark-restaurant-interior`, `car-detailing`, `ceramic-coating`, `rc-car`. Twenty generic ones will waste the budget.

## 2. Download and look

```bash
bash <skill>/scripts/fetch-unsplash.sh <scratch>/photos/<group> ID1 ID2 ID3 …   # 1600px wide, parallel
python3 <skill>/scripts/photo-sheet.py <scratch>/photos/<group> <scratch>/<group>_sheet.jpg
```

Read each sheet image and choose by eye. Every tile is labelled with its index, ID and rough size. Look for:
- **A poster candidate:** dark, wide (16:10 or wider), dramatic, with the subject off to one side.
- **Card shots:** the food, product or service fills the frame, and the sets look consistent (similar lighting within a section).
- **Gallery and ambience:** interiors, process shots and people from behind or at a distance.

## 3. Convert to WebP

```bash
# poster: wide, no crop
python3 <skill>/scripts/to-webp.py SRC.jpg assets/img/poster.webp --w 1920 --q 74
# menu / product cards: consistent 4:3 crop, focal point nudged with --fy
python3 <skill>/scripts/to-webp.py SRC.jpg assets/img/double-smash.webp --w 800 --crop 4:3 --fy 0.55
# gallery: natural aspect
python3 <skill>/scripts/to-webp.py SRC.jpg assets/img/g-dining.webp --w 1200 --q 70
```

Crop portrait sources to 4:3 for cards, then build a sheet of the crops (`photo-sheet.py` works on a folder of `.webp` too) and check that nothing important was cut. Nudge `--fy` (0 = top, 1 = bottom) where it was. Name files by what they show (`chicken-karahi.webp`, not `img3.webp`), because the data file reads better.

Aim for 2–4 MB of images in total. Load everything below the hero with `loading="lazy"`.
