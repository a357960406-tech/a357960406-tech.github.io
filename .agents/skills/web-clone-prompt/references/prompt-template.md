# MASTER PROMPT TEMPLATE — "1:1 Website Clone Prompt"

> **What this is.** A fill-in skeleton for writing a *website clone prompt* — the kind an AI coding agent reads to reproduce a landing page pixel-for-pixel (motionsites.ai style). Fill every slot with **literal values, not vague descriptions**. The golden rule across all 11 reference prompts: *transcribe, never paraphrase.* Every color is an exact hex/rgba, every class is a verbatim Tailwind string, every asset is either a precise generation brief or a full literal URL when the original/stable fallback exists, every animation is exact numbers, every word of copy is quoted character-for-character.
>
> **How to use.** Walk the blocks top-to-bottom. Skip a block only when the target page genuinely lacks it (e.g. a single-hero page has no multi-section list; an animation-light page has no shared animation components). Keep `<<ANGLE-BRACKET PLACEHOLDERS>>` as your fill targets. Annotations are in `> blockquotes` and `<!-- comments -->` — delete them in the final prompt, but keep the usage-scope line.
>
> **Authorization boundary.** Exact clone prompts are for user-owned pages, authorized work, internal research, or local visual regression. If the source is a third-party page and the user intends public release, the final prompt must replace third-party brand names, copy, trademarks, proprietary media, and proprietary fonts with user-owned or licensed equivalents while preserving layout and motion.
>
> **Precision legend** (used in every slot below):
> - **VERBATIM** = copy exactly, character-for-character (copy, URLs, class strings, CSS, path data).
> - **EXACT-VALUE** = a literal number/token, never a vague word (`#e8702a` not "orange"; `0.42s` not "a short delay"; `text-8xl` not "large").
> - **ENUMERATED** = a fixed ordered list; order is load-bearing.
> - **NAMED-CONTRACT** = define once by name + full behavior, then reference by name everywhere else.

---

## BLOCK 0 — OPENING BRIEF (the one-sentence lock)

**Slot name:** `opening_brief`
**What to write:** A single dense imperative sentence (optionally a labeled title line above it) that front-loads, *in this order*:
1. **Build verb + deliverable + scope** — `Create`/`Build`/`Recreate` + page type + viewport footprint (`landing page` / `full-screen hero section` / `single-page site with exactly N full-screen sections`).
2. **Product identity** — brand name **in quotes** + one-line vertical/positioning appositive.
3. **Section map** — the section count and names (for multi-section pages) OR the signature mechanic (for single-hero pages).
4. **Exact tech stack inline** — framework + bundler + language + CSS + animation lib + icon lib, `+`-joined or comma-joined.
5. **Dominant aesthetic** — the mood + the 1–2 non-negotiable global invariants (bg color, text color, key font, the core compositional device like "full-viewport video backgrounds").
6. *(Optional but powerful)* a **determinism oath**: `Match every detail below exactly.`

**Precision:** EXACT-VALUE for stack tokens and brand name; the aesthetic clause may be prose but must name concrete invariants.

**Fill-in pattern / examples (from the corpus):**
```
USAGE SCOPE: internal visual regression / authorized clone. Original third-party assets, brand names, and copy are reference evidence only; replace before production unless licensed.

Create a React + Vite + TypeScript + Tailwind CSS landing page for a creative studio
called "Prisma". The page has 3 sections: Hero, About, and Features. Use framer-motion
for animations and lucide-react for icons. The design is dark, moody, and cinematic with
a warm cream color palette.
```
```
Build a single-page landing site for "SynapseX" — a futuristic neural-AI interface product.
The entire site uses a black background with white text and full-viewport video backgrounds.
The primary font is "Space Mono" (monospace) for all text. Use React + TypeScript + Vite +
Tailwind CSS + Framer Motion.
```
```
Build a full-screen, dark-themed hero section for a geology brand called **Lithos**, using
**React 18 + TypeScript + Vite + Tailwind CSS** and **lucide-react** for icons. The signature
feature is a **cursor-following spotlight that reveals a second image**… Match every detail below exactly.
```
> **Single-section variant:** if cloning only a hero, say so explicitly (`Recreate this hero section exactly. Here are the complete specifications:`) so the AI doesn't invent extra sections.

---

## BLOCK 1 — TECH STACK (pinned)

**Slot name:** `tech_stack`
**What to write:** The exact dependency set, version-pinned where reproducibility matters. Include: framework + version, bundler, language, CSS system + version, animation lib + version, icon lib + version, font source, and any special runtime (canvas, WebGL/OGL/three, shaders, custom elements, ResizeObserver, Lenis, rAF, pointer tracking, variable fonts). State a **negative constraint** to lock the set (`No other UI libraries.`). If CDN-only (in-browser Babel build), give the full `<script>` tags **with SRI integrity hashes** verbatim.

