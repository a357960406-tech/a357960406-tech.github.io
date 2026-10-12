# External Benchmarks · 可借鉴机制与边界

Purpose: keep lessons from adjacent mature tools without turning this skill into a different product. This skill remains **prompt-first**: screenshot/URL -> deterministic clone prompt -> ask user -> optional Codex implementation.

## Verdict Matrix

| Reference | What it is | Useful for this skill | Do not copy |
|---|---|---|---|
| `abi/screenshot-to-code` | Open-source screenshot/Figma/video-to-code app with model providers, tools, preview loop, asset extraction, and update modes | Prompt routing, design-system injection, asset extraction/generation split, screenshot preview regression, create/update plan separation | Do not become a code-only generator; do not allow `placehold.co`; do not require API keys just to emit prompt |
| `alyssaxuu/motionity` | Web-based motion graphics editor with keyframes, easing, masking, filters, Lottie, video export | Timeline vocabulary for micro-motion specs: keyframes, easing, duration, direction, text animation order, layer masks | Do not embed an editor; do not import its UI; do not overcomplicate simple landing-page motion |
| `CopyWeb` on mcp.so / copyweb.ai | Hosted website-copying product advertised for screenshot/URL/Figma to React/Vue/HTML/CSS | Confirms target user flow: input visual source, output framework code with assets and animations | Public page does not expose implementation/prompt internals; treat as product benchmark, not source material |

## Adopted Patterns

### 1. Prompt Construction Plan

Before writing the clone prompt, route the task:

```text
input_mode: screenshot | multi-screenshot | url | screenshot+url
target_stage: prompt-only | implementation-confirmed
asset_mode: image-gen-capable | fetch-only | original-src-required | replace-before-production
scope: visible-only | full-landing-page
```

Rules:
- `prompt-only` is default.
- `implementation-confirmed` is only allowed after the user confirms.
- Screenshot plus "site/landing page" implies `scope=full-landing-page` and requires inferred below-fold sections.
- Screenshot plus "hero/visible only" implies `scope=visible-only`.

### 2. Design System Injection

If the user provides a design system, prior clone prompt, MotionSites prompt sample, brand guide, or screenshots from the same site family, inject it as a high-priority block:

```text
DESIGN SYSTEM CONTEXT
If this conflicts with generic defaults, prioritize this block.
...
```

Do not let it override visible facts from the current screenshot/URL. Priority:
1. Current URL measured values
2. Current screenshot visible facts
3. User-provided design system / prompt corpus
4. Inference from industry and pattern library

### 3. Asset Strategy: Extract, Generate, Verify

Use this decision split, adapted from screenshot-to-code but aligned with our no-placeholder rule:

1. URL mode with stable public original asset -> pin exact `src`/`srcset`/CSS URL.
2. Screenshot mode and asset is a distinct crop-worthy element -> describe how the consuming agent may extract/crop it for authorized/internal work, but do not depend on user-supplied files in the portable prompt.
3. Missing, occluded, low-res, background, should not contain baked-in text, or not licensed for public release -> generate with a detailed art-direction brief.
4. If implementation-confirmed in Codex -> copy generated assets into project `public/assets/`, then inspect screenshots.

Never use `placehold.co`, `REPLACE-ME`, `source.unsplash.com`, or vague "hero image" placeholders.

### 4. Preview Regression Loop

When the user confirms implementation:

```text
build -> run dev server -> screenshot desktop -> screenshot mobile -> inspect layout/motion -> patch -> rebuild
```

Minimum checks:
- Screenshot mode registers every uploaded screenshot as a reference frame and captures a clone frame at the matching viewport/state for each one.
- URL mode first captures original-site opening and interaction evidence at the same viewport as the clone: first paint/loading frames, loader/brand intro, stable hero, mouse-left, mouse-center, mouse-right, first scroll transition, and one key hover state per interaction family.
- Compare structured state as well as screenshots: `canvas` count/rects, custom element/classes, headline `fontVariationSettings`, custom cursor rect/label, background/depth transforms, hover color/background/transform/filter deltas.
- Text visible after initial load; hero content must not depend only on IntersectionObserver.
- Desktop and mobile have no horizontal overflow.
- Generated images load from project-local paths.
- Hero photographic background has real video or **perceptible** code motion; verify computed transform or screenshot difference 3-5 seconds apart.
- Long-page screenshots include inferred below-fold sections and keep the same visual language.
- Inferred two-column sections balance visual mass: no short media beside tall text with a large blank gutter; media/text alignment and rounded corners look intentional.
- Micro labels (`EST.`, years, section numbers) align to their visual anchor, not to the wrong parent container.

### 4.1 Regression Lessons From 2026-06-28 Tests

