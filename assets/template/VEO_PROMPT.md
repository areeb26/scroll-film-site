# Hero video: Veo 3 prompt ({{BRAND}})

**Settings:** Veo 3 (Quality, not Fast) · 16:9 · 1080p · 8 s · make 4 variations and keep the one that doesn't morph.

<!-- One line on the concept, then where the subject sits so the scroll text stays clear of it. -->
- **Start:** subject on the right, headline bottom-left
- **20–40 %:** …
- **45–62 %:** …
- **68–84 %:** …
- **End:** subject in the upper-middle, dark empty space below for the closing line

## Prompt

> A single continuous cinematic shot, no cuts, 8 seconds. …  The final second holds almost still. No people, no hands, no text, no logos, no watermark.

**Negative prompt** (Flow / Vertex): `cuts, scene change, people, faces, hands, text, captions, logo, watermark, shaky camera, fast motion, morphing`

## Backup prompt (if the main one keeps morphing)

> …

## Tips
- For a longer scroll, **Extend** once in Flow (16 s), then run `scripts/make-frames.sh video/hero.mp4 15`.
- For tight control, generate the final still first (Imagen or Nano Banana), then use Veo **Frames to video** with it as the last frame.

## After you download the MP4
Save it as `video/hero.mp4`, then:
```bash
scripts/make-frames.sh video/hero.mp4
scripts/deploy-frames-pages.sh {{SLUG}}-frames
git add -A && git commit -m "Add hero film" && git push
```