**Precision:** EXACT-VALUE (caret-pinned semver like `^12.40.0`); VERBATIM for `<script>`/SRI tags; explicit exclusion clause.

**Fill-in pattern:**
```
- React 18 (react, react-dom ^18.3.1)   - TypeScript   - Vite   - Tailwind CSS ^3.4.1
- Framer Motion ^12.40.0   - lucide-react ^0.344.0
- URL-derived motion runtimes if present: GSAP/Lenis/OGL/WebGL canvas/custom cursor/variable-font pointer ripple, with exact component contracts below
- Google Fonts: <<FONTS>>
- No other UI libraries.   <!-- locking exclusion -->
```
```json
"framer-motion": "^12.40.0", "lucide-react": "^0.344.0", "react": "^18.3.1", "react-dom": "^18.3.1"
```
> Put this block early if the page is animation-heavy (so APIs are known before sections); a **recap copy at the very end** (Block 11) is also conventional.

---

## BLOCK 2 — FONTS

**Slot name:** `fonts`
**What to write:** For each typeface: exact family name, source (Google Fonts query string / CDN URL with hash) **verbatim**, exact weight + ital axes, and its **role** ("global default", "italic display accent", "body"). Then the **global `font-family` CSS rule** verbatim, the **`tailwind.config` `fontFamily` extension** (token → stack tuple), and any **global override** (e.g. all `sans/serif/mono` keys → one font; default `borderRadius` override).

**Precision:** VERBATIM URLs + CSS rule + config tuple; EXACT-VALUE weight lists; explicit role per font.

**Fill-in pattern:**
```
Load in index.html / @import:
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500;1,600&display=swap');

- Body/UI font: Inter (300,400,500,600,700) — global default.
- Display accent: Playfair Display, italic only — wordmark + accent headings.
Global rule: * { font-family: 'Inter', sans-serif; }
tailwind.config → fontFamily.serif: ['"Instrument Serif"', 'serif']
(SynapseX-style override: ALL Tailwind fontFamily keys sans/serif/mono → "Space Mono", monospace)
```

---

## BLOCK 3 — COLOR SYSTEM

**Slot name:** `color_system`
**What to write:** Every color as an **exact hex or rgba**, each **bound to the surface/role it paints** (global bg, card bg, primary text, secondary text, nav link, accent, hover, border). Distinguish near-identical values **and how each is applied** (Tailwind class vs inline style). Use opacity-slash tokens where the source does (`text-white/70`, `bg-black/20`, `border-white/10`). State any **negative palette constraint** (`No purple, no indigo.`).

**Precision:** EXACT-VALUE hex/rgba with role attached; note application method when two values are nearly identical; prohibitions explicit.

**Fill-in pattern:**
```
- Background: #000000 globally; #101010 About card; #212121 Features cards
- Primary text: #E1E0CC (applied via inline style) — note: differs from Tailwind primary #DEDBC8 (used in text-primary, text-primary/70)
- Nav link: rgba(225,224,204,0.8), hover #E1E0CC (inline styles)
- Accent/CTA: bg-[#e8702a] hover:bg-[#d2611f], hover shadow-[#e8702a]/30
- Secondary text: white/70 ; borders: white/10
- No purple, no indigo.
```
> If colors are few, you may inline them per-element instead of a table (single-hero prompts often do). For multi-section pages, a dedicated table prevents drift.

---

## BLOCK 4 — ASSET MANIFEST (generation briefs first)

**Slot name:** `asset_manifest`
**What to write:** Start with `target_asset_mode`. Default is `image-gen-capable` for Codex environments with image generation access, Gemini, v0, Lovable, and bolt: every media asset is a **precise generation brief** that the consuming AI can materialize with no user-supplied files. Use a full literal URL only when URL mode exposes a stable original `src` and the work is authorized/internal, or when `target_asset_mode=fetch-only` requires one verified free-stock fallback per asset. For third-party public release, mark original source URLs as `internal reference only / replace before production` and provide replacement generation briefs. Label each asset by role and alias reused assets to **named constants** (`HERO_BG`, `CARD_IMG_1`). For videos annotate **playback mode** (`autoplay muted loop` vs `mouse-scrubbed, NOT autoplay`) and `object-fit`/`object-position`. For hero/background stills, also prescribe the **code motion** that gives the still image video-like life.

**Precision:** Structured generation briefs with medium, camera angle, lens feel, crop, composition grid, foreground/midground/background, subject details, live-text safe area, palette lock, lighting, texture/style, negative constraints, delivery, and optional code-motion values; VERBATIM URLs when used (incl. query strings); EXACT-VALUE playback attributes; named constants for reuse.