Observed local tests:
- `web-clone-prompt-regression-20260628` / Regal Crest: screenshot-to-page path worked when visible pixels were treated as the authority, cropped into sections, and inferred below-fold sections kept the same design language.
- `web-clone-prompt-regression-20260628-partnom`: screenshot path improved through repeated full-page and hero-frame comparisons.
- `web-clone-prompt-regression-20260628-theunknown-url`: URL path exposed the hard case. The source `https://theunknown.tv/en` provided real fonts, assets, root color tokens, loader assets, canvases/custom elements, variable-font pointer behavior, smooth scroll, and hover/cursor states. The clone quality dropped when the workflow treated those as static design inspiration instead of runtime evidence.

Adopt these concrete fixes:
- Screenshot mode: split dense screenshots into local crops, describe each element group with exact design language, then compare the clone against every crop/frame and the whole screenshot.
- Screenshot mode: if a screenshot is cut off and the requested scope is a full page, auto-complete the missing sections from nav/industry/visual grammar and label inferred material; do not stop at the crop.
- URL mode: build a source evidence matrix first: opening timeline, rest state, pointer states, scroll anchors, hover states, mobile states, and JSON snapshots.
- URL mode: prefer original public images/videos/fonts/SVG/Lottie/CSS URLs for authorized/internal use. When extraction fails or the clone is intended for third-party public release, generate equivalent assets with image-generation briefs; never use placeholders.
- URL mode: preserve dynamic primitives as named runtime contracts. A source canvas, WebGL shader, smooth-scroll timeline, variable-font pointer ripple, custom cursor, or hover media swap cannot be silently downgraded to a static gradient/card.
- URL mode: measure tone from CSS variables/computed colors/frame samples. A background that is merely "purple/pink" but not the source hue/luminance is a failed clone.
- URL mode: layer timing matters. Opening-only elements, stable hero elements, and scroll-state elements must be compared at the same timestamp; stacking multiple timestamps together creates false overlaps.
- Implementation: if interaction feels laggy, fix the runtime path before handoff: pointer/scroll/canvas should use rAF, refs, transforms, and CSS variables rather than React state updates that re-render large trees every frame.
- Complexity gate: when a URL depends on a large 3D/WebGL/physics/video engine that is unlikely to be reproduced faithfully in the requested budget, stop and confirm the acceptable target: 100% replica attempt, high-fidelity reimplementation, or static approximation.

### 4.2 Regression Lessons From 2026-06-29 Eleos URL Test

Observed failure mode:
- URL clone looked close in isolated frames but failed under side-by-side scroll comparison: typography, layout, footer auto layout, loader timing, and repeated modules diverged.
- The root cause was not one CSS tweak. It was missing evidence: no fresh-profile loader replay, no same-viewport source-anchor comparison, no computed box audit, and no data-cardinality audit before claiming fidelity.

Adopt these concrete fixes:
- Always capture URL loaders/opening with a new browser profile, disabled cache, and cache-busting URL. One-time loaders cannot be judged from a browser session that has already seen the site.
- Compare original and clone by source anchors and identical CSS viewport/DPR, not by "roughly the same scroll." Emit `original_<anchor>.png`, `local_<anchor>.png`, `compare-report.json`, and a side-by-side `index.html`.
- Probe computed layout boxes before patching by eye. In Eleos, Tailwind's default `.container` max-width silently clamped the layout to 768px; the fix was to override `max-width` or avoid `.container`.
- Treat viewport-specific states as separate evidence. A single-column card stack, two-column stagger, footer crop, and title line breaks can all be valid at different widths; never mix them into one target.
- Preserve real source cardinality and assets. If the original home page shows a limited set of project cards with real images, do not render repeated placeholder modules just because source data contains more possible projects.
- Remove synthetic overlays unless the source proves they exist in the same state. A dark footer veil or CTA mask added for readability is a clone failure when absent in the stable original.
- Keep title/description/button group relationships from the source layout. Auto-layout effects are often flex/grid distribution, not fixed absolute positions; validate with bounding rects and grid/flex computed styles.

Use `references/url-regression-protocol.md` as the execution checklist for future URL implementation runs.

### 5. Motionity-Inspired Motion Vocabulary

For static screenshots, infer motion using timeline terms:

- `layer`: background media, veil, grain, nav, hero title, CTA, section cards.
- `keyframes`: exact from/to transform, opacity, filter, and time.
- `easing`: named or cubic-bezier array.
- `order`: forward/backward/letters/words when revealing text.
- `mask`: when spotlight, crop reveal, or liquid-glass borders are visible.

Example:

```text
Hero background pseudo-video:
Layer HERO_BG_STILL keyframes:
0%   transform scale(1.04) rotate(-1.8deg) translate3d(-3%, -1.6%, 0)
100% transform scale(1.18) rotate(1.8deg) translate3d(3%, 1.6%, 0)
duration 18-24s, easing ease-in-out, direction alternate, repeat infinite, transform-origin center.
```

## Rejection Rules

- Do not switch this skill's primary output from prompt to code.
- Do not start implementation after producing the prompt without user confirmation.
- Do not copy screenshot-to-code's placeholder policy; placeholders are failures here.
- Do not depend on closed CopyWeb behavior because it is not publicly inspectable.
- Do not make Motionity-style timeline complexity mandatory for small hover/fade interactions; use it where it improves fidelity.
