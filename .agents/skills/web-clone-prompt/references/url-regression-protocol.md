# URL Regression Protocol

**Purpose:** URL clone work must prove fidelity through browser evidence, not memory, taste, or a single screenshot. Use this protocol only after the user confirms implementation or when refining a URL-derived clone prompt from live evidence.

## 0. Required Outputs

Every URL implementation run must leave a small evidence folder in the test project:

```text
qa/compare/
  index.html                 # original/local side-by-side viewer
  compare-report.json         # viewport, scrollY, selector/text hit, rects, computed state
  original_loader_t*.png      # fresh-profile original opening frames
  local_loader_t*.png         # fresh-profile clone opening frames
  original_hero_occlusion_*.png # foreground/mask scroll micro-frames when applicable
  local_hero_occlusion_*.png    # matching clone micro-frames
  original_<anchor>.png       # source anchor screenshots
  local_<anchor>.png          # clone anchor screenshots
```

If these files do not exist, do not claim that scroll/opening/interaction comparison was performed.

## 1. Fresh Opening Capture

Opening loaders often run once and then disappear behind localStorage/session/cache. Always capture original opening with:

- new browser profile / empty user-data-dir
- cache disabled
- cache-busting query param
- no reused page session
- same viewport as the clone comparison

Minimum frames:

```text
t0080, t2600, t3600, t5200, t5600, t6000, t6400, t7000
```

Add extra frames wherever the original visually changes. Record overlay rect, opacity, transform, filter, height, text/wordmark rect, visible image/video assets, and layer z-order.

Failure signals:

- clone starts at stable hero while original has loader/opening
- clone uses fade/translate when original uses grid strips, clips, shutters, masks, or panel reveal
- opening-only elements persist into stable hero
- different timestamps are accidentally stacked into one state

## 2. Same-Viewport Source Anchors

Do not compare by approximate scroll percentage when source and clone have different page heights. Use source anchors first:

```text
hero:       scrollY = 0 after stable opening
intro:      text/selector for first content section
projects:  text/selector for project list/header
model:     text/selector for model/process/impact section
cta:       text/selector for final CTA
footer:    text/selector for footer headline
```

For each anchor, run both original and clone at the same CSS viewport and DPR. Save screenshot + JSON:

```json
{
  "target": "model",
  "viewport": {"width": 1000, "height": 1000, "dpr": 1},
  "scrollY": 3175,
  "scrollHeight": 6713,
  "scrollResult": {"found": true, "text": "THE MODEL THAT MAKES"},
  "samples": {
    "section": {"rect": "...", "font": "...", "transform": "..."},
    "h2": {"rect": "...", "fontSize": "...", "lineHeight": "..."},
    "footer": {"rect": "..."}
  }
}
```

If a user screenshot was captured in a split browser window, infer the real CSS viewport from browser chrome or reproduce the split-window viewport. Do not mix a 1000px source state with a 1440px clone state.

## 3. CSS / Framework Audit

Before blaming layout math, inspect computed boxes. This catches framework defaults that silently rewrite the design.

Audit at minimum:

- root/body font, `letter-spacing`, smoothing, background
- global `box-sizing`
- container width and `max-width`
- section `overflow`, `min-height`, `height`
- grid/flex columns, gap, align-items, justify-content
- image `object-fit` and `object-position`
- sticky/fixed transforms, hidden nav transforms
- z-index/opacity/filter of overlays and loaders
- `clip-path`, CSS masks, overflow, and DOM order for foreground layers that cover a mockup/device/dashboard

Tailwind-specific trap:

- `.container` has built-in breakpoint `max-width` unless overridden.
- If the source layout is full-grid/inset and clone `.container` is clamped to 768/1024/1280, the whole page drifts.
- Fix by using a project-specific class name or declaring `max-width: none` on the custom container.

DOM/CSS probe example:

```js
(() => {
  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      sel,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      display: s.display,
      grid: s.gridTemplateColumns,
      gap: s.gap,
      maxWidth: s.maxWidth,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      opacity: s.opacity,
      transform: s.transform,
      clipPath: s.clipPath,
      maskImage: s.maskImage || s.webkitMaskImage,
      zIndex: s.zIndex,
      overflow: s.overflow,
    };
  };
  return {
    scrollY: Math.round(scrollY),
    container: rect(".container"),
    section: rect("section"),
    h1: rect("h1"),
    h2: rect("h2"),
    footer: rect("footer"),
  };
})();
```

## 4. Data Cardinality and Assets

URL mode must extract the real data shape before implementing:

- number of project cards / partners / slides / gallery rows
- source image/video/font/SVG URLs and which ones are missing
- placeholder SVGs in source vs accidental placeholders in clone
- repeated rows caused by marquees vs accidental infinite loops

Failure signals:

- repeated project modules that do not exist in the source
- placeholder cards where source has real images
- source has 3 visible project cards but clone renders 13 generic placeholders
- image gaps are not marked and not replaced by generated briefs

## 5. Breakpoint and State Discipline

Record the viewport and state for every conclusion.

- A section can be two-column at 1000px and single-column at a different split-window width.
- A title can have different line breaks at 1000/1440/mobile.
- Sticky/pinned sections can look frozen if captured at the wrong scroll progress.
- Footer or title "auto layout" may be a responsive grid/flex state, not fixed absolute positions.