**Fill-in pattern:**
```
target_asset_mode: image-gen-capable. Generate assets from these briefs when the consuming environment has image generation access; no files required.

HERO_BG_VIDEO [VID, 16:9, seamless loop, autoplay muted loop playsinline, object-cover]:
  cinematic drone push over <<subject>>, <<composition>>, palette locked to #0C0C0C / #E1E0CC / #e8702a,
  <<lighting>>, <<style>>, no visible text, no watermark, no logo, no UI.
  object-position: center center.

HERO_BG_STILL [IMG, 16:9, generate with available image tool, use as animated pseudo-video background]:
  Medium: photoreal editorial aerial still for the hero background.
  Camera: <<top-down drone / high oblique aerial>>, <<wide-angle / telephoto>> feel.
  Composition: <<diagonal structure + focal masses + low-detail safe area for live title + object-position>>.
  Subject details: <<specific forms, textures, props, environment details; no generic nouns only>>.
  Palette lock: match <<hex + color word>> / <<hex + color word>> / <<hex + color word>>, desaturated, no off-palette hues.
  Lighting/style: <<soft golden hour / overcast / haze / film grain / luxury editorial>>.
  Negative constraints: no visible text, no watermark, no logo, no letters, no signage, no UI.
  Code motion: animate image layer `scale 1.04 → 1.18`, `rotate(-1.8deg) → rotate(1.8deg)`,
    `translate3d(-3%, -1.6%, 0) → translate3d(3%, 1.6%, 0)`, duration 18–24s,
    `ease-in-out`, repeat infinite mirror; add `will-change: transform`, `transform-origin: center`.
  Delivery: object-cover; object-position <<x% y%>>; overlay <<veil/noise>>.

DEVICE_OR_MOCKUP_PHOTO [IMG, <<reference aspect>>, generate with available image tool, use as bitmap layer]:
  Medium: photorealistic monochrome/editorial device or product mockup matching the screenshot, not a generic catalog product shot.
  Camera: <<exact angle from screenshot: three-quarter front / over-the-shoulder / hand-held close-up / high oblique>>, <<lens feel>>.
  Composition: <<subject scale and placement as percentages; crop boundaries; what overlaps live page text; where live overlays attach>>.
  Screen/content state: <<blank only if reference is blank; otherwise describe visible UI/screen composition, major readable headline, image blocks, small columns; exact page text can remain live overlay if needed>>.
  Light/shadow geometry: <<hard diagonal shadow from upper-left / window stripe / soft gray studio / backlit silhouette>>, with direction and shape.
  Palette lock: match <<hex + color word>> / <<hex + color word>> / <<hex + color word>>, avoid off-palette hues.
  Negative constraints: no watermark, no unrelated logos, no extra devices/people unless visible, no generic blank screen if the reference screen has content.
  Motion/placement: initial state <<y/opacity/scale>> → final captured state <<y/opacity/scale>>, trigger <<delay/scroll progress>>, final layer order <<behind title / over lower half of title / under nav pill>>.

CARD_IMG_1 [IMG, 4:5]:
  Medium/camera/composition/subject details/palette/light/style/delivery all specified:
  <<subject>>, <<camera angle>>, <<crop and live-text safe area>>, <<specific visible details>>,
  same palette as page, <<lighting>>, no visible text/watermark/logo.
  target_asset_mode=fetch-only fallback only if requested: https://images.unsplash.com/photo-<verified-id>?w=1200&q=80&auto=format&fit=crop

If URL mode exposes stable original media, override the generated brief with:
ORIGINAL_HERO_VIDEO (use exactly): https://...full-original-url.mp4?query=params
ORIGINAL_DEPTH_COLOR_TEXTURE (use exactly): https://.../mountain.webp
ORIGINAL_DEPTH_MAP (use exactly): https://.../depth.png
ORIGINAL_LOGO_JSON_OR_SVG (use exactly): https://.../logo.json OR raw SVG path data
```

---

## BLOCK 4B — REFERENCE FRAMES / REGRESSION TARGETS

**Slot name:** `reference_frames`
**What to write:** A fixed list of source frames that must be matched after implementation. Screenshot mode uses user-uploaded screenshots and their crops/subframes. URL mode uses browser-captured frames from first paint/opening/stable/hover/scroll states. This block is not optional when the input contains screenshots or a URL with motion. The target is strict visual parity, not approximate inspiration.

**Precision:** ENUMERATED; each frame includes input file or captured URL state, viewport, timestamp/scroll/pointer state, visible section, and what counts as a pass.

