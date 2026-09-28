# Writing the hero film prompt (Veo 3)

The film isn't watched; it's **scrubbed**. The visitor's scroll position picks the frame, so they drag through it forwards and backwards at any speed. That changes what makes a good film:

- **One continuous shot with no cuts.** A cut becomes a jarring jump mid-scroll.
- **One slow, steady camera move**: a dolly forward, a sideways track, a crane down or a gentle orbit. Any fast motion turns into mush when scrubbed slowly.
- **The last second holds almost still.** The final frame doubles as the poster and social preview, and it's where the closing headline sits.
- **Things that scrub beautifully:** fire, sparks, steam, smoke, water droplets, light bars sweeping across paint, fabric, liquids pouring, and slow reveals.
- **Things that morph and break the illusion:** hands and faces, text and logos, thin objects (skewers, watch hands, propellers, wheels), and "transformations" (dull → glossy, raw → cooked). Keep these out, or keep them small and reject any take where they warp.

## Plan the film around the text

Before writing the prompt, decide where the site's chapters sit. There's an intro bottom-left, side cards alternating left and right, and a centred final line. Then write a timeline so the subject stays clear of each text panel:

| Scroll | Text | Subject should be |
|---|---|---|
| 0 – 14 % | headline bottom-left | right half |
| ~20 – 40 % | card on the left | right half |
| ~45 – 62 % | card on the right | left or centre |
| ~66 – 84 % | card on the left | right or centre |
| 88 – 100 % | final line, bottom-centre | upper-middle, with dark empty space below |

Put this timeline at the top of `VEO_PROMPT.md` so the user understands why the prompt describes positions.

On portrait phones only about a third of the 16:9 width is visible. The engine pans the crop along `hero.mobileFocus` to follow the subject (see film-timing.md), but a subject that hugs the extreme edge for long stretches will still be lost. Keep it within roughly 0.25–0.75 of the width.

## Prompt anatomy

Write it in this order, as one flowing paragraph:
1. `A single continuous cinematic shot, no cuts, 8 seconds.`
2. **Setting and mood.** Name the place, the materials and the time of day in one sentence.
3. **Opening frame.** Say where the camera starts, where the subject sits (left or right) and what is moving.
4. **Camera move.** Name one verb and one direction: "tracks slowly and smoothly to the right at table height".
5. **Midpoint beats.** Describe what passes or happens, one or two things only.
6. **Ending.** Say what the camera settles on, where it sits in frame, and "dark, empty [floor/counter/table] below it".
7. **Look.** Cover the lighting colours, contrast, "photorealistic [category] commercial", lens (anamorphic or shallow depth of field) and "smooth steady camera".
8. `The final second holds almost still. No people, no hands, no text, no logos, no watermark.` Drop "no people" only if the concept truly needs a person, and then never show a face up close.

Add a **negative prompt** line for Flow or Vertex:
`cuts, scene change, people, faces, hands, text, captions, logo, watermark, shaky camera, fast motion, morphing, [category-specific: warped wheels / bent skewers / extra propellers]`

Always add a **backup prompt**: a simpler crane down or push in over a composed still scene. It's for when the ambitious move keeps morphing.

## VEO_PROMPT.md template

```markdown
# Hero video: Veo 3 prompt (<Brand>)

**Settings:** Veo 3 (Quality, not Fast) · 16:9 · 1080p · 8 s · make 4 variations and keep the one that doesn't morph.

<one line on the concept> — built so the scroll text sits clear of the subject:
- **Start:** …
- **20–40 %:** …
- **45–62 %:** …
- **68–84 %:** …
- **End:** …

## Prompt
> …

**Negative prompt** (Flow / Vertex): `…`

## Backup prompt (if the main one keeps morphing)
> …

## Tips
- Reject takes where <the fragile thing> changes shape.
- For a longer scroll, **Extend** once in Flow (16 s), then run `scripts/make-frames.sh video/hero.mp4 15`.
- For tight control, generate the final still first (Imagen or Nano Banana), then use Veo **Frames to video** with it as the last frame.

## After you download the MP4
Save it as `video/hero.mp4`, then:
    scripts/make-frames.sh video/hero.mp4
    scripts/deploy-frames-pages.sh <slug>-frames
```

## Examples that worked

**Car detailing / PPF studio.** A glide toward a car under a hexagon LED ceiling, with a light bar sweeping the paint to mirror gloss:
> A single continuous cinematic shot, no cuts, 8 seconds. Inside a dark, modern car detailing studio: polished grey epoxy floor, matte black walls and a hexagonal LED light grid on the ceiling. A black luxury sports car sits on the right side of the frame. The camera starts low and wide on the left and glides slowly toward the front of the car. … a bright horizontal light bar sweeps along the body and the paint transforms into a flawless, deep mirror gloss with crisp hexagon reflections. … The camera settles into a slow, stable, centred front three-quarter hero shot of the gleaming car with its headlights on, the car in the upper-middle of the frame and clean dark floor below it. Moody high-contrast lighting, cool white with subtle cyan accents, photorealistic automotive commercial, anamorphic lens, shallow depth of field, smooth steady camera, the final second holds almost still. No text, no logos, no badges, no licence plate, no watermark.

**Toy shop.** A floor-level glide through a sunny playroom, where an RC truck jumps a ramp, a drone lifts off and everything ends on a centred hero group:
> … The camera starts low at floor level and glides slowly forward. A shiny red remote-control monster truck … races across the right half of the frame, bounces over a small cardboard ramp and lands smoothly. The camera rises gently as a small white quadcopter drone … lifts off from a toy box on the left … The shot ends on a stable, centred hero composition … the lower third of the frame is clean empty rug. …

**Grill restaurant.** A sideways track along the kitchen counter, from coals to karahi to burger:
> … The camera starts close and low on a charcoal grill packed with glowing orange coals on the right of the frame, with skewers of seekh kebab and chicken tikka sizzling on it; fat drips, small flames flare up and sparks float upward. The camera tracks slowly and smoothly to the right along the counter at table height. It passes a black iron karahi … steam rising … and eases to a stop on a tall double smash burger … The burger ends in the upper-middle of the frame with dark, empty counter below it. …

Adapt the structure, not the words. Each client gets its own concept drawn from what they actually sell.