Never combine evidence from different states into one implementation target. If the user supplies screenshots from multiple viewport widths, implement the responsive breakpoint ladder and validate each width separately.

## 6. Overlay and Layer Discipline

Do not add overlays to make text readable unless the source has them.

When a foreground visual layer covers another element, classify it before patching:

```text
foreground scenery/matte/mask   # image-shaped occlusion, allowed only if source shows it
terminal black field            # black fill below foreground, should not cover visible subject
readability overlay             # synthetic veil, forbidden unless source proves it
opening-only overlay            # may exist only at matching timestamps
```

For every overlay-like layer, record:

```text
selector/name
source evidence: CSS/source/timestamp
state: opening-only | stable | hover | scroll-progress
z-index
background/color
opacity/filter/transform
exit condition
```

Failure signals:

- footer/CTA has a dark veil not present in original
- source overlay exists only during opening but clone keeps it stable
- clone hides content behind a synthetic gray layer
- clone uses a rectangular black block where the source uses a mountain/tree/foreground-shaped mask
- foreground scenery sits behind the mockup, letting the mockup cover the mountain/tree layer
- a mockup tail, top sliver, border strip, gradient strip, or dashboard bottom leaks into a region that should be pure black or foreground imagery

## 7. Scroll and Interaction Sampling

Minimum URL samples:

```text
opening frames
stable hero
source anchors: intro / projects / model / cta / footer
0%, 10%, 25%, 50%, 75%, 100% when source anchors are insufficient
one hover per interaction family
mouse-left / mouse-center / mouse-right for pointer-reactive sites
mobile hero / mobile menu / first mobile scroll state
```

For hero scenes where a foreground landscape covers a mockup/dashboard/device, add micro-frames across the first scroll transition, not just coarse page percentages:

```text
hero_occlusion_y000
hero_occlusion_y080
hero_occlusion_y120
hero_occlusion_y180
hero_occlusion_y240
hero_occlusion_y300
hero_occlusion_y360
```

Use source-equivalent scroll values when page height or smooth-scroll virtual coordinates differ. Store screenshot + JSON for each frame.

Store screenshot + JSON for each. Compare:

- canvas count/rects and custom elements
- video currentTime/paused/readyState
- fontVariationSettings if variable font is pointer/scroll reactive
- cursor rect/label/filter
- background/depth/canvas transform
- hover before/after color/background/transform/filter
- section rects and z-index/opacity/transform
- foreground mask layer rect, mockup rect, `clip-path`/mask/overflow, DOM order, and whether the black terminal field is pure black below the foreground

## 8. Fora Hero Occlusion Lessons

The Fora test exposed a specific failure family: a hero mockup/dashboard looked acceptable at rest but leaked rectangular tails and top/bottom strips while the foreground mountains moved during scroll.

Default checks for similar pages:

- Build the hero as a depth stack: background gradient/sky, far hills, mockup/dashboard/modal, near hills, foreground trees/mountain, terminal black field.
- Record the source layer order and scroll transforms before implementing. Foreground scenery must render above the mockup; the black field belongs below/behind the scenery, not as a visible rectangle over the subject.
- If the source has no stable dark overlay during scroll, do not add one. A black field is allowed only where the source is actually black.
- Avoid hard horizontal `clip-path` lines on visible mockups. If a crop is needed to prevent leakage, hide the crop behind the foreground shape or matte.
- Inspect the mockup entry animation as well as scroll frames; leaks often appear before the stable frame.
- Fail the clone if any dashboard/sidebar/border/gradient strip appears below the foreground layer, or if the foreground mountain/tree layer is behind the mockup.

Convert these into default checks for every URL clone with foreground occlusion, not one-off fixes.

## 9. Eleos Regression Lessons

The Eleos test exposed these concrete mistakes:

- Text/layout mismatch came from Tailwind `.container` max-width clamping the custom container; computed rects revealed `maxWidth` and wrong x/w values.
- Model section text was spread by `space-between`; the source groups title + description together and pins CTA separately.
- Source model cards were two-column staggered at the captured viewport; a different screenshot state showed single-column. The clone must match the viewport being tested.
- Repeated placeholder project modules came from treating source data as generic list filler instead of real home-project cardinality.
- Footer mismatch came from both scroll-position mismatch and wrong auto-layout values; same-text anchor comparison made the mismatch visible.
- Extra footer overlay was not in stable source state and had to be removed.
- Opening animation was not fade+translate; it was a strip/panel reveal captured only after clearing cache/fresh profile.

Convert these into default checks for every URL clone, not one-off fixes.

## 10. Pass/Fail Rule

Pass only when:

- build succeeds
- local preview runs
- `qa/compare/index.html` and `compare-report.json` exist
- original and clone are captured with the same viewport/DPR
- opening, scroll anchors, hover/pointer/mobile states were sampled as applicable
- no hard failure remains: missing loader, wrong tone, missing canvas/custom interaction, broken scroll/pin, hero foreground/mockup leakage, placeholder data, framework container drift, synthetic overlay, or timestamp-stacked layers

If a page contains a large 3D/WebGL/physics/video engine and strict reproduction is unlikely, stop before implementation and ask the user to choose the success target.