**Fill-in pattern:**
```
REFERENCE_FRAMES / VISUAL REGRESSION TARGETS
- REFERENCE_FRAME_01_SCREENSHOT: input `landing-hero.png`, viewport/aspect <<1440x900>>, visible section Hero, exact visible crop. Pass = clone screenshot at same viewport matches typography, color, layout, imagery, and visible state.
- REFERENCE_FRAME_01_CROP_A: crop from `landing-hero.png`, rect <<x,y,w,h>>, visible element group <<nav/logo/title/media>>, pass = local alignment, spacing, font, color, and z-order match before judging whole page.
- REFERENCE_FRAME_02_SCREENSHOT: input `section-2.png`, viewport/aspect <<...>>, visible section <<...>>, pass criteria <<...>>.
- URL_FRAME_T000_OPENING: captured from <<URL>>, timestamp <<0ms/first paint>>, state <<blank/loading/head/brand>>, pass criteria <<...>>.
- URL_FRAME_T5000_OPENING: captured from <<URL>>, timestamp <<5000ms>>, state <<head-C5MOojJn.webp visible over #fff6f1>>, pass criteria <<...>>.
- URL_FRAME_HERO_OCCLUSION_Y180: captured from <<URL>>, viewport <<...>>, scrollY/source-equivalent <<180>>, state <<foreground mountain/tree mask covering dashboard/mockup>>, pass criteria <<foreground layer above mockup, no mockup tail/sliver/gradient strip leaks, no source-absent overlay, terminal field is pure black where source is black>>.
- URL_FRAME_MOUSE_CENTER: captured from <<URL>>, pointer (50%,50%), state <<variable font/canvas/cursor>>, pass criteria <<fontVariationSettings and transform visibly change>>.
- URL_FRAME_SCROLL_25: captured from <<URL>>, scroll progress <<25% or source anchor>>, state <<sticky/scrub/color transition>>, pass criteria <<same section position, layer order, transforms, and background tone>>.
- URL_FRAME_HOVER_PROJECT: captured from <<URL>>, pointer target <<selector>>, state <<cursor label/media swap/card transform>>, pass criteria <<before/after diff matches>>.
```

For URL mode add a **SOURCE MOTION EVIDENCE** sub-block:
```
SOURCE MOTION EVIDENCE
- complexity: <<simple DOM / smooth-scroll+GSAP / canvas-WebGL / full 3D engine / video-physics>>
- risk confirmation required: <<yes/no + reason>>
- root colors sampled: <<--color-dark #4c1b5e, ...>>
- canvas/custom elements: <<count + tag names>>
- opening layers: <<stage/timestamp/z-index/opacity/transform/exit>>
- scroll primitives: <<smooth scroll lerp, sticky pins, scrub ranges, color fields>>
- foreground occlusion stack: <<background/far landscape/mockup/near landscape/foreground/matte/black field with DOM order + z-index + scroll transforms + clip/mask leak guard>>
- pointer/hover primitives: <<variable font axes, cursor follower, hover media swap>>
- performance contract: pointer/scroll/canvas updates use rAF + refs/CSS variables, not per-frame React state for large DOM.
```

---

## BLOCK 5 — CUSTOM CSS UTILITIES

**Slot name:** `custom_css_utilities`
**What to write:** Any non-Tailwind reusable effect as a **named class with the full CSS block reproduced verbatim** — glassmorphism (`.liquid-glass`), noise overlays (SVG `feTurbulence baseFrequency/numOctaves`), gradient-clip text classes, gradient-stroke borders (incl. the `::before` mask trick `-webkit-mask-composite: xor; mask-composite: exclude`). Define **variants as a diff** from the base (`/* same but: */ backdrop-filter: blur(50px)`). Also place global reset / smoothing / `@tailwind` directives here.

**Precision:** VERBATIM full CSS (exact rgba alphas, exact blur px, exact `::before` padding like `1.4px`, exact gradient stops); variant-as-diff notation.

**Fill-in pattern:**
```
.liquid-glass {
  background: rgba(255,255,255,0.01);
  backdrop-filter: blur(4px);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
}
.liquid-glass::before { /* gradient-stroke border */
  padding: 1.4px;
  background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, …0.15 20%, 0 40%, 0 60%, …0.15 80%, …0.45 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
.liquid-glass-strong { /* same but: */ backdrop-filter: blur(50px); }

.hero-heading { background: linear-gradient(180deg,#646973 0%,#BBCCD7 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
```

---

## BLOCK 6 — CUSTOM / SVG COMPONENTS (non-animation)

**Slot name:** `custom_components`
**What to write:** Inline SVG logos/icons by **exact geometry** — `viewBox`, `fill` (`currentColor` if it inherits text color), and the **full `d`/polygon path string** verbatim — so glyphs are byte-reproducible without an icon library. Also define any structural component contract that isn't an animation (e.g. `RevealLayer({image,cursorX,cursorY})` canvas masking, `ScaledDashboard` ResizeObserver scaling at a fixed design width). State **what is NOT needed** (`no external icon library needed for these`).

**Precision:** VERBATIM path data + viewBox + fill; NAMED-CONTRACT with prop signature + step-by-step internal behavior.

**Fill-in pattern:**
```
Logo SVG: 26×26, viewBox "0 0 256 256", fill="#ffffff",
  d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z"

RevealLayer({ image, cursorX, cursorY }): hidden <canvas> sized to window; reveal <div> bg=image;
  each render → clear → radial gradient at (cursorX,cursorY) 0→SPOTLIGHT_R with stops
  [0→rgba(255,255,255,1), 0.4→1, 0.6→0.75, 0.75→0.4, 0.88→0.12, 1→0] → fill arc → toDataURL()
  → apply as maskImage/webkitMaskImage, maskSize '100% 100%'.
```

**URL-derived custom elements / canvas primitives:** if the original site exposes custom motion tags or canvas effects, define them here or in Block 8 by name, using source-derived values. Do not bury them as prose inside a section.
```
AuroraCanvas / c-aurora:
  Parent: #home__background, fixed/full-viewport canvas, z-index <<N>>.
  Source-derived colors: <<#FF5462>>, <<#C138EB>>, <<#FFB61E>>, <<#E6349A>>.
  Uniforms/params: scale <<0.48>>, frequency <<20.3>>, speed <<2.91>>, amplitude <<2.43>>;
  mouse uniform maps to eased pointer `[-x*.33, y*.33, 0, 0]`; resize canvas to viewport * DPR.

ParallaxDepth / c-parallax-depth:
  Color texture URL: <<ORIGINAL_DEPTH_COLOR_TEXTURE>>; depth map URL: <<ORIGINAL_DEPTH_MAP>>;
  fragment shader offsets color texture by depth; strength <<0.1>>;
  mouse x maps to uv offset <<0.47→0.53>>; opening state bottom:-50vh → bottom:0 over <<1050ms>>.

LiquidCursor / c-liquid-cursor:
  Rest 24x24 fixed follower; expanded <<54px high, fit-content width, px-6>> on `[data-cursor]`;
  follower lerp <<0.1>>; filter/backdrop CSS verbatim; label text comes from trigger content.
```

---

## BLOCK 7 — SECTION-BY-SECTION  ⟦REUSABLE SUB-TEMPLATE — repeat per section⟧

> First emit a **SECTION ORDER manifest** (ENUMERATED list of section component names in render order). Then repeat the sub-template below **once per section**, in DOM/visual order, delimited by `---`. For a single-hero page, the "sections" become functional zones (Video / Nav / Hero Content / CTA) but use the same sub-fields.

**Section manifest example:** `HeroSection / MarqueeSection / AboutSection / ServicesSection / ProjectsSection`

### ↓↓↓ COPY THIS BLOCK PER SECTION ↓↓↓
```
#### SECTION <<N>>: <<Name>>  (<<sizing convention, e.g. full viewport height (h-screen) / min-h-screen / pure black, no video>>)

- **Container / layout:** <<flex|grid spec + overflow + padding, VERBATIM Tailwind incl. responsive prefixes>>
    e.g. relative h-screen overflow-hidden bg-black ; p-4 md:p-6 ; 12-column grid: left 8 cols heading, right 4 cols
- **Layout QA / alignment contract:** <<visual balance rules for this section: column ratio, equal-height media/text when needed, top/bottom alignment, side-label anchoring, long-word fit, rounded-corner clipping>>
    e.g. two-column media/text section uses `md:grid-cols-2 md:items-stretch`; media `md:h-full md:min-h-[520px]`; text wrapper `flex h-full min-h-[520px] flex-col justify-between`; no blank gutter below the shorter column
- **Background:** <<asset constant + generation brief/URL + playback mode + object-fit + inline scale style>> OR <<exact bg color, "no video">>
    e.g. Video #2, autoplay muted loop, object-cover ; OR pure black background, no video
- **Overlays:** <<gradient/dot-grid/noise/watermark layers — exact gradient string + opacity + z-index + blend mode>>
    e.g. top gradient 180px linear-gradient(#010103→transparent) z-10 ; .noise-overlay opacity-[0.7] mix-blend-overlay
- **Z-order / DOM flow:** <<arrowed child order>>  e.g. z-10 layer holds: Navbar → Hero content → Partners
- **Sub-elements (top-to-bottom), each its own labeled block:**
    <<Navbar:>>   container Tailwind string · child list · verbatim copy
    <<Heading:>>  component used (e.g. WordsPullUp / ScrambleIn) · responsive type ladder · color · per-element animation
    <<Body / CTA / Cards:>>  …
- **Content / copy (VERBATIM):** <<every visible string in quotes, incl. <br> splits, em-dashes, &apos;, casing quirks>>
    e.g. heading "Prisma" ; nav "Our story","Collective","Workshops","Programs","Inquiries" ; CTA "Join the lab"
- **Typography (per text element, EXACT-VALUE):** <<full responsive size ladder + weight + leading + tracking + color>>
    e.g. text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] / font-medium leading-[0.85] tracking-[-0.07em] / #E1E0CC
    fluid: clamp(48px,10vw,96px)
- **Animation (EXACT-VALUE):** <<from-state (y/opacity/blur/filter) → to-state · duration · delay · easing array · stagger · trigger hook>>
    e.g. fade up y:20→0, delay 0.5s, ease [0.16,1,0.3,1] ; cards scale 0.95→1, useInView(once, margin "-100px"), stagger 0.15s, ease [0.22,1,0.36,1]
- **Per-card / per-item dataset (if repeating):** <<numbered rows: index + title + bg hex + asset constant/icon name + checklist count + link treatment>>
    e.g. Card 2 "Project Storyboard." (01): bg-[#212121], icon <URL>, 4 Check items, "Learn more" arrow rotated -45deg
- **Responsive:** <<per-element hide/show + scale across sm/md/lg/xl>>
    e.g. grid 1-col(mobile)→2(md)→4(lg) ; center nav pill hidden below md ; bottom-left paragraph hidden sm:block
```
### ↑↑↑ END PER-SECTION BLOCK ↑↑↑

**Precision for the whole sub-template:** copy = VERBATIM; class strings = VERBATIM (incl. arbitrary `[..]` values); colors = EXACT-VALUE hex; animation = EXACT-VALUE numbers + easing arrays; z-index/grid = EXACT-VALUE; lists = ENUMERATED in order.

> **Determinism tips inside sections:** narrate children in DOM order; pin z-index numerically; reuse named components (Block 8) and named CSS classes (Block 5) by name; echo padding rather than restating (`same horizontal padding as navbar`); add negative constraints inline (`NO dark overlay, NO gradient overlay — video plays raw`).

---

## BLOCK 8 — SHARED ANIMATION COMPONENTS  (NAMED-CONTRACT, define once)

**Slot name:** `shared_animation_components`
**What to write:** Each reusable motion primitive defined **once** by: name + prop signature + **full algorithm/lifecycle** + exact framer-motion or CSS-keyframe params. Cover: text reveals (`WordsPullUp`, `BlurText`, `ScrambleIn`/`ScrambleText` — give the char set, ms interval, chars/frame, reveal direction, IntersectionObserver threshold), entrance wrappers (`FadeIn`, `StaggeredFade` — `useInView(once:true)`, per-char `delay i*0.07`), video crossfaders (`FadingVideo` — named constants `FADE_MS=500`, `FADE_OUT_LEAD=0.55`, per-event behavior, `loop` OFF), and URL-derived primitives (`AuroraCanvas`, `ParallaxDepth`, `VariableFontPointerText`, `LiquidCursor`, `SmoothScrollProgress`) when source evidence shows them. Reference these **by name** from sections. If using hand-written CSS instead of framer-motion, define the `@keyframes` + `.animate-*` utility classes here with exact `duration` / `cubic-bezier` / `fill-mode`, plus a `prefers-reduced-motion` guard.

**Precision:** NAMED-CONTRACT; EXACT-VALUE for every keyframe target, ms timing, stagger formula, threshold, easing.

**Fill-in pattern:**
```
BlurText: split text on spaces; each word a motion.span,
  initial {filter:'blur(10px)', opacity:0, y:50} → {filter:'blur(0px)', opacity:1, y:0},
  duration 0.7s, stagger = i*100/1000 s, IntersectionObserver threshold 0.1.

FadingVideo (custom rAF crossfade, NO CSS transitions): FADE_MS=500, FADE_OUT_LEAD=0.55;
  on loadeddata fade in 500ms; on timeupdate when (duration-currentTime ≤ 0.55 && >0) fadeTo(0);
  on ended setTimeout(100ms) reset currentTime=0; loop attribute OFF.

VariableFontPointerText:
  Split the headline into word spans, then character spans `.hero-char`.
  Pointer singleton starts at x=window.innerWidth/2, y=-100+scrollY; update on `pointermove`, lerp current pointer by <<0.1>> each rAF.
  For each char center, compute distance to pointer; influence = clamp(1 - distance / <<400>>, 0, 1), smoothstep it.
  Apply `font-variation-settings: "wght" <<300→900>>, "Wide" <<0→10>>` per char every frame.
  Update scroll offset if smooth-scroll changes y; cleanup listener + cancel RAF.

OpeningTimeline:
  Define exact source-observed order: background canvas visible → depth layer bottom:-50vh to 0 over <<1050ms>> →
  ring/media top:100vh to center over <<1550ms>> → title words y:160→0, delay <<1s>>, stagger <<0.1s>>, duration <<0.45s>> →
  baseline/CTA opacity 0→1. Captured/final state may intentionally overlap title.

OpeningSequence / LoaderIntro:
  Use for URL-captured first impression before stable hero.
  Stage 0: blank/loading surface bg <<#fff6f1>>, duration or condition <<image loaded / 0-900ms>>.
  Stage 1: primary subject asset <<HEAD_OR_PRODUCT_URL>>, rect <<x/y/w/h or CSS>>, opacity/filter <<0 + blur-xl → 1 + blur-0>>,
    transition <<1000ms cubic-bezier(.77,0,.175,1)>>.
  Stage 2: brand/color field <<gradient/logo/wordmark>>, reveal <<height 0→100vh over 1250ms>>, z-order <<...>>.
  Stage 3: exit overlay <<height 100vh→0 over 550ms>>, filter <<brightness(1)→brightness(.8) blur(3px) over 450ms>>,
    then `display:none`/unmount after transition end.
  Stage 4: stable hero appears with continuing canvas/mouse/scroll behavior.

CSS variant — index.css:
  @keyframes fade-up {0%{opacity:0;transform:translateY(24px);filter:blur(6px)}100%{...0...}}
  .animate-fade-up{animation:fade-up .9s cubic-bezier(0.22,1,0.36,1) both;}
  stagger via inline [animation-delay:Xms]: 0 → 100ms → 220ms → 340ms → 460ms → 620ms
  @media (prefers-reduced-motion: reduce){ disable all animations }
```

---

## BLOCK 9 — RESPONSIVE

**Slot name:** `responsive`
**What to write:** Either a **breakpoint matrix** (per-element px/utility per `<640/640/768/1024/1280` column) or a prose list of per-element hide/show + scale rules. State the mobile-first convention and any special viewport units (`min-h-[100svh]`, dual `h-screen` + `h-[100dvh]`) **with rationale** (`so mobile browser chrome doesn't clip the section`).

**Precision:** EXACT-VALUE per breakpoint; spell out `sm/md/lg/xl` rather than "responsive".

**Fill-in pattern:**
```
Mobile-first; breakpoints sm/md/lg/xl.
- Headline: text-5xl → sm:text-7xl → md:text-8xl
- Features grid: 1-col → md:2-col → lg:4-col
- Center nav pill & desktop CTA: hidden below md ; hamburger: md:hidden
- All h-screen elements also carry h-[100dvh].  Section height uses 100dvh (mobile chrome).
```
> Many single-hero prompts skip a standalone block and inline responsive prefixes in every class string instead — that's acceptable if every element already carries its `sm:/md:/lg:` ladders.

---

## BLOCK 10 — KEY DESIGN PRINCIPLES / TECHNICAL DETAILS  (guardrail recap)

**Slot name:** `guardrails`
**What to write:** A closing bullet list that **restates cross-cutting invariants** and catches edge cases that belong to no single section: global wrapper `fontFamily`, dual-height rule, the hero scrub `seeked`-chaining, the `useScroll/useSpring/useTransform` pipeline params, glass = near-invisible fill + gradient-stroke border, and **negative constraints** (`No external state management, no routing, no database`; `No dark overlay`; `rounded-full for buttons, rounded-2xl for containers`). This is a redundant consistency check on purpose.

**Precision:** EXACT-VALUE invariants + explicit prohibitions.

**Fill-in pattern:**
```
- App wrapper inline style fontFamily: '"Space Mono", monospace'.
- All h-screen elements also have h-[100dvh].
- No dark overlay on video — contrast comes from glass chrome + text.
- rounded-full for buttons/inputs, rounded-2xl for containers.
- Heading font is always italic with very tight negative tracking; body font is light weight.
- No external state management, no routing, no database — pure single-page React app.
```

---

## BLOCK 11 — TECH STACK RECAP  (closing checklist)

**Slot name:** `tech_stack_recap`
**What to write:** A short re-statement of Block 1 as a closing checklist (and a `Dependencies` package list if not already given). Acts as a confirmation that the implementer has every dependency. May also end with a **completeness assertion**.

**Precision:** EXACT-VALUE; mirror Block 1.

**Fill-in pattern:**
```
TECH STACK
Vite + React 18 + TypeScript ; Tailwind CSS 3 ; framer-motion (all animations) ; lucide-react (ArrowRight, Check)

Dependencies: react, react-dom, framer-motion, tailwindcss, postcss, autoprefixer, vite, @vitejs/plugin-react, typescript

The detailed prompt above captures every element, style, animation, asset brief/URL, and font to recreate the page exactly.
```

---

## QUICK CHECKLIST BEFORE YOU SHIP THE PROMPT
- [ ] Opening sentence carries **stack + product + section map + key libs + aesthetic** before any detail.
- [ ] Usage scope is explicit: authorized/internal clone, or third-party public release with brand/copy/media/font replacements before production.
- [ ] **Every** color is exact hex/rgba with a role; near-duplicates explain their application method.
- [ ] Screenshot mode: every uploaded screenshot is registered as `REFERENCE_FRAME_N` with viewport/aspect, visible section, and pass criteria; implementation must compare against all frames, not just the first.
- [ ] Screenshot mode: if the screenshot is dense or truncated, it is cropped into local reference frames and the prompt includes a split-screen parsing plan; truncated pages are completed automatically when scope is a full website/landing page.
- [ ] URL mode: opening/loader/first-paint frames are captured before the stable hero; if there is a loader/person/product/wordmark transition, the prompt includes `OpeningSequence / LoaderIntro` with assets, stages, timings, and exit behavior.
- [ ] URL mode: complex 3D/WebGL/video/physics pages have a success-target confirmation block before promising strict 100%.
- [ ] URL mode: source tone is measured by root variables/computed styles/frame samples; background shader/gradient/video colors are not guessed from a final screenshot alone.
- [ ] URL mode: scroll states are captured at source anchors or 0/10/25/50/75/100%, and the prompt specifies sticky/pin/scrub/color-field behavior instead of merely making the page scroll.
- [ ] URL mode: same-viewport source-anchor comparison is planned for implementation (`original_<anchor>.png`, `local_<anchor>.png`, `compare-report.json`, side-by-side `index.html`); no claim of "逐屏对比" without these artifacts.
- [ ] URL mode: one-time opening/loader is captured with fresh browser profile, cache disabled, and cache-busting URL; not from a session where localStorage/session/cache already skipped the intro.
- [ ] URL mode: layer timing is explicit enough that opening-only layers cannot accidentally stack into the stable hero.
- [ ] URL mode: pointer/scroll/hover runtime uses rAF/CSS variables/refs where needed; janky interaction is treated as a failed clone.
- [ ] URL implementation: CSS/framework defaults are audited with computed styles and bounding rects. Tailwind `.container` max-width, global body font/letter-spacing, section overflow, sticky/fixed transforms, and image object-position cannot silently alter the source grid.
- [ ] URL implementation: source data cardinality is preserved. Project cards, partners, galleries, and repeated modules match the source; placeholders only appear if the original truly uses placeholders or the prompt marks a verified asset gap with a generation brief.
- [ ] URL implementation: no synthetic overlay/mask/veil is added unless the source has that layer in the same timestamp/scroll state.
- [ ] URL implementation: each comparison states the CSS viewport/DPR. Do not mix desktop, split-window, and mobile breakpoint states into one target.
- [ ] **Every** asset has a generation brief with medium, camera angle, composition, subject details, palette lock, lighting, texture/style, delivery, and no-text/no-watermark/no-logo constraints; fetch-only mode adds one verified URL fallback, and URL mode pins stable original `src` values exactly only for authorized/internal use or marks them `replace before production`.
- [ ] For visible photographic/mockup assets, the prompt asks image-gen to create the raster subject; it does not replace laptops, phones, hands, product cards, or photographed scenes with CSS-only approximations.
- [ ] Device screens match the reference state: blank only when the reference is blank; if the screenshot shows UI/text on the screen, the brief describes that screen composition instead of requesting a white/blank screen.
- [ ] Any generated image that occludes a title/wordmark has both initial and final motion states pinned, so the captured overlap is treated as a deliberate scroll/entrance state.
- [ ] Hero/background still images include code-level micro-motion (slow scale/pan/rotate/parallax or equivalent) unless the prompt uses a real looping video.
- [ ] Hero/background micro-motion is perceptible, not just technically present; for implementation-confirmed runs, verify computed transform or screenshots 3-5s apart.
- [ ] URL mode only: all source-observed custom elements/canvas/WebGL/shader/pointer/scroll/hover primitives are represented as named prompt contracts; no `canvas` or custom cursor from the source has been silently replaced by a static CSS approximation.
- [ ] URL mode only: the prompt includes an original-vs-clone verification plan with same-viewport rest, mouse-left, mouse-center, mouse-right, scroll, and key hover states; compare canvas count, custom tags/classes, font variation changes, cursor rect/label, and transform diffs.
- [ ] If input is a screenshot and the requested scope is a full landing page, the prompt includes `INFERRED PAGE COMPLETION`: visible sections vs inferred below-fold sections, with inferred copy/sections clearly marked but fully specified.
- [ ] Every inferred section includes a **Layout QA / alignment contract**. Two-column sections must balance visual mass; side labels/dates align to their visual anchor; long headings fit their column; rounded media has no accidental blank/crop band.
- [ ] **Every** visible string is quoted VERBATIM (incl. `<br>`, em-dashes, entities, casing).
- [ ] **Every** element has a VERBATIM Tailwind class string with full responsive ladder + arbitrary `[..]` values.
- [ ] **Every** animation has exact from→to states, duration, delay, easing array, stagger, and trigger.
- [ ] Signature CSS effects (glass/noise/gradient-text) are pasted as **full CSS**, variants as diffs.
- [ ] Reusable motion/SVG defined **once by name**, referenced by name in sections.
- [ ] Sections delivered in order with `---` dividers; z-index and grid pinned numerically.
- [ ] Negative constraints suppress plausible-but-wrong defaults (`No overlay`, `No purple`, `No other UI libraries`, `loop OFF`).
- [ ] `prefers-reduced-motion` guard + dual `h-[100dvh]` included where relevant.
- [ ] After delivering the clone prompt, ask the user whether to continue building locally; do not start implementation until they explicitly confirm.
